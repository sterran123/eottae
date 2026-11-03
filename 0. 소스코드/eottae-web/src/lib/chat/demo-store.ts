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

export const CHAT_DEMO_STORAGE_KEY = 'eottae.chat.demo.v1';
export const CHAT_DEMO_EVENT = 'eottae-chat-demo';
const STORAGE_KEY = CHAT_DEMO_STORAGE_KEY;
const EVENT_NAME = CHAT_DEMO_EVENT;
const CHANNEL_NAME = 'eottae.chat.demo';

/**
 * chat-service의 보내기 확인(400ms)과 자동응답(1600ms)이 삭제 뒤에 한 번 더 쓰지 않게 막는다.
 * 그 시각이 지나면 새 입력은 저장한다.
 */
const PENDING_APPEND_MS = 1700;
let suppressAppendUntil = 0;
let epoch = 0;

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
    // 키가 없어도 메모리를 비우지 않는다. 비우면 저장 실패로 메모리에만 둔 데모까지 사라진다.
    // 비우기는 resetChatDemo와 키 삭제 이벤트에서만 한다.
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

function clearChatMemory(): void {
  memory = { rev: 0, rooms: {} };
  epoch += 1;
  const until = Date.now() + PENDING_APPEND_MS;
  if (until > suppressAppendUntil) suppressAppendUntil = until;
}

/** 같은 탭의 탈퇴 데모가 호출한다. 키를 지우기 전에 메모리부터 비운다. */
export function resetChatDemo(): void {
  clearChatMemory();
}

/** 키 삭제가 실패하면, 방금 건 저장 금지를 푼다. 메모리는 다음 read가 저장소로 되돌린다. */
export function releaseChatDemoAppendSuppress(): void {
  suppressAppendUntil = 0;
}

/** 삭제 세대. 열린 채팅이 낙관적 메시지를 다시 붙이지 않게 구분한다. */
export function chatDemoEpoch(): number {
  return epoch;
}

function rememberRemote(state: unknown) {
  if (state == null) {
    clearChatMemory();
    // 이 이벤트보다 먼저 예약된 저장이 키를 되살렸으면 같은 탭에서 다시 지운다.
    // read()는 키가 없다는 이유만으로 메모리를 비우지 않는다.
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) !== null) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // 다시 지우지 못하면 다음 read가 되살린 값을 올릴 수 있다.
    }
    return;
  }
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

/**
 * 방이 비어 있으면 예시 대화를 넣는다.
 * 탈퇴로 키가 지워진 뒤 채팅 화면에 다시 들어오면 방 키가 없으므로 예시만 다시 만든다.
 * 사용자가 보낸 말은 저장에 없으므로 돌아오지 않는다.
 */
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

export function appendDemoMessage(message: DemoChatMessage): boolean {
  const parsed = parseMessage(message);
  if (!parsed) return false;
  if (!DEMO_ROOMS.some((room) => room.id === parsed.conversationId)) return false;
  // reset 직후 이미 예약된 onMessageSent·자동응답이 그 한 대화를 다시 저장하지 않게 한다.
  if (Date.now() < suppressAppendUntil) return false;
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
  return true;
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
