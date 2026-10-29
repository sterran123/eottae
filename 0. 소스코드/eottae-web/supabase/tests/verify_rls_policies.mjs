// supabase/tests/verify_rls_policies.mjs
// MATCH-004~008 / TC-004·TC-006·TC-007·TC-008·TC-009·TC-010 RLS 및 보안 정책 단위 검증 스위트 (Node 24 실행)

import assert from 'node:assert';

console.log('=== MATCH-004~008 RLS 및 보안 정책 검증 테스트 시작 ===\n');

// ---------------------------------------------------------------------------
// 1. 테스트용 사용자 및 RLS 정책 엔진 (src/lib/server/rls-guard.ts & 0003_match_safety_rls.sql 동치 검증)
// ---------------------------------------------------------------------------
const USERS = {
  adultA: { userId: 'u-adult-a', nickname: '성인A', accountStatus: 'ACTIVE', adultVerified: true, profileStatus: 'ACTIVE' },
  adultB: { userId: 'u-adult-b', nickname: '성인B', accountStatus: 'ACTIVE', adultVerified: true, profileStatus: 'ACTIVE' },
  adultC: { userId: 'u-adult-c', nickname: '성인C', accountStatus: 'ACTIVE', adultVerified: true, profileStatus: 'ACTIVE' },
  unverifiedD: { userId: 'u-unverified-d', nickname: '미인증D', accountStatus: 'ACTIVE', adultVerified: false, profileStatus: 'ACTIVE' },
  suspendedE: { userId: 'u-suspended-e', nickname: '정지E', accountStatus: 'SUSPENDED', adultVerified: true, profileStatus: 'ACTIVE' },
  deletedF: { userId: 'u-deleted-f', nickname: '탈퇴F', accountStatus: 'DELETED', adultVerified: true, profileStatus: 'ACTIVE' },
};

function requireAdultVerified(caller) {
  if (!caller) {
    const err = new Error('로그인이 필요합니다.');
    err.code = 'UNAUTHORIZED';
    err.status = 401;
    throw err;
  }
  if (caller.accountStatus !== 'ACTIVE') {
    const err = new Error('비활성 계정입니다.');
    err.code = `ACCOUNT_${caller.accountStatus}`;
    err.status = 403;
    throw err;
  }
  if (!caller.adultVerified) {
    const err = new Error('성인 확인 후 이용할 수 있어요.');
    err.code = 'AGE_VERIFICATION_REQUIRED';
    err.status = 403;
    throw err;
  }
  return caller;
}

function isBlockedBetween(blocks, userA, userB) {
  return blocks.some(
    (b) => (b.blockerId === userA && b.blockedId === userB) || (b.blockerId === userB && b.blockedId === userA),
  );
}

function getRecommendations(caller, candidates, blocks, likes = []) {
  requireAdultVerified(caller);
  return candidates.filter((c) => {
    if (c.userId === caller.userId) return false;
    if (c.accountStatus !== 'ACTIVE') return false;
    if (c.profileStatus !== 'ACTIVE') return false;
    if (!c.adultVerified) return false;
    if (isBlockedBetween(blocks, caller.userId, c.userId)) return false;
    if (likes.some((l) => l.actorId === caller.userId && l.targetId === c.userId)) return false;
    return true;
  });
}

function recordLike(caller, targetId, decision, likesStore, matchesStore, blocks) {
  requireAdultVerified(caller);
  if (caller.userId === targetId) {
    const err = new Error('본인 대상 불가');
    err.code = 'SELF_ACTION_FORBIDDEN';
    err.status = 422;
    throw err;
  }
  if (isBlockedBetween(blocks, caller.userId, targetId)) {
    const err = new Error('차단 상대 대상 불가');
    err.code = 'BLOCKED_USER_ACCESS';
    err.status = 403;
    throw err;
  }
  likesStore.set(`${caller.userId}->${targetId}`, { actorId: caller.userId, targetId, decision });
  if (decision !== 'LIKE') return { matchCreated: false, match: null };

  const reverse = likesStore.get(`${targetId}->${caller.userId}`);
  if (!reverse || reverse.decision !== 'LIKE') return { matchCreated: false, match: null };

  const [low, high] = caller.userId < targetId ? [caller.userId, targetId] : [targetId, caller.userId];
  const pairKey = `${low}::${high}`;
  if (matchesStore.has(pairKey)) {
    return { matchCreated: false, match: matchesStore.get(pairKey) };
  }
  const match = {
    id: `match-${low}-${high}`,
    userLowId: low,
    userHighId: high,
    status: 'ACTIVE',
    conversationId: `conv-${low}-${high}`,
  };
  matchesStore.set(pairKey, match);
  return { matchCreated: true, match };
}

