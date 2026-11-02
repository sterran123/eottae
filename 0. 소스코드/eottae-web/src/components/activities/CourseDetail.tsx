'use client';

import { useEffect, useRef } from 'react';
import ActivityCover from '@/components/activities/ActivityCover';
import { budgetBand, courseTotals, formatDuration, formatWon } from '@/lib/activities/demo-data';
import type { DateCourse } from '@/lib/activities/types';

type Props = {
  course: DateCourse | undefined;
  onBack: () => void;
  onShare: () => void;
};

export default function CourseDetail({ course, onBack, onShare }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
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

  return (
    <article className="act-detail" aria-labelledby="act-course-title">
      <div className="act-actions">
        <button type="button" className="btn outline" onClick={onBack}>
          ← 코스 목록
        </button>
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
        <span className="act-demo-mark">데모</span>
      </div>
      <p>{course.summary}</p>
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
