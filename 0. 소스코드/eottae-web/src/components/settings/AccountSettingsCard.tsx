'use client';

// src/components/settings/AccountSettingsCard.tsx
// 설정 화면 02번 계정 카드 — useAuth 상태 연동 및 로그인/비로그인 분기

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/use-auth';
import { matchService } from '@/lib/match/match-service';
import DemoAdultSettingsStatus from '@/components/settings/DemoAdultSettingsStatus';
import DeleteAccountDemo from '@/components/settings/DeleteAccountDemo';

export default function AccountSettingsCard() {
  const auth = useAuth();
  const [showDemoAdult, setShowDemoAdult] = useState(false);

  useEffect(() => {
    let active = true;
    void matchService.resolveAccessContext().then(
      (context) => {
        if (active) setShowDemoAdult(context.mode === 'demo');
      },
      () => {
        if (active) setShowDemoAdult(false);
      },
    );
    return () => {
      active = false;
    };
  }, [auth.status]);

  return (
    <article className="feature settings-card">
      <span>02</span>
      <h2>계정</h2>
      {auth.status === 'loading' ? (
        <p className="settings-status">계정 상태 확인 중…</p>
      ) : auth.status === 'signed-in' && auth.account ? (
        <>
          <p className="settings-status">
            로그인됨: <b>{auth.account.nickname || auth.account.fullName || '회원'}</b> ({auth.account.email ?? auth.user?.email ?? '-'})
          </p>
          <div className="settings-actions">
            <Link className="btn outline" href="/auth/login">
              내 계정 확인
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="settings-status">로그인이 필요해요</p>
          <div className="settings-actions">
            <Link className="btn outline" href="/auth/login">
              로그인하기
            </Link>
          </div>
        </>
      )}
      {showDemoAdult ? <DemoAdultSettingsStatus /> : null}
      <DeleteAccountDemo />
    </article>
  );
}

