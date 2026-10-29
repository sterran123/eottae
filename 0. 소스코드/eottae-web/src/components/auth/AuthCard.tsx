// src/components/auth/AuthCard.tsx
// 인증 화면 공통 카드 레이아웃 + 정적 배포(GitHub Pages) 세션 검증 모드 안내 (RULES 7 DEMO 라벨 준수)

import { isSupabaseConfigured } from '@/lib/supabase/client';

export function DemoModeNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <aside className="warn auth-demo">
      <strong>DEMO · 정적 배포 세션 검증 모드</strong>
      <p>
        현재 GitHub Pages 정적 환경이므로 브라우저 세션 서명·검증 모듈(
        <code>src/lib/server/auth.ts</code> · <code>session.ts</code>)로 회원가입 → 이메일 인증번호 확인 →
        로그인 및 계정 상태(ACTIVE / 403 차단) 검증이 동작합니다.
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
        <DemoModeNotice />
        {children}
      </div>
    </section>
  );
}
