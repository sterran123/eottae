// 시연용 성인 확인 상태. 데모 모드의 이 브라우저(localStorage)에만 둔다.
// 생년월일·신분증·주민등록번호는 받지 않고 저장하지 않는다.
// 라이브 계정의 adult_verified / Supabase / BBaton 은 읽거나 쓰지 않는다.
// 통과와 저장은 NEXT_PUBLIC_DEMO_ADULT_BYPASS가 정확히 '1'일 때만 한다.
// GitHub Pages 빌드(deploy-pages.yml)와 next.config.mjs에는 이 변수를 넣지 않는다.

const STORAGE_KEY = 'eottae_demo_adult_v1';
export const DEMO_ADULT_EVENT = 'eottae-demo-adult';
export const DEMO_ADULT_TTL_MS = 24 * 60 * 60 * 1000;
/** 공개 배포의 기본값은 꺼짐. 로컬 시연 빌드에서만 '1'로 켠다. */
export const DEMO_ADULT_BYPASS = process.env.NEXT_PUBLIC_DEMO_ADULT_BYPASS === '1';
export const DEMO_ADULT_UNAVAILABLE_MESSAGE = '본인 확인이 연결되지 않아 열 수 없어요';

export type DemoAdultRecord = {
  kind: 'bbaton-demo';
  verifiedAt: string;
  expiresAt: string;
};

function isRecord(value: unknown): value is DemoAdultRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  if (row.kind !== 'bbaton-demo') return false;
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
    return { kind: 'bbaton-demo', verifiedAt: parsed.verifiedAt, expiresAt: parsed.expiresAt };
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

export function completeDemoAdult(now = Date.now()): DemoAdultRecord | null {
  if (!DEMO_ADULT_BYPASS) return null;
  const record: DemoAdultRecord = {
    kind: 'bbaton-demo',
    verifiedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DEMO_ADULT_TTL_MS).toISOString(),
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
