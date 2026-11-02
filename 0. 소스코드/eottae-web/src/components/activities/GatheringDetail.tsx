'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ActivityCover from '@/components/activities/ActivityCover';
import ActivityReportDialog from '@/components/activities/ActivityReportDialog';
import GatheringManage from '@/components/activities/GatheringManage';
import GatheringReviews from '@/components/activities/GatheringReviews';
import RecruitmentBadges from '@/components/activities/RecruitmentBadges';
import type { MyJoinStatus } from '@/lib/activities/demo-storage';
import { recruitmentToggleLabel, type VirtualPerson } from '@/lib/activities/demo-roster';
import { recruitmentView } from '@/lib/activities/recruitment';
import { averageStars, canWriteReview, isEndedGathering, type ReviewRow } from '@/lib/activities/reviews';
import type { Gathering } from '@/lib/activities/types';

const JOIN_LABEL: Record<MyJoinStatus, string> = {
  requested: '요청됨',
  accepted: '수락됨',
  rejected: '거절됨',
};

type PanelId = 'info' | 'manage' | 'reviews';

type Props = {
  gathering: Gathering | undefined;
  requested: boolean;
  joinStatus: MyJoinStatus | null;
  ready: boolean;
  myVote: string | null;
  people: readonly VirtualPerson[];
  recruitmentOverride?: 'closed' | 'open';
  reviewRows: readonly ReviewRow[];
  onBack: () => void;
  onToggleRequest: () => void;
  onVote: (optionId: string) => void;
  onRemove: () => void;
  onDecision: (personId: string, status: 'accepted' | 'rejected' | 'kicked') => void;
  onToggleRecruitment: () => void;
  onSaveReview: (stars: number, body: string) => void;
  onDeleteReview: () => void;
  onToast: (message: string) => void;
};

