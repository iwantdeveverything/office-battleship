'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { INITIAL_LEADERBOARD } from '@/lib/constants';
import type {
  Coordinate,
  GridCell,
  LeaderboardEntry,
  MatchRoomState,
  SanitizedRoomPayload,
  ShipInstance,
} from '@/types/game';

const UID_STORAGE_KEY = 'recon_q4_uid';
const POLL_INTERVAL_MS = 1200;

interface AuditApiResponse {
  room?: MatchRoomState;
  payload?: SanitizedRoomPayload;
  openRooms?: MatchRoomState[];
  leaderboard?: LeaderboardEntry[];
  error?: string;
}

export interface UseMultiplayerSyncOptions {
  enabled?: boolean;
  alias: string;
  onPayloadUpdate?: (payload: SanitizedRoomPayload) => void;
}

export interface MultiplayerSyncHook {
  uid: string;
  activeRoomId: string | null;
  setActiveRoomId: (roomId: string | null) => void;
  payload: SanitizedRoomPayload | null;
  openRooms: MatchRoomState[];
  leaderboard: LeaderboardEntry[];
  isSyncing: boolean;
  syncError: string | null;
  refreshLobby: () => Promise<void>;
  createRoom: (customRoomId?: string) => Promise<SanitizedRoomPayload | null>;
  joinRoom: (roomId: string) => Promise<SanitizedRoomPayload | null>;
  quickMatch: () => Promise<SanitizedRoomPayload | null>;
  submitReadyFleet: (
    roomId: string,
    grid: GridCell[][],
    fleet: ShipInstance[]
  ) => Promise<SanitizedRoomPayload | null>;
  sendMultiplayerAudit: (
    roomId: string,
    coord: Coordinate
  ) => Promise<SanitizedRoomPayload | null>;
  sendMultiplayerScan: (
    roomId: string,
    coord: Coordinate
  ) => Promise<SanitizedRoomPayload | null>;
  sendMultiplayerBarrage: (
    roomId: string,
    row: number
  ) => Promise<SanitizedRoomPayload | null>;
  sendComment: (
    roomId: string,
    text: string,
    cellCoord?: Coordinate
  ) => Promise<SanitizedRoomPayload | null>;
  leaveRoom: () => void;
}

