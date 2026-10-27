import { createEmptyGrid, FLEET_TEMPLATES, GRID_SIZE, parseCoordinate, toCoordinate } from '@/lib/constants';
import type {
  CellShotState,
  Coordinate,
  GridCell,
  Locale,
  Orientation,
  ShipInstance,
  ShipTemplate,
} from '@/types/game';

export function cloneGrid(grid: GridCell[][]): GridCell[][] {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

export function cloneFleet(fleet: ShipInstance[]): ShipInstance[] {
  return fleet.map((ship) => ({
    ...ship,
    names: { ...ship.names },
    cells: [...ship.cells],
  }));
}

/**
 * Validates whether an account (ship) of `size` can be placed at `(row, col)` with `orientation`.
 * Returns the list of occupied coordinates if valid, or `null` if out-of-bounds or overlapping.
 */
export function canPlaceShip(
  grid: GridCell[][],
  row: number,
  col: number,
  size: number,
  orientation: Orientation
): Coordinate[] | null {
  if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE || size <= 0) {
    return null;
  }

  const coords: Coordinate[] = [];
  for (let offset = 0; offset < size; offset += 1) {
    const r = orientation === 'V' ? row + offset : row;
    const c = orientation === 'H' ? col + offset : col;

    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
      return null;
    }

    const cell = grid[r]?.[c];
    if (!cell || cell.shipId !== null) {
      return null;
    }

    coords.push(toCoordinate(r, c));
  }

  return coords;
}

/**
 * Immutably places a ship template onto `grid` and appends a `ShipInstance` to `fleet`.
 * Returns `null` if the ship is already placed or coordinates are invalid/overlapping.
 */
export function placeShipOnGrid(
  grid: GridCell[][],
  fleet: ShipInstance[],
  template: ShipTemplate,
  row: number,
  col: number,
  orientation: Orientation,
  locale: Locale = 'es'
): { grid: GridCell[][]; fleet: ShipInstance[] } | null {
  if (fleet.some((existing) => existing.id === template.id)) {
    return null;
  }

  const coords = canPlaceShip(grid, row, col, template.size, orientation);
  if (!coords) {
    return null;
  }

  const nextGrid = cloneGrid(grid);
  for (let offset = 0; offset < template.size; offset += 1) {
    const r = orientation === 'V' ? row + offset : row;
    const c = orientation === 'H' ? col + offset : col;
    nextGrid[r][c].shipId = template.id;
    nextGrid[r][c].shipCode = template.code;
  }

  const newShip: ShipInstance = {
    id: template.id,
    code: template.code,
    name: template.names[locale],
    names: { ...template.names },
    size: template.size,
    fakeValue: template.fakeValue,
    cells: coords,
    hits: 0,
    sunk: false,
  };

  return {
    grid: nextGrid,
    fleet: [...cloneFleet(fleet), newShip],
  };
}

/**
 * Automatically allocates all 5 reserved accounts from `FLEET_TEMPLATES` onto a fresh 10x10 ledger.
 */
export function autoAllocateFleet(
  locale: Locale = 'es',
  rng: () => number = Math.random
): { grid: GridCell[][]; fleet: ShipInstance[] } {
  let currentGrid = createEmptyGrid();
  let currentFleet: ShipInstance[] = [];

  for (const template of FLEET_TEMPLATES) {
    let placed = false;

    for (let attempt = 0; attempt < 250 && !placed; attempt += 1) {
      const orientation: Orientation = rng() < 0.5 ? 'H' : 'V';
      const maxRow = orientation === 'V' ? GRID_SIZE - template.size + 1 : GRID_SIZE;
      const maxCol = orientation === 'H' ? GRID_SIZE - template.size + 1 : GRID_SIZE;
      const row = Math.floor(rng() * maxRow);
      const col = Math.floor(rng() * maxCol);

      const res = placeShipOnGrid(currentGrid, currentFleet, template, row, col, orientation, locale);
      if (res) {
        currentGrid = res.grid;
        currentFleet = res.fleet;
        placed = true;
      }
    }

    if (!placed) {
      outer: for (const orientation of ['H', 'V'] as const) {
        for (let r = 0; r < GRID_SIZE; r += 1) {
          for (let c = 0; c < GRID_SIZE; c += 1) {
            const res = placeShipOnGrid(currentGrid, currentFleet, template, r, c, orientation, locale);
            if (res) {
              currentGrid = res.grid;
              currentFleet = res.fleet;
              placed = true;
              break outer;
            }
          }
        }
      }
    }
  }

  return { grid: currentGrid, fleet: currentFleet };
}

/**
 * Deterministic initial allocation so SSR and client hydration match with zero layout shift,
 * allowing first-time visitors to start auditing in a single click.
 */
export function createDefaultAllocatedFleet(
  locale: Locale = 'es'
): { grid: GridCell[][]; fleet: ShipInstance[] } {
  let seed = 4092026;
  const deterministicRng = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  return autoAllocateFleet(locale, deterministicRng);
}

/**
 * Resolves a single cell audit (`=AUDIT(coord)`) against the target grid and fleet.
 */
