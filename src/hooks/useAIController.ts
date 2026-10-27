'use client';

import { useCallback, useRef } from 'react';
import { GRID_SIZE, parseCoordinate, toCoordinate } from '@/lib/constants';
import type { CellShotState, Coordinate, GridCell } from '@/types/game';

const ORTHOGONAL_DELTAS: ReadonlyArray< readonly [number, number] > = [
  [-1, 0], // North
  [1, 0],  // South
  [0, 1],  // East
  [0, -1], // West
];

/**
 * Returns valid orthogonal neighbor coordinates (`N, S, E, W`) that have not been audited yet (`shot === 'NONE'`).
 */
export function getOrthogonalNeighbors(
  grid: GridCell[][],
  row: number,
  col: number
): Coordinate[] {
  const neighbors: Coordinate[] = [];

  for (const [dr, dc] of ORTHOGONAL_DELTAS) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      const cell = grid[r]?.[c];
      if (cell && cell.shot === 'NONE') {
        neighbors.push(toCoordinate(r, c));
      }
    }
  }

  return neighbors;
}

/**
 * Updates the AI target queue after a shot outcome on `(hitRow, hitCol)`.
 * - On `HIT`: appends un-audited orthogonal neighbors and prioritizes aligned hits.
 * - On `SUNK`: prunes neighbors that are no longer adjacent to any remaining active `HIT` cell.
 */
export function updateTargetQueueAfterShot(
  grid: GridCell[][],
  currentQueue: Coordinate[],
  hitRow: number,
  hitCol: number,
  outcome: CellShotState
): Coordinate[] {
  const seen = new Set<Coordinate>();
  const cleanQueue: Coordinate[] = [];

  for (const coord of currentQueue) {
    const parsed = parseCoordinate(coord);
    if (parsed && grid[parsed.row]?.[parsed.col]?.shot === 'NONE' && !seen.has(coord)) {
      seen.add(coord);
      cleanQueue.push(coord);
    }
  }

  if (outcome === 'HIT') {
    const neighbors = getOrthogonalNeighbors(grid, hitRow, hitCol);
    for (const n of neighbors) {
      if (!seen.has(n)) {
        seen.add(n);
        cleanQueue.push(n);
      }
    }
  } else if (outcome === 'SUNK') {
    // Rebuild queue from any remaining unsunk HIT cells on the board
    const activeHits: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        if (grid[r]?.[c]?.shot === 'HIT') {
          activeHits.push({ row: r, col: c });
        }
      }
    }

    if (activeHits.length === 0) {
      return [];
    }

    const rebuilt: Coordinate[] = [];
    const rebuiltSeen = new Set<Coordinate>();
    for (const h of activeHits) {
      for (const n of getOrthogonalNeighbors(grid, h.row, h.col)) {
        if (!rebuiltSeen.has(n)) {
          rebuiltSeen.add(n);
          rebuilt.push(n);
        }
      }
    }
    return prioritizeAlignedTargets(grid, rebuilt);
  }

  return prioritizeAlignedTargets(grid, cleanQueue);
}

/**
 * If two or more unsunk `HIT` cells align horizontally or vertically,
 * moves queue coordinates lying along that same row or column to the front.
 */
export function prioritizeAlignedTargets(
  grid: GridCell[][],
  queue: Coordinate[]
): Coordinate[] {
  if (queue.length <= 1) return queue;

  const activeHits: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (grid[r]?.[c]?.shot === 'HIT') {
        activeHits.push({ row: r, col: c });
      }
    }
  }

  if (activeHits.length < 2) {
    return queue;
  }

  const alignedRows = new Set<number>();
  const alignedCols = new Set<number>();

  for (let i = 0; i < activeHits.length; i += 1) {
    for (let j = i + 1; j < activeHits.length; j += 1) {
      if (activeHits[i].row === activeHits[j].row) {
        alignedRows.add(activeHits[i].row);
      }
      if (activeHits[i].col === activeHits[j].col) {
        alignedCols.add(activeHits[i].col);
      }
    }
  }

  if (alignedRows.size === 0 && alignedCols.size === 0) {
    return queue;
  }

  const prioritized: Coordinate[] = [];
  const secondary: Coordinate[] = [];

  for (const coord of queue) {
    const parsed = parseCoordinate(coord);
    if (!parsed) continue;
    if (alignedRows.has(parsed.row) || alignedCols.has(parsed.col)) {
      prioritized.push(coord);
    } else {
      secondary.push(coord);
    }
  }

  return [...prioritized, ...secondary];
}

