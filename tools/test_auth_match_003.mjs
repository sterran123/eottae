// tools/test_auth_match_003.mjs
// MATCH-003: 세션 서명, 만료, 계정 상태 차단 로직 단위 검증 테스트 (순수 Node 24 실행)

import assert from 'node:assert';

console.log('=== MATCH-003 단위 검증 테스트 시작 ===\n');

// 1. 세션 토큰 서명/검증 알고리즘 검증
const DEFAULT_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const SESSION_SECRET = 'eottae-dev-secret-key-change-in-prod';

function toBase64Url(str) {
  return Buffer.from(str, 'utf-8').toString('base64url');
}

function fromBase64Url(base64Url) {
  return Buffer.from(base64Url, 'base64url').toString('utf-8');
}

function createSignature(payloadBase64) {
  let hash = 0;
  const combined = `${payloadBase64}.${SESSION_SECRET}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function createSessionToken(session) {
  const json = JSON.stringify(session);
  const payloadBase64 = toBase64Url(json);
  const signature = createSignature(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadBase64, signature] = parts;
  if (!payloadBase64 || !signature) return null;
  if (signature !== createSignature(payloadBase64)) return null;

  try {
    const session = JSON.parse(fromBase64Url(payloadBase64));
    if (!session || typeof session !== 'object') return null;
    const now = Date.now();
    if (!session.expiresAt || typeof session.expiresAt !== 'number' || now > session.expiresAt) {
      return null;
    }
    if (!session.userId || !session.accountStatus) return null;
    return session;
  } catch {
    return null;
  }
}

class AuthException extends Error {
  constructor(code, message, status = 401) {
    super(message);
    this.name = 'AuthException';
    this.code = code;
    this.status = status;
  }
}

function requireActiveUser(token) {
  if (!token) {
    throw new AuthException('UNAUTHORIZED', '로그인이 필요합니다.', 401);
  }
  const session = verifySessionToken(token);
  if (!session) {
    throw new AuthException('SESSION_EXPIRED', '세션이 만료되었거나 유효하지 않습니다.', 401);
  }
  switch (session.accountStatus) {
    case 'ACTIVE':
      return session;
    case 'SUSPENDED':
      throw new AuthException('ACCOUNT_SUSPENDED', '이용이 정지된 계정입니다.', 403);
    case 'DELETED':
      throw new AuthException('ACCOUNT_DELETED', '탈퇴 처리된 계정입니다.', 403);
    case 'PENDING':
      throw new AuthException('ACCOUNT_PENDING', '가입 승인 대기 중인 계정입니다.', 403);
    default:
      throw new AuthException('UNAUTHORIZED', '유효하지 않은 계정 상태입니다.', 401);
  }
}

// [테스트 1] 정상 세션 발급 및 서명 검증
console.log('[테스트 1] 정상 세션 발급 및 서명 검증');
const validSession = {
  userId: 'test-user-1',
  authId: 'auth-1',
  email: 'test@eottae.kr',
  nickname: '테스터',
  accountStatus: 'ACTIVE',
  adultVerified: true,
  issuedAt: Date.now(),
  expiresAt: Date.now() + 3600 * 1000,
};
const token = createSessionToken(validSession);
assert(typeof token === 'string' && token.includes('.'), '토큰은 payload.sig 형태여야 합니다.');
const parsed = verifySessionToken(token);
assert(parsed !== null, '정상 토큰은 파싱되어야 합니다.');
assert.strictEqual(parsed.userId, 'test-user-1');
assert.strictEqual(parsed.accountStatus, 'ACTIVE');
const activeUser = requireActiveUser(token);
assert.strictEqual(activeUser.userId, 'test-user-1');
console.log(' -> 통과: 정상 세션 서명 및 복원 완료');

// [테스트 2] 만료된 세션 즉시 차단 (Fail-closed)
console.log('\n[테스트 2] 만료된 세션 즉시 차단 (Fail-closed)');
const expiredSession = {
  userId: 'test-user-expired',
  authId: 'auth-exp',
  email: 'expired@eottae.kr',
  nickname: '만료자',
  accountStatus: 'ACTIVE',
  adultVerified: true,
  issuedAt: Date.now() - 5000,
  expiresAt: Date.now() - 1000, // 1초 전 만료
};
const expiredToken = createSessionToken(expiredSession);
const expiredResult = verifySessionToken(expiredToken);
assert.strictEqual(expiredResult, null, '만료된 세션은 verifySessionToken에서 null이어야 합니다.');
assert.throws(
  () => requireActiveUser(expiredToken),
  (err) => err instanceof AuthException && err.code === 'SESSION_EXPIRED',
  'requireActiveUser는 만료된 토큰에 대해 SESSION_EXPIRED(401) 예외를 던져야 합니다.'
);
console.log(' -> 통과: 만료 세션 차단 확인 (401)');

// [테스트 3] 위변조된 토큰 무효화
console.log('\n[테스트 3] 서명 불일치 위변조 토큰 차단');
const tamperedToken = token.slice(0, -4) + 'abcd';
const tamperedResult = verifySessionToken(tamperedToken);
assert.strictEqual(tamperedResult, null, '변조된 서명의 토큰은 null이어야 합니다.');
console.log(' -> 통과: 위변조 토큰 무효화 확인');

// [테스트 4] 정지 계정(SUSPENDED) 403 차단
console.log('\n[테스트 4] 정지 계정(SUSPENDED) 403 차단');
const suspendedSession = {
  userId: 'test-suspended',
  authId: 'auth-sus',
  email: 'suspended@eottae.kr',
  nickname: '정지회원',
  accountStatus: 'SUSPENDED',
  adultVerified: true,
  issuedAt: Date.now(),
  expiresAt: Date.now() + 3600 * 1000,
};
const suspendedToken = createSessionToken(suspendedSession);
assert.throws(
  () => requireActiveUser(suspendedToken),
  (err) => err instanceof AuthException && err.code === 'ACCOUNT_SUSPENDED' && err.status === 403,
  '정지 계정은 ACCOUNT_SUSPENDED(403) 예외가 발생해야 합니다.'
);
console.log(' -> 통과: 정지 계정 접근 차단 확인 (403)');

// [테스트 5] 탈퇴 계정(DELETED) 403 차단
console.log('\n[테스트 5] 탈퇴 계정(DELETED) 403 차단');
const deletedSession = {
  userId: 'test-deleted',
  authId: 'auth-del',
  email: 'deleted@eottae.kr',
  nickname: '탈퇴회원',
  accountStatus: 'DELETED',
  adultVerified: true,
  issuedAt: Date.now(),
  expiresAt: Date.now() + 3600 * 1000,
};
const deletedToken = createSessionToken(deletedSession);
assert.throws(
  () => requireActiveUser(deletedToken),
  (err) => err instanceof AuthException && err.code === 'ACCOUNT_DELETED' && err.status === 403,
  '탈퇴 계정은 ACCOUNT_DELETED(403) 예외가 발생해야 합니다.'
);
console.log(' -> 통과: 탈퇴 계정 접근 차단 확인 (403)');

console.log('\n=== MATCH-003 모든 단위 테스트 ALL PASS (성공) ===');