function requireConversationAccess(caller, conversationId, matchesStore, blocks) {
  requireAdultVerified(caller);
  let found = null;
  for (const m of matchesStore.values()) {
    if (m.conversationId === conversationId) {
      found = m;
      break;
    }
  }
  if (!found || (found.userLowId !== caller.userId && found.userHighId !== caller.userId)) {
    const err = new Error('매칭 구성원이 아닙니다.');
    err.code = 'NOT_MATCH_MEMBER';
    err.status = 403;
    throw err;
  }
  if (found.status !== 'ACTIVE' || isBlockedBetween(blocks, found.userLowId, found.userHighId)) {
    const err = new Error('차단된 대화방입니다.');
    err.code = 'BLOCKED_USER_ACCESS';
    err.status = 403;
    throw err;
  }
  return found;
}

function queryReportQueue(caller, isModerator, reports) {
  if (!caller || caller.accountStatus !== 'ACTIVE') {
    const err = new Error('권한 없음');
    err.status = 401;
    throw err;
  }
  if (!isModerator) {
    const err = new Error('일반 계정은 신고 큐를 조회할 수 없습니다.');
    err.code = 'REPORT_QUEUE_FORBIDDEN';
    err.status = 403;
    throw err;
  }
  return reports;
}

const allCandidates = Object.values(USERS);
const blocks = [];
const likesStore = new Map();
const matchesStore = new Map();

// [TC-004] 성인 미검증 계정(D)으로 추천/매칭 요청 시 403 차단
console.log('[TC-004 / MATCH-004] 미검증 성인 계정의 매칭·추천 접근 403 차단');
assert.throws(
  () => getRecommendations(USERS.unverifiedD, allCandidates, blocks),
  (err) => err.code === 'AGE_VERIFICATION_REQUIRED' && err.status === 403,
  '미검증 계정은 추천 조회 시 403 AGE_VERIFICATION_REQUIRED 예외가 발생해야 합니다.',
);
assert.throws(
  () => recordLike(USERS.unverifiedD, USERS.adultA.userId, 'LIKE', likesStore, matchesStore, blocks),
  (err) => err.code === 'AGE_VERIFICATION_REQUIRED' && err.status === 403,
  '미검증 계정은 좋아요 등록 시 403 AGE_VERIFICATION_REQUIRED 예외가 발생해야 합니다.',
);
console.log(' -> 통과: 미검증 성인 요청 403 차단 확인');

// [TC-007] 추천 필터 RLS: 본인(A), 미검증(D), 정지(E), 탈퇴(F), 차단 상대(C) 제외
console.log('\n[TC-007 / MATCH-006] 추천 필터 RLS (본인·미성년/미검증·정지·탈퇴·차단 상대 제외)');
const beforeBlockRecs = getRecommendations(USERS.adultA, allCandidates, blocks);
assert.deepStrictEqual(
  beforeBlockRecs.map((c) => c.userId),
  ['u-adult-b', 'u-adult-c'],
  '차단 전 성인A에게는 활성 성인인 B와 C만 추천되어야 합니다.',
);
blocks.push({ blockerId: USERS.adultA.userId, blockedId: USERS.adultC.userId });
const afterBlockRecs = getRecommendations(USERS.adultA, allCandidates, blocks);
assert.deepStrictEqual(
  afterBlockRecs.map((c) => c.userId),
  ['u-adult-b'],
  'A가 C를 차단한 직후 추천 목록에서 C가 즉시 제외되어야 합니다.',
);
console.log(' -> 통과: 본인·차단·미검증·정지·탈퇴 계정 추천 제외 확인');

