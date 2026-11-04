// 데모 상태만 이 브라우저 localStorage에 둔다. 서버로 보내지 않는다.

import { isSafeCover } from './cover';
import { DEMO_GATHERINGS } from './demo-data';
import { isVirtualPerson, type GatheringOps } from './demo-roster';
import type { Gathering, PollOption } from './types';
import { isActivityRegion, isGatheringCategory } from './types';

export const ACTIVITIES_DEMO_STORAGE_KEY = 'eottae.activities.demo.v1';
const STORAGE_KEY = ACTIVITIES_DEMO_STORAGE_KEY;
const NOTICE_KEY = 'eottae.activities.demo.notice';
const MAX_CREATED = 20;
const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export type MyJoinStatus = 'requested' | 'accepted' | 'rejected';

export type StoredReview = {
  id: string;
  nickname: string;
  stars: number;
  body: string;
  atLabel: string;
  mine: true;
};

export type InfoCheckStatus = 'pending' | 'confirmed' | 'planned';

/** 영업·폐업 확인 승인 요청. 이 브라우저에만 남긴다. */
export type InfoCheckRequest = {
  id: string;
  kind: 'course' | 'gathering';
  targetId: string;
  reason: '업데이트가 필요해요';
  note: string;
  atLabel: string;
  atIso: string;
  status: InfoCheckStatus;
};

export type ActivitiesDemoState = {
  requests: Record<string, true>;
  /** 내 참가 요청의 데모 진행. requested·accepted만 모집 인원에 포함한다. */
  joins: Record<string, MyJoinStatus>;
  votes: Record<string, string>;
  created: Gathering[];
  /** 모임장 데모: 수락·거절·강퇴·모집 토글 */
  ops: Record<string, GatheringOps>;
  /** 내가 쓴 후기. 예시 후기는 여기 넣지 않는다. */
  reviews: Record<string, StoredReview[]>;
  hiddenReviewIds: string[];
  /** `course:id` · `gathering:id` 내 좋아요 */
  likes: Record<string, true>;
  /** `course:id` · `gathering:id` 내 추천 */
  recommends: Record<string, true>;
  /** 업데이트가 필요해요 신고의 확인 요청 */
  infoChecks: InfoCheckRequest[];
};

export const EMPTY_ACTIVITIES_DEMO: ActivitiesDemoState = {
  requests: {},
  joins: {},
  votes: {},
  created: [],
  ops: {},
  reviews: {},
  hiddenReviewIds: [],
  likes: {},
  recommends: {},
  infoChecks: [],
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
  delete next.recruitmentForceOpen;
  delete next.viewerIsHost;
  delete next.ended;
  delete next.demoAttended;
  if (isCount(value.demoLikes)) next.demoLikes = value.demoLikes;
  else delete next.demoLikes;
  if (isCount(value.demoRecommends)) next.demoRecommends = value.demoRecommends;
  else delete next.demoRecommends;
  if (typeof value.listedAt === 'string' && LOCAL_DATE.test(value.listedAt)) next.listedAt = value.listedAt;
  else delete next.listedAt;
  return next;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9999;
}

function readJoins(value: unknown): Record<string, MyJoinStatus> {
  if (!value || typeof value !== 'object') return {};
  const next: Record<string, MyJoinStatus> = {};
  for (const [key, status] of Object.entries(value)) {
    if (key.length === 0 || key.length > 80) continue;
    if (status === 'requested' || status === 'accepted' || status === 'rejected') next[key] = status;
  }
  return next;
}

/** 노을 스케치·내가 만든 모임은 모임장이 이미 currentCount에 있다. */
function hostGatheringIds(created: readonly Pick<Gathering, 'id' | 'mine' | 'viewerIsHost'>[]): Set<string> {
  const ids = new Set<string>();
  for (const item of created) {
    if (item.mine === true || item.viewerIsHost === true) ids.add(item.id);
  }
  for (const item of DEMO_GATHERINGS) {
    if (item.mine === true || item.viewerIsHost === true) ids.add(item.id);
  }
  return ids;
}

function omitHostMembership(
  requests: Record<string, true>,
  joins: Record<string, MyJoinStatus>,
  created: readonly Pick<Gathering, 'id' | 'mine' | 'viewerIsHost'>[]
): { requests: Record<string, true>; joins: Record<string, MyJoinStatus> } {
  const hostIds = hostGatheringIds(created);
  const nextRequests = { ...requests };
  const nextJoins = { ...joins };
  for (const id of hostIds) {
    delete nextRequests[id];
    delete nextJoins[id];
  }
  return { requests: nextRequests, joins: nextJoins };
}

function alignJoinMaps(
  requests: Record<string, true>,
  joins: Record<string, MyJoinStatus>
): { requests: Record<string, true>; joins: Record<string, MyJoinStatus> } {
  const nextJoins = { ...joins };
  for (const key of Object.keys(requests)) {
    if (!nextJoins[key]) nextJoins[key] = 'requested';
  }
  const nextRequests: Record<string, true> = {};
  for (const [key, status] of Object.entries(nextJoins)) {
    if (status === 'requested' || status === 'accepted') nextRequests[key] = true;
  }
  return { requests: nextRequests, joins: nextJoins };
}

