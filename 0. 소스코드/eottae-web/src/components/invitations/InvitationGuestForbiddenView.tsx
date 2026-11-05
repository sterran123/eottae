'use client';

import Link from 'next/link';

interface InvitationGuestForbiddenViewProps {
  invitationTitle?: string;
  onBack?: () => void;
}

export default function InvitationGuestForbiddenView({
  invitationTitle,
  onBack,
}: InvitationGuestForbiddenViewProps) {
  return (
    <div
      style={{
        margin: '1.5rem 0',
        padding: '1.75rem 1.25rem',
        borderRadius: '16px',
        backgroundColor: 'var(--warn-bg)',
        border: '1px solid var(--warn-line)',
        color: 'var(--warn-ink)',
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}
    >
      {/* 3차 데모 뱃지 & TC-015 뱃지 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1rem',
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
          TC-015 보안 목업
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.25rem 0.6rem',
            borderRadius: '999px',
            backgroundColor: 'var(--paper)',
            color: 'var(--warn-ink)',
            border: '1px solid var(--warn-line)',
            display: 'inline-block',
          }}
        >
          403 FORBIDDEN 거절
        </span>
      </div>

      <h3
        style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.2rem',
          color: 'var(--ink)',
          wordBreak: 'keep-all',
        }}
      >
        하객 목록 열람 거절 (소유자 전용)
      </h3>

      <p
        style={{
          margin: '0 0 1rem 0',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          wordBreak: 'keep-all',
        }}
      >
        {invitationTitle ? `선택하신 청첩장(「${invitationTitle}」)의 ` : '이 청첩장의 '}
        <strong>하객 명단 및 RSVP 회신 내역은 청첩장 소유자만 열람</strong>할 수 있습니다.
        비소유자 계정이나 초대 링크를 통한 직접 쿼리 접근(?guests=, ?edit=)은 엄격히 차단됩니다.
      </p>

      <div
        style={{
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--line)',
          color: 'var(--muted)',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          marginBottom: '1.25rem',
        }}
      >
        <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: '0.25rem' }}>
          🔒 개인정보 보호 정책 (ADR-004 / TC-015)
        </strong>
        타인의 하객 이름, 참석 여부, 전화번호 등 민감정보는 어떤 경우에도 제3자에게 노출되지 않습니다.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {onBack ? (
          <button
            type="button"
            className="btn outline"
            onClick={onBack}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              padding: '0 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          >
            ← 이전 화면으로 돌아가기
          </button>
        ) : (
          <Link
            href="/invitations/"
            className="btn outline"
            style={{
              minHeight: '44px',
              minWidth: '44px',
              padding: '0 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              textDecoration: 'none',
            }}
          >
            ← 청첩장 목록으로 돌아가기
          </Link>
        )}
      </div>
    </div>
  );
}