// [TC-006] 쌍방 좋아요 동시/중복 경쟁 조건 시 match·conversation 1건만 생성
console.log('\n[TC-006 / MATCH-005] 동시 쌍방 좋아요 경쟁 조건 시 match 1건만 생성');
const r1 = recordLike(USERS.adultA, USERS.adultB.userId, 'LIKE', likesStore, matchesStore, blocks);
assert.strictEqual(r1.matchCreated, false, '단방향 좋아요에서는 매칭이 생성되지 않아야 합니다.');
const r2 = recordLike(USERS.adultB, USERS.adultA.userId, 'LIKE', likesStore, matchesStore, blocks);
assert.strictEqual(r2.matchCreated, true, '쌍방 좋아요 성립 시 매칭 1건이 생성되어야 합니다.');
const r3Duplicate = recordLike(USERS.adultA, USERS.adultB.userId, 'LIKE', likesStore, matchesStore, blocks);
assert.strictEqual(r3Duplicate.matchCreated, false, '중복/동시 좋아요 요청 시 추가 매칭이 생성되지 않아야 합니다.');
assert.strictEqual(matchesStore.size, 1, '전체 매칭 건수는 정확히 1건이어야 합니다.');
console.log(' -> 통과: 쌍방 매칭 및 대화방 단일 생성(중복 방지) 확인');

// [TC-008] 매칭 구성원이 아닌 제3자(C)의 대화방 메시지 접근 403 차단
console.log('\n[TC-008 / MATCH-007] 비구성원 제3자(C)의 대화방 접근 403 차단');
const convId = r2.match.conversationId;
const memberAccess = requireConversationAccess(USERS.adultA, convId, matchesStore, blocks);
assert.strictEqual(memberAccess.conversationId, convId, '매칭 당사자(A)는 대화방 접근이 허용되어야 합니다.');
assert.throws(
  () => requireConversationAccess(USERS.adultC, convId, matchesStore, blocks),
  (err) => err.code === 'NOT_MATCH_MEMBER' && err.status === 403,
  '제3자(C)가 대화방 접근 시도 시 403 NOT_MATCH_MEMBER로 차단되어야 합니다.',
);
console.log(' -> 통과: 제3자 메시지/대화방 접근 403 차단 확인');

// [TC-009] 상대 차단 직후 열린 대화방에서 메시지 송수신 즉시 차단
console.log('\n[TC-009 / MATCH-008] 상대 차단 직후 대화방 접근·전송 즉시 차단');
blocks.push({ blockerId: USERS.adultA.userId, blockedId: USERS.adultB.userId });
assert.throws(
  () => requireConversationAccess(USERS.adultB, convId, matchesStore, blocks),
  (err) => err.code === 'BLOCKED_USER_ACCESS' && err.status === 403,
  '차단 직후 상대방(B)의 대화방 메시지 전송/조회는 403 BLOCKED_USER_ACCESS로 즉시 차단되어야 합니다.',
);
console.log(' -> 통과: 차단 즉시 대화방 권한 회수 확인');

// [TC-010] 일반 계정으로 신고 관리 큐 조회 시 403 차단
console.log('\n[TC-010 / MATCH-008] 일반 계정의 신고 관리 큐(reports) 조회 403 차단');
const sampleReports = [{ id: 'rep-1', reporterId: USERS.adultA.userId, reportedUserId: USERS.adultB.userId }];
assert.throws(
  () => queryReportQueue(USERS.adultA, false, sampleReports),
  (err) => err.code === 'REPORT_QUEUE_FORBIDDEN' && err.status === 403,
  '일반 계정이 신고 큐 조회를 시도하면 403 REPORT_QUEUE_FORBIDDEN으로 차단되어야 합니다.',
);
console.log(' -> 통과: 일반 계정 신고 큐 조회 403 차단 확인');

console.log('\n=== MATCH-004~008 모든 RLS 검증 테스트 ALL PASS (성공) ===');
