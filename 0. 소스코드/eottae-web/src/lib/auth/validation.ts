// src/lib/auth/validation.ts
// MATCH-003: 회원가입 입력 검증 (UI 편의용 — 최종 판정은 DB private.validate_signup, ADR-002)

import { MIN_SIGNUP_AGE } from './config';

export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 한국 시간 기준 오늘 (YYYY-MM-DD) */
export function todayInKorea(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 만 나이. 형식이 잘못되면 null. */
export function fullAge(birthDate: string, today: string = todayInKorea()): number | null {
  const b = DATE_RE.exec(birthDate);
  const t = DATE_RE.exec(today);
  if (!b || !t) return null;

  const [by, bm, bd] = [Number(b[1]), Number(b[2]), Number(b[3])];
  const [ty, tm, td] = [Number(t[1]), Number(t[2]), Number(t[3])];

  // 존재하지 않는 날짜(2월 30일 등) 거부
  const probe = new Date(Date.UTC(by, bm - 1, bd));
  if (probe.getUTCFullYear() !== by || probe.getUTCMonth() !== bm - 1 || probe.getUTCDate() !== bd) {
    return null;
  }

  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return '이메일을 입력해 주세요.';
  if (!EMAIL_RE.test(v)) return '이메일 형식이 올바르지 않아요.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return '비밀번호를 입력해 주세요.';
  if (password.length < PASSWORD_MIN_LENGTH) return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 해요.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return '영문과 숫자를 모두 포함해 주세요.';
  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (!confirm) return '비밀번호를 한 번 더 입력해 주세요.';
  if (password !== confirm) return '비밀번호가 일치하지 않아요.';
  return null;
}

export function validateFullName(name: string): string | null {
  const v = name.trim();
  if (!v) return '이름을 입력해 주세요.';
  if (v.length > 50) return '이름은 50자 이하로 입력해 주세요.';
  return null;
}

export function validateBirthDate(birthDate: string): string | null {
  if (!birthDate) return '생년월일을 입력해 주세요.';
  if (birthDate < '1900-01-01' || birthDate > todayInKorea()) return '생년월일을 다시 확인해 주세요.';
  const age = fullAge(birthDate);
  if (age === null) return '생년월일을 다시 확인해 주세요.';
  if (age < MIN_SIGNUP_AGE) return `만 ${MIN_SIGNUP_AGE}세 이상만 가입할 수 있어요.`;
  return null;
}

/** 로그인 후 이동 경로 — 같은 사이트 내부 경로만 허용 (오픈 리다이렉트 방지) */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/';
  if (next.startsWith('/auth/')) return '/';
  return next;
}

