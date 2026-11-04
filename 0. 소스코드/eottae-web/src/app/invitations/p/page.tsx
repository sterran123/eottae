'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Invitation } from '@/lib/invitations/types';
import { getInvitationByToken, loadInvitationsDemo } from '@/lib/invitations/demo-storage';
import InvitationCardRenderer from '@/components/invitations/InvitationCardRenderer';
import '../invitations.css';

function GuestInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';
  const guestToken = searchParams.get('g') || '';

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setLoaded(true);
      return;
    }
    // 토큰으로 청첩장 조회
    const found = getInvitationByToken(token);
    if (found) {
      setInvitation(found);
    } else {
      // 데모 편의: demo-data의 sharingToken과 일치하는 항목 확인
      const state = loadInvitationsDemo();
      const match = state.invitations.find((item) => item.sharingToken === token);
      if (match) setInvitation(match);
    }
    setLoaded(true);
  }, [token]);

  if (!loaded) {
    return (
      <div className="shell subpage" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>초대장을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="shell subpage" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💌</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>
          초대장을 찾을 수 없거나 열람 기간이 만료되었습니다
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          초대 링크의 주소를 다시 한번 확인해 주시거나,<br />
          신랑·신부님께 새로운 초대 링크를 요청해 주세요.
        </p>
        <Link href="/invitations/" className="inv-btn-primary">
          청첩장 메인으로 가기
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
      {/* 상단 하객 열람 안내 띠 */}
      <div style={{
        width: '100%',
        background: 'var(--card)',
        borderBottom: '1px solid var(--line)',
        padding: '8px 16px',
        fontSize: 12,
        color: 'var(--muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <span>💌 초대받은 하객 열람 화면입니다 (가상 예식 정보)</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {guestToken && (
            <span style={{ fontSize: 11, background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>
              하객 토큰 확인됨
            </span>
          )}
          <Link href="/invitations/" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
            허브로 가기 →
          </Link>
        </div>
      </div>

      {/* 스마트폰 폭(최대 480px) 중앙 정렬 뷰어 */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        minHeight: '100vh',
        boxShadow: '0 0 30px rgba(0,0,0,0.06)',
        position: 'relative',
      }}>
        <InvitationCardRenderer
          invitation={invitation}
          previewMode={false}
        />
      </div>
    </div>
  );
}

export default function GuestInvitationPage() {
  return (
    <Suspense fallback={<div className="shell subpage">초대장을 불러오는 중...</div>}>
      <GuestInvitationContent />
    </Suspense>
  );
}

