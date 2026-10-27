'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  FilePlus2,
  Link2,
  RefreshCw,
  Share2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { CorporateTheme, Locale, MatchRoomState } from '@/types/game';
import { DICTIONARY, type I18nDictionary } from '@/lib/i18n';

export interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPanicMode?: boolean;
  theme: CorporateTheme;
  locale: Locale;
  dict?: I18nDictionary;
  auditorAlias: string;
  onAliasChange: (alias: string) => void;
  roomId: string | null;
  openRooms: MatchRoomState[];
  isLoading?: boolean;
  onCreateRoom: () => void;
  onQuickMatch: () => void;
  onJoinRoom: (roomId: string) => void;
  onRefreshRooms?: () => void;
}

export function MultiplayerLobbyModal({
  isOpen,
  onClose,
  isPanicMode = false,
  theme,
  locale,
  dict: propDict,
  auditorAlias,
  onAliasChange,
  roomId,
  openRooms,
  isLoading = false,
  onCreateRoom,
  onQuickMatch,
  onJoinRoom,
  onRefreshRooms,
}: MultiplayerLobbyModalProps) {
  const dict = propDict ?? DICTIONARY[locale];
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || isPanicMode) {
    return null;
  }

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://docs.internal-audit.corp';

  const disguisedUrl = roomId
    ? `${origin}/spreadsheets/d/${roomId}/edit?usp=sharing`
    : `${origin}/spreadsheets/d/q4-pending-room/edit?usp=sharing`;

  const handleCopyUrl = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(disguisedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  };

  const modalBg = isDark
    ? 'bg-[#1e1f22] text-gray-200 border-[#383a40]'
    : 'bg-white text-gray-800 border-gray-300';

  const headerBg = isDark
    ? 'bg-[#25262a] border-[#32343a]'
    : 'bg-[#f8f9fa] border-gray-200';

  const inputClass = isDark
    ? 'bg-[#18191b] text-gray-100 border-[#3e4045] focus:border-blue-500'
    : 'bg-white text-gray-900 border-gray-300 focus:border-emerald-700';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dict.lobbyTitle}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
    >
      <div className={`w-full max-w-xl rounded border shadow-2xl overflow-hidden ${modalBg}`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b px-4 py-3 ${headerBg}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <Share2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-blue-400" />
            <div className="min-w-0">
              <h2 className="truncate font-sans text-sm font-bold">{dict.lobbyTitle}</h2>
              <p className="truncate font-mono text-[11px] opacity-75">{dict.lobbySubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={dict.lobbyCloseBtn}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Auditor Alias + Room Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block font-mono text-[11px] font-semibold mb-1">
                {dict.lobbyAliasLabel}
              </label>
              <input
                type="text"
                value={auditorAlias}
                onChange={(e) => onAliasChange(e.target.value)}
                maxLength={24}
                className={`h-8 w-full rounded border px-2.5 font-mono text-xs outline-none ${inputClass}`}
              />
            </div>

            <div className="sm:col-span-7 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={onCreateRoom}
                className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded border px-3 font-semibold transition-colors ${
                  isDark
                    ? 'bg-blue-700 hover:bg-blue-600 text-white border-blue-500'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                }`}
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                <span>{dict.lobbyCreateRoomBtn}</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={onQuickMatch}
                className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded border px-3 font-semibold transition-colors ${
                  isDark
                    ? 'bg-[#2b2d30] hover:bg-[#383a3e] text-gray-100 border-[#3e4045]'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>{dict.lobbyQuickMatchBtn}</span>
              </button>
            </div>
          </div>

          {/* Disguised Share URL Box */}
          <div
            className={`rounded border p-3 space-y-1.5 ${
              isDark ? 'bg-[#18191b] border-[#32343a]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                <Link2 className="h-3.5 w-3.5 opacity-75" />
                <span>{dict.lobbyShareUrlLabel}</span>
              </span>
              {roomId && (
                <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  ROOM: {roomId}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={disguisedUrl}
                className={`h-8 flex-1 rounded border px-2.5 font-mono text-[11px] select-all outline-none ${inputClass}`}
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded border px-3 font-mono text-[11px] font-semibold ${
                  copied
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : isDark
                      ? 'bg-[#2b2d30] hover:bg-[#383a3e] text-gray-200 border-[#3e4045]'
                      : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
                }`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? dict.lobbyCopiedBtn : dict.lobbyCopyBtn}</span>
              </button>
            </div>
          </div>

          {/* Open Workbooks Waiting for Counterparty */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="inline-flex items-center gap-1.5 font-sans text-xs font-bold">
                <Users className="h-3.5 w-3.5 opacity-75" />
                <span>{dict.lobbyOpenRoomsTitle}</span>
              </h3>
              {onRefreshRooms && (
                <button
                  type="button"
                  onClick={onRefreshRooms}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] opacity-75 hover:opacity-100"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>SYNC</span>
                </button>
              )}
            </div>

            <div
              className={`max-h-48 overflow-y-auto rounded border divide-y ${
                isDark
                  ? 'border-[#32343a] divide-[#2b2d30] bg-[#18191b]'
                  : 'border-gray-200 divide-gray-200 bg-white'
              }`}
            >
              {openRooms.length === 0 ? (
                <div className="py-8 text-center font-mono text-[11px] opacity-60">
                  {dict.lobbyNoOpenRooms}
                </div>
              ) : (
                openRooms.map((room) => (
                  <div
                    key={room.roomId}
                    className="flex items-center justify-between px-3 py-2 font-mono text-[11px]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{room.p1.alias}</span>
                        <span className="rounded border px-1 text-[10px] opacity-75">
                          ELO {room.p1.elo}
                        </span>
                      </div>
                      <p className="truncate text-[10px] opacity-60">
                        ID: {room.roomId} • {room.status}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onJoinRoom(room.roomId)}
                      className={`inline-flex h-7 items-center rounded border px-3 font-sans text-xs font-semibold ${
                        isDark
                          ? 'bg-blue-700 hover:bg-blue-600 text-white border-blue-500'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                      }`}
                    >
                      {dict.lobbyJoinBtn}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-end border-t px-4 py-2.5 ${headerBg}`}>
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

export default MultiplayerLobbyModal;
