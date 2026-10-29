// src/lib/auth/client-auth.ts
// ADR-005 준수: Supabase Auth를 사용하며 자체 세션 토큰을 생성하거나 localStorage에 저장하지 않습니다.

export const clientAuth = {
  getToken(): string | null {
    return null;
  },
  getSession() {
    return null;
  },
  login() {
    return { success: false, error: { code: 'NOT_CONFIGURED', message: 'ADR-005: Supabase Auth를 사용해 주세요.' } };
  },
  logout() {
    // no-op
  },
};
