'use client';

import Link from 'next/link';

interface InvitationExpiredViewProps {
  reason?: 'expired' | 'deleted' | 'not-found' | 'revoked';
  message?: string;
}

export default function InvitationExpiredView({
  reason = 'expired',
  message,
}: InvitationExpiredViewProps) {
  const title =
    reason === 'deleted'
      ? '삭제된 청첩장입니다'
      : reason === 'revoked'
      ? '폐기된 초대 링크입니다'
      : '만료되었거나 유효하지 않은 초대 링크입니다';

  const defaultDescription =
    reason === 'deleted'
      ? '소유자에 의해 삭제된 청첩장으로, 더 이상 상세 내용이나 회신을 확인할 수 없습니다.'
      : '소유자가 공개 링크 토큰을 재발급하였거나 보존 기간이 만료되어 이전 링크는 접속이 차단되었습니다.';

  return (
    <div
      className="shell subpage"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        textAlign: 'center',
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}
    >
      {/* 3차 데모 뱃지 */}
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.25rem 0.6rem',
          borderRadius: '999px',
          backgroundColor: 'var(--chip-bg)',
          color: 'var(--chip-ink)',
          display: 'inline-block',
          marginBottom: '1rem',
        }}
      >
        데모 데이터로 동작하는 3차 미리보기 (INV-002)
      </span>

      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2rem 1.5rem',
          borderRadius: '16px',
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 1.25rem auto',
            borderRadius: '50%',
            backgroundColor: 'var(--warn-bg)',
            border: '1px solid var(--warn-line)',
            color: 'var(--warn-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
          }}
          aria-hidden="true"
        >
          ✉
        </div>

        <h2
          style={{
            margin: '0 0 0.75rem 0',
            fontSize: '1.35rem',
            color: 'var(--ink)',
            wordBreak: 'keep-all',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: '0 0 1.75rem 0',
            fontSize: '0.9rem',
            color: 'var(--muted)',
            lineHeight: 1.6,
            wordBreak: 'keep-all',
          }}
        >
          {message || defaultDescription}
        </p>

        {/* 보안 안내 메모 */}
        <aside
          className="warn"
          style={{
            textAlign: 'left',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            backgroundColor: 'var(--soft)',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            marginBottom: '1.5rem',
            boxSizing: 'border-box',
          }}
        >
          <strong style={{ display: 'block', color: 'var(--brand-dark)', marginBottom: '0.25rem' }}>
            🔒 보안 및 개인정보 보호 (ADR-004 / TC-015)
          </strong>
          토큰이 만료되거나 삭제된 청첩장은 행사 정보, 하객 명단, RSVP 회신 등 모든 상세 정보가 비공개 처리됩니다.
        </aside>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            href="/invitations/"
            className="btn outline"
            style={{
              minHeight: '44px',
              minWidth: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            모바일 청첩장 홈으로 이동
          </Link>
          <Link
            href="/"
            className="btn outline"
            style={{
              minHeight: '44px',
              minWidth: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              border: 'none',
              color: 'var(--muted)',
              boxSizing: 'border-box',
            }}
          >
            ← 통합 홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
