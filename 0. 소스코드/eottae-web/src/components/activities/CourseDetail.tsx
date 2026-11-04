'use client';

import { useEffect, useRef, useState } from 'react';
import ActivityCover from '@/components/activities/ActivityCover';
import ActivityMoreMenu, { type MoreMenuItem } from '@/components/activities/ActivityMoreMenu';
import ActivityReactions from '@/components/activities/ActivityReactions';
import InfoChecks from '@/components/activities/InfoChecks';
import { budgetBand, courseTotals, formatDuration, formatWon } from '@/lib/activities/demo-data';
import type { InfoCheckRequest, InfoCheckStatus } from '@/lib/activities/demo-storage';
import { infoStatusLabel } from '@/lib/activities/feedback';
import type { DateCourse } from '@/lib/activities/types';

type Props = {
  course: DateCourse | undefined;
  ready: boolean;
  liked: boolean;
  recommended: boolean;
  likeCount: number;
  recommendCount: number;
  infoChecks: readonly InfoCheckRequest[];
  onBack: () => void;
  onShare: () => void;
  onToggleLike: () => void;
  onToggleRecommend: () => void;
  onCopyLink: () => void;
  onReport: () => void;
  onResolveInfo: (id: string, status: Exclude<InfoCheckStatus, 'pending'>) => void;
};

export default function CourseDetail({
  course,
  ready,
  liked,
  recommended,
  likeCount,
  recommendCount,
  infoChecks,
  onBack,
  onShare,
  onToggleLike,
  onToggleRecommend,
  onCopyLink,
  onReport,
  onResolveInfo,
}: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [authorLook, setAuthorLook] = useState(false);
  const statusLabel = infoStatusLabel(infoChecks);

  useEffect(() => {
    setAuthorLook(false);
    titleRef.current?.focus();
  }, [course?.id]);

  if (!course) {
    return (
      <div className="act-detail">
        <p role="status">이 주소의 예시 코스가 없어요.</p>
        <div className="act-actions">
          <button type="button" className="btn outline" onClick={onBack}>
            ← 코스 목록
          </button>
        </div>
      </div>
    );
  }

  const totals = courseTotals(course);
  const menuItems: MoreMenuItem[] = [
    { id: 'report', label: '신고하기', onSelect: onReport },
    { id: 'copy', label: '링크 복사', onSelect: onCopyLink },
  ];

  return (
    <article className="act-detail" aria-labelledby="act-course-title">
      <div className="act-detail-bar">
        <button type="button" className="btn outline" onClick={onBack}>
          ← 코스 목록
        </button>
        <ActivityMoreMenu items={menuItems} />
      </div>
      <ActivityCover item={course} large />
      <p className="act-kicker">데이트 코스 · 예시</p>
      <h2 id="act-course-title" ref={titleRef} tabIndex={-1}>
        {course.title}
      </h2>
      <div className="act-chips" aria-label="코스 조건">
        <span className="act-chip">{course.region}</span>
        <span className="act-chip">{course.mood}</span>
        <span className="act-chip">{budgetBand(totals.costWon)}</span>
        <span className="act-chip">{formatDuration(totals.minutes)}</span>
        {statusLabel && <span className="act-chip">{statusLabel}</span>}
        <span className="act-demo-mark">데모</span>
      </div>
      <ActivityReactions
        likes={likeCount}
        recommends={recommendCount}
        liked={liked}
        recommended={recommended}
        disabled={!ready}
        onLike={onToggleLike}
        onRecommend={onToggleRecommend}
      />
      <p>{course.summary}</p>
      {infoChecks.length > 0 && (
        <section aria-labelledby="act-course-check">
          <h3 id="act-course-check">정보 확인 요청</h3>
          <p className="act-note">
            <span className="act-demo-mark">데모</span> 영업·폐업 확인 요청 기록입니다. 시각과 사유만 이 브라우저에 남아요.
            {authorLook ? ' 확인 완료와 수정 예정은 이 브라우저에서만 바뀌어요.' : ''}
          </p>
          <div className="act-actions">
            <button
              type="button"
              className="btn outline"
              aria-pressed={authorLook}
              onClick={() => setAuthorLook((value) => !value)}
            >
              {authorLook ? '둘러보기 시점으로 돌아가기' : '작성자 시점으로 보기'}
            </button>
            <span className="act-demo-mark">데모 · 코스에는 관리 탭이 없음</span>
          </div>
          <InfoChecks rows={infoChecks} canResolve={authorLook} onResolve={onResolveInfo} />
        </section>
      )}
      <dl className="act-totals">
        <div>
          <dt>두 사람 예상 합계</dt>
          <dd>{formatWon(totals.costWon)}</dd>
        </div>
        <div>
          <dt>예상 시간</dt>
          <dd>{formatDuration(totals.minutes)}</dd>
        </div>
      </dl>
      <section aria-labelledby="act-course-steps">
        <h3 id="act-course-steps">단계별 동선</h3>
        <ol className="act-steps">
          {course.steps.map((step, index) => (
            <li key={`${course.id}-${index}`} className="act-step">
              <span className="act-step-num" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3>
                  {index + 1}단계 · {step.title}
                </h3>
                <p>{step.placeLabel}</p>
                <p className="act-meta">
                  {formatDuration(step.minutes)} · {step.costWon === 0 ? '이 단계는 비용 없음' : formatWon(step.costWon)}
                </p>
                <p className="act-note">{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <p className="act-note">장소 이름은 가상입니다. 집 주소나 실시간 위치는 적지 않았어요.</p>
      <div className="act-actions">
        <button type="button" className="btn primary" onClick={onShare}>
          우리 사이에 공유
        </button>
        <span className="act-demo-mark">데모 · 전송하지 않음</span>
      </div>
    </article>
  );
}
