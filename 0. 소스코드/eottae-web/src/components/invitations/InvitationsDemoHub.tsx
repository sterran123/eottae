'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Invitation } from '@/lib/invitations/types';
import {
  loadInvitationsDemo,
  subscribeInvitationsDemo,
  deleteInvitation,
} from '@/lib/invitations/demo-storage';
import { invitationGuestHref } from '@/lib/invitations/href';
import InvitationPolicyPanel from './InvitationPolicyPanel';
import InvitationGuestForbiddenView from './InvitationGuestForbiddenView';

export default function InvitationsDemoHub() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const guestsId = searchParams.get('guests');

  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    const sync = () => {
      const state = loadInvitationsDemo();
      setInvitations(state.invitations);
    };
    sync();
    return subscribeInvitationsDemo(sync);
  }, []);

  const activeEditInvitation = editId
    ? invitations.find((item) => item.id === editId)
    : null;

  const activeGuestsInvitation = guestsId
    ? invitations.find((item) => item.id === guestsId)
    : null;

  return (
    <div style={{ marginTop: '2rem', marginBottom: '3rem', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 3차 데모 알림 배너 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          backgroundColor: 'var(--soft)',
          border: '1px solid var(--line)',
          marginBottom: '1.5rem',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.25rem 0.5rem',
            borderRadius: '999px',
            backgroundColor: 'var(--chip-bg)',
            color: 'var(--chip-ink)',
          }}
        >
          3차 모바일 청첩장 목업 (INV-001 ~ INV-004)
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          브라우저 로컬 스토리지 데모 연동
        </span>
      </div>

      {/* ?guests= 직접 쿼리 모드: 하객 목록 조회 시도 (TC-015 거절 검증) */}
      {guestsId && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
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
          </div>

          {activeGuestsInvitation ? (
            activeGuestsInvitation.viewerIsOwner ? (
              // 소유자일 때는 정책 패널 내 하객 목록 표시
              <InvitationPolicyPanel
                invitation={activeGuestsInvitation}
                onDeleted={() => {
                  window.location.href = '/invitations/';
                }}
              />
            ) : (
              // 비소유자일 때는 명확한 하객 목록 거절 화면 렌더링 (TC-015 Grok 봇 지적사항 해결)
              <InvitationGuestForbiddenView invitationTitle={activeGuestsInvitation.title} />
            )
          ) : (
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
              <strong>해당 청첩장을 찾을 수 없습니다</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                삭제되었거나 유효하지 않은 청첩장 ID입니다.
              </p>
            </aside>
          )}
        </div>
      )}

      {/* ?edit= 모드일 때: 소유자 정책 패널 표시 */}
      {editId && !guestsId && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
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
          </div>

          {activeEditInvitation ? (
            <InvitationPolicyPanel
              invitation={activeEditInvitation}
              onDeleted={() => {
                window.location.href = '/invitations/';
              }}
            />
          ) : (
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
              <strong>해당 청첩장을 찾을 수 없습니다</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                삭제되었거나 유효하지 않은 청첩장 ID입니다. 목록에서 확인해 주세요.
              </p>
            </aside>
          )}
        </div>
      )}

      {/* 내 청첩장 목록 섹션 */}
      <section
        style={{
          padding: '1.5rem',
          borderRadius: '16px',
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box',
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ink)' }}>
            청첩장 목록 및 정책 관리
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            총 {invitations.length}개의 예시 청첩장
          </span>
        </div>

        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          청첩장 소유자는 공개 링크의 공유 토큰을 재발급하거나, 하객 명단 및 RSVP 회신을 확인하고,
          필요 시 청첩장을 완전히 삭제할 수 있습니다.
        </p>

        {invitations.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '0.9rem',
              backgroundColor: 'var(--soft)',
              borderRadius: '12px',
            }}
          >
            등록되거나 보존된 청첩장이 없습니다. (모두 삭제됨)
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {invitations.map((inv) => {
              const publicHref = invitationGuestHref(inv.sharingToken);
              const isOwner = inv.viewerIsOwner === true;

              return (
                <article
                  key={inv.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    backgroundColor: 'var(--soft)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: isOwner ? 'var(--card-lav-a)' : 'var(--paper)',
                            color: isOwner ? 'var(--brand-dark)' : 'var(--muted)',
                            border: '1px solid var(--line)',
                          }}
                        >
                          {isOwner ? '소유자 (내 청첩장)' : '비소유자 예시'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          상태: {inv.status === 'published' ? '공개 중' : inv.status}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>
                        {inv.title}
                      </h4>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {inv.hostNames} · {inv.weddingDate} · {inv.venueLabel}
                      </p>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                      토큰: {inv.sharingToken.slice(0, 12)}...
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      borderTop: '1px solid var(--line)',
                      paddingTop: '0.75rem',
                      alignItems: 'center',
                    }}
                  >
                    <Link
                      href={publicHref}
                      className="btn outline"
                      style={{
                        minHeight: '44px',
                        minWidth: '44px',
                        padding: '0 1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                        textDecoration: 'none',
                      }}
                    >
                      공개 링크 열기 (하객용)
                    </Link>

                    <Link
                      href={`/invitations/?edit=${inv.id}`}
                      className="btn outline"
                      style={{
                        minHeight: '44px',
                        minWidth: '44px',
                        padding: '0 1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                        textDecoration: 'none',
                      }}
                    >
                      {isOwner ? '정책 및 토큰 관리' : '비소유자 편집 거절 테스트'}
                    </Link>

                    {/* 하객 목록 직접 쿼리 링크 (?guests=) - TC-015 거절 흐름 검증용 */}
                    <Link
                      href={`/invitations/?guests=${inv.id}`}
                      className="btn outline"
                      style={{
                        minHeight: '44px',
                        minWidth: '44px',
                        padding: '0 1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                        textDecoration: 'none',
                        color: isOwner ? 'inherit' : 'var(--warn-ink)',
                        borderColor: isOwner ? 'var(--line)' : 'var(--warn-line)',
                      }}
                    >
                      {isOwner ? '하객 목록 보기' : '하객 목록 거절 테스트 (TC-015)'}
                    </Link>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`'${inv.title}' 청첩장을 완전히 삭제하시겠습니까?`)) {
                            deleteInvitation(inv.id);
                          }
                        }}
                        style={{
                          minHeight: '44px',
                          minWidth: '44px',
                          padding: '0 1.25rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          borderRadius: '8px',
                          border: '1px solid var(--warn-line)',
                          backgroundColor: 'var(--warn-bg)',
                          color: 'var(--warn-ink)',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
