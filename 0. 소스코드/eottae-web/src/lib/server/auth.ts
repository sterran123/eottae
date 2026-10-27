// src/lib/server/auth.ts
// MATCH-003: 서버 인증 유효성 검사, 계정 상태/만료 차단 가드

import type { UserSession, AuthError } from '../auth/types';
import { verifySessionToken, buildUserSession, createSessionToken } from './session';

export class AuthException extends Error {
  public readonly code: AuthError['code'];
  public readonly status: number;

  constructor(code: AuthError['code'], message: string, status = 401) {
    super(message);
    this.name = 'AuthException';
    this.code = code;
    this.status = status;
  }
}

/**
 * 데모 및 개발 검증용 Mock 사용자 풀
 */
export const MOCK_USERS: Record<string, {
  userId: string;
  authId: string;
  email: string;
  nickname: string;
  accountStatus: UserSession['accountStatus'];
  adultVerified: boolean;
}> = {
  'demo@eottae.kr': {
    userId: '11111111-1111-4111-8111-111111111111',
    authId: 'auth-demo-001',
    email: 'demo@eottae.kr',
    nickname: '어때데모',
    accountStatus: 'ACTIVE',
    adultVerified: true,
  },
  'user@eottae.kr': {
    userId: '22222222-2222-4222-8222-222222222222',
    authId: 'auth-user-002',
    email: 'user@eottae.kr',
    nickname: '설레는마음',
    accountStatus: 'ACTIVE',
    adultVerified: false, // 성인 미인증 상태
  },
  'suspended@eottae.kr': {
    userId: '33333333-3333-4333-8333-333333333333',
    authId: 'auth-suspended-003',
    email: 'suspended@eottae.kr',
    nickname: '정지회원',
    accountStatus: 'SUSPENDED', // 정지 상태
    adultVerified: true,
  },
  'deleted@eottae.kr': {
    userId: '44444444-4444-4444-8444-444444444444',
    authId: 'auth-deleted-004',
    email: 'deleted@eottae.kr',
    nickname: '탈퇴회원',
    accountStatus: 'DELETED', // 탈퇴 상태
    adultVerified: true,
  },
};

/**
 * 토큰 또는 세션 문자열로부터 활성 유저 세션 검증
 * - 세션 미존재/만료: 401 Unauthorized
 * - 정지(SUSPENDED): 403 Forbidden
 * - 탈퇴(DELETED): 403 Forbidden
 * - 대기(PENDING): 403 Forbidden
 */
export function requireActiveUser(token: string | null | undefined): UserSession {
  if (!token) {
    throw new AuthException('UNAUTHORIZED', '로그인이 필요합니다.', 401);
  }

  const session = verifySessionToken(token);
  if (!session) {
    throw new AuthException('SESSION_EXPIRED', '세션이 만료되었거나 유효하지 않습니다.', 401);
  }

  // 계정 상태에 따른 차단 (Fail-closed)
  switch (session.accountStatus) {
    case 'ACTIVE':
      return session;
    case 'SUSPENDED':
      throw new AuthException('ACCOUNT_SUSPENDED', '이용이 정지된 계정입니다. 고객센터에 문의해 주세요.', 403);
    case 'DELETED':
      throw new AuthException('ACCOUNT_DELETED', '탈퇴 처리된 계정입니다.', 403);
    case 'PENDING':
      throw new AuthException('ACCOUNT_PENDING', '가입 승인 대기 중인 계정입니다.', 403);
    default:
      throw new AuthException('UNAUTHORIZED', '유효하지 않은 계정 상태입니다.', 401);
  }
}

/**
 * 로그인 인증 처리 (Mock & 확장 가능 구조)
 */
export function authenticateUser(email: string): { session: UserSession; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const mockUser = MOCK_USERS[normalizedEmail];

  if (!mockUser) {
    // 목업에 없는 새 이메일인 경우 자동 활성 유저로 가상 생성 (개발 편의)
    const newSession = buildUserSession({
      userId: `user-${Date.now()}`,
      authId: `auth-${Date.now()}`,
      email: normalizedEmail,
      nickname: normalizedEmail.split('@')[0] || '사용자',
      accountStatus: 'ACTIVE',
      adultVerified: false,
    });
    return {
      session: newSession,
      token: createSessionToken(newSession),
    };
  }

  // 계정 상태 검사
  if (mockUser.accountStatus === 'SUSPENDED') {
    throw new AuthException('ACCOUNT_SUSPENDED', '이용 정지된 계정입니다.', 403);
  }
  if (mockUser.accountStatus === 'DELETED') {
    throw new AuthException('ACCOUNT_DELETED', '탈퇴된 계정입니다.', 403);
  }

  const session = buildUserSession({
    userId: mockUser.userId,
    authId: mockUser.authId,
    email: mockUser.email,
    nickname: mockUser.nickname,
    accountStatus: mockUser.accountStatus,
    adultVerified: mockUser.adultVerified,
  });

  return {
    session,
    token: createSessionToken(session),
  };
}
