// src/components/auth/AuthCard.tsx
// 인증 화면 공통 카드 레이아웃 + 정적 배포(GitHub Pages) 세션 검증 모드 안내 (RULES 7 DEMO 라벨 준수)

import { isSupabaseConfigured } from '@/lib/supabase/client';

export function NotConfiguredNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <aside className="warn auth-demo" role="alert">
      <strong>인증 서비스 안내</strong>
      <p>
        인증 환경변수(<code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>)가 설정되지 않아 가입 및 로그인이 비활성화되어 있습니다 (ADR-005 fail-closed).
      </p>
    </aside>
  );
}

export default function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="shell auth-page">
      <div className="auth-card">
        <span className="auth-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p className="auth-desc">{description}</p>}
        <NotConfiguredNotice />
        {children}
      </div>
    </section>
  );
}
