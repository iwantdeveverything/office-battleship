'use client';

import React from 'react';
import type {
  Coordinate,
  CorporateTheme,
  GamePhase,
  GridCell,
  Locale,
  ShipInstance,
} from '@/types/game';
import { DICTIONARY, type I18nDictionary } from '@/lib/i18n';
import { LedgerGrid } from './LedgerGrid';
import { FleetSummaryBar, type FleetStatusSummaryItem } from './FleetSummaryBar';

export interface ReconciliationWorkspaceProps {
  theme: CorporateTheme;
  locale: Locale;
  dict?: I18nDictionary;
  phase: GamePhase;
  isMyTurn: boolean;
  isPanicMode: boolean;
  ownGrid: GridCell[][];
  radarGrid: GridCell[][];
  ownFleet: ShipInstance[];
  enemyFleet: FleetStatusSummaryItem[];
  activeCoord?: Coordinate;
  previewCells?: Coordinate[];
  previewValid?: boolean;
  previewShipCode?: string | null;
  selectedShipId?: string | null;
  onSelectShip?: (shipId: string) => void;
  onOwnCellClick?: (coord: Coordinate, row: number, col: number) => void;
  onOwnCellHover?: (coord: Coordinate | null, row?: number, col?: number) => void;
  onRadarCellClick?: (coord: Coordinate, row: number, col: number) => void;
  onRadarCellHover?: (coord: Coordinate | null, row?: number, col?: number) => void;
}

export function ReconciliationWorkspace({
  theme,
  locale,
  dict: propDict,
  phase,
  isMyTurn,
  isPanicMode,
  ownGrid,
  radarGrid,
  ownFleet,
  enemyFleet,
  activeCoord,
  previewCells = [],
  previewValid = true,
  previewShipCode = null,
  selectedShipId = null,
  onSelectShip,
  onOwnCellClick,
  onOwnCellHover,
  onRadarCellClick,
  onRadarCellHover,
}: ReconciliationWorkspaceProps) {
  const dict = propDict ?? DICTIONARY[locale];
  const isDark = theme === 'dark';

  const workspaceBg = isDark ? 'bg-[#18191b] text-gray-200' : 'bg-[#f1f3f4] text-gray-800';

  return (
    <main className={`flex-1 w-full overflow-y-auto p-3 space-y-3 ${workspaceBg}`}>
      {/* Dual 10x10 Responsive Side-by-Side Spreadsheet Grids */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
        <LedgerGrid
          mode="OWN"
          grid={ownGrid}
          theme={theme}
          locale={locale}
          dict={dict}
          isPanicMode={isPanicMode}
          activeCoord={activeCoord}
          previewCells={phase === 'SETUP' ? previewCells : []}
          previewValid={previewValid}
          previewShipCode={previewShipCode}
          disabled={phase !== 'SETUP'}
          onCellClick={onOwnCellClick}
          onCellHover={onOwnCellHover}
        />

        <LedgerGrid
          mode="RADAR"
          grid={radarGrid}
          theme={theme}
          locale={locale}
          dict={dict}
          isPanicMode={isPanicMode}
          activeCoord={activeCoord}
          disabled={phase !== 'BATTLE' || !isMyTurn}
          onCellClick={onRadarCellClick}
          onCellHover={onRadarCellHover}
        />
      </div>

      {/* Bottom Extraordinary Items / Reserved Financial Accounts Breakdown */}
      <FleetSummaryBar
        ownFleet={ownFleet}
        enemyFleet={enemyFleet}
        theme={theme}
        locale={locale}
        dict={dict}
        isPanicMode={isPanicMode}
        selectedShipId={selectedShipId}
        onSelectShip={onSelectShip}
      />
    </main>
  );
}

export default ReconciliationWorkspace;