function getOrCreateClientUid(): string {
  if (typeof window === 'undefined') return 'usr-ssr-temp';
  try {
    const existing = window.localStorage.getItem(UID_STORAGE_KEY);
    if (existing && existing.trim().length > 0) {
      return existing.trim();
    }
    const generated = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    window.localStorage.setItem(UID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `usr-${Math.random().toString(36).slice(2, 9)}`;
  }
}

export function useMultiplayerSync(options: UseMultiplayerSyncOptions): MultiplayerSyncHook {
  const { enabled = false, alias, onPayloadUpdate } = options;

  const [uid, setUid] = useState<string>('usr-init');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [payload, setPayload] = useState<SanitizedRoomPayload | null>(null);
  const [openRooms, setOpenRooms] = useState<MatchRoomState[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const onPayloadUpdateRef = useRef(onPayloadUpdate);
  onPayloadUpdateRef.current = onPayloadUpdate;

  useEffect(() => {
    setUid(getOrCreateClientUid());
  }, []);

  const applyApiResponse = useCallback((data: AuditApiResponse): SanitizedRoomPayload | null => {
    if (Array.isArray(data.openRooms)) {
      setOpenRooms(data.openRooms);
    }
    if (Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
      setLeaderboard(data.leaderboard);
    }
    if (data.payload) {
      setPayload(data.payload);
      setActiveRoomId(data.payload.room.roomId);
      onPayloadUpdateRef.current?.(data.payload);
      return data.payload;
    }
    return null;
  }, []);

  const refreshLobby = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const currentUid = uid === 'usr-init' ? getOrCreateClientUid() : uid;
    try {
      const query = activeRoomId
        ? `?roomId=${encodeURIComponent(activeRoomId)}&uid=${encodeURIComponent(currentUid)}`
        : `?uid=${encodeURIComponent(currentUid)}`;
      const res = await fetch(`/api/audit${query}`, { cache: 'no-store' });
      const data = (await res.json()) as AuditApiResponse;
      if (res.ok) {
        setSyncError(null);
        applyApiResponse(data);
      } else if (data.error) {
        setSyncError(data.error);
      }
    } catch {
      // Silent network retry on next poll
    }
  }, [activeRoomId, applyApiResponse, uid]);

  const dispatchAction = useCallback(
    async (body: Record<string, unknown>): Promise<SanitizedRoomPayload | null> => {
      const currentUid = uid === 'usr-init' ? getOrCreateClientUid() : uid;
      setIsSyncing(true);
      setSyncError(null);
      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...body,
            uid: currentUid,
            alias,
          }),
        });
        const data = (await res.json()) as AuditApiResponse;
        if (!res.ok) {
          setSyncError(data.error ?? 'Error en servidor de auditoría.');
          return null;
        }
        return applyApiResponse(data);
      } catch {
        setSyncError('Error de red al sincronizar con el servidor.');
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    [alias, applyApiResponse, uid]
  );

  const createRoom = useCallback(
    async (customRoomId?: string) =>
      dispatchAction({
        action: 'CREATE_ROOM',
        roomId: customRoomId,
      }),
    [dispatchAction]
  );

  const joinRoom = useCallback(
    async (roomId: string) =>
      dispatchAction({
        action: 'JOIN_ROOM',
        roomId,
      }),
    [dispatchAction]
  );

  const quickMatch = useCallback(
    async () =>
      dispatchAction({
        action: 'QUICK_MATCH',
      }),
    [dispatchAction]
  );

  const submitReadyFleet = useCallback(
    async (roomId: string, grid: GridCell[][], fleet: ShipInstance[]) =>
      dispatchAction({
        action: 'READY_FLEET',
        roomId,
        grid,
        fleet,
      }),
    [dispatchAction]
  );

  const sendMultiplayerAudit = useCallback(
    async (roomId: string, coord: Coordinate) =>
      dispatchAction({
        action: 'AUDIT_CELL',
        roomId,
        coord,
      }),
    [dispatchAction]
  );

  const sendMultiplayerScan = useCallback(
    async (roomId: string, coord: Coordinate) =>
      dispatchAction({
        action: 'MACRO_SCAN',
        roomId,
        coord,
      }),
    [dispatchAction]
  );

  const sendMultiplayerBarrage = useCallback(
    async (roomId: string, row: number) =>
      dispatchAction({
        action: 'MACRO_BARRAGE',
        roomId,
        row,
      }),
    [dispatchAction]
  );

  const sendComment = useCallback(
    async (roomId: string, text: string, cellCoord?: Coordinate) =>
      dispatchAction({
        action: 'ADD_COMMENT',
        roomId,
        text,
        cellCoord,
      }),
    [dispatchAction]
  );

  const leaveRoom = useCallback(() => {
    setActiveRoomId(null);
    setPayload(null);
    setSyncError(null);
  }, []);

  // Poll every 1200ms when multiplayer is active or a room is joined
  useEffect(() => {
    if (!enabled && !activeRoomId) return;

    void refreshLobby();
    const timer = window.setInterval(() => {
      void refreshLobby();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, activeRoomId, refreshLobby]);

  return {
    uid,
    activeRoomId,
    setActiveRoomId,
    payload,
    openRooms,
    leaderboard,
    isSyncing,
    syncError,
    refreshLobby,
    createRoom,
    joinRoom,
    quickMatch,
    submitReadyFleet,
    sendMultiplayerAudit,
    sendMultiplayerScan,
    sendMultiplayerBarrage,
    sendComment,
    leaveRoom,
  };
}
