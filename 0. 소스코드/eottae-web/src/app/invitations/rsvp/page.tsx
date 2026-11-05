'use client';

// 3차 모바일 청첩장 하객 전용 RSVP 회신 화면 (/invitations/rsvp/?t=&g=, INV-003 · TC-016 목업)
// - 공유 토큰(t)과 게스트 토큰(g)이 모두 유효할 때만 해당 하객 본인의 회신 폼을 연다.
// - 토큰이 없거나 잘못됐거나 만료·폐기된 경우 행사 상세와 다른 하객 정보를 전혀 그리지 않는다.
// - ?host= 모드에서는 소유자 읽기 전용 집계(demo-inv-1)와 비소유자 편집·명단 열람 거절(demo-inv-3, TC-015 목업)만 확인한다.

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import InvitationRsvpForm from '@/components/invitations/InvitationRsvpForm';
import { subscribeInvitationsDemo } from '@/lib/invitations/demo-storage';
import {
  resolveOwnerRsvpOverview,
  type OwnerRsvpOverview,
} from '@/lib/invitations/rsvp-access';
import type { RsvpMeal, RsvpResponse } from '@/lib/invitations/types';

const RESPONSE_LABEL: Record<RsvpResponse, string> = {
  yes: '참석',
  maybe: '미정',
  no: '불참',
};

const MEAL_LABEL: Record<RsvpMeal, string> = {
  yes: '식사 예정',
  no: '식사 안 함',
  undecided: '식사 미정',
};

const DEMO_SCENARIOS = [
  {
    id: 'guest-a',
    label: '하객 A (솜사탕) 초대 링크 — 유효한 t+g',
    href: '/invitations/rsvp/?t=k7Qm2pL9xRt4vNw8aB3cYd6e&g=gt-x8k2m9p1',
    t: 'k7Qm2pL9xRt4vNw8aB3cYd6e',
    g: 'gt-x8k2m9p1',
    host: '',
  },
  {
    id: 'guest-b',
    label: '하객 B (종이배) 초대 링크 — 다른 하객 g (타인 회신 격리)',
    href: '/invitations/rsvp/?t=k7Qm2pL9xRt4vNw8aB3cYd6e&g=gt-q4v7w2n6',
    t: 'k7Qm2pL9xRt4vNw8aB3cYd6e',
    g: 'gt-q4v7w2n6',
    host: '',
  },
  {
    id: 'guest-new',
    label: '미회신 하객 (구름달) 초대 링크 — 첫 회신·연속 제출 확인',
    href: '/invitations/rsvp/?t=m3Xp8vY2wT6zQr1kL5nBd9aF&g=gt-t9j1s5d2',
    t: 'm3Xp8vY2wT6zQr1kL5nBd9aF',
    g: 'gt-t9j1s5d2',
    host: '',
  },
  {
    id: 'no-guest-token',
    label: '게스트 토큰 없음 (g 누락) — 회신 거절',
    href: '/invitations/rsvp/?t=k7Qm2pL9xRt4vNw8aB3cYd6e',
    t: 'k7Qm2pL9xRt4vNw8aB3cYd6e',
    g: '',
    host: '',
  },
  {
    id: 'revoked-token',
    label: '폐기된 공유 토큰 (revoked) — 회신 거절',
    href: '/invitations/rsvp/?t=old-revoked-token-sample&g=gt-x8k2m9p1',
    t: 'old-revoked-token-sample',
    g: 'gt-x8k2m9p1',
    host: '',
  },
  {
    id: 'owner-view',
    label: '소유자 회신 목록 (읽기 전용 · demo-inv-1)',
    href: '/invitations/rsvp/?host=demo-inv-1',
    t: '',
    g: '',
    host: 'demo-inv-1',
  },
  {
    id: 'non-owner-denied',
    label: '비소유자 편집·명단 열람 거절 (TC-015 목업 · demo-inv-3)',
    href: '/invitations/rsvp/?host=demo-inv-3',
    t: '',
    g: '',
    host: 'demo-inv-3',
  },
] as const;

