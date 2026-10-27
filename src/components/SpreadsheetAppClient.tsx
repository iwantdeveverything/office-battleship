'use client';

import React, { useEffect, useState } from 'react';
import { AuditNotesChat } from '@/components/drawers/AuditNotesChat';
import { ReconciliationWorkspace } from '@/components/grid/ReconciliationWorkspace';
import { FormulaToolbar } from '@/components/layout/FormulaToolbar';
import { SheetFooter } from '@/components/layout/SheetFooter';
import { SpreadsheetHeader } from '@/components/layout/SpreadsheetHeader';
import { GlobalLeaderboardModal } from '@/components/modals/GlobalLeaderboardModal';
import { MultiplayerLobbyModal } from '@/components/modals/MultiplayerLobbyModal';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useStealthMode } from '@/hooks/useStealthMode';
import { DICTIONARY } from '@/lib/i18n';
import type { Coordinate } from '@/types/game';

export interface SpreadsheetAppClientProps {
  initialRoomId?: string | null;
}

export function SpreadsheetAppClient({ initialRoomId = null }: SpreadsheetAppClientProps) {
  const [hasAutoJoined, setHasAutoJoined] = useState<boolean>(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);

  const stealth = useStealthMode();
  const engine = useGameEngine({
    locale: stealth.locale,
    alias: stealth.alias,
  });

  // Keep dynamic tab title (* indicator on active turn) synced with theme and panic state
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isActiveTurn = engine.phase === 'BATTLE' && engine.isMyTurn && !stealth.isPanicMode;
    const baseTitle = document.title.replace(/^\*\s+/, '');
    document.title = isActiveTurn ? `* ${baseTitle}` : baseTitle;
  }, [engine.phase, engine.isMyTurn, stealth.isPanicMode, stealth.theme, stealth.locale]);

  const dict = DICTIONARY[stealth.locale];

  // Automatically join or create the room when arriving via a disguised URL (/spreadsheets/d/[roomId]/edit)
  useEffect(() => {
    if (!initialRoomId || hasAutoJoined) return;
    setHasAutoJoined(true);
    engine.setMode('MULTI');
    void engine.multiplayer.joinRoom(initialRoomId);
  }, [initialRoomId, hasAutoJoined, engine]);

  const handleOwnCellClick = (coord: Coordinate, row: number, col: number) => {
    engine.setSelectedCoord(coord);
    if (engine.phase === 'SETUP') {
      engine.placeShipAt(row, col);
    }
  };

  const handleOwnCellHover = (coord: Coordinate | null, row?: number, col?: number) => {
    if (coord && row !== undefined && col !== undefined) {
      engine.setHoverCell({ row, col });
    } else {
      engine.setHoverCell(null);
    }
  };

  const handleRadarCellClick = (coord: Coordinate, row: number, col: number) => {
    engine.setSelectedCoord(coord);
    void engine.handleRadarCellClick(row, col);
  };

  const handleTriggerScan3x3 = (coord: Coordinate) => {
    const formula =
      stealth.locale === 'es' ? `=ESCANEAR_3X3(${coord})` : `=SCAN_3X3(${coord})`;
    void engine.executeFormula(formula);
  };

  const handleTriggerBarrageRow = (rowNumber: number) => {
    const formula =
      stealth.locale === 'es' ? `=BARRIDO_FILA(${rowNumber})` : `=BARRAGE_ROW(${rowNumber})`;
    void engine.executeFormula(formula);
  };

  const themeFontClass =
    stealth.theme === 'dark'
      ? 'font-mono bg-[#18191b] text-gray-200'
      : stealth.theme === 'excel'
        ? 'font-sans bg-[#f3f2f1] text-gray-900'
        : 'font-sans bg-[#f8f9fa] text-gray-900';

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${themeFontClass}`}>
      <SpreadsheetHeader
        theme={stealth.theme}
        onThemeChange={stealth.setTheme}
        locale={stealth.locale}
        onLocaleChange={stealth.setLocale}
        dict={dict}
        mode={engine.mode}
        onModeChange={(nextMode) => {
          engine.setMode(nextMode);
          if (nextMode === 'MULTI' && !engine.multiplayer.activeRoomId) {
            setIsLobbyOpen(true);
            void engine.multiplayer.refreshLobby();
          }
        }}
        phase={engine.phase}
        isMyTurn={engine.isMyTurn}
        isPanicMode={stealth.isPanicMode}
        onTogglePanicMode={stealth.togglePanicMode}
        onOpenLobby={() => {
          setIsLobbyOpen(true);
          void engine.multiplayer.refreshLobby();
        }}
        onOpenLeaderboard={() => {
          setIsLeaderboardOpen(true);
          void engine.multiplayer.refreshLobby();
        }}
        onToggleNotes={() => setIsNotesOpen((prev) => !prev)}
        isNotesOpen={isNotesOpen}
        unreadNotesCount={engine.comments.length}
        roomId={engine.multiplayer.activeRoomId}
      />

      <FormulaToolbar
        theme={stealth.theme}
        locale={stealth.locale}
        dict={dict}
        phase={engine.phase}
        isMyTurn={engine.isMyTurn}
        isPanicMode={stealth.isPanicMode}
        activeCoord={engine.selectedCoord}
        formulaValue={engine.formulaInput}
        onFormulaChange={engine.setFormulaInput}
        onExecuteFormula={(raw) => {
          void engine.executeFormula(raw);
        }}
        formulaError={engine.formulaError}
        orientation={engine.orientation}
        onToggleOrientation={engine.toggleOrientation}
        onAutoAllocate={engine.autoAllocate}
        onClearLedger={engine.clearBoard}
        canConfirmAllocation={engine.isSetupComplete}
        onConfirmAllocation={() => {
          void engine.confirmSetup();
        }}
        onNewExercise={engine.resetExercise}
        macros={engine.macros}
        onTriggerScan3x3={handleTriggerScan3x3}
        onTriggerBarrageRow={handleTriggerBarrageRow}
        discrepanciesFound={engine.hitsCount}
        accountsLiquidated={engine.sunkCount}
        auditAccuracy={engine.accuracyPct}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <ReconciliationWorkspace
          theme={stealth.theme}
          locale={stealth.locale}
          dict={dict}
          phase={engine.phase}
          isMyTurn={engine.isMyTurn}
          isPanicMode={stealth.isPanicMode}
          ownGrid={engine.ownGrid}
          radarGrid={engine.radarGrid}
          ownFleet={engine.ownFleet}
          enemyFleet={engine.enemyFleetSummary}
          activeCoord={engine.selectedCoord}
          previewCells={Array.from(engine.placementPreview.coords)}
          previewValid={engine.placementPreview.valid}
          previewShipCode={engine.currentShipTemplate?.code ?? null}
          selectedShipId={engine.currentShipTemplate?.id ?? null}
          onOwnCellClick={handleOwnCellClick}
          onOwnCellHover={handleOwnCellHover}
          onRadarCellClick={handleRadarCellClick}
        />

        <AuditNotesChat
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          isPanicMode={stealth.isPanicMode}
          theme={stealth.theme}
          locale={stealth.locale}
          dict={dict}
          comments={engine.comments}
          activeCoord={engine.selectedCoord}
          onSendComment={(text, coord) => {
            void engine.addComment(text, coord);
          }}
          onSelectCoord={(coord) => engine.setSelectedCoord(coord)}
        />
      </div>

      <SheetFooter
        theme={stealth.theme}
        locale={stealth.locale}
        dict={dict}
        statusMessage={engine.actionLog}
        isPanicMode={stealth.isPanicMode}
      />

      <MultiplayerLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        isPanicMode={stealth.isPanicMode}
        theme={stealth.theme}
        locale={stealth.locale}
        dict={dict}
        auditorAlias={stealth.alias}
        onAliasChange={stealth.setAlias}
        roomId={engine.multiplayer.activeRoomId}
        openRooms={engine.multiplayer.openRooms}
        isLoading={engine.multiplayer.isSyncing}
        onCreateRoom={() => {
          engine.setMode('MULTI');
          void engine.multiplayer.createRoom();
        }}
        onQuickMatch={() => {
          engine.setMode('MULTI');
          void engine.multiplayer.quickMatch();
        }}
        onJoinRoom={(targetRoomId) => {
          engine.setMode('MULTI');
          void engine.multiplayer.joinRoom(targetRoomId);
          setIsLobbyOpen(false);
        }}
        onRefreshRooms={() => {
          void engine.multiplayer.refreshLobby();
        }}
      />

      <GlobalLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        isPanicMode={stealth.isPanicMode}
        theme={stealth.theme}
        locale={stealth.locale}
        dict={dict}
        entries={engine.multiplayer.leaderboard}
        currentUserAlias={stealth.alias}
        isLoading={engine.multiplayer.isSyncing}
        onRefresh={() => {
          void engine.multiplayer.refreshLobby();
        }}
      />
    </div>
  );
}
