'use client';

// src/components/auth/LoginForm.tsx
// MATCH-003: 이메일 로그인 + 세션 검증(src/lib/server/auth.ts requireActiveUser, session.ts verifySessionToken)
// 정적 배포(GitHub Pages) 화면에서 회원가입한 계정 로그인과 4가지 계정 상태(ACTIVE/미인증/정지 403/탈퇴 403) 검증을 바로 확인할 수 있다.

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { authService, consumeNextPath, rememberNextPath } from '@/lib/auth/auth-service';
import { useAuth } from '@/lib/auth/use-auth';
import { validateEmail } from '@/lib/auth/validation';
import { EmailSentPanel } from './SignupForm';
import SocialLoginButtons from './SocialLoginButtons';

const DEMO_ACCOUNTS = [
  { email: 'demo@eottae.kr', label: '활성 · 성인인증 완료 (200)', desc: 'ACTIVE / adultVerified: true' },
  { email: 'user@eottae.kr', label: '활성 · 성인 미인증 (200)', desc: 'ACTIVE / adultVerified: false' },
  { email: 'suspended@eottae.kr', label: '정지 계정 차단 (403)', desc: 'SUSPENDED → 403 Forbidden' },
  { email: 'deleted@eottae.kr', label: '탈퇴 계정 차단 (403)', desc: 'DELETED → 403 Forbidden' },
] as const;

export default function LoginForm() {
  const id = useId();
  const searchParams = useSearchParams();
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [showVerifyPanel, setShowVerifyPanel] = useState(false);
  const [verifyOtpCode, setVerifyOtpCode] = useState<string | undefined>(undefined);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    rememberNextPath(searchParams.get('next'));
  }, [searchParams]);

  const disabled = submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setNeedsConfirm(false);

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

    await auth.refresh();
    setInfo('로그인 및 세션 서명 검증(requireActiveUser)이 완료되었어요.');
  };

  const quickTestAccount = async (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('demo1234');
    setError(null);
    setInfo(null);
    setNeedsConfirm(false);

    const res = await authService.signInWithEmail(targetEmail, 'demo1234');
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    await auth.refresh();
    setInfo(`${targetEmail} 세션이 발급되고 requireActiveUser 검증을 통과했어요.`);
  };

  const resendAndOpenVerify = async () => {
    const res = await authService.resendConfirmation(email);
    if (res.ok) {
      setVerifyOtpCode(res.data.demoOtpCode);
      setShowVerifyPanel(true);
    } else {
      setInfo(res.error.message);
    }
  };

  if (showVerifyPanel && email.trim()) {
    return <EmailSentPanel email={email.trim()} initialDemoOtp={verifyOtpCode} />;
  }

  const verification = authService.verifyStaticSession();

  return (
    <>
      {auth.status === 'signed-in' && auth.account && (
        <div className="auth-session-box" role="status">
          <div className="auth-session-head">
            <span className="auth-session-badge">세션 검증 PASS (200)</span>
            <strong>{auth.account.nickname || auth.account.fullName}</strong>
          </div>
          <dl className="auth-session-dl">
            <div>
              <dt>이메일</dt>
              <dd>{auth.account.email ?? auth.session?.email ?? '-'}</dd>
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
            <div>
              <dt>가드 판정</dt>
              <dd>{verification.guardMessage}</dd>
            </div>
          </dl>
          <div className="auth-session-actions">
            <Link className="btn primary" href={consumeNextPath()}>
              서비스로 이동
            </Link>
            <button
              type="button"
              className="btn outline"
              onClick={async () => {
                await authService.signOut();
                await auth.refresh();
                setInfo('로그아웃되어 세션 토큰이 즉시 파기되었어요.');
              }}
            >
              로그아웃 (세션 파기)
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
            인증번호 재발급받고 이메일 확인하기
          </button>
        )}
        {info && (
          <p className="auth-field-help" role="status">
            {info}
          </p>
        )}

        <button type="submit" className="btn primary auth-submit" disabled={disabled}>
          {submitting ? '세션 검증 중…' : '로그인 · 세션 검증'}
        </button>
      </form>

      <div className="auth-divider" role="separator">
        <span>또는</span>
      </div>
      <SocialLoginButtons disabled={disabled} />

      <div className="auth-preset-box">
        <p className="auth-preset-title">
          <b>[DEMO]</b> <code>src/lib/server/auth.ts</code> 세션·계정 상태 즉시 검증
        </p>
        <div className="auth-preset-grid">
          {DEMO_ACCOUNTS.map((item) => (
            <button
              key={item.email}
              type="button"
              className="auth-preset-btn"
              onClick={() => void quickTestAccount(item.email)}
            >
              <strong>{item.label}</strong>
              <span>{item.email}</span>
              <small>{item.desc}</small>
            </button>
          ))}
        </div>
      </div>

      <p className="auth-switch">
        아직 회원이 아니신가요? <Link href="/auth/signup">회원가입 진행하기</Link>
      </p>
    </>
  );
}
