'use client';

// src/components/auth/CompleteSignupForm.tsx
// MATCH-003: 소셜 첫 로그인(PENDING) 사용자의 가입 완료 — 약관 동의·이름·생년월일
// 최종 판정은 DB rpc('complete_signup')가 한다. 성공 시 ACTIVE.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authService, consumeNextPath } from '@/lib/auth/auth-service';
import { useAuth } from '@/lib/auth/use-auth';
import ConsentFields, {
  EMPTY_PROFILE_CONSENT,
  validateProfileConsent,
  type ProfileConsentErrors,
  type ProfileConsentValues,
} from './ConsentFields';

export default function CompleteSignupForm() {
  const router = useRouter();
  const auth = useAuth();
  const [values, setValues] = useState<ProfileConsentValues>(EMPTY_PROFILE_CONSENT);
  const [errors, setErrors] = useState<ProfileConsentErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 이미 가입이 끝난 계정은 이 화면이 필요 없다
  useEffect(() => {
    if (auth.status === 'signed-in' && auth.account && auth.account.accountStatus !== 'PENDING') {
      router.replace(consumeNextPath());
    }
  }, [auth.status, auth.account, router]);

  if (auth.status === 'loading') {
    return (
      <p className="auth-desc" role="status">
        계정 정보를 확인하고 있어요…
      </p>
    );
  }

  if (auth.status !== 'signed-in') {
    return (
      <p className="auth-desc">
        먼저 로그인해 주세요. <Link href="/auth/login">로그인하기</Link>
      </p>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!auth.account?.email) {
      setFormError('인증된 계정 이메일을 확인할 수 없습니다. 다시 로그인해 주세요.');
      return;
    }
    const errs = validateProfileConsent(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError('입력한 내용을 확인해 주세요.');
      return;
    }

    setSubmitting(true);
    const res = await authService.completeSignup(values);
    setSubmitting(false);

    if (!res.ok) {
      if (res.error.code === 'SIGNUP_ALREADY_COMPLETED') {
        router.replace(consumeNextPath());
        return;
      }
      setFormError(res.error.message);
      return;
    }

    await auth.refresh();
    router.replace(consumeNextPath());
  };

  return (
    <form className="auth-form" noValidate onSubmit={onSubmit}>
      {auth.account?.email ? (
        <div className="auth-email-confirm-box" role="status">
          <span className="auth-email-confirm-label">현재 인증된 계정</span>
          <strong className="auth-email-confirm-addr">{auth.account.email}</strong>
          <p className="auth-email-confirm-desc">위 계정으로 추가 정보를 등록하고 가입을 완료합니다.</p>
        </div>
      ) : (
        <p className="auth-form-error" role="alert">
          계정 이메일 정보를 확인할 수 없습니다. 다시 로그인해 주세요.
        </p>
      )}

      {auth.account?.email && (
        <ConsentFields
          values={values}
          errors={errors}
          disabled={submitting}
          onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        />
      )}

      {formError && (
        <p className="auth-form-error" role="alert">
          {formError}
        </p>
      )}

      <button
        type="submit"
        className="btn primary auth-submit"
        disabled={submitting || !auth.account?.email}
      >
        {submitting ? '처리 중…' : '가입 완료'}
      </button>

      <button
        type="button"
        className="auth-text-btn"
        onClick={() => void authService.signOut().then(() => router.replace('/auth/login'))}
      >
        다른 계정으로 로그인 (로그아웃)
      </button>
    </form>
  );
}

