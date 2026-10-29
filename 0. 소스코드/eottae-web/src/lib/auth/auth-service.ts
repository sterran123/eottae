// src/lib/auth/auth-service.ts
// MATCH-003: 회원가입·이메일 확인·로그인·세션 검증 통합 서비스
// - 정적 배포(GitHub Pages) 환경에서는 src/lib/server/auth.ts(requireActiveUser, authenticateUser),
//   src/lib/server/session.ts(verifySessionToken, createSessionToken), src/lib/auth/client-auth.ts(clientAuth)를
//   통해 브라우저 세션 기반으로 회원가입 → 이메일 인증번호 확인 → 로그인 → 세션 검증까지 모두 동작한다.
// - Supabase 환경변수가 주입된 경우 Supabase Auth + RLS(0001/0002 마이그레이션)와 연동된다.

import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { getSupabase } from '../supabase/client';
import { AuthException, MOCK_USERS, requireActiveUser } from '../server/auth';
import { verifySessionToken } from '../server/session';
import { clientAuth } from './client-auth';
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
  UserSession,
} from './types';

const MESSAGES: Record<AuthErrorCode, string> = {
  NOT_CONFIGURED: '인증 설정을 확인할 수 없어요.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않아요.',
  EMAIL_NOT_CONFIRMED: '이메일 인증이 아직 완료되지 않았어요. 인증번호를 입력해 확인을 완료해 주세요.',
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

/** 정적 배포(GitHub Pages) 데모 세션 모드용 가입 대기/완료 메모리 저장소 (ADR-002: 생년월일 원본·비밀번호 미보관, birthYear만 보관) */
interface StaticAccountRecord {
  userId: string;
  email: string;
  fullName: string;
  birthYear: number;
  otpCode: string;
  emailConfirmed: boolean;
  signupCompletedAt: string | null;
}

const staticAccounts = new Map<string, StaticAccountRecord>();
let pendingReturnPath = '/';

function generateSixDigitOtp(email: string): string {
  const seed = Math.abs(
    email.split('').reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 17), 240003),
  );
  return String(100000 + (seed % 900000));
}

