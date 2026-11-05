'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Invitation } from '@/lib/invitations/types';
import {
  getInvitationByToken,
  subscribeInvitationsDemo,
} from '@/lib/invitations/demo-storage';
import InvitePreview from './preview/InvitePreview';
import InvitationExpiredView from './InvitationExpiredView';

export default function PublicInvitationClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';
  const [invitation, setInvitation] = useState<Invitation | null | 'loading'>('loading');

  useEffect(() => {
    const checkToken = () => {
      if (!token) {
        setInvitation(null);
        return;
      }
      const item = getInvitationByToken(token);
      if (item) {
        // 공개 하객 화면에서는 소유자 권한을 강제로 제거하여 편집/하객목록 노출 방지
        setInvitation({
          ...item,
          viewerIsOwner: false,
        });
      } else {
        setInvitation(null);
      }
    };

    checkToken();
    return subscribeInvitationsDemo(checkToken);
  }, [token]);

  if (invitation === 'loading') {
    return (
      <div
        className="shell subpage"
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
        }}
      >
        초대장을 불러오는 중입니다...
      </div>
    );
  }

  // 옛 토큰, 존재하지 않는 토큰, 삭제된 청첩장의 경우 만료 화면 표시
  if (!invitation) {
    return <InvitationExpiredView reason="expired" />;
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* 3차 데모 뱃지 바 */}
      <div
        style={{
          backgroundColor: 'var(--paper)',
          borderBottom: '1px solid var(--line)',
          padding: '0.6rem 1rem',
          textAlign: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.25rem 0.6rem',
            borderRadius: '999px',
            backgroundColor: 'var(--chip-bg)',
            color: 'var(--chip-ink)',
            display: 'inline-block',
          }}
        >
          데모 데이터로 동작하는 3차 미리보기 (INV-002)
        </span>
      </div>

      {/* 청첩장 본문 렌더링 (InvitePreview: 하객 개인정보는 미포함) */}
      <main style={{ paddingBottom: '3rem' }}>
        <InvitePreview invitation={invitation} />
      </main>

      {/* 하객 개인정보 비노출 및 보존 안내 푸터 (ADR-004 / INV-002 / DEC-06) */}
      <footer
        style={{
          backgroundColor: 'var(--soft)',
          borderTop: '1px solid var(--line)',
          padding: '1.5rem 1rem 3rem 1rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--muted)',
          lineHeight: 1.6,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: 'var(--ink)' }}>
            🔒 하객 개인정보 보호 정책 (INV-002 · ADR-004)
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            본 공개 화면에는 하객 명단, 회신 내역, 전화번호, 상세 주소가 일체 노출되지 않으며 검색엔진에 수집되지 않습니다(noindex).
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem' }}>
            보존 안내: 행사 종료 후 이 브라우저에서 지울 수 있어요. 보관 기간은 팀 결정(DEC-06) 후 확정됩니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
