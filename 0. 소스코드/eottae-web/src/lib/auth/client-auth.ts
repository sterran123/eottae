// src/lib/auth/client-auth.ts
// MATCH-003: 브라우저/클라이언트 세션 스토리지 관리 및 인증 헬퍼

import type { UserSession, AuthResponse, AccountStatus } from './types';
import { verifySessionToken } from '../server/session';
import { authenticateUser } from '../server/auth';

const STORAGE_KEY = 'eottae_user_session';
const TOKEN_KEY = 'eottae_session_token';

/**
 * 클라이언트 세션 매니저
 */
export const clientAuth = {
  /**
   * 현재 활성 세션 토큰 반환
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * 현재 활성 유저 세션 가져오기 (만료 및 서명 검증 포함)
   */
  getSession(): UserSession | null {
    if (typeof window === 'undefined') return null;

    const token = this.getToken();
    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session) {
      // 변조되었거나 만료된 세션이면 로컬 스토리지 정리
      this.logout();
      return null;
    }

    // 정지/탈퇴 계정이면 세션 무효화
    if (session.accountStatus !== 'ACTIVE') {
      this.logout();
      return null;
    }

    return session;
  },

  /**
   * 간이 로그인 수행 (데모 또는 지정 이메일)
   */
  login(email: string): AuthResponse {
    try {
      const { session, token } = authenticateUser(email);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        // 다른 탭/컴포넌트 동기화를 위한 커스텀 이벤트
        window.dispatchEvent(new Event('eottae-auth-change'));
      }
      return { success: true, session };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message,
        },
      };
    }
  },

  /**
   * 로그아웃 (세션 및 토큰 즉시 파기)
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('eottae-auth-change'));
  },

  /**
   * 성인 인증 상태 갱신 (MATCH-004 연동 대비)
   */
  updateAdultVerification(status: boolean): UserSession | null {
    const session = this.getSession();
    if (!session) return null;

    const updatedSession: UserSession = {
      ...session,
      adultVerified: status,
    };

    // 토큰 재생성
    const { token } = authenticateUser(session.email);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
      window.dispatchEvent(new Event('eottae-auth-change'));
    }
    return updatedSession;
  },
};
