'use client';

import React from 'react';
import {
  Database,
  EyeOff,
  FileSpreadsheet,
  Globe,
  MessageSquareText,
  Share2,
  ShieldCheck,
  Trophy,
  Users,
  Cpu,
} from 'lucide-react';
import type { CorporateTheme, GameMode, GamePhase, Locale } from '@/types/game';
import { THEME_METADATA } from '@/lib/constants';
import { DICTIONARY, type I18nDictionary } from '@/lib/i18n';

export interface SpreadsheetHeaderProps {
  theme: CorporateTheme;
  onThemeChange: (theme: CorporateTheme) => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  dict?: I18nDictionary;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  phase: GamePhase;
  isMyTurn: boolean;
  isPanicMode: boolean;
  onTogglePanicMode: () => void;
  onOpenLobby: () => void;
  onOpenLeaderboard: () => void;
  onToggleNotes: () => void;
  isNotesOpen?: boolean;
  unreadNotesCount?: number;
  roomId?: string | null;
}

export function SpreadsheetHeader({
  theme,
  onThemeChange,
  locale,
  onLocaleChange,
  dict: propDict,
  mode,
  onModeChange,
  phase,
  isMyTurn,
  isPanicMode,
  onTogglePanicMode,
  onOpenLobby,
  onOpenLeaderboard,
  onToggleNotes,
  isNotesOpen = false,
  unreadNotesCount = 0,
  roomId = null,
}: SpreadsheetHeaderProps) {
  const dict = propDict ?? DICTIONARY[locale];
  const themeMeta = THEME_METADATA[theme];
  const isDark = theme === 'dark';
  const isExcel = theme === 'excel';

  const getTurnBadgeInfo = (): { text: string; className: string } => {
    if (isPanicMode) {
      return {
        text: dict.panicActiveBanner,
        className: isDark
          ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
          : 'bg-slate-100 text-slate-700 border-slate-300',
      };
    }

    switch (phase) {
      case 'SETUP':
        return {
          text: dict.turnBadgeSetup,
          className: isDark
            ? 'bg-blue-950/70 text-blue-300 border-blue-800'
            : 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'WAITING_FOR_OPPONENT':
        return {
          text: dict.turnBadgeWaiting,
          className: isDark
            ? 'bg-amber-950/70 text-amber-300 border-amber-800'
            : 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'BATTLE':
        if (isMyTurn) {
          return {
            text: dict.turnBadgeYourTurn,
            className: isDark
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300',
          };
        }
        return {
          text: dict.turnBadgeOpponentTurn,
          className: isDark
            ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
            : 'bg-gray-100 text-gray-600 border-gray-300',
        };
      case 'GAMEOVER':
        return {
          text: dict.turnBadgeFinished,
          className: isDark
            ? 'bg-purple-950/70 text-purple-300 border-purple-800'
            : 'bg-slate-200 text-slate-800 border-slate-400',
        };
    }
  };

  const badge = getTurnBadgeInfo();

  const headerBg = isDark
    ? 'bg-[#1e1f22] text-gray-200 border-[#2b2d30]'
    : isExcel
      ? 'bg-[#f3f2f1] text-gray-800 border-gray-300'
      : 'bg-[#f9fbfd] text-gray-800 border-gray-200';

  const topRibbonBg = isExcel
    ? 'bg-[#107c41] text-white'
    : isDark
      ? 'bg-[#18191b] text-gray-300 border-b border-[#2b2d30]'
      : 'bg-white text-gray-800 border-b border-gray-200';

  const controlBtnBase = isDark
    ? 'bg-[#2b2d30] hover:bg-[#383a3e] text-gray-200 border-[#3e4045]'
    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300';

  return (
    <header className={`w-full select-none border-b ${headerBg}`}>
      {/* Top Document Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 min-h-[42px] ${topRibbonBg}`}>
        {/* Left: App Icon + Editable-looking Title + Menu */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border"
            style={{
              backgroundColor: isExcel ? '#0c5e31' : themeMeta.faviconColor,
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
            }}
            title={dict.appName}
          >
            {isDark ? <Database className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`truncate font-sans text-xs font-semibold px-1.5 py-0.5 rounded border border-transparent ${
                  isExcel
                    ? 'hover:border-white/30 text-white'
                    : isDark
                      ? 'hover:border-neutral-700 text-gray-100 font-mono'
                      : 'hover:border-gray-300 text-gray-800'
                }`}
              >
                {themeMeta.docTitle[locale]}
              </span>
              {roomId && !isPanicMode && (
                <span
                  className={`hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                    isExcel
                      ? 'bg-white/15 text-white border-white/25'
                      : isDark
                        ? 'bg-neutral-800 text-blue-400 border-neutral-700'
                        : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}
                >
                  ID: {roomId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Turn / Executive Read-Only Status Badge (Fixed height for CLS = 0) */}
        <div className="flex items-center justify-center">
          <div
            className={`inline-flex h-6 items-center gap-1.5 rounded border px-2.5 font-mono text-[11px] font-semibold tracking-tight ${badge.className}`}
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[260px] sm:max-w-none">{badge.text}</span>
          </div>
        </div>

        {/* Right: Mode Switcher, Theme Selector, Locale, Modals, Notes, Panic Button */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Active Mode Switcher (SINGLE vs MULTI) */}
          <div
            className={`inline-flex h-7 items-center rounded border p-0.5 text-[11px] ${
              isDark ? 'bg-[#1e1f22] border-[#3e4045]' : 'bg-gray-100 border-gray-300'
            }`}
          >
            <button
              type="button"
              onClick={() => onModeChange('SINGLE')}
              className={`inline-flex h-5 items-center gap-1 rounded-sm px-2 font-medium transition-colors ${
                mode === 'SINGLE'
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 shadow-xs'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Cpu className="h-3 w-3" />
              <span className="hidden md:inline">{dict.modeSinglePlayer}</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('MULTI')}
              className={`inline-flex h-5 items-center gap-1 rounded-sm px-2 font-medium transition-colors ${
                mode === 'MULTI'
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 shadow-xs'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-3 w-3" />
              <span className="hidden md:inline">{dict.modeMultiplayer}</span>
            </button>
          </div>

          {/* Chameleon Theme Selector */}
          <select
            aria-label="Corporate Theme"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as CorporateTheme)}
            className={`h-7 rounded border px-2 text-[11px] font-medium outline-none ${controlBtnBase}`}
          >
            <option value="sheets">{THEME_METADATA.sheets.label[locale]}</option>
            <option value="excel">{THEME_METADATA.excel.label[locale]}</option>
            <option value="dark">{THEME_METADATA.dark.label[locale]}</option>
          </select>

          {/* Language Toggle Button (ES / EN) */}
          <button
            type="button"
            onClick={() => onLocaleChange(locale === 'es' ? 'en' : 'es')}
            className={`inline-flex h-7 items-center gap-1 rounded border px-2 text-[11px] font-semibold uppercase ${controlBtnBase}`}
            title="Switch Language / Cambiar Idioma"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{locale.toUpperCase()}</span>
          </button>

          {/* Multiplayer Lobby / Share Button */}
          <button
            type="button"
            onClick={onOpenLobby}
            className={`inline-flex h-7 items-center gap-1 rounded border px-2 text-[11px] font-medium ${
              isPanicMode
                ? controlBtnBase
                : isDark
                  ? 'bg-blue-950/80 hover:bg-blue-900 text-blue-200 border-blue-800'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{dict.multiplayerLobbyBtn}</span>
          </button>

          {/* ELO Leaderboard Button */}
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className={`inline-flex h-7 items-center gap-1 rounded border px-2 text-[11px] font-medium ${controlBtnBase}`}
            title={dict.leaderboardBtn}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{dict.leaderboardBtn}</span>
          </button>

          {/* Cell Notes Drawer Toggle Button */}
          <button
            type="button"
            onClick={onToggleNotes}
            className={`inline-flex h-7 items-center gap-1 rounded border px-2 text-[11px] font-medium ${
              isNotesOpen && !isPanicMode
                ? isDark
                  ? 'bg-neutral-700 text-white border-neutral-500'
                  : 'bg-gray-200 text-gray-900 border-gray-400'
                : controlBtnBase
            }`}
            title={dict.notesDrawerBtn}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{dict.notesDrawerBtn}</span>
            {unreadNotesCount > 0 && !isPanicMode && (
              <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 py-0 text-[10px] font-mono text-white">
                {unreadNotesCount}
              </span>
            )}
          </button>

          {/* Instant Panic Button (Esc) */}
          <button
            type="button"
            onClick={onTogglePanicMode}
            className={`inline-flex h-7 items-center gap-1 rounded border px-2.5 text-[11px] font-semibold ${
              isPanicMode
                ? isDark
                  ? 'bg-emerald-900/60 text-emerald-200 border-emerald-700'
                  : 'bg-slate-800 text-white border-slate-900'
                : isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-gray-200 border-neutral-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
            }`}
            title={dict.panicButtonLabel}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>{dict.panicButtonLabel}</span>
          </button>
        </div>
      </div>

      {/* Secondary Fake Spreadsheet Menu Bar */}
      <div
        className={`flex h-6 items-center justify-between px-3 text-[11px] ${
          isDark
            ? 'bg-[#25262a] text-gray-400'
            : isExcel
              ? 'bg-[#f3f2f1] text-gray-700'
              : 'bg-[#f9fbfd] text-gray-600'
        }`}
      >
        <nav aria-label="Spreadsheet Menu" className="flex items-center gap-1 overflow-x-auto">
          {dict.fileMenu.map((item) => (
            <span
              key={item}
              className={`cursor-default rounded px-2 py-0.5 transition-colors ${
                isDark ? 'hover:bg-neutral-700/60 hover:text-gray-200' : 'hover:bg-gray-200/70 hover:text-gray-900'
              }`}
            >
              {item}
            </span>
          ))}
        </nav>
        <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] opacity-75">
          <span>ISO-27001</span>
          <span>•</span>
          <span>SOX-404</span>
        </div>
      </div>
    </header>
  );
}

export default SpreadsheetHeader;
