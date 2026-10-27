import { NextResponse } from 'next/server';
import {
  createEmptyGrid,
  FLEET_TEMPLATES,
  GRID_SIZE,
  INITIAL_LEADERBOARD,
  parseCoordinate,
  toCoordinate,
} from '@/lib/constants';
import { calculateNewElo } from '@/lib/eloCalculator';
import {
  cloneFleet,
  cloneGrid,
  resolveAuditShot,
  resolveBarrageRow,
  resolveScan3x3,
} from '@/lib/gridEngine';
import type {
  AuditComment,
  Coordinate,
  GridCell,
  LeaderboardEntry,
  MacroInventory,
  MatchRoomState,
  SanitizedRoomPayload,
  ShipInstance,
} from '@/types/game';

export interface PlayerServerBoard {
  grid: GridCell[][];
  fleet: ShipInstance[];
  macros: MacroInventory;
  scannedHints: Record<Coordinate, number>;
}

export interface ServerMatchRoom {
  state: MatchRoomState;
  p1Board: PlayerServerBoard;
  p2Board: PlayerServerBoard;
}

declare global {
  var __reconRooms: Map<string, ServerMatchRoom> | undefined;
  var __reconLeaderboard: Map<string, LeaderboardEntry> | undefined;
}

function getRoomsStore(): Map<string, ServerMatchRoom> {
  if (!globalThis.__reconRooms) {
    globalThis.__reconRooms = new Map<string, ServerMatchRoom>();
  }
  return globalThis.__reconRooms;
}

function getLeaderboardStore(): Map<string, LeaderboardEntry> {
  if (!globalThis.__reconLeaderboard) {
    const map = new Map<string, LeaderboardEntry>();
    for (const entry of INITIAL_LEADERBOARD) {
      map.set(entry.uid, { ...entry });
    }
    globalThis.__reconLeaderboard = map;
  }
  return globalThis.__reconLeaderboard;
}

function getOrCreatePlayerLeaderboard(uid: string, alias: string): LeaderboardEntry {
  const store = getLeaderboardStore();
  const existing = store.get(uid);
  if (existing) {
    if (alias && alias.trim().length > 0) {
      existing.alias = alias.trim();
    }
    return existing;
  }

  const created: LeaderboardEntry = {
    uid,
    alias: alias.trim() || 'Auditor_Anon',
    department: 'External Audit',
    elo: 1200,
    wins: 0,
    losses: 0,
    updatedAt: Date.now(),
  };
  store.set(uid, created);
  return created;
}

function getSortedLeaderboard(): LeaderboardEntry[] {
  return Array.from(getLeaderboardStore().values()).sort((a, b) => b.elo - a.elo);
}