/**
 * Pure deterministic/testable Hunt & Target shot selector.
 * - TARGET mode: pops the highest-priority un-audited coordinate from `targetQueue`.
 * - HUNT mode: selects an un-audited cell with checkerboard parity `(row + col) % 2 === 0`
 *   (falling back to any remaining un-audited cell if all parity cells are audited).
 */
export function chooseNextAIShot(
  grid: GridCell[][],
  targetQueue: Coordinate[],
  rng: () => number = Math.random
): { coord: Coordinate; row: number; col: number; nextQueue: Coordinate[] } {
  const validQueue: Coordinate[] = [];
  const seen = new Set<Coordinate>();

  for (const coord of targetQueue) {
    const parsed = parseCoordinate(coord);
    if (parsed && grid[parsed.row]?.[parsed.col]?.shot === 'NONE' && !seen.has(coord)) {
      seen.add(coord);
      validQueue.push(coord);
    }
  }

  const orderedQueue = prioritizeAlignedTargets(grid, validQueue);

  if (orderedQueue.length > 0) {
    const [pickedCoord, ...restQueue] = orderedQueue;
    const parsed = parseCoordinate(pickedCoord);
    if (parsed) {
      return {
        coord: parsed.coord,
        row: parsed.row,
        col: parsed.col,
        nextQueue: restQueue,
      };
    }
  }

  // HUNT mode: checkerboard parity (row + col) % 2 === 0
  const parityCells: GridCell[] = [];
  const fallbackCells: GridCell[] = [];

  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const cell = grid[r]?.[c];
      if (cell && cell.shot === 'NONE') {
        fallbackCells.push(cell);
        if ((r + c) % 2 === 0) {
          parityCells.push(cell);
        }
      }
    }
  }

  const pool = parityCells.length > 0 ? parityCells : fallbackCells;
  if (pool.length === 0) {
    return {
      coord: 'A1',
      row: 0,
      col: 0,
      nextQueue: [],
    };
  }

  const idx = Math.floor(rng() * pool.length);
  const chosen = pool[idx] ?? pool[0];

  return {
    coord: chosen.id,
    row: chosen.row,
    col: chosen.col,
    nextQueue: [],
  };
}

export interface AIControllerHook {
  getNextShot: (playerGrid: GridCell[][]) => { coord: Coordinate; row: number; col: number };
  recordShotOutcome: (
    updatedPlayerGrid: GridCell[][],
    row: number,
    col: number,
    outcome: CellShotState
  ) => void;
  resetAI: () => void;
}

/**
 * React hook encapsulating the Hunt & Target AI target queue across turns.
 */
export function useAIController(): AIControllerHook {
  const targetQueueRef = useRef<Coordinate[]>([]);

  const getNextShot = useCallback((playerGrid: GridCell[][]) => {
    const { coord, row, col, nextQueue } = chooseNextAIShot(playerGrid, targetQueueRef.current);
    targetQueueRef.current = nextQueue;
    return { coord, row, col };
  }, []);

  const recordShotOutcome = useCallback(
    (updatedPlayerGrid: GridCell[][], row: number, col: number, outcome: CellShotState) => {
      targetQueueRef.current = updateTargetQueueAfterShot(
        updatedPlayerGrid,
        targetQueueRef.current,
        row,
        col,
        outcome
      );
    },
    []
  );

  const resetAI = useCallback(() => {
    targetQueueRef.current = [];
  }, []);

  return {
    getNextShot,
    recordShotOutcome,
    resetAI,
  };
}
