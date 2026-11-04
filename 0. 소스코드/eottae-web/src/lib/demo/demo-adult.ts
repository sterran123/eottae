// 시연용 성인 확인 상태. 데모 모드의 이 브라우저(localStorage)에만 둔다.
// 생년월일은 만 나이 판정(fullAge, 생일 지남)에만 쓰고 원본은 저장하지 않는다(ADR-002).
// 신분증·주민등록번호는 받지 않는다.
// 통과 기록은 시각과 「만 19세 이상 확인」 플래그만 남긴다.
// 라이브 계정의 adult_verified / Supabase / BBaton 은 읽거나 쓰지 않는다.
// 통과와 저장은 NEXT_PUBLIC_DEMO_ADULT_BYPASS가 정확히 '1'이고,
// 인자로 받은 만 나이가 MIN_SIGNUP_AGE 이상일 때만 한다.
// 목업 단계(DEC-11)의 GitHub Pages 빌드(deploy-pages.yml)는 이 값을 '1'로 넣는다.
// 시연 확인(생일 기준 만 19세)을 거치면 매칭·채팅 데모가 열린다.
// 실데이터 단계에서 그 값을 지워 fail-closed(ADR-002)로 되돌린다. next.config.mjs에는 넣지 않는다.

import { MIN_SIGNUP_AGE } from '@/lib/auth/config';
import { fullAge, todayInKorea } from '@/lib/auth/validation';

const STORAGE_KEY = 'eottae_demo_adult_v1';
export const DEMO_ADULT_EVENT = 'eottae-demo-adult';
export const DEMO_ADULT_TTL_MS = 24 * 60 * 60 * 1000;
/** 1900-01-01부터 계산되는 만 나이의 상한. 타임스탬프를 나이로 넘기는 우회를 막는다. */
const MAX_DEMO_ADULT_AGE = 200;
/** 목업 단계(DEC-11) 배포 빌드는 '1'. 그 값이 아니면 시연 확인을 열지 않는다. 실데이터 단계에서 끈다. */
export const DEMO_ADULT_BYPASS = process.env.NEXT_PUBLIC_DEMO_ADULT_BYPASS === '1';
export const DEMO_ADULT_UNAVAILABLE_MESSAGE = '본인 확인이 연결되지 않아 열 수 없어요';
export const DEMO_ADULT_UNDERAGE_MESSAGE = `만 ${MIN_SIGNUP_AGE}세 이상만 이용할 수 있어요`;

export type DemoAdultRecord = {
  kind: 'bbaton-demo';
  verifiedAt: string;
  expiresAt: string;
  /** 만 19세 이상 확인. 생년월일·만나이 숫자는 넣지 않는다. */
  minAgeConfirmed: true;
};

export type DemoAdultBirthJudgment =
  | { ok: true; age: number }
  | { ok: false; message: string };

function isAcceptedDemoAge(age: number): boolean {
  return Number.isInteger(age) && age >= MIN_SIGNUP_AGE && age <= MAX_DEMO_ADULT_AGE;
}

/**
 * 오늘(한국 날짜) 기준 만 나이. 생일 당일 포함은 fullAge와 같다.
 * 생년월일 문자열은 반환하지 않는다.
 */
export function judgeDemoAdultBirth(birthDate: string, today: string = todayInKorea()): DemoAdultBirthJudgment {
  const trimmed = birthDate.trim();
  if (!trimmed) return { ok: false, message: '생년월일을 입력해 주세요.' };
  if (trimmed < '1900-01-01' || trimmed > today) {
    return { ok: false, message: '생년월일을 다시 확인해 주세요.' };
  }
  const age = fullAge(trimmed, today);
  if (age === null || age < 0 || age > MAX_DEMO_ADULT_AGE) {
    return { ok: false, message: '생년월일을 다시 확인해 주세요.' };
  }
  if (age < MIN_SIGNUP_AGE) return { ok: false, message: DEMO_ADULT_UNDERAGE_MESSAGE };
  return { ok: true, age };
}

function isRecord(value: unknown): value is DemoAdultRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  if (row.kind !== 'bbaton-demo') return false;
  if (row.minAgeConfirmed !== true) return false;
  if (typeof row.verifiedAt !== 'string' || typeof row.expiresAt !== 'string') return false;
  return !Number.isNaN(Date.parse(row.verifiedAt)) && !Number.isNaN(Date.parse(row.expiresAt));
}

export function readDemoAdult(): DemoAdultRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    return {
      kind: 'bbaton-demo',
      verifiedAt: parsed.verifiedAt,
      expiresAt: parsed.expiresAt,
      minAgeConfirmed: true,
    };
  } catch {
    return null;
  }
}

export function isDemoAdultActive(now = Date.now()): boolean {
  if (!DEMO_ADULT_BYPASS) return false;
  const record = readDemoAdult();
  if (!record) return false;
  return Date.parse(record.expiresAt) > now;
}

/** 만 나이가 기준 이상일 때만 시각 기록을 남긴다. 생년월일은 받지 않는다. */
export function completeDemoAdult(age: number, now = Date.now()): DemoAdultRecord | null {
  if (!DEMO_ADULT_BYPASS) return null;
  if (!isAcceptedDemoAge(age)) return null;
  const record: DemoAdultRecord = {
    kind: 'bbaton-demo',
    verifiedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DEMO_ADULT_TTL_MS).toISOString(),
    minAgeConfirmed: true,
  };
  if (typeof window === 'undefined') return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    return null;
  }
  window.dispatchEvent(new Event(DEMO_ADULT_EVENT));
  return record;
}

export function clearDemoAdult(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(DEMO_ADULT_EVENT));
}

export function subscribeDemoAdult(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    onChange();
  };
  window.addEventListener(DEMO_ADULT_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(DEMO_ADULT_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function formatDemoWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '알 수 없음';
  const text = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return `${text} (한국 시간)`;
}
