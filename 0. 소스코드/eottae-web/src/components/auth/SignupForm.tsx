'use client';

// src/components/auth/SignupForm.tsx
// MATCH-003: 이메일 회원가입 → 이메일 확인 → 계정 활성화 (ADR-005)
// - Supabase 미설정 시: NOT_CONFIGURED 로 가입 비활성화 (ADR-005 fail-closed)
// - 가입 시 생년월일 원본은 만 19세 판정에만 사용하고 저장하지 않음 (ADR-002)

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { authService } from '@/lib/auth/auth-service';
import { getSupabase } from '@/lib/supabase/client';
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
  const isConfigured = Boolean(getSupabase());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [profile, setProfile] = useState<ProfileConsentValues>(EMPTY_PROFILE_CONSENT);

  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [profileErrors, setProfileErrors] = useState<ProfileConsentErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const disabled = submitting || !isConfigured;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isConfigured) {
      setFormError('인증 환경변수가 설정되지 않아 회원가입이 비활성화되어 있습니다.');
      return;
    }

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
    setSentTo(email.trim());
  };

  if (sentTo) return <EmailSentPanel email={sentTo} />;

  return (
    <>
      {!isConfigured && (
        <div className="auth-form-error" role="alert" style={{ marginBottom: 16 }}>
          인증 환경변수가 설정되지 않아 회원가입 및 로그인이 비활성화되어 있습니다 (ADR-005 fail-closed).
        </div>
      )}

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
            가입 후 이메일 인증을 완료하면 계정이 활성화(<code>ACTIVE</code>)돼요.
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
          {submitting ? '인증 준비 중…' : isConfigured ? '이메일 확인하고 가입하기' : '회원가입 준비 중 (비활성화)'}
        </button>
      </form>

      <p className="auth-switch">
        이미 계정이 있나요? <Link href="/auth/login">로그인하기</Link>
      </p>
    </>
  );
}

export function EmailSentPanel({ email }: { email: string }) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
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

    // 인증 완료 후 로그인 화면으로 이동
    router.replace('/auth/login');
  };

  const resend = async () => {
    setMessage(null);
    setOtpError(null);
    const res = await authService.resendConfirmation(email);
    if (res.ok) {
      setMessage('인증 메일을 새로 발송했어요.');
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
        <b>{email}</b>(으)로 인증 안내를 발송했어요.
        <br />
        메일에 포함된 링크를 누르거나, 아래에 <b>6자리 인증번호</b>를 입력하면 계정이 활성화(<code>ACTIVE</code>)돼요.
      </p>

      <form className="auth-form auth-otp-form" noValidate onSubmit={onVerifyOtp}>
        <div className="auth-field">
          <label htmlFor="auth-otp-input">6자리 인증번호</label>
          <input
            id="auth-otp-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="예: 123456"
            value={otp}
            disabled={verifying}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>

        {otpError && (
          <p className="auth-field-error" role="alert">
            {otpError}
          </p>
        )}

        <button type="submit" className="btn primary auth-submit" disabled={verifying}>
          {verifying ? '인증번호 확인 중…' : '인증번호 확인'}
        </button>
      </form>

      <div className="auth-done-actions">
        <button
          type="button"
          className="btn outline"
          disabled={cooldown > 0}
          onClick={() => void resend()}
        >
          {cooldown > 0 ? `재발송 대기 (${cooldown}초)` : '인증 메일 다시 보내기'}
        </button>
        <Link className="btn outline" href="/auth/login">
          로그인 화면으로
        </Link>
      </div>

      {message && (
        <p className="auth-field-help" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
