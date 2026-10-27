'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  CornerDownLeft,
  Filter,
  Lock,
  Play,
  Radar,
  RefreshCw,
  RotateCw,
  Rows3,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import type {
  Coordinate,
  CorporateTheme,
  GamePhase,
  Locale,
  MacroInventory,
  Orientation,
} from '@/types/game';
import { ROWS } from '@/lib/constants';
import { DICTIONARY, type I18nDictionary } from '@/lib/i18n';

export interface FormulaToolbarProps {
  theme: CorporateTheme;
  locale: Locale;
  dict?: I18nDictionary;
  phase: GamePhase;
  isMyTurn?: boolean;
  isPanicMode: boolean;
  activeCoord: Coordinate;
  formulaValue?: string;
  onFormulaChange?: (value: string) => void;
  onExecuteFormula: (formulaRaw: string) => void;
  formulaError?: string | null;
  orientation: Orientation;
  onToggleOrientation: () => void;
  onAutoAllocate: () => void;
  onClearLedger: () => void;
  canConfirmAllocation: boolean;
  onConfirmAllocation: () => void;
  onNewExercise?: () => void;
  macros: MacroInventory;
  onTriggerScan3x3?: (coord: Coordinate) => void;
  onTriggerBarrageRow?: (rowNumber: number) => void;
  discrepanciesFound: number;
  accountsLiquidated: number;
  auditAccuracy: number;
}

