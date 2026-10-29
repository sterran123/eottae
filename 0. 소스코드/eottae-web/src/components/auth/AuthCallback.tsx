'use client';

// src/components/auth/AuthCallback.tsx
// MATCH-003: 이메일 인증 링크 / OAuth 복귀 및 정적 배포 세션 검증 콜백

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/client';
import { clientAuth } from '@/lib/auth/client-auth';
import { authService, consumeNextPath } from '@/lib/auth/auth-service';

type Phase = 'working' | 'confirmed-other-device' | 'static-verified' | 'error';

const VALID_OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

function parseOtpType(raw: string | null): EmailOtpType {
  if (raw && (VALID_OTP_TYPES as readonly string[]).includes(raw)) {
    return raw as EmailOtpType;
  }
  return 'signup';
}

export default function AuthCallback() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('working');
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      const session = clientAuth.getSession();
      if (session) {
        setPhase('static-verified');
      } else {
        setDetail('활성 세션이 없습니다. 로그인 또는 회원가입을 진행해 주세요.');
        setPhase('error');
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const providerError = params.get('error_description') ?? hash.get('error_description');
    const tokenHash = params.get('token_hash');
    const otpType = parseOtpType(params.get('type'));
    const hadCode = params.has('code');

    let cancelled = false;

    (async () => {
      if (providerError) {
        setDetail(/expired|invalid/i.test(providerError) ? '인증 링크가 만료되었거나 이미 사용되었어요.' : null);
        setPhase('error');
        return;
      }

      if (tokenHash) {
        const verified = await authService.verifyTokenHash(tokenHash, otpType);
        if (cancelled) return;
        if (!verified.ok) {
          setDetail(verified.error.message);
          setPhase('error');
          return;
        }
        if (!verified.data) {
          setPhase('confirmed-other-device');
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!data.session) {
        setPhase(hadCode ? 'confirmed-other-device' : 'error');
        return;
      }

      const me = await authService.getMyAccount();
      if (cancelled) return;

      if (me?.accountStatus === 'PENDING') {
        router.replace('/auth/complete');
      } else {
        router.replace(consumeNextPath());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (phase === 'working') {
    return (
      <p className="auth-desc" role="status">
        이메일 인증 및 세션 정보를 확인하고 있어요…
      </p>
    );
  }

  if (phase === 'confirmed-other-device' || phase === 'static-verified') {
    return (
      <div className="auth-done" role="status">
        <div className="auth-done-icon" aria-hidden="true">✓</div>
        <h2>세션 및 이메일 확인이 완료됐어요</h2>
        <p>로그인 화면에서 세션 검증 상태를 확인하거나 서비스를 이용해 보세요.</p>
        <Link className="btn primary" href="/auth/login">
          로그인 · 세션 검증 확인
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-done" role="alert">
      <div className="auth-done-icon is-error" aria-hidden="true">!</div>
      <h2>인증을 완료하지 못했어요</h2>
      <p>{detail ?? '잠시 후 다시 시도해 주세요.'}</p>
      <Link className="btn primary" href="/auth/login">
        로그인 화면으로
      </Link>
    </div>
  );
}
