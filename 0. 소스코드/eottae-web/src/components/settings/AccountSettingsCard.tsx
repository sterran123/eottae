'use client';

// src/components/settings/AccountSettingsCard.tsx
// 설정 화면 02번 계정 카드 — useAuth 상태 연동 및 로그인/비로그인 분기

import Link from 'next/link';
import { useAuth } from '@/lib/auth/use-auth';

export default function AccountSettingsCard() {
  const auth = useAuth();

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
      <div className="settings-actions" style={{ marginTop: '12px' }}>
        <button
          type="button"
          className="btn outline"
          disabled
          aria-disabled="true"
          aria-describedby="settings-delete-note"
        >
          회원 탈퇴·데이터 삭제
        </button>
      </div>
      <p className="settings-note" id="settings-delete-note">
        계정 및 데이터 삭제 기능은 준비 중이에요 (CORE-004 미구현)
      </p>
    </article>
  );
}

