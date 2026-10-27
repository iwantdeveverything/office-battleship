'use client';

import React from 'react';
import { Award, RefreshCw, Trophy, X } from 'lucide-react';
import type { CorporateTheme, LeaderboardEntry, Locale } from '@/types/game';
import { INITIAL_LEADERBOARD } from '@/lib/constants';
import { DICTIONARY, type I18nDictionary } from '@/lib/i18n';

export interface GlobalLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPanicMode?: boolean;
  theme: CorporateTheme;
  locale: Locale;
  dict?: I18nDictionary;
  entries: LeaderboardEntry[];
  currentUserAlias?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function GlobalLeaderboardModal({
  isOpen,
  onClose,
  isPanicMode = false,
  theme,
  locale,
  dict: propDict,
  entries,
  currentUserAlias,
  isLoading = false,
  onRefresh,
}: GlobalLeaderboardModalProps) {
  const dict = propDict ?? DICTIONARY[locale];
  const isDark = theme === 'dark';

  if (!isOpen || isPanicMode) {
    return null;
  }

  const effectiveEntries = entries.length > 0 ? entries : INITIAL_LEADERBOARD;
  const sortedEntries = [...effectiveEntries].sort((a, b) => b.elo - a.elo);

  const modalBg = isDark
    ? 'bg-[#1e1f22] text-gray-200 border-[#383a40]'
    : 'bg-white text-gray-800 border-gray-300';

  const headerBg = isDark
    ? 'bg-[#25262a] border-[#32343a]'
    : 'bg-[#f8f9fa] border-gray-200';

  const rowBorder = isDark ? 'border-[#2d2f34]' : 'border-gray-200';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dict.leaderboardTitle}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
    >
      <div className={`w-full max-w-xl rounded border shadow-2xl overflow-hidden ${modalBg}`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b px-4 py-3 ${headerBg}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0">
              <h2 className="truncate font-sans text-sm font-bold">{dict.leaderboardTitle}</h2>
              <p className="truncate font-mono text-[11px] opacity-75">
                {dict.leaderboardSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded p-1.5 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
                title={dict.leaderboardRefreshTitle}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label={dict.lobbyCloseBtn}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className={`h-8 border-b text-left text-[11px] ${headerBg}`}>
                <th className="w-12 px-3 text-center font-semibold">#</th>
                <th className="px-3 font-semibold">{dict.leaderboardColAuditor}</th>
                <th className="px-3 font-semibold">{dict.leaderboardColDept}</th>
                <th className="w-24 px-3 text-right font-semibold">{dict.leaderboardColElo}</th>
                <th className="w-32 px-3 text-right font-semibold">{dict.leaderboardColRecord}</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry, idx) => {
                const rank = idx + 1;
                const isCurrentUser =
                  Boolean(currentUserAlias) &&
                  entry.alias.toLowerCase() === currentUserAlias?.toLowerCase();

                return (
                  <tr
                    key={entry.uid}
                    className={`h-9 border-b last:border-b-0 ${rowBorder} ${
                      isCurrentUser
                        ? isDark
                          ? 'bg-blue-950/40 font-semibold'
                          : 'bg-emerald-50/70 font-semibold'
                        : isDark
                          ? 'hover:bg-white/[0.02]'
                          : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <td className="px-3 text-center tabular-nums font-bold">
                      {rank <= 3 ? (
                        <span className="inline-flex items-center justify-center gap-0.5 text-amber-600 dark:text-amber-400">
                          <Award className="h-3.5 w-3.5" />
                          <span>{rank}</span>
                        </span>
                      ) : (
                        rank
                      )}
                    </td>
                    <td className="px-3 truncate">{entry.alias}</td>
                    <td className="px-3 font-sans text-[11px] opacity-80 truncate">
                      {entry.department}
                    </td>
                    <td className="px-3 text-right tabular-nums font-bold">{entry.elo}</td>
                    <td className="px-3 text-right tabular-nums">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {entry.wins}
                        {dict.leaderboardWinsShort}
                      </span>
                      <span className="mx-1 opacity-40">-</span>
                      <span className="text-rose-600 dark:text-rose-400">
                        {entry.losses}
                        {dict.leaderboardLossesShort}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-between border-t px-4 py-2.5 ${headerBg}`}>
          <span className="font-mono text-[10px] opacity-70">
            {dict.leaderboardFooterStandard}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-7 items-center rounded border px-3 text-xs font-semibold ${
              isDark
                ? 'bg-[#2b2d30] hover:bg-[#383a3e] text-gray-200 border-[#3e4045]'
                : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            {dict.lobbyCloseBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlobalLeaderboardModal;
