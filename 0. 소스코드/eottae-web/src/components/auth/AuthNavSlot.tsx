'use client';

// src/components/auth/AuthNavSlot.tsx
// 헤더 내비의 로그인·세션 상태 표시 슬롯

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MotifIcon } from '@/components/shared/motif-icon';
import { authService } from '@/lib/auth/auth-service';
import { useAuth } from '@/lib/auth/use-auth';

export default function AuthNavSlot() {
  const auth = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  if (auth.status === 'loading') {
    return (
      <span className="login-slot is-ready" aria-hidden="true">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </span>
    );
  }

  if (auth.status === 'signed-out') {
    return (
      <Link className="login-slot is-ready" href="/auth/login">
        <MotifIcon name="lock" size={14} />
        로그인
      </Link>
    );
  }

  if (auth.needsSignupCompletion) {
    return (
      <Link className="login-slot is-ready is-pending" href="/auth/complete">
        가입 완료하기
      </Link>
    );
  }

  const name = auth.account?.nickname || auth.account?.fullName || '내 계정';

  return (
    <span className="login-slot is-ready is-user">
      <Link className="login-slot-name" href="/auth/login" title={name}>
        {name}
      </Link>
      <button
        type="button"
        className="login-slot-out"
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true);
          await authService.signOut();
          setSigningOut(false);
          router.replace('/');
        }}
      >
        로그아웃
      </button>
    </span>
  );
}
