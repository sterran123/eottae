// src/lib/server/rls-guard.ts
// MATCH-004 (성인 확인 게이트) · MATCH-005 (상호 매칭 경쟁 조건 방지) ·
// MATCH-006 (추천 필터·RLS) · MATCH-007/008 (채팅·차단·신고 RLS 가드)
// 담당: 주한태 (ADR-002 · ADR-003 · ADR-005 준수)

import type { AccountStatus, UserSession } from '../auth/types';
import { AuthException, requireActiveUser } from './auth';

export type RlsErrorCode =
  | 'AGE_VERIFICATION_REQUIRED'
  | 'BLOCKED_USER_ACCESS'
  | 'NOT_MATCH_MEMBER'
  | 'REPORT_QUEUE_FORBIDDEN'
  | 'SELF_ACTION_FORBIDDEN';

export class RlsPolicyException extends Error {
  public readonly code: RlsErrorCode;
  public readonly status: number;

  constructor(code: RlsErrorCode, message: string, status = 403) {
    super(message);
    this.name = 'RlsPolicyException';
    this.code = code;
    this.status = status;
  }
}

export interface CandidateProfile {
  userId: string;
  nickname: string;
  accountStatus: AccountStatus;
  adultVerified: boolean;
  adultVerificationExpiresAt?: number | null;
  profileStatus?: 'ACTIVE' | 'HIDDEN';
}

export interface LikeRecord {
  actorId: string;
  targetId: string;
  decision: 'LIKE' | 'PASS';
  createdAt: number;
}

export interface MatchRecord {
  id: string;
  userLowId: string;
  userHighId: string;
  status: 'ACTIVE' | 'UNMATCHED' | 'BLOCKED';
  conversationId: string;
  createdAt: number;
}

export interface BlockRecord {
  blockerId: string;
  blockedId: string;
  createdAt: number;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  reportedUserId: string;
  category: 'SPAM' | 'ABUSE' | 'UNDERAGE_SUSPECTED' | 'IMPERSONATION' | 'OTHER';
  description: string;
  createdAt: number;
}

/**
 * MATCH-004 (TC-004): 검증된 만 19세 이상 성인 + ACTIVE 계정만 통과 (Fail-closed)
 * - 미로그인/만료: 401
 * - 정지/탈퇴/대기: 403
 * - 성인 미인증(adultVerified === false): 403 AGE_VERIFICATION_REQUIRED
 */
export function requireAdultVerifiedUser(token: string | null | undefined): UserSession {
  const session = requireActiveUser(token);
  if (!session.adultVerified) {
    throw new RlsPolicyException(
      'AGE_VERIFICATION_REQUIRED',
      '만 19세 이상 성인 확인 후 이용할 수 있어요. (403 Forbidden)',
      403,
    );
  }
  return session;
}

/**
 * 양방향 차단 여부 확인 (`public.is_blocked_between` 동일 로직)
 */
export function isBlockedBetween(
  blocks: readonly BlockRecord[],
  userA: string,
  userB: string,
): boolean {
  return blocks.some(
    (b) =>
      (b.blockerId === userA && b.blockedId === userB) ||
      (b.blockerId === userB && b.blockedId === userA),
  );
}

/**
 * MATCH-006 (TC-004 · TC-007): 추천 후보 RLS 필터 (`public.get_recommendations` 동일 규칙)
 * - 호출자가 검증된 활성 성인이 아니면 즉시 403 AGE_VERIFICATION_REQUIRED
 * - 제외 대상: 본인, 비활성(SUSPENDED/DELETED/PENDING), 성인 미검증/만료, 프로필 비공개(HIDDEN),
 *   양방향 차단 관계, 이미 좋아요/패스한 대상
 */
export function filterRecommendationsWithRls(params: {
  callerToken: string | null | undefined;
  candidates: readonly CandidateProfile[];
  blocks: readonly BlockRecord[];
  likes?: readonly LikeRecord[];
  nowMs?: number;
}): CandidateProfile[] {
  const caller = requireAdultVerifiedUser(params.callerToken);
  const now = params.nowMs ?? Date.now();
  const likes = params.likes ?? [];

  return params.candidates.filter((c) => {
    if (c.userId === caller.userId) return false;
    if (c.accountStatus !== 'ACTIVE') return false;
    if ((c.profileStatus ?? 'ACTIVE') !== 'ACTIVE') return false;
    if (!c.adultVerified) return false;
    if (c.adultVerificationExpiresAt && c.adultVerificationExpiresAt <= now) return false;
    if (isBlockedBetween(params.blocks, caller.userId, c.userId)) return false;
    if (likes.some((l) => l.actorId === caller.userId && l.targetId === c.userId)) return false;
    return true;
  });
}

/**
 * MATCH-005 (TC-006): 관심 표시 및 상호 매칭 원자적 생성 (`private.handle_mutual_like` 동일 규칙)
 * - 정규화된 쌍 (userLowId < userHighId) 키를 사용해 동시/중복 좋아요 경쟁 조건에도 매칭과 대화방은 단 1건만 생성된다.
 */
