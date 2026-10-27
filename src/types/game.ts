export type Coordinate = string; // "A1" .. "J10"
export type CellShotState = 'NONE' | 'MISS' | 'HIT' | 'SUNK';
export type GamePhase = 'SETUP' | 'WAITING_FOR_OPPONENT' | 'BATTLE' | 'GAMEOVER';
export type CorporateTheme = 'sheets' | 'excel' | 'dark';
export type Locale = 'en' | 'es';
export type Orientation = 'H' | 'V';
export type GameMode = 'SINGLE' | 'MULTI';

export interface ShipTemplate {
  id: string;
  classicName: string;
  code: string;
  size: number;
  fakeValue: string;
  names: Record<Locale, string>;
}

export interface ShipInstance {
  id: string;
  code: string;
  name: string;
  names: Record<Locale, string>;
  size: number;
  fakeValue: string;
  cells: Coordinate[];
  hits: number;
  sunk: boolean;
}

export interface GridCell {
  id: Coordinate;
  row: number;
  col: number;
  shipId: string | null;
  shipCode: string | null;
  shot: CellShotState;
  scannedHint?: number; // From =SCAN_3X3 macro
}

export interface MacroInventory {
  scan3x3: number;
  barrageRow: number;
}

export interface AuditComment {
  id: string;
  authorAlias: string;
  authorRole: 'P1' | 'P2' | 'SYSTEM';
  cellCoord?: Coordinate;
  text: string;
  createdAt: number;
}

export interface MatchRoomState {
  roomId: string;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  turn: 'P1' | 'P2';
  winner: 'P1' | 'P2' | null;
  p1: { uid: string; alias: string; elo: number; ready: boolean };
  p2: { uid: string; alias: string; elo: number; ready: boolean } | null;
  lastActionLog: string;
  updatedAt: number;
  comments?: AuditComment[];
}

export interface SanitizedRoomPayload {
  room: MatchRoomState;
  role: 'P1' | 'P2' | 'SPECTATOR';
  ownGrid: GridCell[][];
  ownFleet: ShipInstance[];
  radarGrid: GridCell[][];
  enemyFleetSummary: Array<{
    id: string;
    code: string;
    names: Record<Locale, string>;
    size: number;
    sunk: boolean;
    fakeValue: string;
  }>;
  macros: MacroInventory;
}

export interface LeaderboardEntry {
  uid: string;
  alias: string;
  department: string;
  elo: number;
  wins: number;
  losses: number;
  updatedAt: number;
}

export type ParsedFormulaCommand =
  | { type: 'AUDIT'; coord: Coordinate; row: number; col: number }
  | { type: 'SCAN_3X3'; coord: Coordinate; row: number; col: number }
  | { type: 'BARRAGE_ROW'; row: number }
  | { type: 'INVALID'; raw: string; errorKey: 'UNKNOWN_FORMULA' | 'INVALID_COORD' | 'INVALID_ROW' };
