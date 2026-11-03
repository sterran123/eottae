// 신고·차단 데모. 이 브라우저 localStorage에만 남긴다. 서버로 보내지 않는다.

import { publishDemo, subscribeDemo } from '@/lib/demo/demo-sync';
import {
  toBlockView,
  toReportHistoryItem,
  type BlockView,
  type ReportCategory,
  type ReportHistoryItem,
  type ReportRow,
  type ReportStatus,
} from './types';

export const SAFETY_DEMO_STORAGE_KEY = 'eottae.safety.demo.v1';
export const SAFETY_DEMO_EVENT = 'eottae-safety-demo';
const STORAGE_KEY = SAFETY_DEMO_STORAGE_KEY;
const EVENT_NAME = SAFETY_DEMO_EVENT;
const CHANNEL_NAME = 'eottae.safety.demo';

const CATEGORIES = new Set<ReportCategory>(['abuse', 'sexual', 'scam', 'other']);
const STATUSES = new Set<ReportStatus>(['open', 'closed']);

type SafetyState = {
  rev: number;
  reports: ReportHistoryItem[];
  blocks: BlockView[];
};

const EMPTY: SafetyState = { rev: 0, reports: [], blocks: [] };
let memory: SafetyState = EMPTY;
let seq = 0;

function isShortId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 80;
}

function isIso(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function parseReport(value: unknown): ReportHistoryItem | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<ReportHistoryItem>;
  if (!isShortId(row.id) || !isShortId(row.reporterId) || !isShortId(row.targetId)) return null;
  if (typeof row.nickname !== 'string' || row.nickname.length < 1 || row.nickname.length > 40) return null;
  if (!row.category || !CATEGORIES.has(row.category)) return null;
  if (typeof row.description !== 'string' || row.description.length > 200) return null;
  if (!isIso(row.createdAt) || !row.status || !STATUSES.has(row.status)) return null;
  return {
    id: row.id,
    reporterId: row.reporterId,
    targetId: row.targetId,
    nickname: row.nickname,
    category: row.category,
    description: row.description,
    createdAt: row.createdAt,
    status: row.status,
  };
}

function parseBlock(value: unknown): BlockView | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<BlockView>;
  if (!isShortId(row.blockerId) || !isShortId(row.blockedId) || row.blockerId === row.blockedId) return null;
  if (!isIso(row.createdAt)) return null;
  return { blockerId: row.blockerId, blockedId: row.blockedId, createdAt: row.createdAt };
}

function parseState(value: unknown): SafetyState | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<SafetyState>;
  if (typeof row.rev !== 'number' || !Number.isFinite(row.rev)) return null;
  if (!Array.isArray(row.reports) || !Array.isArray(row.blocks)) return null;
  return {
    rev: row.rev,
    reports: row.reports.map(parseReport).filter((item): item is ReportHistoryItem => item !== null).slice(-50),
    blocks: row.blocks.map(parseBlock).filter((item): item is BlockView => item !== null).slice(-100),
  };
}

function read(): SafetyState {
  if (typeof window === 'undefined') return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // 키가 없어도 메모리를 비우지 않는다. 비우면 저장 실패로 메모리에만 둔 신고·차단까지 사라진다.
    // 비우기는 resetSafetyDemo와 키 삭제 이벤트에서만 한다.
    if (raw) {
      const parsed = parseState(JSON.parse(raw));
      if (parsed && parsed.rev >= memory.rev) memory = parsed;
    }
  } catch {
    // 저장을 못 읽으면 메모리에 둔 데모를 쓴다.
  }
  return memory;
}

function commit(update: (prev: SafetyState) => SafetyState) {
  const prev = read();
  const next = update(prev);
  if (next === prev) return;
  memory = { ...next, rev: prev.rev + 1 };
  publishDemo(STORAGE_KEY, EVENT_NAME, CHANNEL_NAME, memory);
}

function blankSafety(): SafetyState {
  return { rev: 0, reports: [], blocks: [] };
}

/** 같은 탭의 탈퇴 데모가 호출한다. 신고와 차단 메모리를 함께 비운다. */
export function resetSafetyDemo(): void {
  memory = blankSafety();
}

function rememberRemote(state: unknown) {
  if (state == null) {
    memory = blankSafety();
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) !== null) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // 다시 지우지 못하면 다음 read가 되살린 신고·차단을 올릴 수 있다.
    }
    return;
  }
  const parsed = parseState(state);
  if (parsed && parsed.rev > memory.rev) memory = parsed;
}

export function subscribeSafetyDemo(listener: () => void): () => void {
  return subscribeDemo(STORAGE_KEY, EVENT_NAME, CHANNEL_NAME, rememberRemote, listener);
}

export function listDemoReports(): ReportHistoryItem[] {
  return read().reports.map((item) => ({ ...item }));
}

export function getDemoBlock(blockerId: string, blockedId: string): BlockView | null {
  return read().blocks.find((item) => item.blockerId === blockerId && item.blockedId === blockedId) ?? null;
}

export function isDemoBlocked(blockerId: string, blockedId: string): boolean {
  return getDemoBlock(blockerId, blockedId) !== null;
}

export function saveDemoReport(input: {
  reporterId: string;
  targetId: string;
  nickname: string;
  category: ReportCategory;
  description: string;
}): ReportHistoryItem | null {
  if (!isShortId(input.reporterId) || !isShortId(input.targetId)) return null;
  const nickname = input.nickname.trim().slice(0, 40);
  if (!nickname) return null;
  const row: ReportRow = {
    id: `report-${Date.now()}-${seq++}`,
    reporter_id: input.reporterId,
    reported_user_id: input.targetId,
    category: input.category,
    description: input.description.trim().slice(0, 200) || null,
    status: 'open',
    created_at: new Date().toISOString(),
  };
  const item = toReportHistoryItem(row, nickname, input.reporterId);
  commit((prev) => ({ ...prev, reports: [...prev.reports, item].slice(-50) }));
  return item;
}

export function saveDemoBlock(blockerId: string, blockedId: string): BlockView | null {
  if (!isShortId(blockerId) || !isShortId(blockedId) || blockerId === blockedId) return null;
  const existing = getDemoBlock(blockerId, blockedId);
  if (existing) return existing;
  const view = toBlockView({
    blocker_id: blockerId,
    blocked_user_id: blockedId,
    created_at: new Date().toISOString(),
  });
  commit((prev) => ({ ...prev, blocks: [...prev.blocks, view].slice(-100) }));
  return view;
}

export function removeDemoBlock(blockerId: string, blockedId: string) {
  commit((prev) => {
    const blocks = prev.blocks.filter((item) => !(item.blockerId === blockerId && item.blockedId === blockedId));
    if (blocks.length === prev.blocks.length) return prev;
    return { ...prev, blocks };
  });
}
