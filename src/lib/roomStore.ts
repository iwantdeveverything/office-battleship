import { INITIAL_LEADERBOARD } from '@/lib/constants';
import type {
  Coordinate,
  GridCell,
  LeaderboardEntry,
  MacroInventory,
  MatchRoomState,
  ShipInstance,
} from '@/types/game';

export interface PlayerServerBoard {
  grid: GridCell[][];
  fleet: ShipInstance[];
  macros: MacroInventory;
  scannedHints: Record<Coordinate, number>;
}

export interface ServerMatchRoom {
  state: MatchRoomState;
  p1Board: PlayerServerBoard;
  p2Board: PlayerServerBoard;
}

export const ROOM_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
export const ROOM_TTL_SECONDS = 7200;
export const MAX_IN_MEMORY_ROOMS = 500;

const REDIS_ROOM_PREFIX = 'recon:room:';
const REDIS_ROOM_INDEX_KEY = 'recon:room_ids';
const REDIS_LEADERBOARD_KEY = 'recon:leaderboard';

declare global {
  var __reconRooms: Map<string, ServerMatchRoom> | undefined;
  var __reconLeaderboard: Map<string, LeaderboardEntry> | undefined;
}

interface RedisConfig {
  url: string;
  token: string;
}

function getRedisConfig(): RedisConfig | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim() ||
    '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim() ||
    '';

  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
}

async function executeRedisCommand<T = unknown>(
  config: RedisConfig,
  command: (string | number)[]
): Promise<T | null> {
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { result?: T };
    return data.result ?? null;
  } catch {
    return null;
  }
}

export function getInMemoryRoomsStore(): Map<string, ServerMatchRoom> {
  if (!globalThis.__reconRooms) {
    globalThis.__reconRooms = new Map<string, ServerMatchRoom>();
  }
  return globalThis.__reconRooms;
}

export function getInMemoryLeaderboardStore(): Map<string, LeaderboardEntry> {
  if (!globalThis.__reconLeaderboard) {
    const map = new Map<string, LeaderboardEntry>();
    for (const entry of INITIAL_LEADERBOARD) {
      map.set(entry.uid, { ...entry });
    }
    globalThis.__reconLeaderboard = map;
  }
  return globalThis.__reconLeaderboard;
}

/**
 * Evicts expired rooms (older than `ttlMs`) and caps total rooms at `maxRooms`
 * to prevent unbounded memory growth during traffic spikes.
 */
export function evictExpiredRooms(
  store: Map<string, ServerMatchRoom> = getInMemoryRoomsStore(),
  now: number = Date.now(),
  ttlMs: number = ROOM_TTL_MS,
  maxRooms: number = MAX_IN_MEMORY_ROOMS
): number {
  let evicted = 0;

  for (const [roomId, room] of store.entries()) {
    if (now - room.state.updatedAt > ttlMs) {
      store.delete(roomId);
      evicted += 1;
    }
  }

  if (store.size > maxRooms) {
    const sortedByOldest = Array.from(store.entries()).sort(
      (a, b) => a[1].state.updatedAt - b[1].state.updatedAt
    );
    const excess = store.size - maxRooms;
    for (let i = 0; i < excess; i += 1) {
      const target = sortedByOldest[i];
      if (target) {
        store.delete(target[0]);
        evicted += 1;
      }
    }
  }

  return evicted;
}

export async function loadRoom(roomId: string): Promise<ServerMatchRoom | undefined> {
  const normalizedId = roomId.trim().toUpperCase();
  const memoryStore = getInMemoryRoomsStore();
  evictExpiredRooms(memoryStore);

  const redis = getRedisConfig();
  if (redis) {
    const raw = await executeRedisCommand<string>(redis, [
      'GET',
      `${REDIS_ROOM_PREFIX}${normalizedId}`,
    ]);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ServerMatchRoom;
        memoryStore.set(normalizedId, parsed);
        return parsed;
      } catch {
        // Fall through to in-memory store
      }
    }
  }

  return memoryStore.get(normalizedId);
}

export async function saveRoom(room: ServerMatchRoom): Promise<void> {
  const normalizedId = room.state.roomId.trim().toUpperCase();
  const memoryStore = getInMemoryRoomsStore();
  evictExpiredRooms(memoryStore);
  memoryStore.set(normalizedId, room);

  const redis = getRedisConfig();
  if (redis) {
    const serialized = JSON.stringify(room);
    await Promise.all([
      executeRedisCommand(redis, [
        'SET',
        `${REDIS_ROOM_PREFIX}${normalizedId}`,
        serialized,
        'EX',
        ROOM_TTL_SECONDS,
      ]),
      executeRedisCommand(redis, ['SADD', REDIS_ROOM_INDEX_KEY, normalizedId]),
    ]);
  }
}

export async function listActiveRooms(): Promise<ServerMatchRoom[]> {
  const memoryStore = getInMemoryRoomsStore();
  evictExpiredRooms(memoryStore);

  const redis = getRedisConfig();
  if (redis) {
    const ids = await executeRedisCommand<string[]>(redis, ['SMEMBERS', REDIS_ROOM_INDEX_KEY]);
    if (Array.isArray(ids) && ids.length > 0) {
      const keys = ids.map((id) => `${REDIS_ROOM_PREFIX}${id}`);
      const values = await executeRedisCommand<(string | null)[]>(redis, ['MGET', ...keys]);
      if (Array.isArray(values)) {
        const loaded: ServerMatchRoom[] = [];
        const expiredIds: string[] = [];
        values.forEach((raw, idx) => {
          const id = ids[idx];
          if (!raw) {
            if (id) expiredIds.push(id);
            return;
          }
          try {
            const parsed = JSON.parse(raw) as ServerMatchRoom;
            memoryStore.set(parsed.state.roomId, parsed);
            loaded.push(parsed);
          } catch {
            if (id) expiredIds.push(id);
          }
        });
        if (expiredIds.length > 0) {
          void executeRedisCommand(redis, ['SREM', REDIS_ROOM_INDEX_KEY, ...expiredIds]);
        }
        return loaded;
      }
    }
  }

  return Array.from(memoryStore.values());
}

export async function loadLeaderboardStore(): Promise<Map<string, LeaderboardEntry>> {
  const memoryLeaderboard = getInMemoryLeaderboardStore();
  const redis = getRedisConfig();
  if (redis) {
    const raw = await executeRedisCommand<string>(redis, ['GET', REDIS_LEADERBOARD_KEY]);
    if (raw) {
      try {
        const entries = JSON.parse(raw) as LeaderboardEntry[];
        if (Array.isArray(entries)) {
          for (const entry of entries) {
            memoryLeaderboard.set(entry.uid, entry);
          }
        }
      } catch {
        // Ignore malformed cache
      }
    }
  }
  return memoryLeaderboard;
}

export async function saveLeaderboardStore(
  store: Map<string, LeaderboardEntry>
): Promise<void> {
  const redis = getRedisConfig();
  if (redis) {
    const entries = Array.from(store.values());
    await executeRedisCommand(redis, [
      'SET',
      REDIS_LEADERBOARD_KEY,
      JSON.stringify(entries),
    ]);
  }
}
