'use client';

// src/components/auth/LoginForm.tsx
// MATCH-003: 이메일 로그인 + 세션 검증
// - Supabase 미설정 시: NOT_CONFIGURED 로 비활성화 (ADR-005 fail-closed)
// - 로그인 성공 후 public.users의 account_status (ACTIVE) 확인

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { authService, consumeNextPath, peekNextPath, rememberNextPath } from '@/lib/auth/auth-service';
import {
  clearDemoSession,
  loginDemo,
  readDemoSession,
  subscribeDemoSession,
  type DemoSession,
} from '@/lib/demo/demo-session';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { validateEmail } from '@/lib/auth/validation';
import { EmailSentPanel } from './SignupForm';
import SocialLoginButtons from './SocialLoginButtons';
import '@/components/demo/demo-flow.css';

export default function LoginForm() {
  const id = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const isConfigured = isSupabaseConfigured;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [showVerifyPanel, setShowVerifyPanel] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nextHref, setNextHref] = useState('/');
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    rememberNextPath(searchParams.get('next'));
    setNextHref(peekNextPath());
  }, [searchParams]);

  useEffect(() => {
    setDemoSession(readDemoSession());
    return subscribeDemoSession(() => setDemoSession(readDemoSession()));
  }, []);

  const disabled = submitting || !isConfigured;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setNeedsConfirm(false);

    if (!isConfigured) {
      setError('인증 환경변수가 설정되지 않아 로그인이 비활성화되어 있습니다.');
      return;
    }

    const emErr = validateEmail(email);
    if (emErr || !password) {
      setError(emErr ?? '비밀번호를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    const res = await authService.signInWithEmail(email, password);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error.message);
      setNeedsConfirm(res.error.code === 'EMAIL_NOT_CONFIRMED');
      return;
    }

    clearDemoSession();
    await auth.refresh();
    const myAcc = await authService.getMyAccount();
    if (myAcc?.accountStatus === 'PENDING') {
      router.replace('/auth/complete');
      return;
    }
    setInfo('로그인되었습니다.');
    router.replace(consumeNextPath());
  };

  const resendAndOpenVerify = async () => {
    const res = await authService.resendConfirmation(email);
    if (res.ok) {
      setShowVerifyPanel(true);
    } else {
      setInfo(res.error.message);
    }
  };

  if (showVerifyPanel && email.trim()) {
    return <EmailSentPanel email={email.trim()} />;
  }

  return (
    <>
      {!isConfigured && (
        <div className="auth-form-error auth-form-error--spaced" role="alert">
          인증 환경변수가 설정되지 않아 로그인 및 회원가입이 비활성화되어 있습니다 (ADR-005 fail-closed).
        </div>
      )}

      {auth.status === 'signed-out' && (
        <div className="demo-adult-block demo-login-panel" role="region" aria-label="데모 로그인">
          <h2>데모 로그인</h2>
          <p>실제 서버에는 접속하지 않아요. 이 브라우저에만 데모 세션이 남아요.</p>
          {demoSession ? (
            <>
              <p>
                {demoSession.nickname}(데모)로 로그인되어 있어요. 로그아웃하면 매칭·채팅·내 프로필이
                열리지 않아요.
              </p>
              <div className="demo-flow-actions">
                <Link className="btn primary" href={nextHref} onClick={() => consumeNextPath()}>
                  이어서 보기
                </Link>
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => {
                    clearDemoSession();
                    setInfo('데모 로그아웃했어요. 매칭·채팅·내 프로필은 열리지 않아요.');
                  }}
                >
                  데모 로그아웃
                </button>
              </div>
            </>
          ) : (
            <div className="demo-flow-actions">
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  const session = loginDemo();
                  if (!session) {
                    setError('이 브라우저에 데모 로그인을 저장하지 못했어요.');
                    return;
                  }
                  setInfo('데모로 로그인했어요. 이 브라우저에만 남아요.');
                  router.replace(consumeNextPath());
                }}
              >
                데모로 로그인
              </button>
            </div>
          )}
        </div>
      )}

      {auth.status === 'signed-in' && auth.account && (
        <div className="auth-session-box" role="status">
          <div className="auth-session-head">
            <span className="auth-session-badge">로그인됨 ({auth.account.accountStatus})</span>
            <strong>{auth.account.nickname || auth.account.fullName}</strong>
          </div>
          <dl className="auth-session-dl">
            <div>
              <dt>이메일</dt>
              <dd>{auth.account.email ?? '-'}</dd>
            </div>
            <div>
              <dt>계정 상태</dt>
              <dd>
                <code>{auth.account.accountStatus}</code>
              </dd>
            </div>
            <div>
              <dt>성인 확인(MATCH-004)</dt>
              <dd>{auth.account.adultVerified ? '검증 완료 (true)' : '미인증 (false)'}</dd>
            </div>
            {auth.account.birthYear && (
              <div>
                <dt>출생연도(ADR-002)</dt>
                <dd>{auth.account.birthYear}년생 (생년월일 원본 미저장)</dd>
              </div>
            )}
          </dl>
          <div className="auth-session-actions">
            <Link className="btn primary" href={nextHref} onClick={() => consumeNextPath()}>
              서비스로 이동
            </Link>
            <button
              type="button"
              className="btn outline"
              onClick={async () => {
                clearDemoSession();
                await authService.signOut();
                await auth.refresh();
                setInfo('로그아웃되었습니다.');
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      )}

      <form className="auth-form" noValidate onSubmit={onSubmit}>
        <div className="auth-field">
          <label htmlFor={`${id}-email`}>이메일</label>
          <input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            disabled={disabled}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor={`${id}-pw`}>비밀번호</label>
          <input
            id={`${id}-pw`}
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={disabled}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="auth-form-error" role="alert">
            {error}
          </p>
        )}
        {needsConfirm && (
          <button
            type="button"
            className="btn outline auth-inline-btn"
            onClick={() => void resendAndOpenVerify()}
          >
            인증 링크/번호 재발송하기
          </button>
        )}
        {info && (
          <p className="auth-field-help" role="status">
            {info}
          </p>
        )}

        <button type="submit" className="btn primary auth-submit" disabled={disabled}>
          {submitting ? '로그인 중…' : isConfigured ? '로그인' : '로그인 준비 중 (비활성화)'}
        </button>
      </form>

      <div className="auth-divider" role="separator">
        <span>또는</span>
      </div>
      <SocialLoginButtons disabled={disabled} />

      <p className="auth-switch">
        아직 회원이 아니신가요? <Link href="/auth/signup">회원가입 진행하기</Link>
      </p>
    </>
  );
}