function readOps(value: unknown): Record<string, GatheringOps> {
  if (!value || typeof value !== 'object') return {};
  const next: Record<string, GatheringOps> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (key.length === 0 || key.length > 80 || !raw || typeof raw !== 'object') continue;
    const row = raw as GatheringOps;
    const ops: GatheringOps = {};
    if (row.recruitment === 'closed' || row.recruitment === 'open') ops.recruitment = row.recruitment;
    if (Array.isArray(row.people)) {
      const people = row.people.filter(isVirtualPerson).slice(0, 20);
      if (people.length > 0) ops.people = people;
    }
    if (ops.recruitment || ops.people) next[key] = ops;
  }
  return next;
}

function isStoredReview(value: unknown): value is StoredReview {
  if (!value || typeof value !== 'object') return false;
  const row = value as StoredReview;
  return (
    row.mine === true &&
    typeof row.id === 'string' &&
    row.id.length > 0 &&
    row.id.length <= 80 &&
    typeof row.nickname === 'string' &&
    row.nickname.trim().length >= 2 &&
    row.nickname.length <= 24 &&
    typeof row.body === 'string' &&
    row.body.trim().length >= 2 &&
    row.body.length <= 80 &&
    typeof row.atLabel === 'string' &&
    row.atLabel.length > 0 &&
    row.atLabel.length <= 40 &&
    typeof row.stars === 'number' &&
    Number.isInteger(row.stars) &&
    row.stars >= 1 &&
    row.stars <= 5
  );
}

function readReviews(value: unknown): Record<string, StoredReview[]> {
  if (!value || typeof value !== 'object') return {};
  const next: Record<string, StoredReview[]> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (key.length === 0 || key.length > 80 || !Array.isArray(raw)) continue;
    const rows = raw.filter(isStoredReview).slice(0, 4);
    if (rows.length > 0) next[key] = rows;
  }
  return next;
}

function isInfoCheck(value: unknown): value is InfoCheckRequest {
  if (!value || typeof value !== 'object') return false;
  const row = value as InfoCheckRequest;
  return (
    typeof row.id === 'string' &&
    row.id.length > 0 &&
    row.id.length <= 80 &&
    (row.kind === 'course' || row.kind === 'gathering') &&
    typeof row.targetId === 'string' &&
    row.targetId.length > 0 &&
    row.targetId.length <= 80 &&
    row.reason === '업데이트가 필요해요' &&
    typeof row.note === 'string' &&
    row.note.length <= 200 &&
    typeof row.atLabel === 'string' &&
    row.atLabel.length > 0 &&
    row.atLabel.length <= 40 &&
    typeof row.atIso === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(row.atIso) &&
    row.atIso.length <= 40 &&
    (row.status === 'pending' || row.status === 'confirmed' || row.status === 'planned')
  );
}

function readInfoChecks(value: unknown): InfoCheckRequest[] {
  if (!Array.isArray(value)) return [];
  const next: InfoCheckRequest[] = [];
  for (const item of value) {
    if (isInfoCheck(item) && !next.some((row) => row.id === item.id)) next.push(item);
    if (next.length >= 40) break;
  }
  return next;
}

function readIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const next: string[] = [];
  for (const item of value) {
    if (typeof item === 'string' && item.length > 0 && item.length <= 80 && !next.includes(item)) next.push(item);
    if (next.length >= 80) break;
  }
  return next;
}

export function applyJoin(state: ActivitiesDemoState, id: string, status: MyJoinStatus | null): ActivitiesDemoState {
  const joins = { ...state.joins };
  const requests = { ...state.requests };
  if (hostGatheringIds(state.created).has(id)) {
    delete joins[id];
    delete requests[id];
    return { ...state, joins, requests };
  }
  if (status === null) {
    delete joins[id];
    delete requests[id];
  } else if (status === 'rejected') {
    joins[id] = 'rejected';
    delete requests[id];
  } else {
    joins[id] = status;
    requests[id] = true;
  }
  return { ...state, joins, requests };
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
    const aligned = alignJoinMaps(readBoolMap(row.requests), readJoins(row.joins));
    const membership = omitHostMembership(aligned.requests, aligned.joins, created);
    return {
      requests: membership.requests,
      joins: membership.joins,
      votes: readVoteMap(row.votes),
      created,
      ops: readOps(row.ops),
      reviews: readReviews(row.reviews),
      hiddenReviewIds: readIdList(row.hiddenReviewIds),
      likes: readBoolMap(row.likes),
      recommends: readBoolMap(row.recommends),
      infoChecks: readInfoChecks(row.infoChecks),
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
    const membership = omitHostMembership(state.requests, state.joins, created);
    const payload: ActivitiesDemoState = {
      requests: membership.requests,
      joins: membership.joins,
      votes: state.votes,
      created,
      ops: state.ops,
      reviews: state.reviews,
      hiddenReviewIds: state.hiddenReviewIds,
      likes: state.likes,
      recommends: state.recommends,
      infoChecks: state.infoChecks.slice(0, 40),
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
