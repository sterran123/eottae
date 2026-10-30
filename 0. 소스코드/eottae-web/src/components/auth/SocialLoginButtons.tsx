'use client';

// src/components/auth/SocialLoginButtons.tsx
// Google 로그인 버튼. 공급자 설정 전(OAUTH_PROVIDERS_ENABLED.google=false)에는 「준비 중」으로 비활성.
// (카카오 로그인은 일일 로그인 횟수 제한 이슈로 제외)

import { useState } from 'react';
import { OAUTH_PROVIDERS_ENABLED } from '@/lib/auth/config';
import { authService } from '@/lib/auth/auth-service';
import type { OAuthProvider } from '@/lib/auth/types';

const PROVIDERS: { id: OAuthProvider; label: string }[] = [
  { id: 'google', label: 'Google로 계속하기' },
];

function GoogleIcon() {
  return (
    <svg className="auth-google-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path className="g-blue" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path className="g-green" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path className="g-yellow" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
      <path className="g-red" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function SocialLoginButtons({ disabled }: { disabled?: boolean }) {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (provider: OAuthProvider) => {
    setError(null);
    setPending(provider);
    const res = await authService.signInWithOAuth(provider);
    if (!res.ok) {
      setError(res.error.message);
      setPending(null);
    }
  };

  return (
    <div className="auth-social">
      {PROVIDERS.map((p) => {
        const enabled = OAUTH_PROVIDERS_ENABLED[p.id] && !disabled;
        return (
          <button
            key={p.id}
            type="button"
            className={`auth-social-btn is-${p.id}`}
            disabled={!enabled || pending !== null}
            aria-describedby={!OAUTH_PROVIDERS_ENABLED[p.id] ? 'auth-social-soon' : undefined}
            onClick={() => void start(p.id)}
          >
            <GoogleIcon />
            <span>{pending === p.id ? '이동 중…' : p.label}</span>
            {!OAUTH_PROVIDERS_ENABLED[p.id] && <span className="auth-soon">준비 중</span>}
          </button>
        );
      })}
      {!OAUTH_PROVIDERS_ENABLED.google && (
        <p id="auth-social-soon" className="auth-field-help">
          Google 로그인은 준비 중이에요. 지금은 이메일로 가입·로그인해 주세요.
        </p>
      )}
      {error && (
        <p className="auth-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
