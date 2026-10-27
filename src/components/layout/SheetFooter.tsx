'use client';

import React, { useState } from 'react';
import { CheckCircle, Plus, Table2 } from 'lucide-react';
import type { CorporateTheme, Locale } from '@/types/game';
import { DICTIONARY, type I18nDictionary } from '@/lib/i18n';

export interface SheetFooterProps {
  theme: CorporateTheme;
  locale: Locale;
  dict?: I18nDictionary;
  statusMessage: string;
  isPanicMode: boolean;
  activeTab?: 'reconciliation' | 'consolidated' | 'variance';
  onTabChange?: (tab: 'reconciliation' | 'consolidated' | 'variance') => void;
}

export function SheetFooter({
  theme,
  locale,
  dict: propDict,
  statusMessage,
  isPanicMode,
  activeTab: propActiveTab,
  onTabChange,
}: SheetFooterProps) {
  const dict = propDict ?? DICTIONARY[locale];
  const isDark = theme === 'dark';
  const isExcel = theme === 'excel';

  const [internalTab, setInternalTab] = useState<'reconciliation' | 'consolidated' | 'variance'>(
    'reconciliation'
  );
  const currentTab = propActiveTab ?? internalTab;

  const handleSelectTab = (tab: 'reconciliation' | 'consolidated' | 'variance') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const footerBg = isDark
    ? 'bg-[#1e1f22] text-gray-300 border-[#2b2d30]'
    : isExcel
      ? 'bg-[#f3f2f1] text-gray-700 border-gray-300'
      : 'bg-[#f8f9fa] text-gray-700 border-gray-300';

  const activeTabClass = isDark
    ? 'bg-[#2b2d30] text-blue-400 border-t-2 border-t-blue-500 font-semibold'
    : isExcel
      ? 'bg-white text-[#107c41] border-t-2 border-t-[#107c41] font-semibold'
      : 'bg-white text-[#0f9d58] border-t-2 border-t-[#0f9d58] font-semibold';

  const inactiveTabClass = isDark
    ? 'text-gray-400 hover:bg-[#25262a] hover:text-gray-200'
    : 'text-gray-600 hover:bg-gray-200/60 hover:text-gray-900';

  const displayedStatus = isPanicMode ? dict.panicStatusBarVerified : statusMessage;

  return (
    <footer
      className={`flex h-8 w-full shrink-0 select-none items-center justify-between gap-3 border-t px-3 text-[11px] ${footerBg}`}
    >
      {/* Left: Spreadsheet Worksheet Tabs */}
      <div className="flex h-full items-center gap-0.5 overflow-x-auto whitespace-nowrap">
        <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded opacity-60">
          <Plus className="h-3.5 w-3.5" />
        </span>

        <button
          type="button"
          onClick={() => handleSelectTab('reconciliation')}
          className={`inline-flex h-full items-center gap-1.5 px-3 font-mono text-[11px] transition-colors ${
            currentTab === 'reconciliation' ? activeTabClass : inactiveTabClass
          }`}
        >
          <Table2 className="h-3 w-3" />
          <span>{dict.footerTabReconciliation}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('consolidated')}
          className={`inline-flex h-full items-center gap-1.5 px-3 font-mono text-[11px] transition-colors ${
            currentTab === 'consolidated' ? activeTabClass : inactiveTabClass
          }`}
        >
          <Table2 className="h-3 w-3 opacity-70" />
          <span>{dict.footerTabConsolidated}</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('variance')}
          className={`inline-flex h-full items-center gap-1.5 px-3 font-mono text-[11px] transition-colors ${
            currentTab === 'variance' ? activeTabClass : inactiveTabClass
          }`}
        >
          <Table2 className="h-3 w-3 opacity-70" />
          <span>{dict.footerTabVariance}</span>
        </button>
      </div>

      {/* Center: Live Audit Status Log (or Verified message in Panic Mode) */}
      <div className="flex flex-1 items-center justify-center min-w-0 px-2">
        <div className="inline-flex items-center gap-1.5 truncate font-mono text-[11px]">
          <CheckCircle
            className={`h-3.5 w-3.5 shrink-0 ${
              isPanicMode
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          />
          <span className="truncate">{displayedStatus}</span>
        </div>
      </div>

      {/* Right: Fake Spreadsheet Summary Aggregates (SUM | AVG | COUNT) */}
      <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] tabular-nums whitespace-nowrap">
        <span>{dict.footerSumLabel}</span>
        <span className="opacity-30">|</span>
        <span>{dict.footerAvgLabel}</span>
        <span className="opacity-30">|</span>
        <span>{dict.footerCountLabel}</span>
      </div>
    </footer>
  );
}

export default SheetFooter;
