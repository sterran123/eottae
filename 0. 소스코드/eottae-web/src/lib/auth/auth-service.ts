// src/lib/auth/auth-service.ts
// MATCH-003: Supabase Auth 기반 회원가입·이메일 확인·로그인 서비스 (ADR-005)
// - 환경변수가 설정되지 않은 경우 NOT_CONFIGURED 로 즉시 중단 (Fail-closed)
// - 로그인 시 public.users의 account_status (ACTIVE / PENDING / SUSPENDED / DELETED)를 검증
// - 가입 및 완료 시 생년월일 원본은 만 19세 판정에만 사용하고 저장하지 않음 (ADR-002)

import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { getSupabase } from '../supabase/client';
import {
  BASE_PATH,
  OAUTH_PROVIDERS_ENABLED,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from './config';
import { fullAge, sanitizeNextPath } from './validation';
import type {
  AccountStatus,
  AuthError,
  AuthErrorCode,
  AuthResult,
  CompleteSignupInput,
  MyAccount,
  OAuthProvider,
  SignupInput,
} from './types';

const MESSAGES: Record<AuthErrorCode, string> = {
  NOT_CONFIGURED: '인증 서비스가 준비되지 않았습니다. 관리자에게 문의해 주세요.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않아요.',
  EMAIL_NOT_CONFIRMED: '이메일 인증이 아직 완료되지 않았어요. 메일함의 인증 링크 또는 인증번호를 확인해 주세요.',
  INVALID_OTP: '인증번호가 올바르지 않거나 만료되었어요. 다시 확인해 주세요.',
  WEAK_PASSWORD: '더 안전한 비밀번호를 사용해 주세요.',
  RATE_LIMITED: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
  UNDERAGE: '만 19세 이상만 가입할 수 있어요.',
  INVALID_INPUT: '입력한 정보를 다시 확인해 주세요.',
  CONSENT_REQUIRED: '필수 약관에 동의해 주세요.',
  SIGNUP_ALREADY_COMPLETED: '이미 가입이 완료된 계정이에요.',
  SESSION_EXPIRED: '세션이 만료되었거나 유효하지 않아요. 다시 로그인해 주세요.',
  SESSION_INVALID: '유효하지 않은 세션이에요.',
  ACCOUNT_SUSPENDED: '이용이 정지된 계정이에요. 고객센터에 문의해 주세요. (403 Forbidden)',
  ACCOUNT_DELETED: '탈퇴 처리된 계정이에요. (403 Forbidden)',
  ACCOUNT_PENDING: '이메일 인증 대기 중인 계정이에요. (403 Forbidden)',
  PROVIDER_DISABLED: 'Google 로그인은 현재 준비 중이에요. 이메일 회원가입·로그인을 이용해 주세요.',
  UNAUTHORIZED: '로그인이 필요해요. (401 Unauthorized)',
  NETWORK: '네트워크 연결을 확인해 주세요.',
  UNKNOWN: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
};

function fail<T>(code: AuthErrorCode, message = MESSAGES[code]): AuthResult<T> {
  return { ok: false, error: { code, message } };
}

const NEXT_PATH_STORAGE_KEY = 'eottae-auth-next-path';

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** 로그인 후 이동할 경로 기억 (OAuth 등 리다이렉트에도 유지되도록 sessionStorage 활용) */
export function rememberNextPath(next: string | null | undefined): void {
  const sanitized = sanitizeNextPath(next);
  const storage = getSessionStorage();
  if (storage) {
    try {
      storage.setItem(NEXT_PATH_STORAGE_KEY, sanitized);
      return;
    } catch {
      // sessionStorage 사용 불가능한 환경에서는 무시
    }
  }
}

/** 로그인 후 이동할 경로 조회 (제거하지 않음 — 렌더 시 사용) */
export function peekNextPath(): string {
  const storage = getSessionStorage();
  if (storage) {
    try {
      const val = storage.getItem(NEXT_PATH_STORAGE_KEY);
      return sanitizeNextPath(val);
    } catch {
      return '/';
    }
  }
  return '/';
}

/** 로그인 후 이동할 경로 조회 및 1회성 소비 */
export function consumeNextPath(): string {
  const target = peekNextPath();
  const storage = getSessionStorage();
  if (storage) {
    try {
      storage.removeItem(NEXT_PATH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return target;
}

/** Supabase Auth / PostgREST / AuthException 오류를 화면용 코드로 변환 */
export function toAuthError(err: unknown): AuthError {
  const e = (err ?? {}) as { code?: string; message?: string; status?: number; name?: string };
  const code = e.code ?? '';
  const msg = e.message ?? '';

  const pick = (c: AuthErrorCode): AuthError => ({ code: c, message: MESSAGES[c] });

  if (msg.includes('UNDERAGE')) return pick('UNDERAGE');
  if (msg.includes('CONSENT_REQUIRED') || msg.includes('ADULT_SELF_CHECK_REQUIRED')) return pick('CONSENT_REQUIRED');
  if (msg.includes('INVALID_NAME') || msg.includes('INVALID_BIRTH_DATE') || msg.includes('INVALID_SIGNUP_PAYLOAD')) {
    return pick('INVALID_INPUT');
  }
  if (msg.includes('SIGNUP_ALREADY_COMPLETED')) return pick('SIGNUP_ALREADY_COMPLETED');
  if (msg.includes('ACCOUNT_SUSPENDED')) return pick('ACCOUNT_SUSPENDED');
  if (msg.includes('ACCOUNT_DELETED')) return pick('ACCOUNT_DELETED');
  if (msg.includes('ACCOUNT_PENDING')) return pick('ACCOUNT_PENDING');

  switch (code) {
    case 'invalid_credentials':
      return pick('INVALID_CREDENTIALS');
    case 'email_not_confirmed':
      return pick('EMAIL_NOT_CONFIRMED');
    case 'otp_expired':
    case 'otp_disabled':
    case 'flow_state_not_found':
    case 'flow_state_expired':
      return pick('INVALID_OTP');
    case 'weak_password':
      return pick('WEAK_PASSWORD');
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return pick('RATE_LIMITED');
    case 'provider_disabled':
      return pick('PROVIDER_DISABLED');
    case 'user_banned':
      return pick('ACCOUNT_SUSPENDED');
    case 'unexpected_failure':
      return pick('INVALID_INPUT');
  }

  if (e.status === 429) return pick('RATE_LIMITED');
  if (/Invalid login credentials/i.test(msg)) return pick('INVALID_CREDENTIALS');
  if (/Email not confirmed/i.test(msg)) return pick('EMAIL_NOT_CONFIRMED');
  if (/Token has expired|invalid.*token|otp/i.test(msg)) return pick('INVALID_OTP');
  if (/Database error saving new user/i.test(msg)) return pick('INVALID_INPUT');
  if (e.name === 'AuthRetryableFetchError' || /Failed to fetch|NetworkError/i.test(msg)) return pick('NETWORK');

  return pick('UNKNOWN');
}

function callbackUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${BASE_PATH}/auth/callback/`;
}

function mapAccount(row: Record<string, unknown>): MyAccount {
  return {
    id: String(row.id),
    email: (row.email as string | undefined) ?? undefined,
    nickname: (row.nickname as string | null) ?? null,
    fullName: (row.full_name as string | null) ?? null,
    birthYear: (row.birth_year as number | null) ?? null,
    accountStatus: row.account_status as AccountStatus,
    signupCompletedAt: (row.signup_completed_at as string | null) ?? null,
    adultVerified: Boolean(row.adult_verified),
    adultVerificationExpiresAt: (row.adult_verification_expires_at as string | null) ?? null,
  };
}

export const authService = {
  /**
   * 이메일 회원가입
   * - Supabase 미설정 시: NOT_CONFIGURED 로 즉시 중단 (fail-closed)
   * - Supabase 연결 시: Auth signUp 호출 (0002 마이그레이션 BEFORE INSERT 트리거가 만 19세 검증 후 birth_date 제거)
   */
  async signUpWithEmail(
    input: SignupInput,
  ): Promise<AuthResult<{ needsEmailConfirmation: boolean }>> {
    const age = fullAge(input.birthDate);
    if (age === null) return fail('INVALID_INPUT');
    if (age < 19) return fail('UNDERAGE');
    if (!input.agreeTerms || !input.agreePrivacy || !input.adultSelfCheck) {
      return fail('CONSENT_REQUIRED');
    }

    const supabase = getSupabase();
    if (!supabase) return fail('NOT_CONFIGURED');

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        emailRedirectTo: callbackUrl(),
        data: {
          signup: {
            full_name: input.fullName.trim(),
            birth_date: input.birthDate,
            terms_version: input.agreeTerms ? TERMS_VERSION : null,
            privacy_version: input.agreePrivacy ? PRIVACY_VERSION : null,
            adult_self_check: input.adultSelfCheck,
          },
        },
      },
    });

    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: { needsEmailConfirmation: !data.session } };
  },

  /**
   * 계정 상태 통합 판정 가드 (ADR-002, ADR-005)
   * - 세션 유효성 및 email_confirmed_at 확인
   * - public.users 조회 후 SUSPENDED·DELETED·조회 실패면 signOut() 후 에러 반환
   * - PENDING 및 ACTIVE 상태의 MyAccount 반환
   */
  async assertAccountAccess(): Promise<AuthResult<MyAccount>> {
    const supabase = getSupabase();
    if (!supabase) return fail('NOT_CONFIGURED');

    const { data: authData, error: userError } = await supabase.auth.getUser();
    if (userError || !authData.user) {
      await supabase.auth.signOut();
      return fail('UNAUTHORIZED');
    }

    if (!authData.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return fail('EMAIL_NOT_CONFIRMED');
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, nickname, full_name, birth_year, account_status, signup_completed_at, adult_verified, adult_verification_expires_at')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return fail('UNKNOWN', '계정 정보를 확인할 수 없습니다.');
    }

    const account = mapAccount({ ...profile, email: authData.user.email });

    if (account.accountStatus === 'SUSPENDED') {
      await supabase.auth.signOut();
      return fail('ACCOUNT_SUSPENDED');
    }

    if (account.accountStatus === 'DELETED') {
      await supabase.auth.signOut();
      return fail('ACCOUNT_DELETED');
    }

    if (account.accountStatus !== 'ACTIVE' && account.accountStatus !== 'PENDING') {
      await supabase.auth.signOut();
      return fail('UNKNOWN', '유효하지 않은 계정 상태입니다.');
    }

    return { ok: true, data: account };
  },

  /** 이메일 인증번호(OTP) 확인 및 계정 상태 판정 */
  async verifyEmailOtp(email: string, token: string): Promise<AuthResult<MyAccount>> {
    const cleanedToken = token.replace(/\s+/g, '');
    if (!cleanedToken) return fail('INVALID_OTP');

    const supabase = getSupabase();
    if (!supabase) return fail('NOT_CONFIGURED');

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: cleanedToken,
      type: 'signup',
    });

    if (error || !data.session) return { ok: false, error: toAuthError(error) };

    const check = await this.assertAccountAccess();
    if (!check.ok) return { ok: false, error: check.error };
    return { ok: true, data: check.data };
  },

  /** 이메일 링크의 token_hash 검증 (/auth/callback?token_hash=...&type=signup) */
  async verifyTokenHash(tokenHash: string, type: EmailOtpType = 'signup'): Promise<AuthResult<Session | null>> {
    const supabase = getSupabase();
    if (!supabase) return fail('NOT_CONFIGURED');

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: data.session };
  },

  /** 인증 메일 재발송 */
  async resendConfirmation(email: string): Promise<AuthResult<void>> {
    const supabase = getSupabase();
    if (!supabase) return fail('NOT_CONFIGURED');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: undefined };
  },

  /**
   * 이메일 + 비밀번호 로그인
   * - Supabase signInWithPassword 성공 후 public.users 테이블의 account_status를 확인한다.
   * - PENDING(이메일 미인증), SUSPENDED(정지 403), DELETED(탈퇴 403) 시 즉시 세션을 종료하고 에러를 반환한다.
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult<Session>> {
    const supabase = getSupabase();
    if (!supabase) return fail('NOT_CONFIGURED');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user || !data.session) {
      return { ok: false, error: toAuthError(error) };
    }

    // 계정 상태 통합 판정 (이메일 확인 및 public.users 상태)
    const check = await this.assertAccountAccess();
    if (!check.ok) return { ok: false, error: check.error };

    // PENDING(가입 추가정보 미입력) 또는 ACTIVE(정상) 세션 반환 (PENDING은 화면에서 /auth/complete 로 이동)
    return { ok: true, data: data.session };
  },

  /** Google OAuth 로그인 — 현재 준비 중(후순위) */
  async signInWithOAuth(provider: OAuthProvider): Promise<AuthResult<void>> {
    if (!OAUTH_PROVIDERS_ENABLED[provider]) return fail('PROVIDER_DISABLED');
    const supabase = getSupabase();
    if (!supabase) return fail('NOT_CONFIGURED');

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    });
    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: undefined };
  },

  /** 로그아웃 */
  async signOut(): Promise<AuthResult<void>> {
    const supabase = getSupabase();
    if (!supabase) return { ok: true, data: undefined };

    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: undefined };
  },

  /** 현재 로그인 사용자의 public.users 정보 조회 (계정 상태 통합 판정) */
  async getMyAccount(): Promise<MyAccount | null> {
    const check = await this.assertAccountAccess();
    return check.ok ? check.data : null;
  },

  /** 닉네임 수정 (public.users에서 유일하게 클라이언트 UPDATE 허용된 열) */
  async updateNickname(nickname: string): Promise<AuthResult<void>> {
    const supabase = getSupabase();
    if (!supabase) return fail('NOT_CONFIGURED');

    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      return fail('INVALID_INPUT', '닉네임은 2자 이상 20자 이하로 입력해 주세요.');
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return fail('UNAUTHORIZED');

    const { error } = await supabase
      .from('users')
      .update({ nickname: trimmed })
      .eq('id', authData.user.id);

    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: undefined };
  },

  /** 소셜 로그인 사용자의 첫 가입 완료 RPC (/auth/complete) */
  async completeSignup(input: CompleteSignupInput): Promise<AuthResult<void>> {
    const supabase = getSupabase();
    if (!supabase) return fail('NOT_CONFIGURED');

    const age = fullAge(input.birthDate);
    if (age === null) return fail('INVALID_INPUT');
    if (age < 19) return fail('UNDERAGE');
    if (!input.agreeTerms || !input.agreePrivacy || !input.adultSelfCheck) {
      return fail('CONSENT_REQUIRED');
    }

    const { error } = await supabase.rpc('complete_signup', {
      p_full_name: input.fullName.trim(),
      p_birth_date: input.birthDate,
      p_terms_version: TERMS_VERSION,
      p_privacy_version: PRIVACY_VERSION,
      p_adult_self_check: input.adultSelfCheck,
    });

    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: undefined };
  },
};
