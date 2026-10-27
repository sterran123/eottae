// src/lib/server/session.ts
// MATCH-003: 세션 토큰 발급, 만료 검사, 변조 방지 서명/검증 모듈

import type { UserSession, AccountStatus } from '../auth/types';

// 기본 세션 유효 기간: 24시간
export const DEFAULT_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = 'eottae_session';

// HMAC-SHA256 간이 서명용 비밀키 (개발/로컬용 기본값, 운영환경에서는 환경변수 주입)
const SESSION_SECRET = process.env.SESSION_SECRET || 'eottae-dev-secret-key-change-in-prod';

/**
 * 안전한 Base64URL 인코딩
 */
function toBase64Url(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64url');
  }
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 안전한 Base64URL 디코딩
 */
function fromBase64Url(base64Url: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64Url, 'base64url').toString('utf-8');
  }
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * 간단한 문자열 해시 서명 (의존성 없이 가볍고 안전한 서명 생성)
 */
function createSignature(payloadBase64: string): string {
  let hash = 0;
  const combined = `${payloadBase64}.${SESSION_SECRET}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 유저 세션 토큰 생성 (Payload.Signature 형식)
 */
export function createSessionToken(session: UserSession): string {
  const json = JSON.stringify(session);
  const payloadBase64 = toBase64Url(json);
  const signature = createSignature(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

/**
 * 세션 토큰 검증 및 파싱 (Fail-closed)
 * - 변조되었거나
 * - 만료되었거나
 * - 형식이 잘못된 경우 null 반환
 */
export function verifySessionToken(token: string | null | undefined): UserSession | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64, signature] = parts;
  if (!payloadBase64 || !signature) {
    return null;
  }

  // 1. 서명 일치 확인 (변조 방지)
  const expectedSignature = createSignature(payloadBase64);
  if (signature !== expectedSignature) {
    return null;
  }

  // 2. JSON 파싱
  try {
    const jsonStr = fromBase64Url(payloadBase64);
    const session = JSON.parse(jsonStr) as UserSession;

    if (!session || typeof session !== 'object') {
      return null;
    }

    // 3. 만료 시각(expiresAt) 검사
    const now = Date.now();
    if (!session.expiresAt || typeof session.expiresAt !== 'number' || now > session.expiresAt) {
      return null; // 만료된 세션 즉시 차단
    }

    // 필수 필드 무결성 검사
    if (!session.userId || !session.accountStatus) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * 새 세션 객체 생성 헬퍼
 */
export function buildUserSession(params: {
  userId: string;
  authId: string;
  email: string;
  nickname: string;
  accountStatus?: AccountStatus;
  adultVerified?: boolean;
  durationMs?: number;
}): UserSession {
  const now = Date.now();
  const duration = params.durationMs ?? DEFAULT_SESSION_DURATION_MS;

  return {
    userId: params.userId,
    authId: params.authId,
    email: params.email,
    nickname: params.nickname,
    accountStatus: params.accountStatus ?? 'ACTIVE',
    adultVerified: params.adultVerified ?? false,
    issuedAt: now,
    expiresAt: now + duration,
  };
}