export default function GatheringDetail({
  gathering,
  requested,
  joinStatus,
  ready,
  myVote,
  people,
  recruitmentOverride,
  reviewRows,
  onBack,
  onToggleRequest,
  onVote,
  onRemove,
  onDecision,
  onToggleRecruitment,
  onSaveReview,
  onDeleteReview,
  onToast,
}: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [reportSubject, setReportSubject] = useState<string | null>(null);
  const [hostLook, setHostLook] = useState(false);
  const [panel, setPanel] = useState<PanelId>('info');

  useEffect(() => {
    setHostLook(false);
    setPanel('info');
    setReportSubject(null);
    titleRef.current?.focus();
  }, [gathering?.id]);

  useEffect(() => {
    if (!joinStatus) {
      setHostLook(false);
      setPanel((current) => (current === 'manage' ? 'info' : current));
    }
  }, [gathering?.id, joinStatus]);

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

  const now = new Date();
  const host = gathering.viewerIsHost === true || gathering.mine === true;
  const countedRequest = host ? false : requested;
  const roster = recruitmentView(gathering, countedRequest, now);
  const showManage = host || (hostLook && Boolean(joinStatus));
  const showReviews = isEndedGathering(gathering);
  const panels: { id: PanelId; label: string }[] = [{ id: 'info', label: '안내' }];
  if (showManage) panels.push({ id: 'manage', label: '관리' });
  if (showReviews) panels.push({ id: 'reviews', label: '후기' });
  const active: PanelId = panels.some((item) => item.id === panel) ? panel : 'info';
  const selectedVote = gathering.poll.some((option) => option.id === myVote) ? myVote : null;
  const pollTotal = gathering.poll.reduce(
    (sum, option) => sum + option.demoVotes + (selectedVote === option.id ? 1 : 0),
    0
  );
  const canWrite = canWriteReview(gathering, joinStatus);
  const average = averageStars(reviewRows);
  const averageLabel =
    average === null ? '평균 별점 · 후기 없음 · 데모' : `평균 ${average.toFixed(1)}점 · 후기 ${reviewRows.length}개 · 데모`;
  const lockedReason = canWrite
    ? gathering.demoAttended
      ? '이 예시는 참가 확정된 사람이라 작성할 수 있어요.'
      : gathering.mine || gathering.viewerIsHost
        ? '모임장도 확정 인원으로 보고 작성할 수 있어요.'
        : '수락된 참가라 작성할 수 있어요.'
    : '이 데모에서는 확정되지 않아 작성란을 잠갔습니다.';

  const selectPanel = (next: PanelId, index: number) => {
    setPanel(next);
    tabRefs.current[index]?.focus();
  };

  const onTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = panels.length - 1;
    let next = index;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    selectPanel(panels[next].id, next);
  };

  const info = (
    <>
      <section aria-labelledby="act-join-title">
        <h3 id="act-join-title">참가 요청</h3>
        {host ? (
          <p className="act-note">
            <span className="act-demo-mark">데모</span> 모임장은 이미 인원에 들어 있어 참가 요청을 열지 않아요.
          </p>
        ) : (
          <>
            <p className="act-note">
              <span className="act-demo-mark">데모</span> 누르면 상태가 ‘요청됨’으로 바뀌고 이 브라우저에만 남아요. 모임장에게
              전달되지 않습니다.
            </p>
            <div className="act-actions">
              {countedRequest ? (
                <button type="button" className="btn outline" onClick={onToggleRequest} disabled={!ready}>
                  {joinStatus === 'accepted' ? '참가 취소' : '요청 취소'}
                </button>
              ) : (
                <button type="button" className="btn primary" onClick={onToggleRequest} disabled={!ready || roster.closed}>
                  {roster.closed
                    ? roster.shownCount >= gathering.capacity
                      ? '정원이 찬 예시'
                      : '마감된 예시'
                    : joinStatus === 'rejected'
                      ? '다시 요청'
                      : '참가 요청'}
                </button>
              )}
              <span className="act-demo-mark">{joinStatus ? `${JOIN_LABEL[joinStatus]} · 데모` : '데모'}</span>
            </div>
            {joinStatus === 'requested' && (
              <p role="status" className="act-note">
                참가 요청됨. 새로고침해도 이 브라우저에서는 요청됨으로 남아 있어요.
              </p>
            )}
            {joinStatus === 'accepted' && (
              <p role="status" className="act-note">
                수락됨 · 데모. 참가 확정으로 표시하고 모집 인원에도 넣어요.
              </p>
            )}
            {joinStatus === 'rejected' && (
              <p role="status" className="act-note">
                거절됨 · 데모. 모집 인원에는 넣지 않아요.
              </p>
            )}
            {gathering.demoAttended && joinStatus !== 'accepted' && (
              <p role="status" className="act-note">
                데모 · 이 종료 모임에서는 내가 참가 확정된 사람으로 후기를 쓸 수 있어요.
              </p>
            )}
          </>
        )}
      </section>

      <section className="act-poll" aria-labelledby="act-poll-title">
        <h3 id="act-poll-title">일정 투표</h3>
        <p className="act-note">
          <span className="act-demo-mark">데모</span> 후보 3개 중 하나에 표를 남기면 막대만 바뀝니다. 예시 표는 고정이고, 내 표만 이
          브라우저에 저장돼요.
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
          <button type="button" className="btn outline" onClick={() => setReportSubject(gathering.title)}>
            신고
          </button>
          <span className="act-demo-mark">데모 · 확인만</span>
        </div>
      </aside>
    </>
  );

  return (
    <article className="act-detail" aria-labelledby="act-meet-title">
      <div className="act-actions">
        <button type="button" className="btn outline" onClick={onBack}>
          ← 모임 목록
        </button>
      </div>
      <ActivityCover item={gathering} large />
      <p className="act-kicker">
        {gathering.mine
          ? '내가 만든 데모 모임'
          : gathering.viewerIsHost
            ? '데모 · 내가 모임장'
            : showReviews
              ? '종료된 모임 · 예시'
              : '소모임 · 예시'}
      </p>
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
          <dd>
            {gathering.mine || gathering.viewerIsHost
              ? `${gathering.hostNickname} · 이 브라우저의 데모`
              : `${gathering.hostNickname} · 예시 닉네임`}
          </dd>
        </div>
        <div>
          <dt>모집</dt>
          <dd aria-live="polite">
            <RecruitmentBadges gathering={gathering} requested={countedRequest} now={now} />
            {countedRequest ? <span className="act-sr">내 참가 요청이 인원에 포함되어 뱃지가 바뀝니다.</span> : null}
          </dd>
        </div>
      </dl>
      {!host && joinStatus && (
        <p role="status" className="act-note">
          내 참가: {JOIN_LABEL[joinStatus]} · 데모
        </p>
      )}
      {(host || showReviews) && (
        <p className="act-note">
          {host ? '모임장 데모는 관리 탭에 있어요. ' : ''}
          {showReviews ? '별점과 한줄 후기는 후기 탭에 있어요.' : ''}
        </p>
      )}
      {!host && joinStatus && (
        <div className="act-stack">
          <div className="act-actions">
            <button
              type="button"
              className="btn outline"
              aria-pressed={hostLook}
              onClick={() => {
                const next = !hostLook;
                setHostLook(next);
                setPanel(next ? 'manage' : 'info');
              }}
            >
              {hostLook ? '참가자 시점으로 돌아가기' : '모임장 시점으로 보기'}
            </button>
            <span className="act-demo-mark">데모</span>
          </div>
          <p className="act-note">수락·거절은 이 브라우저 안에서만 바뀌고, 상태가 요청됨·수락됨·거절됨으로 보여요.</p>
        </div>
      )}

      {panels.length > 1 && (
        <div className="act-tabs" role="tablist" aria-label="모임 안내, 관리, 후기">
          {panels.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`act-gather-tab-${item.id}`}
              className="act-tab"
              aria-selected={active === item.id}
              aria-controls={`act-gather-panel-${item.id}`}
              tabIndex={active === item.id ? 0 : -1}
              onClick={() => selectPanel(item.id, index)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {panels.length === 1 ? (
        info
      ) : (
        <div role="tabpanel" id={`act-gather-panel-${active}`} aria-labelledby={`act-gather-tab-${active}`}>
          {active === 'info' && info}
          {active === 'manage' && showManage && (
            <GatheringManage
              hostNickname={gathering.hostNickname}
              people={people}
              selfStatus={host ? null : joinStatus}
              recruitmentLabel={recruitmentToggleLabel(roster.closed, recruitmentOverride)}
              canTakeSeat={roster.shownCount < gathering.capacity}
              onDecision={onDecision}
              onToggleRecruitment={onToggleRecruitment}
            />
          )}
          {active === 'reviews' && showReviews && (
            <GatheringReviews
              rows={reviewRows}
              averageLabel={averageLabel}
              canWrite={canWrite}
              lockedReason={lockedReason}
              onSave={onSaveReview}
              onDelete={onDeleteReview}
              onReport={(row) => setReportSubject(`후기 · ${row.nickname}`)}
            />
          )}
        </div>
      )}

      {gathering.mine && (
        <div className="act-actions">
          <button type="button" className="btn outline" onClick={onRemove} disabled={!ready}>
            이 데모 모임 지우기
          </button>
          <span className="act-demo-mark">이 브라우저만</span>
        </div>
      )}

      {reportSubject && (
        <ActivityReportDialog
          subject={reportSubject}
          onClose={() => setReportSubject(null)}
          onConfirm={(reason) => {
            setReportSubject(null);
            onToast(`데모 · ‘${reason}’ 신고는 확인만 했어요. 저장하거나 전송하지 않았습니다.`);
          }}
        />
      )}
    </article>
  );
}
