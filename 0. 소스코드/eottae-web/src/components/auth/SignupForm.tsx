'use client';

// src/components/auth/SignupForm.tsx
// MATCH-003: 이메일 회원가입 → 이메일 인증번호 확인 → 세션 활성화
// 정적 배포(GitHub Pages)에서는 발급된 6자리 DEMO 인증번호를 화면에서 확인·입력하여 즉시 세션 검증까지 마칠 수 있다.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { authService } from '@/lib/auth/auth-service';
import { validateEmail, validatePassword, validatePasswordConfirm, PASSWORD_MIN_LENGTH } from '@/lib/auth/validation';
import ConsentFields, {
  EMPTY_PROFILE_CONSENT,
  validateProfileConsent,
  type ProfileConsentErrors,
  type ProfileConsentValues,
} from './ConsentFields';
import SocialLoginButtons from './SocialLoginButtons';

type AccountErrors = { email?: string; password?: string; passwordConfirm?: string };

const RESEND_COOLDOWN_SEC = 30;

export default function SignupForm() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [profile, setProfile] = useState<ProfileConsentValues>(EMPTY_PROFILE_CONSENT);

  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [profileErrors, setProfileErrors] = useState<ProfileConsentErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | undefined>(undefined);

  const disabled = submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const aErr: AccountErrors = {};
    const em = validateEmail(email);
    if (em) aErr.email = em;
    const pw = validatePassword(password);
    if (pw) aErr.password = pw;
    const pc = validatePasswordConfirm(password, passwordConfirm);
    if (pc) aErr.passwordConfirm = pc;
    const pErr = validateProfileConsent(profile);

    setAccountErrors(aErr);
    setProfileErrors(pErr);
    if (Object.keys(aErr).length || Object.keys(pErr).length) {
      setFormError('입력한 내용을 확인해 주세요.');
      return;
    }

    setSubmitting(true);
    const res = await authService.signUpWithEmail({ email, password, ...profile });
    setSubmitting(false);

    if (!res.ok) {
      setFormError(res.error.message);
      return;
    }
    setDemoOtp(res.data.demoOtpCode);
    setSentTo(email.trim());
  };

  if (sentTo) return <EmailSentPanel email={sentTo} initialDemoOtp={demoOtp} />;

  return (
    <>
      <SocialLoginButtons disabled={disabled} />
      <div className="auth-divider" role="separator">
        <span>또는 이메일로 가입</span>
      </div>

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
            aria-invalid={Boolean(accountErrors.email)}
            aria-describedby={`${id}-email-help${accountErrors.email ? ` ${id}-email-err` : ''}`}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p id={`${id}-email-help`} className="auth-field-help">
            가입 후 이메일 인증(링크 또는 6자리 인증번호)을 완료하면 계정이 활성화(`ACTIVE`)돼요.
          </p>
          {accountErrors.email && (
            <p id={`${id}-email-err`} className="auth-field-error" role="alert">
              {accountErrors.email}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor={`${id}-pw`}>비밀번호</label>
          <input
            id={`${id}-pw`}
            type="password"
            autoComplete="new-password"
            value={password}
            disabled={disabled}
            aria-invalid={Boolean(accountErrors.password)}
            aria-describedby={`${id}-pw-help${accountErrors.password ? ` ${id}-pw-err` : ''}`}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p id={`${id}-pw-help`} className="auth-field-help">
            영문·숫자 포함 {PASSWORD_MIN_LENGTH}자 이상
          </p>
          {accountErrors.password && (
            <p id={`${id}-pw-err`} className="auth-field-error" role="alert">
              {accountErrors.password}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor={`${id}-pw2`}>비밀번호 확인</label>
          <input
            id={`${id}-pw2`}
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            disabled={disabled}
            aria-invalid={Boolean(accountErrors.passwordConfirm)}
            aria-describedby={accountErrors.passwordConfirm ? `${id}-pw2-err` : undefined}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          {accountErrors.passwordConfirm && (
            <p id={`${id}-pw2-err`} className="auth-field-error" role="alert">
              {accountErrors.passwordConfirm}
            </p>
          )}
        </div>

        <ConsentFields
          values={profile}
          errors={profileErrors}
          disabled={disabled}
          onChange={(patch) => setProfile((prev) => ({ ...prev, ...patch }))}
        />

        {formError && (
          <p className="auth-form-error" role="alert">
            {formError}
          </p>
        )}

        <button type="submit" className="btn primary auth-submit" disabled={disabled}>
          {submitting ? '인증 준비 중…' : '이메일 확인하고 가입하기'}
        </button>
      </form>

      <p className="auth-switch">
        이미 계정이 있나요? <Link href="/auth/login">로그인 · 세션 검증</Link>
      </p>
    </>
  );
}

export function EmailSentPanel({ email, initialDemoOtp }: { email: string; initialDemoOtp?: string }) {
  const id = useId();
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | undefined>(initialDemoOtp);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setMessage(null);

    if (!otp.trim()) {
      setOtpError('6자리 인증번호를 입력해 주세요.');
      return;
    }

    setVerifying(true);
    const res = await authService.verifyEmailOtp(email, otp);
    setVerifying(false);

    if (!res.ok) {
      setOtpError(res.error.message);
      return;
    }

    // 인증 완료 후 로그인/세션 검증 화면으로 이동하여 활성 세션을 확인
    router.replace('/auth/login');
  };

  const resend = async () => {
    setMessage(null);
    setOtpError(null);
    const res = await authService.resendConfirmation(email);
    if (res.ok) {
      if (res.data.demoOtpCode) setDemoOtp(res.data.demoOtpCode);
      setMessage('인증번호를 새로 발급했어요.');
    } else {
      setMessage(res.error.message);
    }
    setCooldown(RESEND_COOLDOWN_SEC);
  };

  return (
    <div className="auth-done" role="status">
      <div className="auth-done-icon" aria-hidden="true">✉</div>
      <h2>이메일 인증을 완료해 주세요</h2>
      <p>
        <b>{email}</b> 계정의 이메일 확인 단계예요.
        <br />
        아래에 <b>6자리 인증번호</b>를 입력하면 계정이 <code>ACTIVE</code>로 전환되고 세션이 발급돼요.
      </p>

      {demoOtp && (
        <div className="auth-demo-otp">
          <span>
            <b>[DEMO · 정적 배포 인증번호]</b> 발급 코드: <code>{demoOtp}</code>
          </span>
          <button
            type="button"
            className="btn outline auth-otp-fill"
            onClick={() => {
              setOtp(demoOtp);
              setOtpError(null);
            }}
          >
            인증번호 자동 입력
          </button>
        </div>
      )}

      <form className="auth-otp-form" noValidate onSubmit={onVerifyOtp}>
        <label htmlFor={`${id}-otp`} className="auth-otp-label">
          6자리 인증번호 입력
        </label>
        <div className="auth-otp-row">
          <input
            id={`${id}-otp`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6자리 숫자"
            maxLength={10}
            value={otp}
            disabled={verifying}
            aria-invalid={Boolean(otpError)}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button type="submit" className="btn primary" disabled={verifying || !otp.trim()}>
            {verifying ? '확인 중…' : '인증 완료'}
          </button>
        </div>
        {otpError && (
          <p className="auth-field-error" role="alert">
            {otpError}
          </p>
        )}
      </form>

      <button type="button" className="btn outline" disabled={cooldown > 0} onClick={() => void resend()}>
        {cooldown > 0 ? `인증번호 재발급 (${cooldown}초)` : '인증번호 재발급'}
      </button>
      {message && (
        <p className="auth-field-help" role="status">
          {message}
        </p>
      )}
      <p className="auth-switch">
        <Link href="/auth/login">로그인 화면으로</Link>
      </p>
    </div>
  );
}
