// src/lib/auth/config.ts
// MATCH-003: 인증 관련 설정 상수

import type { OAuthProvider } from './types';

/** 약관 버전 — 본문이 바뀌면 올리고 consents에 새 버전으로 기록된다. */
export const TERMS_VERSION = 'terms-2026-10-draft';
export const PRIVACY_VERSION = 'privacy-2026-10-draft';

/** 가입 가능 최소 만 나이 (서버 private.validate_signup 과 동일) */
export const MIN_SIGNUP_AGE = 19;

/**
 * Google OAuth 사용 여부 (현재 후순위 — 준비 중 표시).
 * (카카오 로그인은 일일 로그인 횟수 제한 이슈로 제외하고 Google + 이메일 로그인으로 확정)
 */
export const OAUTH_PROVIDERS_ENABLED: Record<OAuthProvider, boolean> = {
  google: false,
};

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/eottae';

/** Supabase Redirect allow list (ADR-005) — 끝에 슬래시(trailingSlash: true) 포함 */
export const ALLOWED_REDIRECT_URLS = [
  'https://sterran123.github.io/eottae/auth/callback/',
  'http://localhost:3000/eottae/auth/callback/',
] as const;