export function recordLikeWithMutualMatch(params: {
  callerToken: string | null | undefined;
  targetUserId: string;
  decision: 'LIKE' | 'PASS';
  likesStore: Map<string, LikeRecord>;
  matchesStore: Map<string, MatchRecord>;
  blocks: readonly BlockRecord[];
}): { like: LikeRecord; matchCreated: boolean; match: MatchRecord | null } {
  const caller = requireAdultVerifiedUser(params.callerToken);

  if (caller.userId === params.targetUserId) {
    throw new RlsPolicyException('SELF_ACTION_FORBIDDEN', '본인에게는 관심을 표시할 수 없어요.', 422);
  }

  if (isBlockedBetween(params.blocks, caller.userId, params.targetUserId)) {
    throw new RlsPolicyException('BLOCKED_USER_ACCESS', '차단된 상대에게는 관심을 표시할 수 없어요.', 403);
  }

  const likeKey = `${caller.userId}->${params.targetUserId}`;
  const like: LikeRecord = {
    actorId: caller.userId,
    targetId: params.targetUserId,
    decision: params.decision,
    createdAt: Date.now(),
  };
  params.likesStore.set(likeKey, like);

  if (params.decision !== 'LIKE') {
    return { like, matchCreated: false, match: null };
  }

  const reverseKey = `${params.targetUserId}->${caller.userId}`;
  const reverseLike = params.likesStore.get(reverseKey);
  if (!reverseLike || reverseLike.decision !== 'LIKE') {
    return { like, matchCreated: false, match: null };
  }

  const [userLowId, userHighId] =
    caller.userId < params.targetUserId
      ? [caller.userId, params.targetUserId]
      : [params.targetUserId, caller.userId];
  const pairKey = `${userLowId}::${userHighId}`;

  const existing = params.matchesStore.get(pairKey);
  if (existing) {
    // 경쟁 조건/중복 요청 시 새로 만들지 않고 기존 1건만 유지 (TC-006)
    return { like, matchCreated: false, match: existing };
  }

  const newMatch: MatchRecord = {
    id: `match-${userLowId.slice(0, 6)}-${userHighId.slice(0, 6)}`,
    userLowId,
    userHighId,
    status: 'ACTIVE',
    conversationId: `conv-${userLowId.slice(0, 6)}-${userHighId.slice(0, 6)}`,
    createdAt: Date.now(),
  };
  params.matchesStore.set(pairKey, newMatch);
  return { like, matchCreated: true, match: newMatch };
}

/**
 * MATCH-007 · MATCH-008 (TC-008 · TC-009): 대화방/메시지 접근 및 전송 가드 (`public.can_access_conversation`)
 * - 검증된 성인 + 해당 대화방의 ACTIVE 매칭 당사자 + 양방향 미차단이어야 통과
 */
export function requireConversationAccessWithRls(params: {
  callerToken: string | null | undefined;
  conversationId: string;
  matchesStore: ReadonlyMap<string, MatchRecord>;
  blocks: readonly BlockRecord[];
}): { caller: UserSession; match: MatchRecord } {
  const caller = requireAdultVerifiedUser(params.callerToken);

  let foundMatch: MatchRecord | undefined;
  for (const m of params.matchesStore.values()) {
    if (m.conversationId === params.conversationId) {
      foundMatch = m;
      break;
    }
  }

  if (!foundMatch || (foundMatch.userLowId !== caller.userId && foundMatch.userHighId !== caller.userId)) {
    throw new RlsPolicyException(
      'NOT_MATCH_MEMBER',
      '매칭 당사자만 대화방에 접근할 수 있어요. (403 Forbidden)',
      403,
    );
  }

  if (
    foundMatch.status !== 'ACTIVE' ||
    isBlockedBetween(params.blocks, foundMatch.userLowId, foundMatch.userHighId)
  ) {
    throw new RlsPolicyException(
      'BLOCKED_USER_ACCESS',
      '차단되었거나 비활성화된 대화방에는 메시지를 보내거나 조회할 수 없어요. (403 Forbidden)',
      403,
    );
  }

  return { caller, match: foundMatch };
}

/**
 * MATCH-008 (TC-010): 신고 접수는 활성 본인만 가능하며, 일반 계정의 신고 관리 큐(reports) 조회는 즉시 403 차단
 */
export function queryReportQueueWithRls(params: {
  callerToken: string | null | undefined;
  isModeratorRole?: boolean;
  reports: readonly ReportRecord[];
}): ReportRecord[] {
  requireActiveUser(params.callerToken);
  if (!params.isModeratorRole) {
    throw new RlsPolicyException(
      'REPORT_QUEUE_FORBIDDEN',
      '일반 계정은 신고 관리 큐를 조회할 수 없어요. (403 Forbidden · RLS SELECT 차단)',
      403,
    );
  }
  return [...params.reports];
}

export { AuthException };
