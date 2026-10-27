import type { CorporateTheme, GridCell, LeaderboardEntry, Locale, ShipTemplate } from '@/types/game';

export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const GRID_SIZE = 10;

export const FLEET_TEMPLATES: ShipTemplate[] = [
  {
    id: 'carrier',
    classicName: 'Carrier',
    code: 'FID-500',
    size: 5,
    fakeValue: '$95,000.00',
    names: {
      es: 'Fideicomiso Offshore',
      en: 'Offshore Trust',
    },
  },
  {
    id: 'battleship',
    classicName: 'Battleship',
    code: 'BON-400',
    size: 4,
    fakeValue: '$64,200.00',
    names: {
      es: 'Bonos del Tesoro',
      en: 'Treasury Bonds',
    },
  },
  {
    id: 'submarine',
    classicName: 'Submarine',
    code: 'ACT-301',
    size: 3,
    fakeValue: '$41,800.00',
    names: {
      es: 'Fondo de Reserva',
      en: 'Reserve Fund',
    },
  },
  {
    id: 'cruiser',
    classicName: 'Cruiser',
    code: 'CRD-302',
    size: 3,
    fakeValue: '$38,500.00',
    names: {
      es: 'Línea de Crédito',
      en: 'Credit Line',
    },
  },
  {
    id: 'destroyer',
    classicName: 'Destroyer',
    code: 'CAJ-200',
    size: 2,
    fakeValue: '$12,900.00',
    names: {
      es: 'Caja Chica Ejecutiva',
      en: 'Executive Petty Cash',
    },
  },
];

export const THEME_METADATA: Record<
  CorporateTheme,
  {
    label: Record<Locale, string>;
    docTitle: Record<Locale, string>;
    faviconColor: string;
  }
> = {
  sheets: {
    label: {
      es: 'Google Sheets (Claro)',
      en: 'Google Sheets (Light)',
    },
    docTitle: {
      es: 'Conciliacion_Bancaria_Q4 - Hojas de cálculo',
      en: 'Q4_Bank_Reconciliation - Spreadsheets',
    },
    faviconColor: '#0f9d58',
  },
  excel: {
    label: {
      es: 'Excel 365 (Corporativo)',
      en: 'Excel 365 (Corporate)',
    },
    docTitle: {
      es: 'Libro1_Auditoria_Q4.xlsx - Excel',
      en: 'Workbook1_Audit_Q4.xlsx - Excel',
    },
    faviconColor: '#107c41',
  },
  dark: {
    label: {
      es: 'DataGrip SQL (Oscuro)',
      en: 'DataGrip SQL (Dark)',
    },
    docTitle: {
      es: 'recon_q4_ledger.sql [prod_read_only]',
      en: 'recon_q4_ledger.sql [prod_read_only]',
    },
    faviconColor: '#3b82f6',
  },
};

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    uid: 'usr-cfo-01',
    alias: 'M.Valdez_Audit',
    department: 'Internal Audit',
    elo: 1420,
    wins: 19,
    losses: 4,
    updatedAt: 1730000000000,
  },
  {
    uid: 'usr-fin-02',
    alias: 'S.Chen_FPnA',
    department: 'FP&A Global',
    elo: 1365,
    wins: 15,
    losses: 6,
    updatedAt: 1730000000000,
  },
  {
    uid: 'usr-tax-03',
    alias: 'R.Gomez_Tax',
    department: 'Tax Compliance',
    elo: 1290,
    wins: 11,
    losses: 7,
    updatedAt: 1730000000000,
  },
  {
    uid: 'usr-ops-04',
    alias: 'L.Miller_Treasury',
    department: 'Treasury Ops',
    elo: 1215,
    wins: 8,
    losses: 8,
    updatedAt: 1730000000000,
  },
  {
    uid: 'usr-ctrl-05',
    alias: 'D.Navarro_Ctrl',
    department: 'Comptroller',
    elo: 1150,
    wins: 5,
    losses: 9,
    updatedAt: 1730000000000,
  },
];

export function toCoordinate(row: number, col: number): string {
  const colLetter = COLUMNS[col] ?? 'A';
  return `${colLetter}${row + 1}`;
}

export function parseCoordinate(coordRaw: string): { coord: string; row: number; col: number } | null {
  const cleaned = coordRaw.trim().toUpperCase();
  const match = /^([A-J])(10|[1-9])$/.exec(cleaned);
  if (!match) return null;
  const col = COLUMNS.indexOf(match[1] as (typeof COLUMNS)[number]);
  const row = parseInt(match[2], 10) - 1;
  if (col < 0 || row < 0 || row >= GRID_SIZE) return null;
  return { coord: `${match[1]}${row + 1}`, row, col };
}

/**
 * Deterministic currency string generator for Panic Mode (<16ms DOM mutation, CLS = 0).
 * Uses a fast integer hash from (row, col, tableIndex) so re-renders never jitter.
 */
export function getDeterministicCurrency(row: number, col: number, tableSalt = 1): string {
  const seed = ((row + 1) * 73856093) ^ ((col + 1) * 19349663) ^ (tableSalt * 83492791);
  const positive = Math.abs(seed);
  const dollars = 1200 + (positive % 94800);
  const cents = ((positive >> 4) % 4) * 25; // .00, .25, .50, .75
  const formattedDollars = dollars.toLocaleString('en-US');
  const formattedCents = cents.toString().padStart(2, '0');
  return `$${formattedDollars}.${formattedCents}`;
}

export function createEmptyGrid(): GridCell[][] {
  return Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (__, col) => ({
      id: toCoordinate(row, col),
      row,
      col,
      shipId: null,
      shipCode: null,
      shot: 'NONE',
    }))
  );
}
