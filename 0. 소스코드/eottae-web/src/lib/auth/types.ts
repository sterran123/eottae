// src/lib/auth/types.ts
// MATCH-003: 인증, 세션, 계정 상태 관련 DTO 및 타입 정의 (ADR-005 Supabase Auth 기반)

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING';

export type OAuthProvider = 'google';

export interface UserSession {
  userId: string;
  authId: string;
  email: string;
  nickname: string;
  accountStatus: AccountStatus;
  adultVerified: boolean;
  issuedAt: number;   // UNIX timestamp (ms)
  expiresAt: number;  // UNIX timestamp (ms)
}

export interface LoginCredentials {
  email: string;
  password?: string;
  provider?: 'email' | 'google' | 'demo';
}

export type AuthErrorCode =
  | 'NOT_CONFIGURED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'INVALID_OTP'
  | 'WEAK_PASSWORD'
  | 'RATE_LIMITED'
  | 'UNDERAGE'
  | 'INVALID_INPUT'
  | 'CONSENT_REQUIRED'
  | 'SIGNUP_ALREADY_COMPLETED'
  | 'SESSION_EXPIRED'
  | 'SESSION_INVALID'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DELETED'
  | 'ACCOUNT_PENDING'
  | 'PROVIDER_DISABLED'
  | 'UNAUTHORIZED'
  | 'NETWORK'
  | 'UNKNOWN';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  session?: UserSession;
  error?: AuthError;
}

export interface UserProfileResponse {
  userId: string;
  nickname: string;
  accountStatus: AccountStatus;
  adultVerified: boolean;
}

/** public.users 또는 정적 세션에서 조회한 내 계정 정보 */
export interface MyAccount {
  id: string;
  email?: string;
  nickname: string | null;
  fullName: string | null;
  birthYear: number | null;
  accountStatus: AccountStatus;
  signupCompletedAt: string | null;
  adultVerified: boolean;
  adultVerificationExpiresAt: string | null;
}

/** 이메일 회원가입 폼 입력 */
export interface SignupInput {
  email: string;
  password: string;
  fullName: string;
  /** YYYY-MM-DD. 만 19세 판정 후 출생연도(birthYear)만 보관(ADR-002). */
  birthDate: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  adultSelfCheck: boolean;
}

/** Google 로그인 사용자의 가입 완료 입력 */
export type CompleteSignupInput = Omit<SignupInput, 'email' | 'password'>;

export type AuthResult<T = void> = { ok: true; data: T } | { ok: false; error: AuthError };
