// src/lib/auth/types.ts
// MATCH-003: 인증, 세션, 계정 상태 관련 DTO 및 타입 정의

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING';

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
  provider?: 'email' | 'kakao' | 'demo';
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'SESSION_INVALID'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DELETED'
  | 'ACCOUNT_PENDING'
  | 'UNAUTHORIZED';

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
