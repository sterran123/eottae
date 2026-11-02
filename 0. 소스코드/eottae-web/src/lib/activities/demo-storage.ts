// 데모 상태만 이 브라우저 localStorage에 둔다. 서버로 보내지 않는다.

import { isSafeCover } from './cover';
import type { Gathering, PollOption } from './types';
import { isActivityRegion, isGatheringCategory } from './types';

const STORAGE_KEY = 'eottae.activities.demo.v1';
const NOTICE_KEY = 'eottae.activities.demo.notice';
const MAX_CREATED = 20;
const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export type ActivitiesDemoState = {
  requests: Record<string, true>;
  votes: Record<string, string>;
  created: Gathering[];
};

export const EMPTY_ACTIVITIES_DEMO: ActivitiesDemoState = {
  requests: {},
  votes: {},
  created: [],
};

function isPollOption(value: unknown): value is PollOption {
  if (!value || typeof value !== 'object') return false;
  const row = value as PollOption;
  return (
    typeof row.id === 'string' &&
    row.id.length > 0 &&
    row.id.length <= 80 &&
    typeof row.label === 'string' &&
    row.label.trim().length > 0 &&
    row.label.length <= 80 &&
    typeof row.demoVotes === 'number' &&
    Number.isInteger(row.demoVotes) &&
    row.demoVotes >= 0 &&
    row.demoVotes <= 99
  );
}

function isStoredGathering(value: unknown): value is Gathering {
  if (!value || typeof value !== 'object') return false;
  const row = value as Gathering;
  if (row.mine !== true) return false;
  if (typeof row.id !== 'string' || !row.id.startsWith('mine-') || row.id.length > 80) return false;
  if (typeof row.title !== 'string' || row.title.trim().length < 2 || row.title.length > 40) return false;
  if (!isGatheringCategory(row.category) || !isActivityRegion(row.region)) return false;
  if (typeof row.startsAtLabel !== 'string' || row.startsAtLabel.length > 80) return false;
  if (typeof row.startsAtIso !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(row.startsAtIso)) return false;
  if (!Number.isInteger(row.capacity) || row.capacity < 2 || row.capacity > 12) return false;
  if (!Number.isInteger(row.currentCount) || row.currentCount < 1 || row.currentCount > row.capacity) return false;
  if (typeof row.hostNickname !== 'string' || row.hostNickname.trim().length < 2 || row.hostNickname.length > 12) {
    return false;
  }
  if (typeof row.intro !== 'string' || row.intro.trim().length < 10 || row.intro.length > 300) return false;
  if (typeof row.placeLabel !== 'string' || row.placeLabel.trim().length < 2 || row.placeLabel.length > 40) {
    return false;
  }
  if (!Array.isArray(row.safetyFlags) || row.safetyFlags.length < 1 || row.safetyFlags.length > 6) return false;
  if (!row.safetyFlags.every((flag) => typeof flag === 'string' && flag.length > 0 && flag.length <= 20)) return false;
  if (!Array.isArray(row.poll) || row.poll.length !== 3 || !row.poll.every(isPollOption)) return false;
  return true;
}

function sanitizeGathering(value: Gathering): Gathering {
  const next: Gathering = { ...value };
  if (typeof value.coverImage === 'string' && isSafeCover(value.coverImage)) next.coverImage = value.coverImage;
  else delete next.coverImage;
  if (typeof value.recruitmentClosed === 'boolean') next.recruitmentClosed = value.recruitmentClosed;
  else delete next.recruitmentClosed;
  if (typeof value.recruitmentEndsAt === 'string' && LOCAL_DATE.test(value.recruitmentEndsAt)) {
    next.recruitmentEndsAt = value.recruitmentEndsAt;
  } else delete next.recruitmentEndsAt;
  return next;
}

function readBoolMap(value: unknown): Record<string, true> {
  if (!value || typeof value !== 'object') return {};
  const next: Record<string, true> = {};
  for (const [key, flag] of Object.entries(value)) {
    if (flag === true && key.length > 0 && key.length <= 80) next[key] = true;
  }
  return next;
}

function readVoteMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  const next: Record<string, string> = {};
  for (const [key, optionId] of Object.entries(value)) {
    if (typeof optionId === 'string' && optionId.length > 0 && optionId.length <= 80 && key.length <= 80) {
      next[key] = optionId;
    }
  }
  return next;
}

export function loadActivitiesDemo(): ActivitiesDemoState {
  if (typeof window === 'undefined') return EMPTY_ACTIVITIES_DEMO;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ACTIVITIES_DEMO;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return EMPTY_ACTIVITIES_DEMO;
    const row = parsed as Partial<ActivitiesDemoState>;
    const created = Array.isArray(row.created)
      ? row.created.filter(isStoredGathering).slice(0, MAX_CREATED).map(sanitizeGathering)
      : [];
    return {
      requests: readBoolMap(row.requests),
      votes: readVoteMap(row.votes),
      created,
    };
  } catch {
    return EMPTY_ACTIVITIES_DEMO;
  }
}

export function saveActivitiesDemo(state: ActivitiesDemoState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sliced = state.created.slice(0, MAX_CREATED);
    const created = sliced.map(sanitizeGathering);
    const droppedCover = sliced.some((item, index) => Boolean(item.coverImage) && !created[index]?.coverImage);
    if (droppedCover) return false;
    const payload: ActivitiesDemoState = {
      requests: state.requests,
      votes: state.votes,
      created,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function stashActivitiesNotice(message: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(NOTICE_KEY, message.slice(0, 200));
  } catch {
    // 안내 문구를 못 남겨도 모임 저장 자체는 막지 않는다.
  }
}

export function takeActivitiesNotice(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(NOTICE_KEY);
    if (value) window.sessionStorage.removeItem(NOTICE_KEY);
    return value;
  } catch {
    return null;
  }
}
