'use client';

// src/components/auth/AuthCallback.tsx
// MATCH-003: 이메일 인증 링크 / PKCE OAuth 복귀 콜백 (ADR-005)
// - Supabase 미설정 시: NOT_CONFIGURED 로 즉시 에러 표시 (ADR-005 fail-closed)
// - detectSessionInUrl: false 및 모듈 캐시 1회 PKCE 교환/token_hash 검증 후 계정 상태 통합 판정

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/client';
import { authService, consumeNextPath } from '@/lib/auth/auth-service';

type Phase = 'working' | 'confirmed-other-device' | 'error';

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

// React 18 Strict Mode 이중 마운트로 인한 PKCE code 중복 교환 방지용 모듈 캐시
let codeExchange: Promise<{ error: { message: string } | null }> | null = null;

export default function AuthCallback() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('working');
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setDetail('인증 환경변수가 설정되지 않아 콜백 처리를 진행할 수 없습니다 (ADR-005 fail-closed).');
      setPhase('error');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const providerError = params.get('error_description') ?? hash.get('error_description');
    const tokenHash = params.get('token_hash');
    const code = params.get('code');
    const otpType = parseOtpType(params.get('type'));

    let cancelled = false;

    (async () => {
      if (providerError) {
        setDetail('인증 링크가 만료되었거나 이미 사용되었어요.');
        setPhase('error');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      // 1) PKCE 인증 코드 교환 처리 (모듈 스코프 1회 보장)
      if (code) {
        codeExchange ??= supabase.auth.exchangeCodeForSession(code).then(({ error }) => ({
          error: error ? { message: error.message } : null,
        }));
        const exchanged = await codeExchange;
        if (cancelled) return;
        if (exchanged.error) {
          setDetail('인증 링크가 만료되었거나 이미 사용되었어요.');
          setPhase('error');
          return;
        }
      } else if (tokenHash) {
        // 기존 세션이 있는 상태에서 다른 이메일 인증 링크를 연 경우 세션 분리
        if (session) {
          await supabase.auth.signOut();
        }
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

      // 2) 계정 상태 통합 판정 (SUSPENDED·DELETED·조회 실패 시 signOut 후 에러)
      const gateRes = await authService.assertAccountAccess();
      if (cancelled) return;

      if (!gateRes.ok) {
        setDetail(gateRes.error.message);
        setPhase('error');
        return;
      }

      if (gateRes.data.accountStatus === 'PENDING') {
        router.replace('/auth/complete');
      } else if (gateRes.data.accountStatus === 'ACTIVE') {
        router.replace(consumeNextPath());
      } else {
        await supabase.auth.signOut();
        setDetail('이용할 수 없는 계정 상태입니다.');
        setPhase('error');
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

  if (phase === 'confirmed-other-device') {
    return (
      <div className="auth-done" role="status">
        <div className="auth-done-icon" aria-hidden="true">✓</div>
        <h2>이메일 확인이 완료됐어요</h2>
        <p>인증이 완료되었습니다. 로그인 화면에서 로그인해 주세요.</p>
        <Link className="btn primary" href="/auth/login">
          로그인 화면으로
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