export function resolveAuditShot(
  grid: GridCell[][],
  fleet: ShipInstance[],
  row: number,
  col: number
): {
  grid: GridCell[][];
  fleet: ShipInstance[];
  outcome: CellShotState;
  sunkShip: ShipInstance | null;
  allSunk: boolean;
  alreadyShot: boolean;
} {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
    return {
      grid,
      fleet,
      outcome: 'NONE',
      sunkShip: null,
      allSunk: fleet.length > 0 && fleet.every((s) => s.sunk),
      alreadyShot: false,
    };
  }

  const targetCell = grid[row][col];
  if (targetCell.shot !== 'NONE') {
    return {
      grid,
      fleet,
      outcome: targetCell.shot,
      sunkShip: null,
      allSunk: fleet.length > 0 && fleet.every((s) => s.sunk),
      alreadyShot: true,
    };
  }

  const nextGrid = cloneGrid(grid);
  const nextFleet = cloneFleet(fleet);
  const cell = nextGrid[row][col];

  if (!cell.shipId) {
    cell.shot = 'MISS';
    return {
      grid: nextGrid,
      fleet: nextFleet,
      outcome: 'MISS',
      sunkShip: null,
      allSunk: nextFleet.length > 0 && nextFleet.every((s) => s.sunk),
      alreadyShot: false,
    };
  }

  const targetShip = nextFleet.find((s) => s.id === cell.shipId) ?? null;
  if (!targetShip) {
    cell.shot = 'HIT';
    return {
      grid: nextGrid,
      fleet: nextFleet,
      outcome: 'HIT',
      sunkShip: null,
      allSunk: false,
      alreadyShot: false,
    };
  }

  targetShip.hits += 1;
  let sunkShip: ShipInstance | null = null;
  let outcome: CellShotState = 'HIT';

  if (targetShip.hits >= targetShip.size) {
    targetShip.sunk = true;
    outcome = 'SUNK';
    sunkShip = { ...targetShip, cells: [...targetShip.cells] };

    for (const coord of targetShip.cells) {
      const parsed = parseCoordinate(coord);
      if (parsed) {
        nextGrid[parsed.row][parsed.col].shot = 'SUNK';
      }
    }
  } else {
    cell.shot = 'HIT';
  }

  const allSunk = nextFleet.length > 0 && nextFleet.every((s) => s.sunk);

  return {
    grid: nextGrid,
    fleet: nextFleet,
    outcome,
    sunkShip,
    allSunk,
    alreadyShot: false,
  };
}

/**
 * Computes the number of cells carrying an allocated account (`shipId !== null`)
 * within a 3x3 neighborhood centered at `(centerRow, centerCol)`.
 */
export function resolveScan3x3(
  grid: GridCell[][],
  centerRow: number,
  centerCol: number
): { count: number } {
  let count = 0;

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      const r = centerRow + dr;
      const c = centerCol + dc;
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        if (grid[r]?.[c]?.shipId !== null) {
          count += 1;
        }
      }
    }
  }

  return { count };
}

/**
 * Audits up to 3 un-audited cells in `row` (`=BARRAGE_ROW(row)`).
 */
export function resolveBarrageRow(
  grid: GridCell[][],
  fleet: ShipInstance[],
  row: number,
  rng: () => number = Math.random
): {
  grid: GridCell[][];
  fleet: ShipInstance[];
  auditedCoords: Coordinate[];
  hits: number;
  sunkShips: ShipInstance[];
  allSunk: boolean;
} {
  if (row < 0 || row >= GRID_SIZE) {
    return {
      grid,
      fleet,
      auditedCoords: [],
      hits: 0,
      sunkShips: [],
      allSunk: fleet.length > 0 && fleet.every((s) => s.sunk),
    };
  }

  const candidates = grid[row].filter((cell) => cell.shot === 'NONE');
  const pool = [...candidates];
  const selectedCols: number[] = [];

  while (selectedCols.length < 3 && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    const [picked] = pool.splice(idx, 1);
    if (picked) {
      selectedCols.push(picked.col);
    }
  }

  selectedCols.sort((a, b) => a - b);

  let currentGrid = cloneGrid(grid);
  let currentFleet = cloneFleet(fleet);
  const auditedCoords: Coordinate[] = [];
  let hits = 0;
  const sunkShips: ShipInstance[] = [];
  let allSunk = currentFleet.length > 0 && currentFleet.every((s) => s.sunk);

  for (const col of selectedCols) {
    const result = resolveAuditShot(currentGrid, currentFleet, row, col);
    currentGrid = result.grid;
    currentFleet = result.fleet;
    auditedCoords.push(toCoordinate(row, col));
    if (result.outcome === 'HIT' || result.outcome === 'SUNK') {
      hits += 1;
    }
    if (result.sunkShip) {
      sunkShips.push(result.sunkShip);
    }
    allSunk = result.allSunk;
    if (allSunk) {
      break;
    }
  }

  return {
    grid: currentGrid,
    fleet: currentFleet,
    auditedCoords,
    hits,
    sunkShips,
    allSunk,
  };
}
