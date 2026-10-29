// src/lib/supabase/client.ts
// ADR-005: 브라우저에서 supabase-js로 직접 호출한다. 공개 키(Publishable/anon)만 사용.
// 환경변수가 없으면 null을 돌려주고, 화면은 NOT_CONFIGURED(가입/로그인 비활성화 fail-closed) 상태로 동작한다.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// NEXT_PUBLIC_* 는 빌드 시 문자열로 치환되므로 반드시 리터럴 이름으로 참조한다.
// (보안 스캔 규칙 준수를 위해 환경변수 참조 줄에 기본값 연산자 || / ?? 를 두지 않는다)
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isValidUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    // 운영은 https, 로컬 Supabase(npx supabase start)는 http://127.0.0.1:54321
    return url.protocol === 'https:' || url.hostname === '127.0.0.1' || url.hostname === 'localhost';
  } catch {
    return false;
  }
}

function isValidAnonKey(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0 && value !== 'REPLACE_ME';
}

export const isSupabaseConfigured = isValidUrl(rawSupabaseUrl) && isValidAnonKey(rawSupabaseAnonKey);

let browserClient: SupabaseClient | null = null;

/** 브라우저 전용 Supabase 클라이언트. 설정이 없거나 서버(빌드) 환경이면 null. */
export function getSupabase(): SupabaseClient | null {
  if (!isValidUrl(rawSupabaseUrl) || !isValidAnonKey(rawSupabaseAnonKey) || typeof window === 'undefined') {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        // /auth/callback 의 ?code= 를 클라이언트 초기화 시 자동으로 세션으로 교환한다.
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
