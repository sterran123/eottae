'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import DemoDialog from '@/components/activities/DemoDialog';
import type { Gathering } from '@/lib/activities/types';

const REPORT_REASONS = ['불쾌하거나 위험한 안내', '사칭·광고', '공개되지 않은 장소로 유도', '기타'] as const;

type Props = {
  gathering: Gathering | undefined;
  requested: boolean;
  ready: boolean;
  myVote: string | null;
  onBack: () => void;
  onToggleRequest: () => void;
  onVote: (optionId: string) => void;
  onRemove: () => void;
  onToast: (message: string) => void;
};

export default function GatheringDetail({
  gathering,
  requested,
  ready,
  myVote,
  onBack,
  onToggleRequest,
  onVote,
  onRemove,
  onToast,
}: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>(REPORT_REASONS[0]);
  const reasonName = useId();

  useEffect(() => {
    titleRef.current?.focus();
  }, [gathering?.id]);

  if (!gathering) {
    return (
      <div className="act-detail">
        <p role="status">이 주소의 예시 모임이 없어요. 지운 데모 모임일 수도 있어요.</p>
        <div className="act-actions">
          <button type="button" className="btn outline" onClick={onBack}>
            ← 모임 목록
          </button>
        </div>
      </div>
    );
  }

  const full = gathering.currentCount >= gathering.capacity;
  const shownCount = gathering.currentCount + (requested ? 1 : 0);
  const selectedVote = gathering.poll.some((option) => option.id === myVote) ? myVote : null;
  const pollTotal = gathering.poll.reduce(
    (sum, option) => sum + option.demoVotes + (selectedVote === option.id ? 1 : 0),
    0
  );

  const confirmReport = () => {
    setReportOpen(false);
    onToast(`데모 · ‘${reason}’ 신고는 확인만 했어요. 저장하거나 전송하지 않았습니다.`);
  };

  return (
    <article className="act-detail" aria-labelledby="act-meet-title">
      <div className="act-actions">
        <button type="button" className="btn outline" onClick={onBack}>
          ← 모임 목록
        </button>
      </div>
      <p className="act-kicker">{gathering.mine ? '내가 만든 데모 모임' : '소모임 · 예시'}</p>
      <h2 id="act-meet-title" ref={titleRef} tabIndex={-1}>
        {gathering.title}
      </h2>
      <div className="act-chips" aria-label="모임 표시">
        <span className="act-chip">{gathering.category}</span>
        <span className="act-chip">{gathering.region}</span>
        {gathering.safetyFlags.map((flag) => (
          <span className="act-chip" key={flag}>
            {flag}
          </span>
        ))}
        <span className="act-demo-mark">데모</span>
      </div>
      <p>{gathering.intro}</p>
      <dl className="act-totals">
        <div>
          <dt>안내 일정</dt>
          <dd>{gathering.startsAtLabel}</dd>
        </div>
        <div>
          <dt>장소 표시</dt>
          <dd>{gathering.placeLabel}</dd>
        </div>
        <div>
          <dt>모임장</dt>
          <dd>{gathering.mine ? `${gathering.hostNickname} · 이 브라우저의 데모` : `${gathering.hostNickname} · 예시 닉네임`}</dd>
        </div>
        <div>
          <dt>인원</dt>
          <dd>
            예시 {gathering.currentCount}명
            {requested ? ' + 내 요청 1명' : ''} / 정원 {gathering.capacity}명
            <span className="act-sr">화면 합계 {shownCount}명</span>
          </dd>
        </div>
      </dl>

      <section aria-labelledby="act-join-title">
        <h3 id="act-join-title">참가 요청</h3>
        <p className="act-note">
          <span className="act-demo-mark">데모</span> 누르면 상태가 ‘요청됨’으로 바뀌고 이 브라우저에만 남아요. 모임장에게 전달되지 않습니다.
        </p>
        <div className="act-actions">
          {requested ? (
            <button type="button" className="btn outline" onClick={onToggleRequest} disabled={!ready}>
              요청 취소
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={onToggleRequest} disabled={!ready || full}>
              {full ? '정원이 찬 예시' : '참가 요청'}
            </button>
          )}
          <span className="act-demo-mark">{requested ? '요청됨 · 데모' : '데모'}</span>
        </div>
        {requested && (
          <p role="status" className="act-note">
            참가 요청됨. 새로고침해도 이 브라우저에서는 요청됨으로 남아 있어요.
          </p>
        )}
      </section>

      <section className="act-poll" aria-labelledby="act-poll-title">
        <h3 id="act-poll-title">일정 투표</h3>
        <p className="act-note">
          <span className="act-demo-mark">데모</span> 후보 3개 중 하나에 표를 남기면 막대만 바뀝니다. 예시 표는 고정이고, 내 표만 이 브라우저에 저장돼요.
        </p>
        <div role="group" aria-label="일정 후보">
          {gathering.poll.map((option) => {
            const votes = option.demoVotes + (selectedVote === option.id ? 1 : 0);
            const pct = pollTotal === 0 ? 0 : Math.round((votes / pollTotal) * 100);
            const pressed = selectedVote === option.id;
            return (
              <div className="act-poll-row" key={option.id}>
                <button
                  type="button"
                  className="btn outline act-poll-option"
                  aria-pressed={pressed}
                  disabled={!ready}
                  onClick={() => onVote(option.id)}
                >
                  {option.label}
                  {pressed ? ' · 내 표' : ''}
                </button>
                <div
                  className="act-meter"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={Math.max(pollTotal, 1)}
                  aria-valuenow={votes}
                  aria-label={`${option.label} ${votes}표, ${pct}%`}
                >
                  <span style={{ width: `${pct}%` }} />
                </div>
                <p className="act-meta">
                  예시 {option.demoVotes}표{pressed ? ' + 내 데모 표 1' : ''} · 합계 {votes}표 ({pct}%)
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="act-safety" aria-labelledby="act-safe-title">
        <h3 id="act-safe-title">안전 안내</h3>
        <ul>
          <li>첫 만남은 사람 있는 공개 장소에서 하세요. 집 주소와 실시간 위치는 주고받지 않아요.</li>
          <li>
            신고 위치는 아래 버튼과 <Link href="/safety">안전센터</Link>입니다. 이 버튼은 데모라 접수되지 않아요.
          </li>
          <li>
            차단은 이 데모에서 적용되지 않아요. 정책이 있는 곳은 <Link href="/safety">안전센터</Link>입니다.
          </li>
        </ul>
        <div className="act-actions">
          <button type="button" className="btn outline" onClick={() => setReportOpen(true)}>
            신고
          </button>
          <span className="act-demo-mark">데모 · 확인만</span>
        </div>
      </aside>

      {gathering.mine && (
        <div className="act-actions">
          <button type="button" className="btn outline" onClick={onRemove} disabled={!ready}>
            이 데모 모임 지우기
          </button>
          <span className="act-demo-mark">이 브라우저만</span>
        </div>
      )}

      {reportOpen && (
        <DemoDialog titleId="act-report-title" title="신고 확인 (데모)" onClose={() => setReportOpen(false)}>
          <p>
            <span className="act-demo-mark">데모</span> {gathering.title} 예시를 신고하는 척만 합니다. 사유는 어디에도 저장되지 않아요.
          </p>
          <fieldset className="act-choice-list">
            <legend>예시 사유</legend>
            {REPORT_REASONS.map((item) => (
              <label className="act-choice" key={item}>
                <input
                  type="radio"
                  name={reasonName}
                  value={item}
                  checked={reason === item}
                  onChange={() => setReason(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </fieldset>
          <div className="act-actions">
            <button type="button" className="btn primary" onClick={confirmReport}>
              데모로 확인
            </button>
            <button type="button" className="btn outline" onClick={() => setReportOpen(false)}>
              닫기
            </button>
          </div>
        </DemoDialog>
      )}
    </article>
  );
}