export function FormulaToolbar({
  theme,
  locale,
  dict: propDict,
  phase,
  isMyTurn = true,
  isPanicMode,
  activeCoord,
  formulaValue,
  onFormulaChange,
  onExecuteFormula,
  formulaError = null,
  orientation,
  onToggleOrientation,
  onAutoAllocate,
  onClearLedger,
  canConfirmAllocation,
  onConfirmAllocation,
  onNewExercise,
  macros,
  onTriggerScan3x3,
  onTriggerBarrageRow,
  discrepanciesFound,
  accountsLiquidated,
  auditAccuracy,
}: FormulaToolbarProps) {
  const dict = propDict ?? DICTIONARY[locale];
  const isDark = theme === 'dark';

  const [internalFormula, setInternalFormula] = useState<string>('');
  const [selectedBarrageRow, setSelectedBarrageRow] = useState<number>(1);

  const currentFormula = formulaValue !== undefined ? formulaValue : internalFormula;
  const setFormula = (nextVal: string) => {
    if (onFormulaChange) {
      onFormulaChange(nextVal);
    } else {
      setInternalFormula(nextVal);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPanicMode) return;
    const trimmed = currentFormula.trim();
    if (!trimmed) {
      const defaultCmd = locale === 'es' ? `=AUDITAR(${activeCoord})` : `=AUDIT(${activeCoord})`;
      onExecuteFormula(defaultCmd);
      return;
    }
    onExecuteFormula(trimmed);
  };

  const handleScanMacroClick = () => {
    if (isPanicMode || macros.scan3x3 <= 0 || phase !== 'BATTLE' || !isMyTurn) return;
    const coord = activeCoord || 'E5';
    if (onTriggerScan3x3) {
      onTriggerScan3x3(coord);
    } else {
      const cmd = locale === 'es' ? `=ESCANEAR_3X3(${coord})` : `=SCAN_3X3(${coord})`;
      setFormula(cmd);
      onExecuteFormula(cmd);
    }
  };

  const handleBarrageMacroClick = () => {
    if (isPanicMode || macros.barrageRow <= 0 || phase !== 'BATTLE' || !isMyTurn) return;
    if (onTriggerBarrageRow) {
      onTriggerBarrageRow(selectedBarrageRow);
    } else {
      const cmd =
        locale === 'es'
          ? `=BARRIDO_FILA(${selectedBarrageRow})`
          : `=BARRAGE_ROW(${selectedBarrageRow})`;
      setFormula(cmd);
      onExecuteFormula(cmd);
    }
  };

  const barBg = isDark
    ? 'bg-[#25262a] text-gray-200 border-[#32343a]'
    : 'bg-white text-gray-800 border-gray-200';

  const subBarBg = isDark
    ? 'bg-[#1e1f22] text-gray-300 border-[#2b2d30]'
    : 'bg-[#f8f9fa] text-gray-700 border-gray-200';

  const btnStyle = isDark
    ? 'bg-[#2b2d30] hover:bg-[#383a3e] text-gray-200 border-[#3e4045]'
    : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300';

  return (
    <section className={`w-full select-none border-b ${barBg}`}>
      {/* Row 1: Controls / Macros / Panic Accounting Filter Bar (Fixed h-9 for CLS = 0) */}
      <div
        className={`flex h-9 items-center justify-between gap-2 overflow-x-auto px-3 border-b ${subBarBg}`}
      >
        {isPanicMode ? (
          /* Harmless Accounting Filter Bar with identical height (CLS = 0) */
          <div className="flex items-center gap-3 font-mono text-[11px] whitespace-nowrap">
            <span className="inline-flex h-6 items-center gap-1.5 rounded border px-2 border-gray-300/60 dark:border-neutral-700">
              <Filter className="h-3 w-3 opacity-70" />
              <span>{dict.panicFilterVerified}</span>
            </span>
            <span className="inline-flex h-6 items-center gap-1.5 rounded border px-2 border-gray-300/60 dark:border-neutral-700">
              <SlidersHorizontal className="h-3 w-3 opacity-70" />
              <span>{dict.panicFilterCurrency}</span>
            </span>
            <span className="inline-flex h-6 items-center gap-1.5 rounded border px-2 border-gray-300/60 dark:border-neutral-700">
              <Lock className="h-3 w-3 opacity-70" />
              <span>{dict.panicFilterAuditTrail}</span>
            </span>
          </div>
        ) : phase === 'SETUP' ? (
          /* Setup Controls */
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={onToggleOrientation}
              className={`inline-flex h-6 items-center gap-1.5 rounded border px-2.5 text-[11px] font-medium ${btnStyle}`}
            >
              <RotateCw className="h-3 w-3" />
              <span>{dict.rotateAxisBtn}:</span>
              <span className="font-mono font-bold">{orientation}</span>
            </button>

            <button
              type="button"
              onClick={onAutoAllocate}
              className={`inline-flex h-6 items-center gap-1.5 rounded border px-2.5 text-[11px] font-medium ${btnStyle}`}
            >
              <RefreshCw className="h-3 w-3" />
              <span>{dict.autoAllocateBtn}</span>
            </button>

            <button
              type="button"
              onClick={onClearLedger}
              className={`inline-flex h-6 items-center gap-1.5 rounded border px-2.5 text-[11px] font-medium ${btnStyle}`}
            >
              <Trash2 className="h-3 w-3" />
              <span>{dict.clearLedgerBtn}</span>
            </button>

            <button
              type="button"
              disabled={!canConfirmAllocation}
              onClick={onConfirmAllocation}
              className={`inline-flex h-6 items-center gap-1.5 rounded border px-3 text-[11px] font-semibold transition-colors ${
                canConfirmAllocation
                  ? isDark
                    ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                  : 'opacity-45 cursor-not-allowed ' + btnStyle
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{dict.confirmAllocationBtn}</span>
            </button>
          </div>
        ) : (
          /* Battle / Gameover Tactical Macros */
          <div className="flex items-center gap-2 whitespace-nowrap">
            <button
              type="button"
              disabled={macros.scan3x3 <= 0 || phase !== 'BATTLE' || !isMyTurn}
              onClick={handleScanMacroClick}
              className={`inline-flex h-6 items-center gap-1.5 rounded border px-2.5 font-mono text-[11px] font-medium ${
                macros.scan3x3 > 0 && phase === 'BATTLE' && isMyTurn
                  ? isDark
                    ? 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border-amber-700'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'opacity-45 cursor-not-allowed ' + btnStyle
              }`}
              title={`${dict.macroScanBtn}(${activeCoord || 'E5'})`}
            >
              <Radar className="h-3 w-3" />
              <span>
                {dict.macroScanBtn}({activeCoord || 'E5'})
              </span>
              <span className="rounded bg-black/10 px-1 text-[10px] font-bold">
                {macros.scan3x3}/1
              </span>
            </button>

            <div className="inline-flex h-6 items-center">
              <button
                type="button"
                disabled={macros.barrageRow <= 0 || phase !== 'BATTLE' || !isMyTurn}
                onClick={handleBarrageMacroClick}
                className={`inline-flex h-6 items-center gap-1.5 rounded-l border px-2.5 font-mono text-[11px] font-medium ${
                  macros.barrageRow > 0 && phase === 'BATTLE' && isMyTurn
                    ? isDark
                      ? 'bg-blue-950/70 hover:bg-blue-900/80 text-blue-200 border-blue-700'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300'
                    : 'opacity-45 cursor-not-allowed ' + btnStyle
                }`}
              >
                <Rows3 className="h-3 w-3" />
                <span>{dict.macroBarrageBtn}</span>
                <span className="rounded bg-black/10 px-1 text-[10px] font-bold">
                  {macros.barrageRow}/1
                </span>
              </button>
              <select
                aria-label="Barrage Row Selector"
                value={selectedBarrageRow}
                onChange={(e) => setSelectedBarrageRow(Number(e.target.value))}
                disabled={macros.barrageRow <= 0 || phase !== 'BATTLE' || !isMyTurn}
                className={`h-6 rounded-r border-y border-r px-1.5 font-mono text-[11px] outline-none ${btnStyle}`}
              >
                {ROWS.map((r) => (
                  <option key={r} value={r}>
                    R{r}
                  </option>
                ))}
              </select>
            </div>

            {phase === 'GAMEOVER' && onNewExercise && (
              <button
                type="button"
                onClick={onNewExercise}
                className={`inline-flex h-6 items-center gap-1.5 rounded border px-2.5 text-[11px] font-semibold ${
                  isDark
                    ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-600'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                }`}
              >
                <Play className="h-3 w-3" />
                <span>{dict.newExerciseBtn}</span>
              </button>
            )}
          </div>
        )}

        {/* Right Side: KPI Counters (Normalized in Panic Mode with zero layout shift) */}
        <div className="flex items-center gap-3 font-mono text-[11px] whitespace-nowrap">
          <div className="flex items-center gap-1">
            <span className="opacity-70">{dict.kpiDiscrepanciesFound}:</span>
            <span className="font-semibold tabular-nums">
              {isPanicMode ? '0' : discrepanciesFound}
            </span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-1">
            <span className="opacity-70">{dict.kpiAccountsLiquidated}:</span>
            <span className="font-semibold tabular-nums">
              {isPanicMode ? '5/5' : `${accountsLiquidated}/5`}
            </span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-1">
            <span className="opacity-70">{dict.kpiAuditAccuracy}:</span>
            <span className="font-semibold tabular-nums">
              {isPanicMode ? '100.0%' : `${auditAccuracy.toFixed(1)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Spreadsheet fx Formula Input Bar (Fixed h-8 for CLS = 0) */}
      <form onSubmit={handleFormSubmit} className="flex h-8 items-center gap-2 px-3">
        {/* Active Cell Coordinate Box */}
        <div
          className={`flex h-6 w-14 shrink-0 items-center justify-center rounded border font-mono text-xs font-semibold ${
            isDark
              ? 'bg-[#18191b] text-gray-200 border-[#3e4045]'
              : 'bg-gray-50 text-gray-800 border-gray-300'
          }`}
        >
          {activeCoord || 'A1'}
        </div>

        {/* fx Symbol */}
        <div
          className={`flex h-6 px-1.5 shrink-0 items-center justify-center font-serif italic text-xs font-bold ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          fx
        </div>

        {/* Formula Text Input */}
        <input
          type="text"
          value={
            isPanicMode
              ? `=VLOOKUP(${activeCoord || 'A1'}, Consolidated_Ledger!A1:J10, 2, FALSE)`
              : currentFormula
          }
          onChange={(e) => setFormula(e.target.value)}
          readOnly={isPanicMode}
          placeholder={dict.formulaPlaceholder}
          aria-label="Spreadsheet Formula Bar"
          className={`h-6 flex-1 rounded border px-2.5 font-mono text-xs outline-none transition-colors ${
            isDark
              ? 'bg-[#18191b] text-gray-100 border-[#3e4045] focus:border-blue-500 placeholder:text-gray-500'
              : 'bg-white text-gray-900 border-gray-300 focus:border-blue-600 placeholder:text-gray-400'
          }`}
        />

        {/* Inline Formula Validation Feedback */}
        {formulaError && !isPanicMode && (
          <span className="hidden md:inline-block truncate max-w-xs font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            {formulaError}
          </span>
        )}

        {/* Execute Button */}
        <button
          type="submit"
          disabled={isPanicMode}
          className={`inline-flex h-6 shrink-0 items-center gap-1 rounded border px-2.5 text-[11px] font-semibold ${
            isPanicMode ? 'opacity-50 cursor-default ' + btnStyle : btnStyle
          }`}
        >
          <CornerDownLeft className="h-3 w-3" />
          <span>{dict.formulaExecuteBtn}</span>
        </button>
      </form>
    </section>
  );
}

export default FormulaToolbar;
