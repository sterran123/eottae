'use client';

// 3차 모바일 청첩장 RSVP 회신 폼 (INV-003, TC-016 목업)
// - 공유 토큰(t) + 게스트 토큰(g)이 모두 유효할 때만 폼을 연다. 아니면 거절 안내만 보인다.
// - 이 컴포넌트는 본인 게스트 토큰의 회신만 읽는다. 다른 하객 회신·명단·행사 상세는 그리지 않는다.
// - 저장은 이 브라우저 localStorage('eottae.invitations.demo.v1')뿐이다. 서버 호출 없음.

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { subscribeInvitationsDemo } from '@/lib/invitations/demo-storage';
import {
  EMPTY_RSVP_DRAFT,
  RSVP_COOLDOWN_MS,
  RSVP_DENIED_MESSAGE,
  RSVP_NOTE_MAX,
  RSVP_PARTY_MAX,
  draftFromRsvp,
  resolveRsvpAccess,
  submitGuestRsvp,
  type RsvpAccess,
  type RsvpDraft,
} from '@/lib/invitations/rsvp-access';
import type { RsvpMeal, RsvpResponse } from '@/lib/invitations/types';
import './invitation-rsvp.css';

const RESPONSE_OPTIONS: ReadonlyArray<{ id: RsvpResponse; label: string }> = [
  { id: 'yes', label: '참석할게요' },
  { id: 'maybe', label: '아직 몰라요' },
  { id: 'no', label: '참석이 어려워요' },
];

const MEAL_OPTIONS: ReadonlyArray<{ id: RsvpMeal | null; label: string }> = [
  { id: 'yes', label: '식사할게요' },
  { id: 'no', label: '식사는 안 해요' },
  { id: 'undecided', label: '아직 몰라요' },
  { id: null, label: '선택 안 함' },
];

type Feedback = { kind: 'ok' | 'error'; text: string };

interface InvitationRsvpFormProps {
  /** 공개 공유 토큰 (?t=) */
  token: string;
  /** 하객 개별 초대 토큰 (?g=) */
  guestToken: string;
}

export default function InvitationRsvpForm({ token, guestToken }: InvitationRsvpFormProps) {
  const uid = useId();
  const [access, setAccess] = useState<RsvpAccess | null>(null);
  const [draft, setDraft] = useState<RsvpDraft>(EMPTY_RSVP_DRAFT);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const loadedKey = useRef<string | null>(null);

  // 정적 export 라 서버 렌더에는 localStorage 가 없다. 마운트 뒤에 판정한다.
  useEffect(() => {
    const refresh = () => {
      const next = resolveRsvpAccess(token, guestToken);
      setAccess(next);
      const key = next.ok ? `${next.invitation.id}:${next.guest.guestToken}` : 'denied';
      if (loadedKey.current !== key) {
        loadedKey.current = key;
        setDraft(next.ok && next.myRsvp ? draftFromRsvp(next.myRsvp) : EMPTY_RSVP_DRAFT);
        setFeedback(null);
      }
    };
    refresh();
    return subscribeInvitationsDemo(refresh);
  }, [token, guestToken]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = submitGuestRsvp(token, guestToken, draft);
    if (result.ok) {
      setFeedback({ kind: 'ok', text: '회신이 저장됐어요. (데모 · 이 브라우저에만 저장돼요)' });
      return;
    }
    if (result.reason === 'denied') setAccess({ ok: false });
    setFeedback({ kind: 'error', text: result.message });
  }

  if (access === null) {
    return (
      <section className="rsvp-box" aria-label="참석 회신" aria-busy="true">
        <p className="rsvp-demo-badge">데모 데이터로 동작하는 3차 미리보기</p>
        <p className="rsvp-muted">회신 링크를 확인하는 중이에요…</p>
      </section>
    );
  }

  if (!access.ok) {
    return (
      <section className="rsvp-box" aria-label="참석 회신">
        <p className="rsvp-demo-badge">데모 데이터로 동작하는 3차 미리보기</p>
        <div className="rsvp-denied" role="status">
          <strong>{RSVP_DENIED_MESSAGE}</strong>
          <p className="rsvp-muted">
            신랑·신부님이 보낸 초대 링크(하객 전용 주소)로 다시 들어와 주세요.
          </p>
        </div>
      </section>
    );
  }

  const attending = draft.response !== 'no';
  const noteLeft = RSVP_NOTE_MAX - draft.note.length;

  return (
    <section className="rsvp-box" aria-label="참석 회신">
      <p className="rsvp-demo-badge">데모 데이터로 동작하는 3차 미리보기</p>
      <div className="rsvp-event-summary" aria-label="초대 행사 요약">
        <p className="rsvp-event-title">{access.invitation.title}</p>
        <p className="rsvp-muted">
          {access.invitation.hostNames} · {access.invitation.weddingDate} · {access.invitation.venueLabel}
        </p>
      </div>
      <h3 className="rsvp-title">{access.guest.displayName}님, 참석 여부를 알려 주세요</h3>
      <p className="rsvp-muted">
        회신은 이 브라우저에만 저장돼요. 다른 하객에게는 보이지 않아요.
      </p>

      <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="rsvp-fieldset">
          <legend>참석 여부</legend>
          <div className="rsvp-choices">
            {RESPONSE_OPTIONS.map((option) => (
              <label key={option.id} className="rsvp-choice">
                <input
                  type="radio"
                  name={`${uid}-response`}
                  value={option.id}
                  checked={draft.response === option.id}
                  onChange={() => setDraft((d) => ({ ...d, response: option.id }))}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {attending && (
          <>
            <div className="rsvp-field">
              <label htmlFor={`${uid}-party`}>참석 인원 (본인 포함, 1~{RSVP_PARTY_MAX}명)</label>
              <input
                id={`${uid}-party`}
                className="rsvp-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                value={draft.partySize}
                onChange={(e) => setDraft((d) => ({ ...d, partySize: e.target.value }))}
              />
            </div>

            <fieldset className="rsvp-fieldset">
              <legend>식사 (선택)</legend>
              <div className="rsvp-choices">
                {MEAL_OPTIONS.map((option) => (
                  <label key={option.id ?? 'none'} className="rsvp-choice">
                    <input
                      type="radio"
                      name={`${uid}-meal`}
                      value={option.id ?? ''}
                      checked={draft.meal === option.id}
                      onChange={() => setDraft((d) => ({ ...d, meal: option.id }))}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <div className="rsvp-field">
          <label htmlFor={`${uid}-note`}>전하고 싶은 말 (선택)</label>
          <textarea
            id={`${uid}-note`}
            className="rsvp-input rsvp-textarea"
            rows={3}
            maxLength={RSVP_NOTE_MAX}
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          />
          <span className="rsvp-count" aria-hidden="true">
            {noteLeft}자 남음
          </span>
        </div>

        <button type="submit" className="rsvp-submit">
          {access.myRsvp ? '회신 다시 저장하기' : '회신 보내기'}
        </button>
        <p className="rsvp-muted">
          같은 초대 링크로 {RSVP_COOLDOWN_MS / 1000}초 안에 다시 제출하면 이 데모가 잠시 막아요.
          실제 서버의 속도 제한이 아니에요.
        </p>

        <div className="rsvp-feedback" role="status" aria-live="polite">
          {feedback && (
            <p className={feedback.kind === 'ok' ? 'rsvp-ok' : 'rsvp-error'}>{feedback.text}</p>
          )}
        </div>
      </form>
    </section>
  );
}

