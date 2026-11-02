// 채팅 데모 기록. 같은 브라우저의 탭이 BroadcastChannel(없으면 storage 이벤트)로 나눈다.
// 서버·Realtime 은 쓰지 않는다.

import { publishDemo, subscribeDemo } from '@/lib/demo/demo-sync';
import { getDemoBlock } from '@/lib/safety/demo-store';
import { DEMO_ROOMS } from './demo-data';
import {
  toChatMessageFromDemo,
  type ChatMessage,
  type DemoChatMessage,
  type MessageStatus,
} from './types';

const STORAGE_KEY = 'eottae.chat.demo.v1';
const EVENT_NAME = 'eottae-chat-demo';
const CHANNEL_NAME = 'eottae.chat.demo';

const STATUSES = new Set<MessageStatus>(['sending', 'sent', 'failed']);

type ChatState = {
  rev: number;
  rooms: Record<string, DemoChatMessage[]>;
};

const EMPTY: ChatState = { rev: 0, rooms: {} };
let memory: ChatState = EMPTY;

function isShortId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 80;
}

function parseMessage(value: unknown): DemoChatMessage | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<DemoChatMessage>;
  if (!isShortId(row.id) || !isShortId(row.conversationId) || !isShortId(row.senderId)) return null;
  if (typeof row.body !== 'string' || row.body.length < 1 || row.body.length > 500) return null;
  if (typeof row.createdAt !== 'string' || Number.isNaN(Date.parse(row.createdAt))) return null;
  if (!row.status || !STATUSES.has(row.status)) return null;
  if (row.autoForActorId !== undefined && !isShortId(row.autoForActorId)) return null;
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    body: row.body,
    createdAt: new Date(row.createdAt).toISOString(),
    status: row.status,
    ...(row.autoForActorId ? { autoForActorId: row.autoForActorId } : {}),
  };
}

function parseState(value: unknown): ChatState | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<ChatState>;
  if (typeof row.rev !== 'number' || !Number.isFinite(row.rev) || !row.rooms || typeof row.rooms !== 'object') {
    return null;
  }
  const rooms: Record<string, DemoChatMessage[]> = {};
  for (const [roomId, list] of Object.entries(row.rooms).slice(0, 20)) {
    if (!isShortId(roomId) || !Array.isArray(list)) continue;
    rooms[roomId] = list.map(parseMessage).filter((item): item is DemoChatMessage => item !== null).slice(-200);
  }
  return { rev: row.rev, rooms };
}

function read(): ChatState {
  if (typeof window === 'undefined') return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseState(JSON.parse(raw));
      if (parsed && parsed.rev >= memory.rev) memory = parsed;
    }
  } catch {
    // 저장을 못 읽으면 메모리 데모를 유지한다.
  }
  return memory;
}

function commit(update: (prev: ChatState) => ChatState) {
  const prev = read();
  const next = update(prev);
  if (next === prev) return;
  memory = { ...next, rev: prev.rev + 1 };
  publishDemo(STORAGE_KEY, EVENT_NAME, CHANNEL_NAME, memory);
}

function rememberRemote(state: unknown) {
  const parsed = parseState(state);
  if (parsed && parsed.rev > memory.rev) memory = parsed;
}

export function subscribeChatDemo(listener: () => void): () => void {
  return subscribeDemo(STORAGE_KEY, EVENT_NAME, CHANNEL_NAME, rememberRemote, listener);
}

function seedOf(roomId: string): DemoChatMessage[] {
  const room = DEMO_ROOMS.find((item) => item.id === roomId);
  if (!room) return [];
  return room.initialMessages.map((message) => ({
    id: message.id,
    conversationId: room.id,
    senderId: message.senderId,
    body: message.body,
    createdAt: new Date(message.createdAt).toISOString(),
    status: 'sent' as const,
  }));
}

/** 방이 비어 있으면 예시 대화를 한 번만 넣는다. */
export function ensureChatSeed() {
  commit((prev) => {
    let changed = false;
    const rooms = { ...prev.rooms };
    for (const room of DEMO_ROOMS) {
      if (rooms[room.id]) continue;
      changed = true;
      rooms[room.id] = seedOf(room.id);
    }
    if (!changed) return prev;
    return { ...prev, rooms };
  });
}

export function appendDemoMessage(message: DemoChatMessage) {
  const parsed = parseMessage(message);
  if (!parsed) return;
  if (!DEMO_ROOMS.some((room) => room.id === parsed.conversationId)) return;
  commit((prev) => {
    const list = prev.rooms[parsed.conversationId] ?? [];
    if (list.some((item) => item.id === parsed.id)) return prev;
    return {
      ...prev,
      rooms: {
        ...prev.rooms,
        [parsed.conversationId]: [...list, parsed].slice(-200),
      },
    };
  });
}

function visibleRows(roomId: string, actorId: string): DemoChatMessage[] {
  const list = read().rooms[roomId] ?? [];
  return list.filter((row) => {
    if (row.autoForActorId && row.autoForActorId !== actorId) return false;
    const block = getDemoBlock(actorId, row.senderId);
    if (!block) return true;
    return Date.parse(row.createdAt) <= Date.parse(block.createdAt);
  });
}

/** 이 탭에서 볼 수 있는 메시지만. 차단 이후 상대 말은 빠진다. */
export function loadVisibleMessages(roomId: string, actorId: string): ChatMessage[] {
  return visibleRows(roomId, actorId).map((row) => toChatMessageFromDemo(row, actorId));
}
