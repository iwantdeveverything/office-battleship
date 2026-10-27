import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/audit/route';
import {
  chooseNextAIShot,
  getOrthogonalNeighbors,
  updateTargetQueueAfterShot,
} from '@/hooks/useAIController';
import { createEmptyGrid, FLEET_TEMPLATES } from '@/lib/constants';
import {
  autoAllocateFleet,
  canPlaceShip,
  createDefaultAllocatedFleet,
  placeShipOnGrid,
  resolveAuditShot,
  resolveBarrageRow,
  resolveScan3x3,
} from '@/lib/gridEngine';
import { evictExpiredRooms, type ServerMatchRoom } from '@/lib/roomStore';
import type { SanitizedRoomPayload } from '@/types/game';

describe('RECON-Q4 Grid Engine, Hunt & Target AI, and Server Fog-of-War Anti-Cheat', () => {
  it('validates ship placement bounds and prevents overlapping accounts', () => {
    const empty = createEmptyGrid();
    const destroyerTemplate = FLEET_TEMPLATES[4]; // size 2
    const cruiserTemplate = FLEET_TEMPLATES[3]; // size 3

    expect(canPlaceShip(empty, 0, 9, 2, 'H')).toBeNull();
    expect(canPlaceShip(empty, 9, 0, 2, 'V')).toBeNull();
    expect(canPlaceShip(empty, 0, 0, 2, 'H')).toEqual(['A1', 'B1']);

    const placedFirst = placeShipOnGrid(empty, [], destroyerTemplate, 0, 0, 'H', 'es');
    expect(placedFirst).not.toBeNull();
    expect(placedFirst?.fleet).toHaveLength(1);
    expect(placedFirst?.grid[0][0].shipId).toBe(destroyerTemplate.id);
    expect(placedFirst?.grid[0][1].shipCode).toBe(destroyerTemplate.code);

    // Rejects overlapping placement on B1 (row 0, col 1)
    const overlapping = placeShipOnGrid(
      placedFirst!.grid,
      placedFirst!.fleet,
      cruiserTemplate,
      0,
      1,
      'V',
      'es'
    );
    expect(overlapping).toBeNull();
  });

  it('auto-allocates all 5 reserved accounts totalling 17 cells without overlap', () => {
    const { grid, fleet } = autoAllocateFleet('en');
    expect(fleet).toHaveLength(5);

    const occupiedCells = grid.flat().filter((cell) => cell.shipId !== null);
    expect(occupiedCells).toHaveLength(17);
  });

  it('resolves single-cell audits, transitions ship to SUNK, and detects allSunk', () => {
    const empty = createEmptyGrid();
    const destroyerTemplate = FLEET_TEMPLATES[4]; // size 2 at A1, B1
    const placed = placeShipOnGrid(empty, [], destroyerTemplate, 0, 0, 'H', 'en')!;

    // Miss on C1 (row 0, col 2)
    const missRes = resolveAuditShot(placed.grid, placed.fleet, 0, 2);
    expect(missRes.outcome).toBe('MISS');
    expect(missRes.allSunk).toBe(false);

    // First hit on A1 (row 0, col 0)
    const hitRes = resolveAuditShot(missRes.grid, missRes.fleet, 0, 0);
    expect(hitRes.outcome).toBe('HIT');
    expect(hitRes.sunkShip).toBeNull();
    expect(hitRes.allSunk).toBe(false);

    // Duplicate audit on A1 is rejected with alreadyShot = true
    const dupRes = resolveAuditShot(hitRes.grid, hitRes.fleet, 0, 0);
    expect(dupRes.alreadyShot).toBe(true);

    // Second hit on B1 (row 0, col 1) sinks the account
    const sunkRes = resolveAuditShot(hitRes.grid, hitRes.fleet, 0, 1);
    expect(sunkRes.outcome).toBe('SUNK');
    expect(sunkRes.sunkShip?.id).toBe(destroyerTemplate.id);
    expect(sunkRes.grid[0][0].shot).toBe('SUNK');
    expect(sunkRes.grid[0][1].shot).toBe('SUNK');
    expect(sunkRes.allSunk).toBe(true);
  });

  it('computes 3x3 forensic scan counts and executes row barrage up to 3 cells', () => {
    const empty = createEmptyGrid();
    const submarineTemplate = FLEET_TEMPLATES[2]; // size 3 at B2, C2, D2 (row 1, col 1..3)
    const placed = placeShipOnGrid(empty, [], submarineTemplate, 1, 1, 'H', 'es')!;

    const scanCenter = resolveScan3x3(placed.grid, 1, 2); // C2 center covers B1..D3
    expect(scanCenter.count).toBe(3);

    const scanFar = resolveScan3x3(placed.grid, 8, 8);
    expect(scanFar.count).toBe(0);

    const barrage = resolveBarrageRow(placed.grid, placed.fleet, 1, () => 0);
    expect(barrage.auditedCoords).toHaveLength(3);
    expect(barrage.hits).toBeGreaterThanOrEqual(2);
  });

  it('enforces checkerboard parity in HUNT mode and prioritizes aligned axis in TARGET mode', () => {
    const empty = createEmptyGrid();

    // Verify 25 random HUNT shots always obey checkerboard parity (row + col) % 2 === 0
    for (let i = 0; i < 25; i += 1) {
      const choice = chooseNextAIShot(empty, [], () => (i * 0.13) % 1);
      expect((choice.row + choice.col) % 2).toBe(0);
    }

    // Simulate a HIT at E5 (row 4, col 4)
    const gridAfterHit1 = createEmptyGrid();
    gridAfterHit1[4][4].shot = 'HIT';
    const neighbors = getOrthogonalNeighbors(gridAfterHit1, 4, 4);
    expect(neighbors).toEqual(['E4', 'E6', 'F5', 'D5']);

    const queue1 = updateTargetQueueAfterShot(gridAfterHit1, [], 4, 4, 'HIT');
    expect(queue1).toEqual(['E4', 'E6', 'F5', 'D5']);

    // Simulate second horizontal HIT at F5 (row 4, col 5): row 4 targets (D5, G5) must be prioritized over row 3/5
    const gridAfterHit2 = gridAfterHit1.map((r) => r.map((c) => ({ ...c })));
    gridAfterHit2[4][5].shot = 'HIT';
    const queue2 = updateTargetQueueAfterShot(gridAfterHit2, queue1, 4, 5, 'HIT');
    const nextTarget = chooseNextAIShot(gridAfterHit2, queue2);
    expect(nextTarget.row).toBe(4);
    expect(['D5', 'G5']).toContain(nextTarget.coord);
  });

  it('enforces strict Fog-of-War anti-cheat in /api/audit route', async () => {
    const p1Alloc = autoAllocateFleet('es');
    const p2Alloc = autoAllocateFleet('es');

    // 1. P1 creates room
    const createRes = await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_ROOM',
          roomId: 'Q4-TEST-RECON',
          uid: 'uid-p1',
          alias: 'Auditor_P1',
        }),
      })
    );
    expect(createRes.status).toBe(200);

    // 2. P2 joins room
    await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN_ROOM',
          roomId: 'Q4-TEST-RECON',
          uid: 'uid-p2',
          alias: 'Auditor_P2',
        }),
      })
    );

    // 3. Both submit READY_FLEET
    await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'READY_FLEET',
          roomId: 'Q4-TEST-RECON',
          uid: 'uid-p1',
          grid: p1Alloc.grid,
          fleet: p1Alloc.fleet,
        }),
      })
    );

    const readyRes2 = await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'READY_FLEET',
          roomId: 'Q4-TEST-RECON',
          uid: 'uid-p2',
          grid: p2Alloc.grid,
          fleet: p2Alloc.fleet,
        }),
      })
    );
    expect(readyRes2.status).toBe(200);

    // 4. P1 audits one cell of P2's first ship (HIT, not SUNK): verify zero shipId/shipCode leak on radarGrid
    const firstCellCoord = p2Alloc.fleet[0].cells[0];
    const auditRes = await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AUDIT_CELL',
          roomId: 'Q4-TEST-RECON',
          uid: 'uid-p1',
          coord: firstCellCoord,
        }),
      })
    );
    expect(auditRes.status).toBe(200);
    const auditData = (await auditRes.json()) as { payload: SanitizedRoomPayload };
    const leakedDuringActive = auditData.payload.radarGrid
      .flat()
      .filter((c) => c.shipId !== null || c.shipCode !== null);
    expect(leakedDuringActive).toHaveLength(0);
    const hitCell = auditData.payload.radarGrid.flat().find((c) => c.id === firstCellCoord);
    expect(hitCell?.shot).toBe('HIT');
  });

  it('masks opponent uid tokens in sanitizeRoomForViewer and getOpenRooms', async () => {
    const createRes = await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_ROOM',
          roomId: 'Q4-MASK-RECON',
          uid: 'secret-uid-p1',
          alias: 'Auditor_P1',
        }),
      })
    );
    expect(createRes.status).toBe(200);
    const createData = (await createRes.json()) as {
      payload: SanitizedRoomPayload;
      openRooms: SanitizedRoomPayload['room'][];
    };
    expect(createData.payload.room.p1.uid).toBe('secret-uid-p1');
    const openEntry = createData.openRooms.find((r) => r.roomId === 'Q4-MASK-RECON');
    expect(openEntry?.p1.uid).toBe('REDACTED_P1');

    const joinRes = await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN_ROOM',
          roomId: 'Q4-MASK-RECON',
          uid: 'secret-uid-p2',
          alias: 'Auditor_P2',
        }),
      })
    );
    expect(joinRes.status).toBe(200);
    const joinData = (await joinRes.json()) as { payload: SanitizedRoomPayload };
    expect(joinData.payload.room.p1.uid).toBe('REDACTED_P1');
    expect(joinData.payload.room.p2?.uid).toBe('secret-uid-p2');
  });

  it('rejects non-contiguous / scattered ship coordinates in READY_FLEET with status 400', async () => {
    await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_ROOM',
          roomId: 'Q4-SCATTER-RECON',
          uid: 'uid-scatter-p1',
          alias: 'Auditor_Scatter',
        }),
      })
    );

    const validAlloc = autoAllocateFleet('es');
    // Corrupt the last ship (size 2) to have non-contiguous scattered coordinates
    const corruptedFleet = validAlloc.fleet.map((ship, idx) =>
      idx === 4 ? { ...ship, cells: ['A1', 'J10'] as typeof ship.cells } : ship
    );

    const badRes = await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'READY_FLEET',
          roomId: 'Q4-SCATTER-RECON',
          uid: 'uid-scatter-p1',
          grid: validAlloc.grid,
          fleet: corruptedFleet,
        }),
      })
    );
    expect(badRes.status).toBe(400);
  });

  it('rejects READY_FLEET resubmission during an ACTIVE match with status 400', async () => {
    const p1Alloc = autoAllocateFleet('es');
    const p2Alloc = autoAllocateFleet('es');

    await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_ROOM',
          roomId: 'Q4-LOCK-RECON',
          uid: 'uid-lock-p1',
          alias: 'Auditor_Lock1',
        }),
      })
    );

    await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN_ROOM',
          roomId: 'Q4-LOCK-RECON',
          uid: 'uid-lock-p2',
          alias: 'Auditor_Lock2',
        }),
      })
    );

    const r1 = await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'READY_FLEET',
          roomId: 'Q4-LOCK-RECON',
          uid: 'uid-lock-p1',
          grid: p1Alloc.grid,
          fleet: p1Alloc.fleet,
        }),
      })
    );
    expect(r1.status).toBe(200);

    const r2 = await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'READY_FLEET',
          roomId: 'Q4-LOCK-RECON',
          uid: 'uid-lock-p2',
          grid: p2Alloc.grid,
          fleet: p2Alloc.fleet,
        }),
      })
    );
    expect(r2.status).toBe(200);

    // Attempt to resubmit fleet while room is ACTIVE
    const newAlloc = autoAllocateFleet('es');
    const resubmitRes = await POST(
      new Request('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'READY_FLEET',
          roomId: 'Q4-LOCK-RECON',
          uid: 'uid-lock-p1',
          grid: newAlloc.grid,
          fleet: newAlloc.fleet,
        }),
      })
    );
    expect(resubmitRes.status).toBe(400);
  });

  it('produces identical deterministic initial allocation and evicts expired rooms by TTL', () => {
    const first = createDefaultAllocatedFleet('es');
    const second = createDefaultAllocatedFleet('es');
    expect(first.fleet.map((s) => s.cells)).toEqual(second.fleet.map((s) => s.cells));

    const mockStore = new Map<string, ServerMatchRoom>();
    const now = 1_000_000_000;
    const staleRoom = {
      state: { roomId: 'STALE-1', updatedAt: now - 3 * 60 * 60 * 1000 },
    } as ServerMatchRoom;
    const freshRoom = {
      state: { roomId: 'FRESH-1', updatedAt: now - 10 * 60 * 1000 },
    } as ServerMatchRoom;

    mockStore.set('STALE-1', staleRoom);
    mockStore.set('FRESH-1', freshRoom);

    const evicted = evictExpiredRooms(mockStore, now, 2 * 60 * 60 * 1000, 500);
    expect(evicted).toBe(1);
    expect(mockStore.has('STALE-1')).toBe(false);
    expect(mockStore.has('FRESH-1')).toBe(true);
  });
});