function getOpenRooms(): MatchRoomState[] {
  return Array.from(getRoomsStore().values())
    .filter((r) => r.state.status === 'WAITING' && r.state.p2 === null)
    .map((r) => ({
      ...r.state,
      p1: {
        ...r.state.p1,
        uid: 'REDACTED_P1',
      },
      p2: null,
      comments: r.state.comments ? r.state.comments.map((c) => ({ ...c })) : [],
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function createEmptyPlayerBoard(): PlayerServerBoard {
  return {
    grid: createEmptyGrid(),
    fleet: [],
    macros: {
      scan3x3: 1,
      barrageRow: 1,
    },
    scannedHints: {},
  };
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)] ?? 'X';
  }
  return `Q4-${code}-RECON`;
}

function createServerRoom(uid: string, alias: string, customRoomId?: string): ServerMatchRoom {
  const roomId = customRoomId?.trim() ? customRoomId.trim().toUpperCase() : generateRoomId();
  const playerEntry = getOrCreatePlayerLeaderboard(uid, alias);
  const now = Date.now();

  const room: ServerMatchRoom = {
    state: {
      roomId,
      status: 'WAITING',
      turn: 'P1',
      winner: null,
      p1: {
        uid,
        alias: playerEntry.alias,
        elo: playerEntry.elo,
        ready: false,
      },
      p2: null,
      lastActionLog: `Expediente ${roomId} aperturado por ${playerEntry.alias}.`,
      updatedAt: now,
      comments: [],
    },
    p1Board: createEmptyPlayerBoard(),
    p2Board: createEmptyPlayerBoard(),
  };

  return room;
}

/**
 * Validates that a submitted fleet has all 5 standard templates and exactly 17 allocated cells.
 */
function validateFleetSubmission(
  grid: GridCell[][],
  fleet: ShipInstance[]
): { valid: boolean; normalizedGrid: GridCell[][]; normalizedFleet: ShipInstance[] } {
  if (!Array.isArray(grid) || grid.length !== GRID_SIZE || !Array.isArray(fleet) || fleet.length !== 5) {
    return { valid: false, normalizedGrid: createEmptyGrid(), normalizedFleet: [] };
  }

  const expectedTotalCells = FLEET_TEMPLATES.reduce((acc, t) => acc + t.size, 0); // 17
  const occupiedCoords = new Set<Coordinate>();
  const normalizedGrid = createEmptyGrid();
  const normalizedFleet: ShipInstance[] = [];

  for (const template of FLEET_TEMPLATES) {
    const submitted = fleet.find((f) => f.id === template.id);
    if (!submitted || !Array.isArray(submitted.cells) || submitted.cells.length !== template.size) {
      return { valid: false, normalizedGrid: createEmptyGrid(), normalizedFleet: [] };
    }

    const verifiedCoords: Coordinate[] = [];
    const parsedCells: { row: number; col: number; coord: Coordinate }[] = [];
    for (const rawCoord of submitted.cells) {
      const parsed = parseCoordinate(rawCoord);
      if (!parsed || occupiedCoords.has(parsed.coord)) {
        return { valid: false, normalizedGrid: createEmptyGrid(), normalizedFleet: [] };
      }
      occupiedCoords.add(parsed.coord);
      verifiedCoords.push(parsed.coord);
      parsedCells.push(parsed);
      normalizedGrid[parsed.row][parsed.col].shipId = template.id;
      normalizedGrid[parsed.row][parsed.col].shipCode = template.code;
    }

    const sameRow = parsedCells.every((c) => c.row === parsedCells[0].row);
    const sameCol = parsedCells.every((c) => c.col === parsedCells[0].col);
    if (!sameRow && !sameCol) {
      return { valid: false, normalizedGrid: createEmptyGrid(), normalizedFleet: [] };
    }

    if (sameRow) {
      const sortedCols = parsedCells.map((c) => c.col).sort((a, b) => a - b);
      const isContiguous = sortedCols.every(
        (col, idx) => idx === 0 || col === sortedCols[idx - 1] + 1
      );
      if (!isContiguous) {
        return { valid: false, normalizedGrid: createEmptyGrid(), normalizedFleet: [] };
      }
    } else {
      const sortedRows = parsedCells.map((c) => c.row).sort((a, b) => a - b);
      const isContiguous = sortedRows.every(
        (row, idx) => idx === 0 || row === sortedRows[idx - 1] + 1
      );
      if (!isContiguous) {
        return { valid: false, normalizedGrid: createEmptyGrid(), normalizedFleet: [] };
      }
    }

    normalizedFleet.push({
      id: template.id,
      code: template.code,
      name: submitted.name || template.names.es,
      names: { ...template.names },
      size: template.size,
      fakeValue: template.fakeValue,
      cells: verifiedCoords,
      hits: 0,
      sunk: false,
    });
  }

  if (occupiedCoords.size !== expectedTotalCells) {
    return { valid: false, normalizedGrid: createEmptyGrid(), normalizedFleet: [] };
  }

  return { valid: true, normalizedGrid, normalizedFleet };
}

/**
 * Strict Server-Side Fog-of-War Anti-Cheat Sanitizer.
 * Strips `shipId` and `shipCode` from all opponent `radarGrid` cells unless:
 * - `room.state.status === 'FINISHED'`, OR
 * - `cell.shot === 'SUNK'`
 */
function sanitizeRoomForViewer(
  room: ServerMatchRoom,
  viewerUid: string
): SanitizedRoomPayload {
  const isP1 = room.state.p1.uid === viewerUid;
  const isP2 = room.state.p2?.uid === viewerUid;
  const role: 'P1' | 'P2' | 'SPECTATOR' = isP1 ? 'P1' : isP2 ? 'P2' : 'SPECTATOR';

  const viewerBoard =
    role === 'P1' ? room.p1Board : role === 'P2' ? room.p2Board : createEmptyPlayerBoard();
  const opponentBoard = role === 'P2' ? room.p1Board : room.p2Board;
  const isFinished = room.state.status === 'FINISHED';

  const radarGrid: GridCell[][] = opponentBoard.grid.map((row) =>
    row.map((cell) => {
      const revealIdentity = isFinished || cell.shot === 'SUNK';
      const hint = viewerBoard.scannedHints[cell.id];
      const sanitizedCell: GridCell = {
        id: cell.id,
        row: cell.row,
        col: cell.col,
        shipId: revealIdentity ? cell.shipId : null,
        shipCode: revealIdentity ? cell.shipCode : null,
        shot: cell.shot,
      };
      if (hint !== undefined) {
        sanitizedCell.scannedHint = hint;
      }
      return sanitizedCell;
    })
  );

  const sourceFleet =
    opponentBoard.fleet.length > 0
      ? opponentBoard.fleet
      : FLEET_TEMPLATES.map((t) => ({
          id: t.id,
          code: t.code,
          names: { ...t.names },
          size: t.size,
          sunk: false,
          fakeValue: t.fakeValue,
        }));

  const enemyFleetSummary = sourceFleet.map((ship) => ({
    id: ship.id,
    code: ship.code,
    names: { ...ship.names },
    size: ship.size,
    sunk: ship.sunk,
    fakeValue: ship.fakeValue,
  }));

  return {
    room: {
      ...room.state,
      p1: {
        ...room.state.p1,
        uid: isP1 ? room.state.p1.uid : 'REDACTED_P1',
      },
      p2: room.state.p2
        ? {
            ...room.state.p2,
            uid: isP2 ? room.state.p2.uid : 'REDACTED_P2',
          }
        : null,
      comments: room.state.comments ? room.state.comments.map((c) => ({ ...c })) : [],
    },
    role,
    ownGrid: cloneGrid(viewerBoard.grid),
    ownFleet: cloneFleet(viewerBoard.fleet),
    radarGrid,
    enemyFleetSummary,
    macros: { ...viewerBoard.macros },
  };
}

function settleMatchVictory(room: ServerMatchRoom, winnerRole: 'P1' | 'P2'): number {
  room.state.status = 'FINISHED';
  room.state.winner = winnerRole;
  room.state.updatedAt = Date.now();

  if (!room.state.p2) return 0;

  const p1Entry = getOrCreatePlayerLeaderboard(room.state.p1.uid, room.state.p1.alias);
  const p2Entry = getOrCreatePlayerLeaderboard(room.state.p2.uid, room.state.p2.alias);

  const p1Score = winnerRole === 'P1' ? 1 : 0;
  const p2Score = winnerRole === 'P2' ? 1 : 0;

  const p1Calc = calculateNewElo(p1Entry.elo, p2Entry.elo, p1Score);
  const p2Calc = calculateNewElo(p2Entry.elo, p1Entry.elo, p2Score);

  p1Entry.elo = p1Calc.newRating;
  p2Entry.elo = p2Calc.newRating;
  p1Entry.updatedAt = Date.now();
  p2Entry.updatedAt = Date.now();

  if (winnerRole === 'P1') {
    p1Entry.wins += 1;
    p2Entry.losses += 1;
  } else {
    p2Entry.wins += 1;
    p1Entry.losses += 1;
  }

  room.state.p1.elo = p1Entry.elo;
  room.state.p2.elo = p2Entry.elo;

  return winnerRole === 'P1' ? p1Calc.delta : p2Calc.delta;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId')?.trim().toUpperCase();
  const uid = searchParams.get('uid')?.trim() ?? '';

  const openRooms = getOpenRooms();
  const leaderboard = getSortedLeaderboard();

  if (!roomId) {
    return NextResponse.json({
      openRooms,
      leaderboard,
    });
  }

  const room = getRoomsStore().get(roomId);
  if (!room) {
    return NextResponse.json(
      {
        error: 'Expediente no encontrado.',
        openRooms,
        leaderboard,
      },
      { status: 404 }
    );
  }

  const payload = sanitizeRoomForViewer(room, uid);
  return NextResponse.json({
    room: payload.room,
    payload,
    openRooms,
    leaderboard,
  });
}

interface AuditPostBody {
  action?: string;
  roomId?: string;
  uid?: string;
  alias?: string;
  fleet?: ShipInstance[];
  grid?: GridCell[][];
  coord?: Coordinate;
  row?: number;
  text?: string;
  cellCoord?: Coordinate;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: AuditPostBody;
  try {
    body = (await request.json()) as AuditPostBody;
  } catch {
    return NextResponse.json({ error: 'Solicitud JSON inválida.' }, { status: 400 });
  }

  const action = body.action ?? '';
  const uid = body.uid?.trim() ?? '';
  const alias = body.alias?.trim() || 'Auditor_409';
  const roomIdParam = body.roomId?.trim().toUpperCase();

  if (!uid) {
    return NextResponse.json({ error: 'Identificador de auditor requerido.' }, { status: 400 });
  }

  const rooms = getRoomsStore();

  if (action === 'CREATE_ROOM') {
    const newRoom = createServerRoom(uid, alias, roomIdParam);
    rooms.set(newRoom.state.roomId, newRoom);
    const payload = sanitizeRoomForViewer(newRoom, uid);
    return NextResponse.json({
      room: payload.room,
      payload,
      openRooms: getOpenRooms(),
      leaderboard: getSortedLeaderboard(),
    });
  }

  if (action === 'JOIN_ROOM' || action === 'QUICK_MATCH') {
    let targetRoom: ServerMatchRoom | undefined;

    if (action === 'JOIN_ROOM' && roomIdParam) {
      targetRoom = rooms.get(roomIdParam);
      if (!targetRoom) {
        targetRoom = createServerRoom(uid, alias, roomIdParam);
        rooms.set(targetRoom.state.roomId, targetRoom);
      }
    } else {
      // QUICK_MATCH: find an open room where user isn't P1, or create one
      for (const candidate of rooms.values()) {
        if (
          candidate.state.status === 'WAITING' &&
          (candidate.state.p1.uid === uid || candidate.state.p2 === null)
        ) {
          targetRoom = candidate;
          break;
        }
      }
      if (!targetRoom) {
        targetRoom = createServerRoom(uid, alias);
        rooms.set(targetRoom.state.roomId, targetRoom);
      }
    }

    const playerEntry = getOrCreatePlayerLeaderboard(uid, alias);

    if (targetRoom.state.p1.uid !== uid && targetRoom.state.p2 === null) {
      targetRoom.state.p2 = {
        uid,
        alias: playerEntry.alias,
        elo: playerEntry.elo,
        ready: false,
      };
      targetRoom.state.lastActionLog = `${playerEntry.alias} se integró al expediente ${targetRoom.state.roomId}.`;
      targetRoom.state.updatedAt = Date.now();
    } else if (targetRoom.state.p1.uid === uid) {
      targetRoom.state.p1.alias = playerEntry.alias;
    } else if (targetRoom.state.p2?.uid === uid) {
      targetRoom.state.p2.alias = playerEntry.alias;
    }

    const payload = sanitizeRoomForViewer(targetRoom, uid);
    return NextResponse.json({
      room: payload.room,
      payload,
      openRooms: getOpenRooms(),
      leaderboard: getSortedLeaderboard(),
    });
  }

  if (!roomIdParam) {
    return NextResponse.json({ error: 'Código de expediente requerido.' }, { status: 400 });
  }

  const room = rooms.get(roomIdParam);
  if (!room) {
    return NextResponse.json({ error: 'Expediente no encontrado.' }, { status: 404 });
  }

  const isP1 = room.state.p1.uid === uid;
  const isP2 = room.state.p2?.uid === uid;
  if (!isP1 && !isP2) {
    return NextResponse.json({ error: 'No autorizado en este expediente.' }, { status: 403 });
  }

  const actorRole: 'P1' | 'P2' = isP1 ? 'P1' : 'P2';
  const actorAlias = isP1 ? room.state.p1.alias : (room.state.p2?.alias ?? alias);
  const actorBoard = isP1 ? room.p1Board : room.p2Board;
  const opponentBoard = isP1 ? room.p2Board : room.p1Board;

  if (action === 'READY_FLEET') {
    if (room.state.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'La asignación de partidas solo se permite antes de iniciar la auditoría.' },
        { status: 400 }
      );
    }
    const alreadyReady = isP1 ? room.state.p1.ready : Boolean(room.state.p2?.ready);
    if (alreadyReady) {
      return NextResponse.json(
        { error: 'La asignación de cartera ya fue confirmada para este ejercicio.' },
        { status: 400 }
      );
    }

    const validation = validateFleetSubmission(body.grid ?? [], body.fleet ?? []);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Asignación inválida: se requieren las 5 partidas (17 celdas).' },
        { status: 400 }
      );
    }

    actorBoard.grid = validation.normalizedGrid;
    actorBoard.fleet = validation.normalizedFleet;

    if (isP1) {
      room.state.p1.ready = true;
    } else if (room.state.p2) {
      room.state.p2.ready = true;
    }

    room.state.updatedAt = Date.now();

    if (room.state.p1.ready && room.state.p2?.ready) {
      room.state.status = 'ACTIVE';
      room.state.turn = 'P1';
      room.state.lastActionLog = `Ambos auditores confirmaron anexos. Turno activo: ${room.state.p1.alias}.`;
    } else {
      room.state.lastActionLog = `${actorAlias} confirmó asignación de cartera.`;
    }

    const payload = sanitizeRoomForViewer(room, uid);
    return NextResponse.json({
      room: payload.room,
      payload,
      openRooms: getOpenRooms(),
      leaderboard: getSortedLeaderboard(),
    });
  }

  if (action === 'AUDIT_CELL') {
    if (room.state.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'El expediente no está en fase de auditoría activa.' }, { status: 400 });
    }
    if (room.state.turn !== actorRole) {
      return NextResponse.json({ error: 'Turno de la contraparte en curso.' }, { status: 400 });
    }

    const parsed = parseCoordinate(body.coord ?? '');
    if (!parsed) {
      return NextResponse.json({ error: 'Coordenada fuera de rango (A1..J10).' }, { status: 400 });
    }

    const shotResult = resolveAuditShot(
      opponentBoard.grid,
      opponentBoard.fleet,
      parsed.row,
      parsed.col
    );

    if (shotResult.alreadyShot) {
      return NextResponse.json({ error: 'La celda ya fue auditada previamente.' }, { status: 400 });
    }

    opponentBoard.grid = shotResult.grid;
    opponentBoard.fleet = shotResult.fleet;
    room.state.updatedAt = Date.now();

    if (shotResult.allSunk) {
      const eloDelta = settleMatchVictory(room, actorRole);
      room.state.lastActionLog = `Cierre de ejercicio: ${actorAlias} liquidó todas las partidas (+${eloDelta} ELO).`;
    } else {
      room.state.turn = actorRole === 'P1' ? 'P2' : 'P1';
      if (shotResult.outcome === 'SUNK' && shotResult.sunkShip) {
        room.state.lastActionLog = `[${actorAlias}] Partida ${shotResult.sunkShip.code} liquidada en ${parsed.coord} (#LIQ!).`;
      } else if (shotResult.outcome === 'HIT') {
        room.state.lastActionLog = `[${actorAlias}] Discrepancia detectada en ${parsed.coord} (#REF! -IMP).`;
      } else {
        room.state.lastActionLog = `[${actorAlias}] Celda ${parsed.coord} verificada sin saldo ($0.00 [OK]).`;
      }
    }

    const payload = sanitizeRoomForViewer(room, uid);
    return NextResponse.json({
      room: payload.room,
      payload,
      openRooms: getOpenRooms(),
      leaderboard: getSortedLeaderboard(),
    });
  }

  if (action === 'MACRO_SCAN') {
    if (room.state.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'El expediente no está activo.' }, { status: 400 });
    }
    if (room.state.turn !== actorRole) {
      return NextResponse.json({ error: 'Turno de la contraparte en curso.' }, { status: 400 });
    }
    if (actorBoard.macros.scan3x3 <= 0) {
      return NextResponse.json({ error: 'Macro =SCAN_3X3 agotada en este ejercicio.' }, { status: 400 });
    }

    const parsed = parseCoordinate(body.coord ?? '');
    if (!parsed) {
      return NextResponse.json({ error: 'Coordenada inválida para =SCAN_3X3.' }, { status: 400 });
    }

    const { count } = resolveScan3x3(opponentBoard.grid, parsed.row, parsed.col);
    actorBoard.macros.scan3x3 -= 1;
    actorBoard.scannedHints[parsed.coord] = count;
    room.state.lastActionLog = `[${actorAlias}] Ejecutó =SCAN_3X3(${parsed.coord}): ${count}/9 celdas activas.`;
    room.state.updatedAt = Date.now();

    const payload = sanitizeRoomForViewer(room, uid);
    return NextResponse.json({
      room: payload.room,
      payload,
      scanCount: count,
      openRooms: getOpenRooms(),
      leaderboard: getSortedLeaderboard(),
    });
  }

  if (action === 'MACRO_BARRAGE') {
    if (room.state.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'El expediente no está activo.' }, { status: 400 });
    }
    if (room.state.turn !== actorRole) {
      return NextResponse.json({ error: 'Turno de la contraparte en curso.' }, { status: 400 });
    }
    if (actorBoard.macros.barrageRow <= 0) {
      return NextResponse.json({ error: 'Macro =BARRAGE_ROW agotada en este ejercicio.' }, { status: 400 });
    }

    const targetRow = typeof body.row === 'number' ? body.row : -1;
    if (!Number.isInteger(targetRow) || targetRow < 0 || targetRow >= GRID_SIZE) {
      return NextResponse.json({ error: 'Fila fuera de rango (1..10).' }, { status: 400 });
    }

    const barrageRes = resolveBarrageRow(opponentBoard.grid, opponentBoard.fleet, targetRow);
    if (barrageRes.auditedCoords.length === 0) {
      return NextResponse.json(
        { error: 'La fila seleccionada ya fue auditada en su totalidad.' },
        { status: 400 }
      );
    }

    opponentBoard.grid = barrageRes.grid;
    opponentBoard.fleet = barrageRes.fleet;
    actorBoard.macros.barrageRow -= 1;
    room.state.updatedAt = Date.now();

    if (barrageRes.allSunk) {
      const eloDelta = settleMatchVictory(room, actorRole);
      room.state.lastActionLog = `Cierre por barrido en fila ${targetRow + 1}: ${actorAlias} completó la conciliación (+${eloDelta} ELO).`;
    } else {
      room.state.turn = actorRole === 'P1' ? 'P2' : 'P1';
      room.state.lastActionLog = `[${actorAlias}] Barrido fiscal en fila ${targetRow + 1} (${toCoordinate(targetRow, 0)}..${toCoordinate(targetRow, 9)}): ${barrageRes.hits} impacto(s).`;
    }

    const payload = sanitizeRoomForViewer(room, uid);
    return NextResponse.json({
      room: payload.room,
      payload,
      openRooms: getOpenRooms(),
      leaderboard: getSortedLeaderboard(),
    });
  }

  if (action === 'ADD_COMMENT') {
    const text = body.text?.trim() ?? '';
    if (!text) {
      return NextResponse.json({ error: 'El comentario no puede estar vacío.' }, { status: 400 });
    }

    const parsedCell = body.cellCoord ? parseCoordinate(body.cellCoord) : null;
    const comment: AuditComment = {
      id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      authorAlias: actorAlias,
      authorRole: actorRole,
      cellCoord: parsedCell?.coord,
      text: text.slice(0, 280),
      createdAt: Date.now(),
    };

    if (!room.state.comments) {
      room.state.comments = [];
    }
    room.state.comments.push(comment);
    room.state.updatedAt = Date.now();

    const payload = sanitizeRoomForViewer(room, uid);
    return NextResponse.json({
      room: payload.room,
      payload,
      openRooms: getOpenRooms(),
      leaderboard: getSortedLeaderboard(),
    });
  }

  return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
}
