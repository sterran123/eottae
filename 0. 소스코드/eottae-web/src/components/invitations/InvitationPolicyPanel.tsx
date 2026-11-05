'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Invitation, Guest, Rsvp } from '@/lib/invitations/types';
import {
  loadInvitationsDemo,
  regenerateSharingToken,
  deleteInvitation,
  getRsvpsForInvitation,
} from '@/lib/invitations/demo-storage';
import { invitationGuestHref } from '@/lib/invitations/href';
import InvitationGuestForbiddenView from './InvitationGuestForbiddenView';

interface InvitationPolicyPanelProps {
  invitation: Invitation;
  onUpdated?: (updated: Invitation) => void;
  onDeleted?: () => void;
}

export default function InvitationPolicyPanel({
  invitation,
  onUpdated,
  onDeleted,
}: InvitationPolicyPanelProps) {
  const [currentInvitation, setCurrentInvitation] = useState<Invitation>(invitation);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 옛 토큰 만료 흐름 테스트용 상태
  const [previousToken, setPreviousToken] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    setCurrentInvitation(invitation);
    const state = loadInvitationsDemo();
    const relatedGuests = state.guests.filter((g) => g.invitationId === invitation.id);
    const relatedRsvps = getRsvpsForInvitation(invitation.id);
    setGuests(relatedGuests);
    setRsvps(relatedRsvps);
  }, [invitation]);

  // 비소유자 거절 (TC-015 목업: viewerIsOwner가 아니면 편집 및 하객 목록 접근 거절)
  if (!currentInvitation.viewerIsOwner) {
    return (
      <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* 1. 편집 거절 안내 */}
        <aside
          className="warn"
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--warn-line)',
            backgroundColor: 'var(--warn-bg)',
            color: 'var(--warn-ink)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
                backgroundColor: 'var(--chip-bg)',
                color: 'var(--chip-ink)',
              }}
            >
              TC-015 보안
            </span>
            <strong style={{ fontSize: '1rem' }}>소유자만 고칠 수 있어요</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
            이 청첩장의 편집 권한은 등록한 소유자에게만 제공됩니다.
            비소유자 계정이나 초대 링크를 통한 직접 쿼리(?edit=)는 거절됩니다.
          </p>
        </aside>

        {/* 2. 하객 목록 열람 거절 화면 (Grok 봇 지적사항 해결: 하객 목록 거절 전용 뷰) */}
        <InvitationGuestForbiddenView invitationTitle={currentInvitation.title} />
      </div>
    );
  }

  // 공개 링크 URL
  const publicPath = invitationGuestHref(currentInvitation.sharingToken);
  const fullPublicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname.replace(/\/invitations\/.*$/, '')}${publicPath}`
    : publicPath;

  // 만료된 옛 토큰 URL (토큰 재발급 후 테스트용)
  const expiredOldUrl = previousToken ? invitationGuestHref(previousToken) : null;

  // 토큰 재발급 핸들러
  const handleRegenerateToken = () => {
    const oldToken = currentInvitation.sharingToken;
    const nextToken = regenerateSharingToken(currentInvitation.id);
    if (!nextToken) {
      setActionMessage('토큰 재발급에 실패했습니다.');
      return;
    }

    setPreviousToken(oldToken);
    const updated = {
      ...currentInvitation,
      sharingToken: nextToken,
      updatedAt: new Date().toISOString(),
    };
    setCurrentInvitation(updated);
    setActionMessage(
      `새로운 공유 토큰(${nextToken.slice(0, 8)}...)이 발급되었습니다. 이전 토큰(${oldToken.slice(0, 8)}...)은 즉시 만료되었습니다.`
    );
    if (onUpdated) onUpdated(updated);
  };

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullPublicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionMessage('링크 복사에 실패했습니다.');
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    const ok = deleteInvitation(currentInvitation.id);
    if (ok) {
      setActionMessage('청첩장이 삭제되었습니다. 목록과 공개 링크 모두 닫힙니다.');
      if (onDeleted) onDeleted();
    } else {
      setActionMessage('청첩장 삭제에 실패했습니다.');
    }
  };

  return (
    <div
      style={{
        margin: '2rem 0',
        padding: '1.5rem',
        borderRadius: '16px',
        backgroundColor: 'var(--paper)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-card)',
        boxSizing: 'border-box',
        maxWidth: '100%',
      }}
    >
      {/* 헤더 및 데모 뱃지 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              backgroundColor: 'var(--chip-bg)',
              color: 'var(--chip-ink)',
              display: 'inline-block',
              marginBottom: '0.4rem',
            }}
          >
            데모 데이터로 동작하는 3차 정책 패널 (INV-002)
          </span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ink)' }}>
            행사 및 하객 공유 정책 관리
          </h3>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          소유자 인증됨 (TC-015)
        </span>
      </div>

      {actionMessage && (
        <div
          role="status"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            backgroundColor: 'var(--card-lav-a)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* 1. 공개 링크 및 토큰 재발급 화면 */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--ink)' }}>
          1. 공개 초대 링크 및 토큰 재발급 (INV-002)
        </h4>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          하객에게 전달할 불규칙 토큰 기반의 공개 링크입니다. 토큰을 재발급하면 이전 링크는
          즉시 만료되어 접속이 차단됩니다.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: 'var(--soft)',
            border: '1px solid var(--line)',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>
              현재 활성 공유 링크:
            </span>
            <div
              style={{
                wordBreak: 'break-all',
                fontSize: '0.9rem',
                color: 'var(--brand-dark)',
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            >
              {fullPublicUrl}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn outline"
              onClick={handleCopyLink}
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
              {copied ? '✓ 복사 완료!' : '링크 복사'}
            </button>
            <button
              type="button"
              className="btn outline"
              onClick={handleRegenerateToken}
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
              토큰 재발급 (새 sharingToken)
            </button>
          </div>

          {/* 재발급 후 옛 토큰 만료 흐름 테스트 섹션 (Grok 봇 지적사항 해결) */}
          {expiredOldUrl && previousToken && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.85rem',
                borderRadius: '8px',
                backgroundColor: 'var(--warn-bg)',
                border: '1px solid var(--warn-line)',
                color: 'var(--warn-ink)',
                fontSize: '0.85rem',
              }}
            >
              <strong>만료된 옛 토큰 검증 흐름:</strong>
              <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '0.8rem', lineHeight: 1.4 }}>
                재발급 전의 이전 토큰(<code>{previousToken.slice(0, 10)}...</code>)으로 접속 시
                만료 화면이 정상 노출되는지 테스트할 수 있습니다.
              </p>
              <Link
                href={expiredOldUrl}
                className="btn outline"
                style={{
                  minHeight: '44px',
                  minWidth: '44px',
                  padding: '0 1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  color: 'var(--warn-ink)',
                  borderColor: 'var(--warn-line)',
                }}
              >
                옛 토큰 만료 화면 테스트 열기 →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 2. 데이터 보존 기간 안내 (DEC-06 미결 반영) */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--ink)' }}>
          2. 데이터 보존 및 삭제 정책 안내 (DEC-06)
        </h4>
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: 'var(--warn-bg)',
            border: '1px solid var(--warn-line)',
            color: 'var(--warn-ink)',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
        >
          <strong>보존 기간 안내 (DEC-06 결정 대기)</strong>
          <p style={{ margin: '0.5rem 0 0 0' }}>
            행사 종료 후 이 브라우저에서 지울 수 있어요. 보관 기간은 팀 결정(DEC-06) 후 확정됩니다.
            개인정보 보호를 위해 임의의 숫자(예: 30일 등)를 강제하지 않으며, 소유자가 직접 삭제 시
            즉시 모든 데이터가 영구 폐기됩니다.
          </p>
        </div>
      </section>

      {/* 3. 하객 목록 및 회신 현황 (소유자 전용 화면) */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ink)' }}>
            3. 하객 목록 및 RSVP 회신 현황 (소유자 전용)
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            총 {guests.length}명 초대 / {rsvps.length}명 회신
          </span>
        </div>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          하객 개인정보 보호 원칙(ADR-004)에 따라 <strong>공개 하객 화면에는 게스트 명단·회신·전화번호·실주소가 일체 노출되지 않으며</strong>,
          오직 소유자 패널에서만 조회할 수 있습니다.
        </p>

        {guests.length === 0 ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '0.9rem',
              backgroundColor: 'var(--soft)',
              borderRadius: '10px',
            }}
          >
            등록된 하객 정보가 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)', color: 'var(--muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>하객명</th>
                  <th style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>초대 토큰</th>
                  <th style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>참석 여부</th>
                  <th style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>인원</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>축하 메모</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => {
                  const r = rsvps.find((item) => item.guestToken === g.guestToken);
                  return (
                    <tr key={g.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--ink)' }}>
                        {g.displayName}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                        {g.guestToken.slice(0, 10)}...
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>
                        {r ? (
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              backgroundColor:
                                r.response === 'yes' ? 'var(--card-lav-a)' : 'var(--soft)',
                              color: r.response === 'yes' ? 'var(--brand-dark)' : 'var(--ink)',
                              border: '1px solid var(--line)',
                              display: 'inline-block',
                            }}
                          >
                            {r.response === 'yes' ? '참석' : r.response === 'no' ? '불참' : '미정'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>미회신</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--ink)' }}>
                        {r ? `${r.partySize}명` : '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 0.5rem',
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: 'var(--ink)',
                        }}
                      >
                        {r?.note || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. 청첩장 삭제 */}
      <section
        style={{
          borderTop: '1px solid var(--line)',
          paddingTop: '1.5rem',
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--warn-ink)' }}>
          4. 청첩장 완전 삭제
        </h4>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          삭제 시 이 청첩장과 연결된 하객 목록, RSVP 회신 데이터가 함께 지워지며,
          목록 및 공개 링크 둘 다 더 이상 열리지 않습니다.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            className="btn outline"
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              padding: '0 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              cursor: 'pointer',
              color: 'var(--warn-ink)',
              borderColor: 'var(--warn-line)',
            }}
          >
            청첩장 삭제
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1.25rem',
              borderRadius: '12px',
              backgroundColor: 'var(--warn-bg)',
              border: '1px solid var(--warn-line)',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: 'var(--warn-ink)', fontWeight: 600 }}>
              정말로 삭제하시겠습니까? 되돌릴 수 없습니다.
            </span>
            <button
              type="button"
              className="btn"
              onClick={handleDelete}
              style={{
                minHeight: '44px',
                minWidth: '44px',
                padding: '0 1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                cursor: 'pointer',
                backgroundColor: 'var(--warn-ink)',
                color: 'var(--paper)',
                border: 'none',
              }}
            >
              확인 삭제
            </button>
            <button
              type="button"
              className="btn outline"
              onClick={() => setShowDeleteConfirm(false)}
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
              취소
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
