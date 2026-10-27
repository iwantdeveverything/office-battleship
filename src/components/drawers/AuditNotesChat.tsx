'use client';

import React, { useState } from 'react';
import { Hash, MessageSquareText, Send, X } from 'lucide-react';
import type { AuditComment, Coordinate, CorporateTheme, Locale } from '@/types/game';
import { DICTIONARY, type I18nDictionary } from '@/lib/i18n';

export interface AuditNotesChatProps {
  isOpen: boolean;
  onClose: () => void;
  isPanicMode: boolean;
  theme: CorporateTheme;
  locale: Locale;
  dict?: I18nDictionary;
  comments: AuditComment[];
  activeCoord?: Coordinate;
  onSendComment: (text: string, cellCoord?: Coordinate) => void;
  onSelectCoord?: (coord: Coordinate) => void;
}

export function AuditNotesChat({
  isOpen,
  onClose,
  isPanicMode,
  theme,
  locale,
  dict: propDict,
  comments,
  activeCoord,
  onSendComment,
  onSelectCoord,
}: AuditNotesChatProps) {
  const dict = propDict ?? DICTIONARY[locale];
  const isDark = theme === 'dark';

  const [noteText, setNoteText] = useState<string>('');
  const [attachCoord, setAttachCoord] = useState<boolean>(true);

  // Automatically hidden when Panic Mode is active or drawer is closed
  if (isPanicMode || !isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = noteText.trim();
    if (!cleaned) return;
    onSendComment(cleaned, attachCoord && activeCoord ? activeCoord : undefined);
    setNoteText('');
  };

  const formatTimestamp = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const drawerBg = isDark
    ? 'bg-[#1e1f22] text-gray-200 border-[#32343a]'
    : 'bg-white text-gray-800 border-gray-300';

  const headerBg = isDark
    ? 'bg-[#25262a] border-[#32343a]'
    : 'bg-[#f8f9fa] border-gray-200';

  const cardBg = isDark
    ? 'bg-[#25262a] border-[#383a40] text-gray-200'
    : 'bg-amber-50/40 border-amber-200/80 text-gray-800';

  return (
    <aside
      aria-label={dict.chatHeaderTitle}
      className={`fixed top-[42px] right-0 bottom-8 z-30 flex w-80 sm:w-96 flex-col border-l shadow-xl ${drawerBg}`}
    >
      {/* Drawer Header */}
      <div className={`flex items-center justify-between border-b px-3.5 py-2.5 ${headerBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquareText className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <h2 className="truncate font-sans text-xs font-bold">{dict.chatHeaderTitle}</h2>
            <p className="truncate font-mono text-[10px] opacity-75">{dict.chatHeaderSubtitle}</p>
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

      {/* Comments Thread List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {comments.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center px-4">
            <p className="font-mono text-xs opacity-60">{dict.chatEmptyState}</p>
          </div>
        ) : (
          comments.map((comment) => {
            const roleColor =
              comment.authorRole === 'SYSTEM'
                ? isDark
                  ? 'text-blue-400'
                  : 'text-blue-700'
                : comment.authorRole === 'P1'
                  ? isDark
                    ? 'text-emerald-400'
                    : 'text-emerald-800'
                  : isDark
                    ? 'text-amber-300'
                    : 'text-amber-800';

            return (
              <div
                key={comment.id}
                className={`rounded border p-2.5 text-xs shadow-2xs ${cardBg}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`truncate font-mono text-[11px] font-bold ${roleColor}`}>
                      {comment.authorAlias}
                    </span>
                    {comment.cellCoord && (
                      <button
                        type="button"
                        onClick={() => {
                          if (comment.cellCoord && onSelectCoord) {
                            onSelectCoord(comment.cellCoord);
                          }
                        }}
                        className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0 font-mono text-[10px] font-semibold ${
                          isDark
                            ? 'bg-neutral-800 text-amber-300 border-neutral-600 hover:border-amber-500'
                            : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        <Hash className="h-2.5 w-2.5" />
                        <span>{comment.cellCoord}</span>
                      </button>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[10px] opacity-60">
                    {formatTimestamp(comment.createdAt)}
                  </span>
                </div>
                <p className="font-sans text-xs leading-relaxed break-words">{comment.text}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Comment Composer Form */}
      <form
        onSubmit={handleSubmit}
        className={`border-t p-3 space-y-2 ${headerBg}`}
      >
        {activeCoord && (
          <div className="flex items-center justify-between text-[11px] font-mono">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={attachCoord}
                onChange={(e) => setAttachCoord(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>
                {locale === 'es' ? 'Vincular a celda' : 'Tag cell'}:{' '}
                <strong className="font-bold">{activeCoord}</strong>
              </span>
            </label>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={dict.chatInputPlaceholder}
            maxLength={220}
            className={`h-8 flex-1 rounded border px-2.5 text-xs outline-none ${
              isDark
                ? 'bg-[#18191b] text-gray-100 border-[#3e4045] focus:border-blue-500'
                : 'bg-white text-gray-900 border-gray-300 focus:border-blue-600'
            }`}
          />
          <button
            type="submit"
            disabled={!noteText.trim()}
            className={`inline-flex h-8 shrink-0 items-center gap-1 rounded border px-3 text-xs font-semibold transition-colors ${
              noteText.trim()
                ? isDark
                  ? 'bg-blue-700 hover:bg-blue-600 text-white border-blue-500'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                : 'opacity-40 cursor-not-allowed border-gray-300'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>{dict.chatSendBtn}</span>
          </button>
        </div>
      </form>
    </aside>
  );
}

export default AuditNotesChat;
