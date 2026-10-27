'use client';

import React from 'react';
import type { Coordinate, CorporateTheme, GridCell, Locale } from '@/types/game';
import { COLUMNS, ROWS, getDeterministicCurrency } from '@/lib/constants';
import { DICTIONARY, type I18nDictionary } from '@/lib/i18n';

export interface LedgerGridProps {
  mode: 'OWN' | 'RADAR';
  grid: GridCell[][];
  theme: CorporateTheme;
  locale: Locale;
  dict?: I18nDictionary;
  isPanicMode: boolean;
  activeCoord?: Coordinate;
  previewCells?: Coordinate[];
  previewValid?: boolean;
  previewShipCode?: string | null;
  disabled?: boolean;
  onCellClick?: (coord: Coordinate, row: number, col: number) => void;
  onCellHover?: (coord: Coordinate | null, row?: number, col?: number) => void;
  title?: string;
  subtitle?: string;
}

export function LedgerGrid({
  mode,
  grid,
  theme,
  locale,
  dict: propDict,
  isPanicMode,
  activeCoord,
  previewCells = [],
  previewValid = true,
  previewShipCode = null,
  disabled = false,
  onCellClick,
  onCellHover,
  title,
  subtitle,
}: LedgerGridProps) {
  const dict = propDict ?? DICTIONARY[locale];
  const isDark = theme === 'dark';
  const isExcel = theme === 'excel';
  const previewSet = new Set(previewCells);

  const resolvedTitle =
    title ?? (mode === 'OWN' ? dict.leftGridTitle : dict.rightGridTitle);
  const resolvedSubtitle =
    subtitle ?? (mode === 'OWN' ? dict.leftGridSubtitle : dict.rightGridSubtitle);

  const containerBorder = isDark ? 'border-[#32343a] bg-[#1e1e1e]' : 'border-gray-300 bg-white';
  const headerBarBg = isDark
    ? 'bg-[#25262a] text-gray-200 border-[#32343a]'
    : isExcel
      ? 'bg-[#edf2ef] text-gray-800 border-gray-300'
      : 'bg-[#f8f9fa] text-gray-800 border-gray-300';

  const axisHeaderBg = isDark
    ? 'bg-[#25262a] text-gray-400 border-[#32343a]'
    : 'bg-[#f1f3f4] text-gray-600 border-gray-300';

  const cellBorder = isDark ? 'border-[#2d2f34]' : 'border-gray-200';

  const renderCellState = (cell: GridCell): { text: string; className: string } => {
    // 1. Panic Mode (<16ms DOM mutation, CLS = 0)
    if (isPanicMode) {
      return {
        text: getDeterministicCurrency(cell.row, cell.col, mode === 'OWN' ? 1 : 2),
        className: isDark ? 'bg-[#1e1e1e] text-gray-300' : 'bg-white text-gray-700',
      };
    }

    // 2. Sunk (Liquidated Account)
    if (cell.shot === 'SUNK') {
      const code = cell.shipCode ?? 'ACCT';
      return {
        text: `${dict.cellLiquidatedPrefix} (${code})`,
        className: isDark
          ? 'bg-rose-950/90 text-rose-200 font-bold line-through'
          : 'bg-rose-200 text-rose-950 font-bold line-through',
      };
    }

    // 3. Hit (Flagged Discrepancy Impact)
    if (cell.shot === 'HIT') {
      return {
        text: dict.cellRefImpact,
        className: isDark
          ? 'bg-amber-950/80 text-rose-300 font-bold ring-1 ring-inset ring-rose-700'
          : 'bg-amber-100 text-rose-800 font-bold ring-1 ring-inset ring-rose-300',
      };
    }

    // 4. Miss (Verified Zero Variance)
    if (cell.shot === 'MISS') {
      return {
        text: dict.cellVerifiedZero,
        className: isDark ? 'bg-[#18191b] text-neutral-500' : 'bg-gray-50 text-gray-400',
      };
    }

    // 5. Placement Preview on OWN Grid during SETUP
    if (mode === 'OWN' && previewSet.has(cell.id)) {
      return {
        text: previewShipCode ?? cell.shipCode ?? dict.cellPending,
        className: previewValid
          ? isDark
            ? 'bg-emerald-900/60 text-emerald-200 ring-1 ring-inset ring-emerald-500 font-semibold'
            : 'bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-400 font-semibold'
          : isDark
            ? 'bg-rose-900/60 text-rose-200 ring-1 ring-inset ring-rose-500 font-semibold'
            : 'bg-rose-100 text-rose-900 ring-1 ring-inset ring-rose-400 font-semibold',
      };
    }

    // 6. Own Ship Intact
    if (mode === 'OWN' && cell.shipCode) {
      return {
        text: cell.shipCode,
        className: isDark
          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700 font-semibold'
          : 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold',
      };
    }

    // 7. Sonar 3x3 Hint
    if (cell.scannedHint !== undefined) {
      return {
        text: `${dict.cellScanPrefix} ${cell.scannedHint}/9`,
        className: isDark
          ? 'bg-amber-950/60 text-amber-300 font-bold border-amber-700'
          : 'bg-amber-50 text-amber-900 font-bold border-amber-300',
      };
    }

    // 8. Unchecked (Fog of War)
    return {
      text: mode === 'RADAR' ? dict.cellPending : '-',
      className: isDark
        ? 'bg-[#1e1e1e] text-neutral-500 hover:bg-blue-950/30'
        : 'bg-white text-gray-400 hover:bg-blue-50/50',
    };
  };

  return (
    <div className={`flex flex-col rounded border shadow-2xs overflow-hidden ${containerBorder}`}>
      {/* Sheet Section Header */}
      <div className={`flex items-center justify-between border-b px-3 py-1.5 ${headerBarBg}`}>
        <div className="min-w-0">
          <h2 className="truncate font-sans text-xs font-bold tracking-tight">{resolvedTitle}</h2>
          <p className="truncate font-mono text-[10px] opacity-75">{resolvedSubtitle}</p>
        </div>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
            isDark
              ? 'bg-[#18191b] text-gray-300 border-[#3e4045]'
              : 'bg-white text-gray-600 border-gray-300'
          }`}
        >
          {mode === 'OWN' ? 'A1:J10 [INT]' : 'A1:J10 [EXT]'}
        </span>
      </div>

      {/* 10x10 Fixed Layout Spreadsheet Table (CLS = 0) */}
      <div
        className="w-full overflow-x-auto"
        onMouseLeave={() => {
          if (onCellHover) onCellHover(null);
        }}
      >
        <table className="w-full min-w-[520px] table-fixed border-collapse select-none">
          <thead>
            <tr className="h-6">
              {/* Top-left corner selector */}
              <th
                className={`w-8 border-b border-r font-mono text-[10px] font-normal ${axisHeaderBg}`}
              >
                ◢
              </th>
              {COLUMNS.map((colLetter) => (
                <th
                  key={colLetter}
                  scope="col"
                  className={`border-b border-r text-center font-mono text-[11px] font-semibold ${axisHeaderBg}`}
                >
                  {colLetter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((rowNumber, rowIdx) => {
              const rowCells = grid[rowIdx] ?? [];
              return (
                <tr key={rowNumber} className="h-7">
                  {/* Row Number Header */}
                  <th
                    scope="row"
                    className={`w-8 border-b border-r text-center font-mono text-[11px] font-semibold ${axisHeaderBg}`}
                  >
                    {rowNumber}
                  </th>

                  {/* 10 Columns */}
                  {COLUMNS.map((colLetter, colIdx) => {
                    const fallbackCoord = `${colLetter}${rowNumber}`;
                    const cell: GridCell = rowCells[colIdx] ?? {
                      id: fallbackCoord,
                      row: rowIdx,
                      col: colIdx,
                      shipId: null,
                      shipCode: null,
                      shot: 'NONE',
                    };
                    const { text, className } = renderCellState(cell);
                    const isSelected = activeCoord === cell.id && !isPanicMode;

                    return (
                      <td
                        key={cell.id}
                        onClick={() => {
                          if (!disabled && !isPanicMode && onCellClick) {
                            onCellClick(cell.id, rowIdx, colIdx);
                          }
                        }}
                        onMouseEnter={() => {
                          if (!disabled && !isPanicMode && onCellHover) {
                            onCellHover(cell.id, rowIdx, colIdx);
                          }
                        }}
                        title={`${cell.id}: ${text}`}
                        className={`h-7 border-b border-r px-1 text-right font-mono text-[11px] tabular-nums transition-none ${cellBorder} ${className} ${
                          disabled || isPanicMode ? 'cursor-default' : 'cursor-cell'
                        } ${
                          isSelected
                            ? isDark
                              ? 'outline-2 -outline-offset-2 outline-blue-400 z-10'
                              : 'outline-2 -outline-offset-2 outline-blue-600 z-10'
                            : ''
                        }`}
                      >
                        <div className="truncate leading-6">{text}</div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LedgerGrid;
