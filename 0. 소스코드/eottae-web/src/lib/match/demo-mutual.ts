// 데모 관심·상호 매칭. 이 브라우저 localStorage에만 둔다.
// 같은 쌍의 match id는 정렬한 두 id로 고정해, 연타·새로고침·두 탭이 같은 1건을 쓴다.
// 채팅 저장소와 신고·차단 저장소는 쓰지 않는다.

import { DEMO_SELF_ID } from '@/lib/demo/demo-session';
import type { LikeDecision, RecommendProfile } from './types';

const LIKES_KEY = 'eottae_demo_match_likes_v1';
const MATCHES_KEY = 'eottae_demo_matches_v1';
export const DEMO_MATCH_EVENT = 'eottae-demo-matches';

type LikeMap = Record<string, LikeDecision>;

export type DemoMatchRecord = {
  targetId: string;
  matchId: string;
  conversationId: string;
  createdAt: string;
};

type MatchMap = Record<string, DemoMatchRecord>;

export function demoPairMatchId(targetId: string): string {
  const pair = [DEMO_SELF_ID, targetId].sort().join(':');
  return `demo-match:${pair}`;
}

function readJson(key: string): unknown {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소가 막혀도 화면 메모리는 호출한 쪽이 갱신한다.
  }
}

function notify(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DEMO_MATCH_EVENT));
}

function readLikes(): LikeMap {
  const raw = readJson(LIKES_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const likes: LikeMap = {};
  for (const [id, decision] of Object.entries(raw as Record<string, unknown>)) {
    if (decision === 'yes' || decision === 'no') likes[id] = decision;
  }
  return likes;
}

function canonicalMatch(targetId: string, createdAt: string): DemoMatchRecord {
  const matchId = demoPairMatchId(targetId);
  return {
    targetId,
    matchId,
    conversationId: `demo-conv:${matchId}`,
    createdAt,
  };
}

function readMatches(): MatchMap {
  const raw = readJson(MATCHES_KEY);
  const matches: MatchMap = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const row = value as Record<string, unknown>;
      if (row.targetId !== id || typeof row.createdAt !== 'string') continue;
      matches[id] = canonicalMatch(id, row.createdAt);
    }
  }
  return matches;
}

export function listDemoMatches(): DemoMatchRecord[] {
  return Object.values(readMatches()).sort((a, b) => a.targetId.localeCompare(b.targetId));
}

export function applyDemoMutualState(items: RecommendProfile[]): RecommendProfile[] {
  const likes = readLikes();
  const matches = readMatches();
  return items
    .filter((profile) => likes[profile.id] !== 'no')
    .map((profile) => {
      if (matches[profile.id]) return { ...profile, relation: 'mutual' };
      if (likes[profile.id] === 'yes' && profile.relation !== 'mutual') {
        return { ...profile, relation: 'liked_by_me' };
      }
      return profile;
    });
}

export function recordDemoLike(
  targetId: string,
  decision: LikeDecision,
  partnerReturnsInterest: boolean,
): { matched: boolean; matchId: string | null; conversationId: string | null } {
  if (!targetId || targetId === DEMO_SELF_ID) {
    return { matched: false, matchId: null, conversationId: null };
  }

  const likes = readLikes();
  likes[targetId] = decision;
  writeJson(LIKES_KEY, likes);

  const matches = readMatches();
  const existing = matches[targetId];

  if (decision === 'yes' && (partnerReturnsInterest || existing)) {
    if (!existing) {
      matches[targetId] = canonicalMatch(targetId, new Date().toISOString());
      writeJson(MATCHES_KEY, matches);
    }
    const saved = matches[targetId];
    notify();
    return {
      matched: true,
      matchId: saved.matchId,
      conversationId: saved.conversationId,
    };
  }

  notify();
  return { matched: false, matchId: null, conversationId: null };
}

export function subscribeDemoMatches(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== LIKES_KEY && event.key !== MATCHES_KEY) return;
    onChange();
  };
  window.addEventListener(DEMO_MATCH_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(DEMO_MATCH_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
