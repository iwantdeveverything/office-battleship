import { GRID_SIZE, parseCoordinate } from '@/lib/constants';
import type { ParsedFormulaCommand } from '@/types/game';

const AUDIT_VERBS = new Set(['AUDIT', 'AUDITAR', 'CHECK', 'CONCILIAR']);
const SCAN_VERBS = new Set(['SCAN_3X3', 'ESCANEAR_3X3', 'SCAN', 'ESCANEAR']);
const BARRAGE_VERBS = new Set(['BARRAGE_ROW', 'BARRIDO_FILA', 'BARRAGE', 'BARRIDO']);

/**
 * Parses spreadsheet formulas in both English and Spanish regardless of active UI locale.
 * Supported examples:
 * - =AUDIT(E5) / =AUDITAR(E5)
 * - =SCAN_3X3(C4) / =ESCANEAR_3X3(C4)
 * - =BARRAGE_ROW(3) / =BARRIDO_FILA(3) / =BARRAGE(3)
 * Also supports bare coordinates like "E5" as a quick-entry shorthand for =AUDIT(E5).
 */
export function parseFormulaInput(input: string): ParsedFormulaCommand {
  const trimmed = input.trim();
  if (!trimmed) {
    return { type: 'INVALID', raw: input, errorKey: 'UNKNOWN_FORMULA' };
  }

  // Allow direct cell coordinate shorthand (e.g. "E5" or "=E5")
  const shorthandCandidate = trimmed.startsWith('=') ? trimmed.slice(1).trim() : trimmed;
  if (/^[A-Za-z][0-9]{1,2}$/.test(shorthandCandidate)) {
    const parsedCoord = parseCoordinate(shorthandCandidate);
    if (!parsedCoord) {
      return { type: 'INVALID', raw: input, errorKey: 'INVALID_COORD' };
    }
    return {
      type: 'AUDIT',
      coord: parsedCoord.coord,
      row: parsedCoord.row,
      col: parsedCoord.col,
    };
  }

  const normalized = trimmed.startsWith('=') ? trimmed.slice(1).trim() : trimmed;
  const match = /^([A-Za-z0-9_]+)\s*\(\s*([^)]*)\s*\)$/.exec(normalized);

  if (!match) {
    return { type: 'INVALID', raw: input, errorKey: 'UNKNOWN_FORMULA' };
  }

  const verb = match[1].toUpperCase();
  const arg = match[2].trim().replace(/^["']|["']$/g, '');

  if (AUDIT_VERBS.has(verb)) {
    const parsed = parseCoordinate(arg);
    if (!parsed) {
      return { type: 'INVALID', raw: input, errorKey: 'INVALID_COORD' };
    }
    return {
      type: 'AUDIT',
      coord: parsed.coord,
      row: parsed.row,
      col: parsed.col,
    };
  }

  if (SCAN_VERBS.has(verb)) {
    const parsed = parseCoordinate(arg);
    if (!parsed) {
      return { type: 'INVALID', raw: input, errorKey: 'INVALID_COORD' };
    }
    return {
      type: 'SCAN_3X3',
      coord: parsed.coord,
      row: parsed.row,
      col: parsed.col,
    };
  }

  if (BARRAGE_VERBS.has(verb)) {
    const rowNumber = Number(arg);
    if (!Number.isInteger(rowNumber) || rowNumber < 1 || rowNumber > GRID_SIZE) {
      return { type: 'INVALID', raw: input, errorKey: 'INVALID_ROW' };
    }
    return {
      type: 'BARRAGE_ROW',
      row: rowNumber - 1,
    };
  }

  return { type: 'INVALID', raw: input, errorKey: 'UNKNOWN_FORMULA' };
}