/** Supabase Auth / PostgREST / AuthException 오류를 화면용 코드로 변환 */
export function toAuthError(err: unknown): AuthError {
  if (err instanceof AuthException) {
    return {
      code: err.code,
      message: MESSAGES[err.code] ?? err.message,
    };
  }

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

function sessionToMyAccount(session: UserSession): MyAccount {
  const normalized = session.email.trim().toLowerCase();
  const extra = staticAccounts.get(normalized);
  return {
    id: session.userId,
    email: session.email,
    nickname: session.nickname,
    fullName: extra?.fullName ?? session.nickname,
    birthYear: extra?.birthYear ?? null,
    accountStatus: session.accountStatus,
    signupCompletedAt: extra?.signupCompletedAt ?? new Date(session.issuedAt).toISOString(),
    adultVerified: session.adultVerified,
    adultVerificationExpiresAt: null,
  };
}

/** 로그인 후 이동할 경로 기억/소비 */
export function rememberNextPath(next: string | null | undefined): void {
  pendingReturnPath = sanitizeNextPath(next);
}

export function consumeNextPath(): string {
  const target = pendingReturnPath;
  pendingReturnPath = '/';
  return sanitizeNextPath(target);
}

export const authService = {
  /**
   * 이메일 회원가입
   * - Supabase 연결 시: Custom SMTP로 인증 메일 발송
   * - 정적 배포(GitHub Pages) 세션 모드: 만 19세 검증 후 출생연도만 보관(ADR-002), PENDING 등록 및 6자리 인증번호 발급
   */
  async signUpWithEmail(
    input: SignupInput,
  ): Promise<AuthResult<{ needsEmailConfirmation: boolean; demoOtpCode?: string }>> {
    const age = fullAge(input.birthDate);
    if (age === null) return fail('INVALID_INPUT');
    if (age < 19) return fail('UNDERAGE');
    if (!input.agreeTerms || !input.agreePrivacy || !input.adultSelfCheck) {
      return fail('CONSENT_REQUIRED');
    }

    const supabase = getSupabase();
    if (!supabase) {
      const normalized = input.email.trim().toLowerCase();
      const existingMock = MOCK_USERS[normalized];
      if (existingMock && existingMock.accountStatus === 'SUSPENDED') {
        return fail('ACCOUNT_SUSPENDED');
      }
      if (existingMock && existingMock.accountStatus === 'DELETED') {
        return fail('ACCOUNT_DELETED');
      }

      const otpCode = generateSixDigitOtp(normalized);
      const birthYear = Number(input.birthDate.slice(0, 4));
      const userId = existingMock?.userId ?? `user-${Date.now()}`;

      staticAccounts.set(normalized, {
        userId,
        email: normalized,
        fullName: input.fullName.trim(),
        birthYear,
        otpCode,
        emailConfirmed: false,
        signupCompletedAt: null,
      });

      // 이메일 인증 전까지는 PENDING 상태로 등록 (requireActiveUser 호출 시 403 ACCOUNT_PENDING 차단)
      MOCK_USERS[normalized] = {
        userId,
        authId: `auth-${Date.now()}`,
        email: normalized,
        nickname: input.fullName.trim(),
        accountStatus: 'PENDING',
        adultVerified: false,
      };

      return {
        ok: true,
        data: {
          needsEmailConfirmation: true,
          demoOtpCode: otpCode,
        },
      };
    }

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

  /** 이메일 인증번호(OTP) 확인 → 계정 ACTIVE 전환 및 세션 발급 */
  async verifyEmailOtp(email: string, token: string): Promise<AuthResult<Session | UserSession | null>> {
    const cleanedToken = token.replace(/\s+/g, '');
    if (!cleanedToken) return fail('INVALID_OTP');

    const supabase = getSupabase();
    if (!supabase) {
      const normalized = email.trim().toLowerCase();
      const record = staticAccounts.get(normalized);
      if (!record || record.otpCode !== cleanedToken) {
        return fail('INVALID_OTP');
      }

      record.emailConfirmed = true;
      record.signupCompletedAt = new Date().toISOString();

      MOCK_USERS[normalized] = {
        userId: record.userId,
        authId: `auth-${record.userId}`,
        email: normalized,
        nickname: record.fullName,
        accountStatus: 'ACTIVE',
        adultVerified: false,
      };

      const loginRes = clientAuth.login(normalized);
      if (!loginRes.success || !loginRes.session) {
        return fail('UNAUTHORIZED', loginRes.error?.message);
      }

      // 서버 세션 가드(src/lib/server/auth.ts)로 발급된 토큰 즉시 검증
      const verified = requireActiveUser(clientAuth.getToken());
      return { ok: true, data: verified };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: cleanedToken,
      type: 'signup',
    });

    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: data.session };
  },

  /** 이메일 링크의 token_hash 검증 (/auth/callback?token_hash=...&type=signup) */
  async verifyTokenHash(tokenHash: string, type: EmailOtpType = 'signup'): Promise<AuthResult<Session | null>> {
    const supabase = getSupabase();
    if (!supabase) {
      const session = clientAuth.getSession();
      return session ? { ok: true, data: null } : fail('SESSION_EXPIRED');
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: data.session };
  },

  /** 인증 메일 재발송 (정적 세션 모드에서는 새 6자리 인증번호 재발급) */
  async resendConfirmation(email: string): Promise<AuthResult<{ demoOtpCode?: string }>> {
    const supabase = getSupabase();
    if (!supabase) {
      const normalized = email.trim().toLowerCase();
      const otpCode = generateSixDigitOtp(normalized);
      const record = staticAccounts.get(normalized);
      if (record) {
        record.otpCode = otpCode;
      } else {
        staticAccounts.set(normalized, {
          userId: `user-${Date.now()}`,
          email: normalized,
          fullName: normalized.split('@')[0] || '사용자',
          birthYear: 2000,
          otpCode,
          emailConfirmed: false,
          signupCompletedAt: null,
        });
      }
      return { ok: true, data: { demoOtpCode: otpCode } };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: {} };
  },

  /**
   * 이메일 + 비밀번호 로그인
   * - 정적 배포(GitHub Pages)에서는 src/lib/server/auth.ts의 authenticateUser & requireActiveUser로
   *   계정 상태(ACTIVE / SUSPENDED 403 / DELETED 403 / PENDING 403)와 세션 서명을 검증한다.
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult<Session | UserSession>> {
    const supabase = getSupabase();
    if (!supabase) {
      const normalized = email.trim().toLowerCase();
      const record = staticAccounts.get(normalized);

      if (record && !record.emailConfirmed) {
        return fail('EMAIL_NOT_CONFIRMED');
      }

      const mock = MOCK_USERS[normalized];
      if (mock?.accountStatus === 'PENDING') {
        return fail('EMAIL_NOT_CONFIRMED');
      }

      try {
        // 1) clientAuth.login(authenticateUser) 호출 — SUSPENDED/DELETED 계정은 403 AuthException 발생
        const res = clientAuth.login(normalized);
        if (!res.success || !res.session) {
          if (mock?.accountStatus === 'SUSPENDED') return fail('ACCOUNT_SUSPENDED');
          if (mock?.accountStatus === 'DELETED') return fail('ACCOUNT_DELETED');
          return fail('UNAUTHORIZED', res.error?.message);
        }

        // 2) 발급된 토큰을 src/lib/server/auth.ts 의 requireActiveUser로 최종 검증
        const verifiedSession = requireActiveUser(clientAuth.getToken());
        return { ok: true, data: verifiedSession };
      } catch (err: unknown) {
        return { ok: false, error: toAuthError(err) };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: data.session };
  },

  /** Google OAuth 로그인 — 현재 준비 중(후순위) */
  async signInWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
    if (!OAUTH_PROVIDERS_ENABLED[provider]) return fail('PROVIDER_DISABLED');
    const supabase = getSupabase();
    if (!supabase) return fail('PROVIDER_DISABLED');

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    });
    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: undefined };
  },

  async signOut(): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) {
      clientAuth.logout();
      return { ok: true, data: undefined };
    }

    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: undefined };
  },

  /**
   * 현재 브라우저 세션에 대해 src/lib/server/session.ts (verifySessionToken) 및
   * src/lib/server/auth.ts (requireActiveUser) 검증 결과를 반환
   */
  verifyStaticSession(): {
    rawToken: string | null;
    session: UserSession | null;
    guardStatus: 'PASS_200' | 'BLOCKED_401' | 'BLOCKED_403';
    guardMessage: string;
  } {
    const rawToken = clientAuth.getToken();
    try {
      const active = requireActiveUser(rawToken);
      const verified = verifySessionToken(rawToken);
      return {
        rawToken,
        session: verified ?? active,
        guardStatus: 'PASS_200',
        guardMessage: `requireActiveUser 통과 (상태: ${active.accountStatus}, 성인인증: ${active.adultVerified ? '완료' : '미인증'})`,
      };
    } catch (err: unknown) {
      if (err instanceof AuthException) {
        return {
          rawToken,
          session: null,
          guardStatus: err.status === 403 ? 'BLOCKED_403' : 'BLOCKED_401',
          guardMessage: `[${err.status} ${err.code}] ${err.message}`,
        };
      }
      return {
        rawToken,
        session: null,
        guardStatus: 'BLOCKED_401',
        guardMessage: '[401 UNAUTHORIZED] 활성 세션이 없습니다.',
      };
    }
  },

  /** 내 계정 조회 — 논리 계약 GET /users/me */
  async getMyAccount(): Promise<AuthResult<MyAccount | null>> {
    const supabase = getSupabase();
    if (!supabase) {
      try {
        const session = requireActiveUser(clientAuth.getToken());
        return { ok: true, data: sessionToMyAccount(session) };
      } catch (err: unknown) {
        return { ok: false, error: toAuthError(err) };
      }
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return fail('UNAUTHORIZED');

    const { data, error } = await supabase
      .from('users')
      .select(
        'id, nickname, full_name, birth_year, account_status, signup_completed_at, adult_verified, adult_verification_expires_at',
      )
      .eq('id', user.id)
      .maybeSingle();

    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: data ? mapAccount(data) : null };
  },

  /** 추가 정보 입력 완료 (소셜 로그인 또는 PENDING 계정 활성화) */
  async completeSignup(input: CompleteSignupInput): Promise<AuthResult> {
    const age = fullAge(input.birthDate);
    if (age === null) return fail('INVALID_INPUT');
    if (age < 19) return fail('UNDERAGE');
    if (!input.agreeTerms || !input.agreePrivacy || !input.adultSelfCheck) {
      return fail('CONSENT_REQUIRED');
    }

    const supabase = getSupabase();
    if (!supabase) {
      const session = clientAuth.getSession();
      if (!session) return fail('UNAUTHORIZED');
      const normalized = session.email.trim().toLowerCase();
      MOCK_USERS[normalized] = {
        userId: session.userId,
        authId: session.authId,
        email: normalized,
        nickname: input.fullName.trim(),
        accountStatus: 'ACTIVE',
        adultVerified: session.adultVerified,
      };
      clientAuth.login(normalized);
      return { ok: true, data: undefined };
    }

    const { error } = await supabase.rpc('complete_signup', {
      p_full_name: input.fullName.trim(),
      p_birth_date: input.birthDate,
      p_terms_version: input.agreeTerms ? TERMS_VERSION : null,
      p_privacy_version: input.agreePrivacy ? PRIVACY_VERSION : null,
      p_adult_self_check: input.adultSelfCheck,
    });
    if (error) return { ok: false, error: toAuthError(error) };
    return { ok: true, data: undefined };
  },
};