function OwnerRsvpReadOnlyCard({ invitationId }: { invitationId: string }) {
  const [overview, setOverview] = useState<OwnerRsvpOverview | null>(null);

  useEffect(() => {
    const sync = () => setOverview(resolveOwnerRsvpOverview(invitationId));
    sync();
    return subscribeInvitationsDemo(sync);
  }, [invitationId]);

  if (overview === null) {
    return (
      <section className="rsvp-box" aria-label="호스트 회신 현황" aria-busy="true">
        <p className="rsvp-demo-badge">데모 데이터로 동작하는 3차 미리보기</p>
        <p className="rsvp-muted">소유자 권한을 확인하는 중이에요…</p>
      </section>
    );
  }

  if (!overview.ok) {
    return (
      <section className="rsvp-box" aria-label="비소유자 접근 거절">
        <p className="rsvp-demo-badge">데모 데이터로 동작하는 3차 미리보기</p>
        <div className="rsvp-denied" role="alert">
          <strong>{overview.message}</strong>
          {overview.title ? (
            <p className="rsvp-muted">대상 청첩장: {overview.title} (타인 소유 · viewerIsOwner=false)</p>
          ) : null}
          <p className="rsvp-muted">
            청첩장 수정·토큰 재발급·하객 회신 명단 열람은 소유자(호스트) 계정에서만 허용됩니다. (TC-015 목업)
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rsvp-box" aria-label="소유자 회신 목록 (읽기 전용)">
      <p className="rsvp-demo-badge">데모 데이터로 동작하는 3차 미리보기</p>
      <div className="rsvp-event-summary">
        <p className="rsvp-event-title">{overview.invitation.title}</p>
        <p className="rsvp-muted">
          소유자 전용 읽기 화면 · eottae.invitations.demo.v1 저장 데이터를 읽기만 합니다.
        </p>
      </div>
      <h3 className="rsvp-title">수신된 참석 회신 ({overview.rows.length}건)</h3>
      <p className="rsvp-muted">
        이 목록은 소유자 본인에게만 보이며, 공개 화면과 하객 개별 화면에는 노출되지 않아요.
      </p>
      <ul className="rsvp-owner-list">
        {overview.rows.map((row) => (
          <li key={row.guestToken} className="rsvp-owner-item">
            <strong>
              {row.guestDisplayName} · {RESPONSE_LABEL[row.response]}
              {row.response !== 'no' ? ` (${row.partySize}명)` : ''}
              {row.meal ? ` · ${MEAL_LABEL[row.meal]}` : ''}
            </strong>
            {row.note ? <p className="rsvp-muted">{row.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RsvpPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') ?? '';
  const guestToken = searchParams.get('g') ?? '';
  const hostId = searchParams.get('host') ?? '';

  return (
    <div className="shell subpage rsvp-page">
      {hostId ? (
        <OwnerRsvpReadOnlyCard invitationId={hostId} />
      ) : (
        <InvitationRsvpForm token={token} guestToken={guestToken} />
      )}

      <nav className="rsvp-demo-switcher" aria-label="RSVP 데모 링크 전환">
        <p className="rsvp-demo-switcher-title">데모 링크 전환 (INV-003 · TC-015 · TC-016 시연)</p>
        <p className="rsvp-muted">
          공유 토큰(t)·하객 토큰(g) 조합에 따른 접근 제어, 하객 간 회신 격리, 비소유자 거절을 바로 확인할 수 있어요.
        </p>
        <div className="rsvp-demo-links">
          {DEMO_SCENARIOS.map((item) => {
            const active =
              item.host !== ''
                ? hostId === item.host
                : hostId === '' && token === item.t && guestToken === item.g;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="rsvp-demo-link"
                aria-current={active ? 'page' : undefined}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="rsvp-nav-row">
        <Link className="rsvp-back-link" href="/invitations/sample/">
          ← 샘플 청첩장 미리보기로
        </Link>
        <Link className="rsvp-back-link" href="/invitations/">
          ← 청첩장 입구로
        </Link>
      </div>
    </div>
  );
}

export default function InvitationRsvpPage() {
  return (
    <Suspense
      fallback={
        <div className="shell subpage rsvp-page">
          <section className="rsvp-box" aria-label="참석 회신" aria-busy="true">
            <p className="rsvp-demo-badge">데모 데이터로 동작하는 3차 미리보기</p>
            <p className="rsvp-muted">회신 링크를 확인하는 중이에요…</p>
          </section>
        </div>
      }
    >
      <RsvpPageContent />
    </Suspense>
  );
}
