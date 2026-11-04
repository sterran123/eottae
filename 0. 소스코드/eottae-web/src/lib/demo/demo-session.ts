// 데모 로그인 세션. 이 브라우저 localStorage에만 둔다.
// Supabase 세션·성인 확인 기록은 읽거나 쓰지 않는다.
// 실계정 세션이 있으면 match-service가 이 키를 지운다.

const STORAGE_KEY = 'eottae_demo_session_v1';
export const DEMO_SESSION_EVENT = 'eottae-demo-session';
export const DEMO_SELF_ID = 'demo-self';
export const DEMO_SELF_NICKNAME = '시연 회원';

export type DemoSession = {
  userId: typeof DEMO_SELF_ID;
  nickname: string;
  loggedInAt: string;
};

function isSession(value: unknown): value is DemoSession {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  if (row.userId !== DEMO_SELF_ID) return false;
  if (row.nickname !== DEMO_SELF_NICKNAME) return false;
  if (typeof row.loggedInAt !== 'string') return false;
  return !Number.isNaN(Date.parse(row.loggedInAt));
}

export function readDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isSession(parsed)) return null;
    return {
      userId: DEMO_SELF_ID,
      nickname: DEMO_SELF_NICKNAME,
      loggedInAt: parsed.loggedInAt,
    };
  } catch {
    return null;
  }
}

export function isDemoLoggedIn(): boolean {
  return readDemoSession() !== null;
}

export function loginDemo(now = Date.now()): DemoSession | null {
  const existing = readDemoSession();
  if (existing) return existing;
  const session: DemoSession = {
    userId: DEMO_SELF_ID,
    nickname: DEMO_SELF_NICKNAME,
    loggedInAt: new Date(now).toISOString(),
  };
  if (typeof window === 'undefined') return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    return null;
  }
  window.dispatchEvent(new Event(DEMO_SESSION_EVENT));
  return session;
}

export function clearDemoSession(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(STORAGE_KEY) == null) return;
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(DEMO_SESSION_EVENT));
}

export function subscribeDemoSession(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    onChange();
  };
  window.addEventListener(DEMO_SESSION_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(DEMO_SESSION_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
