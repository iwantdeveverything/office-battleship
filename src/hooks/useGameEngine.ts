'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAIController } from '@/hooks/useAIController';
import { useMultiplayerSync } from '@/hooks/useMultiplayerSync';
import {
  createEmptyGrid,
  FLEET_TEMPLATES,
  parseCoordinate,
  toCoordinate,
} from '@/lib/constants';
import { parseFormulaInput } from '@/lib/formulaParser';
import {
  autoAllocateFleet,
  canPlaceShip,
  cloneFleet,
  cloneGrid,
  createDefaultAllocatedFleet,
  placeShipOnGrid,
  resolveAuditShot,
  resolveBarrageRow,
  resolveScan3x3,
} from '@/lib/gridEngine';
import { DICTIONARY } from '@/lib/i18n';
import type {
  AuditComment,
  Coordinate,
  GameMode,
  GamePhase,
  GridCell,
  Locale,
  MacroInventory,
  Orientation,
  SanitizedRoomPayload,
  ShipInstance,
  ShipTemplate,
} from '@/types/game';

export interface UseGameEngineOptions {
  locale: Locale;
  alias: string;
}

export function useGameEngine({ locale, alias }: UseGameEngineOptions) {
  const t = DICTIONARY[locale] ?? DICTIONARY.es;

  const [mode, setModeState] = useState<GameMode>('SINGLE');
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [orientation, setOrientation] = useState<Orientation>('H');
  const [selectedCoord, setSelectedCoord] = useState<Coordinate>('A1');
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);

  // Player & Opponent Boards (Pre-allocated deterministically for instant 1-click onboarding)
  const initialBoard = useMemo(() => createDefaultAllocatedFleet(locale), []);
  const [ownGrid, setOwnGrid] = useState<GridCell[][]>(() => initialBoard.grid);
  const [ownFleet, setOwnFleet] = useState<ShipInstance[]>(() => initialBoard.fleet);
  const [aiGrid, setAiGrid] = useState<GridCell[][]>(() => createEmptyGrid());
  const [aiFleet, setAiFleet] = useState<ShipInstance[]>([]);

  const [macros, setMacros] = useState<MacroInventory>({
    scan3x3: 1,
    barrageRow: 1,
  });

  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true);
  const [winner, setWinner] = useState<'PLAYER' | 'OPPONENT' | null>(null);
  const [formulaInput, setFormulaInput] = useState<string>('');
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [activeMacroMode, setActiveMacroMode] = useState<'NONE' | 'SCAN_3X3' | 'BARRAGE_ROW'>('NONE');
  const [actionLog, setActionLog] = useState<string>(() => DICTIONARY[locale].logSetupReady);
  const [logs, setLogs] = useState<string[]>(() => [DICTIONARY[locale].logSetupReady]);
  const [localComments, setLocalComments] = useState<AuditComment[]>([]);

  const aiController = useAIController();
  const aiTurnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingAITimeout = useCallback(() => {
    if (aiTurnTimeoutRef.current !== null) {
      clearTimeout(aiTurnTimeoutRef.current);
      aiTurnTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (aiTurnTimeoutRef.current !== null) {
        clearTimeout(aiTurnTimeoutRef.current);
      }
    };
  }, []);

  const appendLog = useCallback((message: string) => {
    setActionLog(message);
    setLogs((prev) => [message, ...prev.slice(0, 39)]);
  }, []);

  const handleServerPayload = useCallback(
    (serverPayload: SanitizedRoomPayload) => {
      clearPendingAITimeout();
      setModeState('MULTI');
      setActionLog(serverPayload.room.lastActionLog);

      if (serverPayload.room.status === 'WAITING') {
        const myReady =
          serverPayload.role === 'P1'
            ? serverPayload.room.p1.ready
            : serverPayload.role === 'P2'
              ? Boolean(serverPayload.room.p2?.ready)
              : false;
        if (!myReady) {
          setOwnGrid((prev) => {
            const hasShots = prev.some((row) => row.some((cell) => cell.shot !== 'NONE'));
            if (hasShots) {
              setOwnFleet([]);
              return createEmptyGrid();
            }
            return prev;
          });
        }
        setPhase(myReady ? 'WAITING_FOR_OPPONENT' : 'SETUP');
        setWinner(null);
      } else if (serverPayload.room.status === 'ACTIVE') {
        setPhase('BATTLE');
        setWinner(null);
      } else if (serverPayload.room.status === 'FINISHED') {
        setPhase('GAMEOVER');
        if (serverPayload.room.winner) {
          setWinner(serverPayload.room.winner === serverPayload.role ? 'PLAYER' : 'OPPONENT');
        }
      }
    },
    [clearPendingAITimeout]
  );

  const multiplayer = useMultiplayerSync({
    enabled: mode === 'MULTI',
    alias,
    onPayloadUpdate: handleServerPayload,
  });

  // Next unplaced ship template during SETUP
  const currentShipTemplate: ShipTemplate | null = useMemo(() => {
    for (const tpl of FLEET_TEMPLATES) {
      if (!ownFleet.some((placed) => placed.id === tpl.id)) {
        return tpl;
      }
    }
    return null;
  }, [ownFleet]);

  const isSetupComplete = ownFleet.length === FLEET_TEMPLATES.length;

  // Keyboard listener for 'R' axis rotation during SETUP
  useEffect(() => {
    if (typeof window === 'undefined' || phase !== 'SETUP') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setOrientation((prev) => (prev === 'H' ? 'V' : 'H'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  const toggleOrientation = useCallback(() => {
    setOrientation((prev) => (prev === 'H' ? 'V' : 'H'));
  }, []);

  // Preview coordinates for ship placement hover in SETUP
  const placementPreview = useMemo<{ coords: Set<Coordinate>; valid: boolean }>(() => {
    if (phase !== 'SETUP' || !currentShipTemplate || !hoverCell) {
      return { coords: new Set<Coordinate>(), valid: true };
    }
    const validCoords = canPlaceShip(
      ownGrid,
      hoverCell.row,
      hoverCell.col,
      currentShipTemplate.size,
      orientation
    );
    if (validCoords) {
      return { coords: new Set(validCoords), valid: true };
    }

    const fallback: Coordinate[] = [];
    for (let offset = 0; offset < currentShipTemplate.size; offset += 1) {
      const r = orientation === 'V' ? hoverCell.row + offset : hoverCell.row;
      const c = orientation === 'H' ? hoverCell.col + offset : hoverCell.col;
      if (r >= 0 && r < 10 && c >= 0 && c < 10) {
        fallback.push(toCoordinate(r, c));
      }
    }
    return { coords: new Set(fallback), valid: false };
  }, [phase, currentShipTemplate, hoverCell, ownGrid, orientation]);

  const placeShipAt = useCallback(
    (row: number, col: number) => {
      if (phase !== 'SETUP' || !currentShipTemplate) return false;
      const res = placeShipOnGrid(
        ownGrid,
        ownFleet,
        currentShipTemplate,
        row,
        col,
        orientation,
        locale
      );
      if (!res) return false;

      setOwnGrid(res.grid);
      setOwnFleet(res.fleet);
      const coord = toCoordinate(row, col);
      setSelectedCoord(coord);
      appendLog(t.logPlacedAccount(currentShipTemplate.code, coord));
      return true;
    },
    [phase, currentShipTemplate, ownGrid, ownFleet, orientation, locale, appendLog, t]
  );

  const autoAllocate = useCallback(() => {
    const allocated = autoAllocateFleet(locale);
    setOwnGrid(allocated.grid);
    setOwnFleet(allocated.fleet);
    setPhase('SETUP');
    appendLog(t.logPlacedAccount('CARTERA-5', 'A1:J10'));
  }, [locale, appendLog, t]);

  const clearBoard = useCallback(() => {
    setOwnGrid(createEmptyGrid());
    setOwnFleet([]);
    setPhase('SETUP');
    setFormulaError(null);
    appendLog(t.logSetupReady);
  }, [appendLog, t]);

  const confirmSetup = useCallback(async () => {
    let gridToUse = ownGrid;
    let fleetToUse = ownFleet;

    if (fleetToUse.length < FLEET_TEMPLATES.length) {
      const allocated = autoAllocateFleet(locale);
      gridToUse = allocated.grid;
      fleetToUse = allocated.fleet;
      setOwnGrid(gridToUse);
      setOwnFleet(fleetToUse);
    }

    if (mode === 'MULTI' && multiplayer.activeRoomId) {
      const updated = await multiplayer.submitReadyFleet(
        multiplayer.activeRoomId,
        gridToUse,
        fleetToUse
      );
      if (updated) {
        setPhase(updated.room.status === 'ACTIVE' ? 'BATTLE' : 'WAITING_FOR_OPPONENT');
      }
      return;
    }

    const enemy = autoAllocateFleet(locale);
    setAiGrid(enemy.grid);
    setAiFleet(enemy.fleet);
    setMacros({ scan3x3: 1, barrageRow: 1 });
    setIsPlayerTurn(true);
    setWinner(null);
    setPhase('BATTLE');
    aiController.resetAI();
    appendLog(t.turnBadgeYourTurn);
  }, [ownGrid, ownFleet, locale, mode, multiplayer, aiController, appendLog, t]);

  const resetExercise = useCallback(() => {
    clearPendingAITimeout();
    if (mode === 'MULTI') {
      multiplayer.leaveRoom();
      setModeState('SINGLE');
    }
    setOwnGrid(createEmptyGrid());
    setOwnFleet([]);
    setAiGrid(createEmptyGrid());
    setAiFleet([]);
    setMacros({ scan3x3: 1, barrageRow: 1 });
    setIsPlayerTurn(true);
    setWinner(null);
    setFormulaError(null);
    setFormulaInput('');
    setActiveMacroMode('NONE');
    setPhase('SETUP');
    aiController.resetAI();
    appendLog(t.logSetupReady);
  }, [clearPendingAITimeout, mode, multiplayer, aiController, appendLog, t]);

  const switchMode = useCallback(
    (nextMode: GameMode) => {
      if (nextMode === mode) return;
      clearPendingAITimeout();
      setModeState(nextMode);
      if (nextMode === 'SINGLE') {
        multiplayer.leaveRoom();
        setPhase('SETUP');
        setWinner(null);
      } else {
        setOwnGrid((prev) => {
          const hasShots = prev.some((row) => row.some((cell) => cell.shot !== 'NONE'));
          if (hasShots) {
            setOwnFleet([]);
            return createEmptyGrid();
          }
          return prev;
        });
        void multiplayer.refreshLobby();
      }
    },
    [mode, clearPendingAITimeout, multiplayer]
  );

  // Trigger AI counter-turn automatically in SINGLE mode
  const runAICounterTurn = useCallback(
    (currentOwnGrid: GridCell[][], currentOwnFleet: ShipInstance[]) => {
      const aiChoice = aiController.getNextShot(currentOwnGrid);
      const result = resolveAuditShot(
        currentOwnGrid,
        currentOwnFleet,
        aiChoice.row,
        aiChoice.col
      );

      aiController.recordShotOutcome(result.grid, aiChoice.row, aiChoice.col, result.outcome);
      setOwnGrid(result.grid);
      setOwnFleet(result.fleet);

      const aiActor = locale === 'es' ? 'Auditor_IA' : 'AI_Auditor';
      if (result.allSunk) {
        setPhase('GAMEOVER');
        setWinner('OPPONENT');
        setIsPlayerTurn(false);
        appendLog(t.logMatchWon(aiActor, -16));
        return;
      }

      if (result.outcome === 'SUNK' && result.sunkShip) {
        appendLog(t.logAuditSunk(aiActor, result.sunkShip.code));
      } else if (result.outcome === 'HIT') {
        appendLog(t.logAuditHit(aiActor, aiChoice.coord));
      } else {
        appendLog(t.logAuditMiss(aiActor, aiChoice.coord));
      }

      setIsPlayerTurn(true);
    },
    [aiController, locale, appendLog, t]
  );

  // Effective grids and fleets depending on SINGLE vs MULTI
  const activeOwnGrid = useMemo(() => {
    if (mode === 'MULTI' && multiplayer.payload && phase !== 'SETUP') {
      return multiplayer.payload.ownGrid;
    }
    return ownGrid;
  }, [mode, multiplayer.payload, phase, ownGrid]);

  const activeOwnFleet = useMemo(() => {
    if (mode === 'MULTI' && multiplayer.payload && phase !== 'SETUP') {
      return multiplayer.payload.ownFleet;
    }
    return ownFleet;
  }, [mode, multiplayer.payload, phase, ownFleet]);

  const radarGrid = useMemo<GridCell[][]>(() => {
    if (mode === 'MULTI' && multiplayer.payload) {
      return multiplayer.payload.radarGrid;
    }
    // In SINGLE mode, also strip un-audited ship identities until SUNK or GAMEOVER
    const isFinished = phase === 'GAMEOVER';
    return aiGrid.map((row) =>
      row.map((cell) => {
        const reveal = isFinished || cell.shot === 'SUNK';
        return {
          ...cell,
          shipId: reveal ? cell.shipId : null,
          shipCode: reveal ? cell.shipCode : null,
        };
      })
    );
  }, [mode, multiplayer.payload, aiGrid, phase]);

  const enemyFleetSummary = useMemo(() => {
    if (mode === 'MULTI' && multiplayer.payload) {
      return multiplayer.payload.enemyFleetSummary;
    }
    const source =
      aiFleet.length > 0
        ? aiFleet
        : FLEET_TEMPLATES.map((tpl) => ({
            id: tpl.id,
            code: tpl.code,
            names: { ...tpl.names },
            size: tpl.size,
            sunk: false,
            fakeValue: tpl.fakeValue,
          }));
    return source.map((s) => ({
      id: s.id,
      code: s.code,
      names: { ...s.names },
      size: s.size,
      sunk: s.sunk,
      fakeValue: s.fakeValue,
    }));
  }, [mode, multiplayer.payload, aiFleet]);

  const activeMacros = useMemo<MacroInventory>(() => {
    if (mode === 'MULTI' && multiplayer.payload) {
      return multiplayer.payload.macros;
    }
    return macros;
  }, [mode, multiplayer.payload, macros]);

  const isMyTurn = useMemo<boolean>(() => {
    if (phase !== 'BATTLE') return false;
    if (mode === 'MULTI' && multiplayer.payload) {
      return (
        multiplayer.payload.room.status === 'ACTIVE' &&
        multiplayer.payload.room.turn === multiplayer.payload.role
      );
    }
    return isPlayerTurn;
  }, [phase, mode, multiplayer.payload, isPlayerTurn]);

  // Execute single-cell audit
  const auditCell = useCallback(
    async (row: number, col: number): Promise<boolean> => {
      const coord = toCoordinate(row, col);
      setSelectedCoord(coord);
      setFormulaError(null);

      if (phase !== 'BATTLE' || !isMyTurn) return false;

      if (mode === 'MULTI' && multiplayer.activeRoomId) {
        const res = await multiplayer.sendMultiplayerAudit(multiplayer.activeRoomId, coord);
        return Boolean(res);
      }

      const shotRes = resolveAuditShot(aiGrid, aiFleet, row, col);
      if (shotRes.alreadyShot) {
        return false;
      }

      setAiGrid(shotRes.grid);
      setAiFleet(shotRes.fleet);

      if (shotRes.allSunk) {
        setPhase('GAMEOVER');
        setWinner('PLAYER');
        setIsPlayerTurn(false);
        appendLog(t.logMatchWon(alias, 16));
        return true;
      }

      if (shotRes.outcome === 'SUNK' && shotRes.sunkShip) {
        appendLog(t.logAuditSunk(alias, shotRes.sunkShip.code));
      } else if (shotRes.outcome === 'HIT') {
        appendLog(t.logAuditHit(alias, coord));
      } else {
        appendLog(t.logAuditMiss(alias, coord));
      }

      setIsPlayerTurn(false);
      clearPendingAITimeout();
      aiTurnTimeoutRef.current = setTimeout(() => {
        aiTurnTimeoutRef.current = null;
        runAICounterTurn(ownGrid, ownFleet);
      }, 280);
      return true;
    },
    [
      phase,
      isMyTurn,
      mode,
      multiplayer,
      aiGrid,
      aiFleet,
      alias,
      appendLog,
      t,
      clearPendingAITimeout,
      runAICounterTurn,
      ownGrid,
      ownFleet,
    ]
  );

  // Execute forensic 3x3 scan macro (does not consume turn)
  const executeScan3x3 = useCallback(
    async (row: number, col: number): Promise<boolean> => {
      const coord = toCoordinate(row, col);
      setSelectedCoord(coord);
      setFormulaError(null);
      setActiveMacroMode('NONE');

      if (phase !== 'BATTLE' || !isMyTurn || activeMacros.scan3x3 <= 0) return false;

      if (mode === 'MULTI' && multiplayer.activeRoomId) {
        const res = await multiplayer.sendMultiplayerScan(multiplayer.activeRoomId, coord);
        return Boolean(res);
      }

      const { count } = resolveScan3x3(aiGrid, row, col);
      const nextAiGrid = cloneGrid(aiGrid);
      if (nextAiGrid[row]?.[col]) {
        nextAiGrid[row][col].scannedHint = count;
      }
      setAiGrid(nextAiGrid);
      setMacros((prev) => ({ ...prev, scan3x3: Math.max(0, prev.scan3x3 - 1) }));
      appendLog(t.logScanResult(coord, count));
      return true;
    },
    [phase, isMyTurn, activeMacros.scan3x3, mode, multiplayer, aiGrid, appendLog, t]
  );

  // Execute fiscal row barrage macro (audits up to 3 un-audited cells in row, consumes turn)
  const executeBarrageRow = useCallback(
    async (row: number): Promise<boolean> => {
      setFormulaError(null);
      setActiveMacroMode('NONE');

      if (phase !== 'BATTLE' || !isMyTurn || activeMacros.barrageRow <= 0) return false;
      if (row < 0 || row >= 10) return false;

      if (mode === 'MULTI' && multiplayer.activeRoomId) {
        const res = await multiplayer.sendMultiplayerBarrage(multiplayer.activeRoomId, row);
        return Boolean(res);
      }

      const barrageRes = resolveBarrageRow(aiGrid, aiFleet, row);
      if (barrageRes.auditedCoords.length === 0) return false;

      setAiGrid(barrageRes.grid);
      setAiFleet(barrageRes.fleet);
      setMacros((prev) => ({ ...prev, barrageRow: Math.max(0, prev.barrageRow - 1) }));
      appendLog(t.logBarrageResult(row + 1, barrageRes.hits));

      if (barrageRes.allSunk) {
        setPhase('GAMEOVER');
        setWinner('PLAYER');
        setIsPlayerTurn(false);
        appendLog(t.logMatchWon(alias, 16));
        return true;
      }

      setIsPlayerTurn(false);
      clearPendingAITimeout();
      aiTurnTimeoutRef.current = setTimeout(() => {
        aiTurnTimeoutRef.current = null;
        runAICounterTurn(ownGrid, ownFleet);
      }, 280);
      return true;
    },
    [
      phase,
      isMyTurn,
      activeMacros.barrageRow,
      mode,
      multiplayer,
      aiGrid,
      aiFleet,
      appendLog,
      t,
      alias,
      clearPendingAITimeout,
      runAICounterTurn,
      ownGrid,
      ownFleet,
    ]
  );

  // Handle radar cell click (respects activeMacroMode if armed)
  const handleRadarCellClick = useCallback(
    async (row: number, col: number) => {
      if (activeMacroMode === 'SCAN_3X3') {
        await executeScan3x3(row, col);
        return;
      }
      if (activeMacroMode === 'BARRAGE_ROW') {
        await executeBarrageRow(row);
        return;
      }
      await auditCell(row, col);
    },
    [activeMacroMode, executeScan3x3, executeBarrageRow, auditCell]
  );

  // Execute spreadsheet formula from formula bar
  const executeFormula = useCallback(
    async (rawInput?: string): Promise<boolean> => {
      const targetRaw = rawInput !== undefined ? rawInput : formulaInput;
      const parsed = parseFormulaInput(targetRaw);

      if (parsed.type === 'INVALID') {
        if (parsed.errorKey === 'INVALID_COORD') {
          setFormulaError(t.formulaErrorCoord);
        } else if (parsed.errorKey === 'INVALID_ROW') {
          setFormulaError(t.formulaErrorRow);
        } else {
          setFormulaError(t.formulaErrorUnknown);
        }
        return false;
      }

      setFormulaError(null);
      setFormulaInput('');

      if (parsed.type === 'AUDIT') {
        return auditCell(parsed.row, parsed.col);
      }
      if (parsed.type === 'SCAN_3X3') {
        return executeScan3x3(parsed.row, parsed.col);
      }
      if (parsed.type === 'BARRAGE_ROW') {
        return executeBarrageRow(parsed.row);
      }
      return false;
    },
    [formulaInput, t, auditCell, executeScan3x3, executeBarrageRow]
  );

  // Comments / Cell review notes
  const comments = useMemo<AuditComment[]>(() => {
    if (mode === 'MULTI' && multiplayer.payload?.room.comments) {
      return multiplayer.payload.room.comments;
    }
    return localComments;
  }, [mode, multiplayer.payload, localComments]);

  const addComment = useCallback(
    async (text: string, cellCoord?: Coordinate) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (mode === 'MULTI' && multiplayer.activeRoomId) {
        await multiplayer.sendComment(
          multiplayer.activeRoomId,
          trimmed,
          cellCoord ?? selectedCoord
        );
        return;
      }

      const parsedCell = cellCoord ? parseCoordinate(cellCoord) : parseCoordinate(selectedCoord);
      const newComment: AuditComment = {
        id: `local-${Date.now()}`,
        authorAlias: alias,
        authorRole: 'P1',
        cellCoord: parsedCell?.coord,
        text: trimmed,
        createdAt: Date.now(),
      };
      setLocalComments((prev) => [...prev, newComment]);
    },
    [mode, multiplayer, selectedCoord, alias]
  );

  // KPI Metrics
  const { hitsCount, totalShots, sunkCount, accuracyPct } = useMemo(() => {
    let hits = 0;
    let shots = 0;
    for (const row of radarGrid) {
      for (const cell of row) {
        if (cell.shot !== 'NONE') {
          shots += 1;
          if (cell.shot === 'HIT' || cell.shot === 'SUNK') {
            hits += 1;
          }
        }
      }
    }
    const sunk = enemyFleetSummary.filter((s) => s.sunk).length;
    const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;
    return {
      hitsCount: hits,
      totalShots: shots,
      sunkCount: sunk,
      accuracyPct: accuracy,
    };
  }, [radarGrid, enemyFleetSummary]);

  return {
    mode,
    setMode: switchMode,
    phase,
    orientation,
    setOrientation,
    toggleOrientation,
    selectedCoord,
    setSelectedCoord,
    hoverCell,
    setHoverCell,
    placementPreview,
    currentShipTemplate,
    isSetupComplete,
    ownGrid: activeOwnGrid,
    ownFleet: activeOwnFleet,
    radarGrid,
    enemyFleetSummary,
    macros: activeMacros,
    activeMacroMode,
    setActiveMacroMode,
    isMyTurn,
    winner,
    formulaInput,
    setFormulaInput,
    formulaError,
    setFormulaError,
    actionLog,
    logs,
    comments,
    addComment,
    placeShipAt,
    autoAllocate,
    clearBoard,
    confirmSetup,
    resetExercise,
    auditCell,
    executeScan3x3,
    executeBarrageRow,
    handleRadarCellClick,
    executeFormula,
    hitsCount,
    totalShots,
    sunkCount,
    accuracyPct,
    multiplayer,
  };
}
