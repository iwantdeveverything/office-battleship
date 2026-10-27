'use client';

import React from 'react';
import type { CorporateTheme, Locale, ShipInstance } from '@/types/game';
import { FLEET_TEMPLATES } from '@/lib/constants';
import { DICTIONARY, type I18nDictionary } from '@/lib/i18n';

export interface FleetStatusSummaryItem {
  id: string;
  code: string;
  names: Record<Locale, string>;
  size: number;
  sunk: boolean;
  fakeValue: string;
  hits?: number;
}

export interface FleetSummaryBarProps {
  ownFleet: ShipInstance[];
  enemyFleet: FleetStatusSummaryItem[];
  theme: CorporateTheme;
  locale: Locale;
  dict?: I18nDictionary;
  isPanicMode: boolean;
  selectedShipId?: string | null;
  onSelectShip?: (shipId: string) => void;
}

export function FleetSummaryBar({
  ownFleet,
  enemyFleet,
  theme,
  locale,
  dict: propDict,
  isPanicMode,
  selectedShipId = null,
  onSelectShip,
}: FleetSummaryBarProps) {
  const dict = propDict ?? DICTIONARY[locale];
  const isDark = theme === 'dark';

  const cardBg = isDark
    ? 'bg-[#1e1e1e] text-gray-200 border-[#32343a]'
    : 'bg-white text-gray-800 border-gray-300';

  const headerBg = isDark
    ? 'bg-[#25262a] text-gray-300 border-[#32343a]'
    : 'bg-[#f8f9fa] text-gray-700 border-gray-300';

  const rowBorder = isDark ? 'border-[#2d2f34]' : 'border-gray-200';

  const getBadgeProps = (
    item: { sunk: boolean; hits?: number } | undefined,
    isOwn: boolean
  ): { label: string; className: string } => {
    if (isPanicMode) {
      return {
        label: dict.statusIntact,
        className: isDark
          ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    }

    if (!item) {
      return {
        label: isOwn ? dict.cellPending : dict.statusIntact,
        className: isDark
          ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
          : 'bg-gray-100 text-gray-600 border-gray-300',
      };
    }

    if (item.sunk) {
      return {
        label: dict.statusLiquidated,
        className: isDark
          ? 'bg-rose-950/80 text-rose-300 border-rose-800 line-through'
          : 'bg-rose-100 text-rose-900 border-rose-300 line-through',
      };
    }

    if (item.hits && item.hits > 0) {
      return {
        label: dict.statusDamaged,
        className: isDark
          ? 'bg-amber-950/80 text-amber-300 border-amber-700'
          : 'bg-amber-100 text-amber-900 border-amber-300',
      };
    }

    return {
      label: dict.statusIntact,
      className: isDark
        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
        : 'bg-emerald-50 text-emerald-800 border-emerald-300',
    };
  };

  return (
    <div className={`w-full rounded border shadow-2xs overflow-hidden select-none ${cardBg}`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b px-3 py-1.5 ${headerBg}`}>
        <h3 className="font-sans text-xs font-bold tracking-tight">{dict.fleetSummaryTitle}</h3>
        <span className="font-mono text-[10px] opacity-75">
          {locale === 'es' ? 'TOTAL RESERVA: $252,400.00' : 'TOTAL RESERVE: $252,400.00'}
        </span>
      </div>

      {/* Breakdown Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[680px] table-fixed border-collapse font-mono text-[11px]">
          <thead>
            <tr className={`h-6 border-b text-left ${headerBg}`}>
              <th className="w-24 px-2.5 font-semibold">
                {locale === 'es' ? 'CÓDIGO' : 'ACCT CODE'}
              </th>
              <th className="px-2.5 font-semibold">
                {locale === 'es' ? 'DENOMINACIÓN CONTABLE' : 'CORPORATE ACCOUNT ALIAS'}
              </th>
              <th className="w-20 px-2.5 text-center font-semibold">
                {locale === 'es' ? 'CELDAS' : 'CELLS'}
              </th>
              <th className="w-32 px-2.5 text-right font-semibold">
                {locale === 'es' ? 'VALOR LIBROS' : 'BOOK VALUE'}
              </th>
              <th className="w-36 px-2.5 text-center font-semibold">
                {locale === 'es' ? 'ESTADO ANEXO A' : 'ANNEX A STATUS'}
              </th>
              <th className="w-36 px-2.5 text-center font-semibold">
                {locale === 'es' ? 'ESTADO ANEXO B' : 'ANNEX B STATUS'}
              </th>
            </tr>
          </thead>
          <tbody>
            {FLEET_TEMPLATES.map((tpl) => {
              const ownShip = ownFleet.find((s) => s.id === tpl.id || s.code === tpl.code);
              const enemyShip = enemyFleet.find((s) => s.id === tpl.id || s.code === tpl.code);
              const ownBadge = getBadgeProps(ownShip, true);
              const enemyBadge = getBadgeProps(enemyShip, false);
              const isSelected = selectedShipId === tpl.id && !isPanicMode;

              return (
                <tr
                  key={tpl.id}
                  onClick={() => {
                    if (!isPanicMode && onSelectShip) {
                      onSelectShip(tpl.id);
                    }
                  }}
                  className={`h-7 border-b last:border-b-0 ${rowBorder} ${
                    onSelectShip && !isPanicMode ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? isDark
                        ? 'bg-blue-950/40'
                        : 'bg-blue-50/70'
                      : isDark
                        ? 'hover:bg-white/[0.02]'
                        : 'hover:bg-gray-50/80'
                  }`}
                >
                  <td className="px-2.5 font-bold">{tpl.code}</td>
                  <td className="px-2.5 font-sans text-xs truncate">{tpl.names[locale]}</td>
                  <td className="px-2.5 text-center tabular-nums">
                    {isPanicMode ? `${tpl.size}/${tpl.size}` : `${tpl.size}u`}
                  </td>
                  <td className="px-2.5 text-right tabular-nums font-medium">{tpl.fakeValue}</td>
                  <td className="px-2.5 text-center">
                    <span
                      className={`inline-block w-28 truncate rounded border px-1.5 py-0.5 text-[10px] font-bold ${ownBadge.className}`}
                    >
                      {ownBadge.label}
                    </span>
                  </td>
                  <td className="px-2.5 text-center">
                    <span
                      className={`inline-block w-28 truncate rounded border px-1.5 py-0.5 text-[10px] font-bold ${enemyBadge.className}`}
                    >
                      {enemyBadge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FleetSummaryBar;
