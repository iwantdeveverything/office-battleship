import { describe, expect, it } from 'vitest';
import { getDeterministicCurrency, parseCoordinate, toCoordinate } from '@/lib/constants';
import { calculateExpectedScore, calculateNewElo } from '@/lib/eloCalculator';
import { parseFormulaInput } from '@/lib/formulaParser';

describe('RECON-Q4 Core Domain & Formula Parser', () => {
  it('converts coordinates and parses A1..J10 bounds accurately', () => {
    expect(toCoordinate(0, 0)).toBe('A1');
    expect(toCoordinate(9, 9)).toBe('J10');
    expect(parseCoordinate('e5')).toEqual({ coord: 'E5', row: 4, col: 4 });
    expect(parseCoordinate('J10')).toEqual({ coord: 'J10', row: 9, col: 9 });
    expect(parseCoordinate('K1')).toBeNull();
    expect(parseCoordinate('A11')).toBeNull();
  });

  it('generates deterministic currency values without jitter for Panic Mode', () => {
    const first = getDeterministicCurrency(3, 7, 1);
    const second = getDeterministicCurrency(3, 7, 1);
    const otherCell = getDeterministicCurrency(3, 8, 1);
    expect(first).toBe(second);
    expect(first).toMatch(/^\$[0-9,]+\.(00|25|50|75)$/);
    expect(first).not.toBe(otherCell);
  });

  it('parses bilingual English and Spanish formulas case-insensitively', () => {
    expect(parseFormulaInput('=AUDIT(B4)')).toEqual({
      type: 'AUDIT',
      coord: 'B4',
      row: 3,
      col: 1,
    });
    expect(parseFormulaInput('=auditar(j10)')).toEqual({
      type: 'AUDIT',
      coord: 'J10',
      row: 9,
      col: 9,
    });
    expect(parseFormulaInput('=SCAN_3X3(E5)')).toEqual({
      type: 'SCAN_3X3',
      coord: 'E5',
      row: 4,
      col: 4,
    });
    expect(parseFormulaInput('=ESCANEAR_3X3(c4)')).toEqual({
      type: 'SCAN_3X3',
      coord: 'C4',
      row: 3,
      col: 2,
    });
    expect(parseFormulaInput('=BARRAGE_ROW(3)')).toEqual({
      type: 'BARRAGE_ROW',
      row: 2,
    });
    expect(parseFormulaInput('=BARRIDO_FILA(10)')).toEqual({
      type: 'BARRAGE_ROW',
      row: 9,
    });
  });

  it('rejects out-of-range coordinates and unknown formulas with typed error keys', () => {
    expect(parseFormulaInput('=AUDIT(Z9)')).toEqual({
      type: 'INVALID',
      raw: '=AUDIT(Z9)',
      errorKey: 'INVALID_COORD',
    });
    expect(parseFormulaInput('=BARRAGE_ROW(12)')).toEqual({
      type: 'INVALID',
      raw: '=BARRAGE_ROW(12)',
      errorKey: 'INVALID_ROW',
    });
    expect(parseFormulaInput('=SUM(A1:A10)')).toEqual({
      type: 'INVALID',
      raw: '=SUM(A1:A10)',
      errorKey: 'UNKNOWN_FORMULA',
    });
  });

  it('calculates ELO K=32 ratings symmetrically', () => {
    expect(calculateExpectedScore(1200, 1200)).toBeCloseTo(0.5, 5);
    const winEqual = calculateNewElo(1200, 1200, 1);
    const lossEqual = calculateNewElo(1200, 1200, 0);
    expect(winEqual).toEqual({ newRating: 1216, delta: 16 });
    expect(lossEqual).toEqual({ newRating: 1184, delta: -16 });
  });
});
