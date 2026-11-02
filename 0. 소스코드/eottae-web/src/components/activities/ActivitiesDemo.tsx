'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CourseDetail from '@/components/activities/CourseDetail';
import DemoDialog from '@/components/activities/DemoDialog';
import GatheringDetail from '@/components/activities/GatheringDetail';
import SubpageHero from '@/components/shared/subpage-hero';
import { MotifIcon } from '@/components/shared/motif-icon';
import { budgetBand, courseTotals, DEMO_COURSES, DEMO_GATHERINGS, findCourse, formatDuration } from '@/lib/activities/demo-data';
import { activitiesHref } from '@/lib/activities/href';
import {
  EMPTY_ACTIVITIES_DEMO,
  loadActivitiesDemo,
  saveActivitiesDemo,
  type ActivitiesDemoState,
} from '@/lib/activities/demo-storage';
import {
  ACTIVITY_REGIONS,
  COURSE_MOODS,
  GATHERING_CATEGORIES,
  isActivityRegion,
  isCourseMood,
  isGatheringCategory,
  type Gathering,
} from '@/lib/activities/types';

const TABS = [
  { id: 'courses', label: '데이트 코스' },
  { id: 'gatherings', label: '소모임' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ActivitiesDemo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stored, setStored] = useState<ActivitiesDemoState>(EMPTY_ACTIVITIES_DEMO);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setStored(loadActivitiesDemo());
    setReady(true);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    []
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  const persist = useCallback((next: ActivitiesDemoState) => {
    setStored(next);
    return saveActivitiesDemo(next);
  }, []);

  const tab: TabId = searchParams.get('tab') === 'gatherings' ? 'gatherings' : 'courses';
  const courseId = searchParams.get('course');
  const gatheringId = searchParams.get('gathering');
  const regionParam = searchParams.get('region') ?? '';
  const moodParam = searchParams.get('mood') ?? '';
  const categoryParam = searchParams.get('category') ?? '';
  const region = isActivityRegion(regionParam) ? regionParam : 'all';
  const mood = isCourseMood(moodParam) ? moodParam : 'all';
  const category = isGatheringCategory(categoryParam) ? categoryParam : 'all';

  const go = useCallback(
    (patch: Record<string, string | null>, scroll = false) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (!value || value === 'all') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `/activities/?${qs}` : '/activities/', { scroll });
    },
    [router, searchParams]
  );

  const gatherings = useMemo(() => {
    const mineIds = new Set(stored.created.map((item) => item.id));
    const merged: Gathering[] = [...stored.created, ...DEMO_GATHERINGS.filter((item) => !mineIds.has(item.id))];
    return merged.sort((a, b) => {
      if (Boolean(a.mine) !== Boolean(b.mine)) return a.mine ? -1 : 1;
      return a.startsAtIso.localeCompare(b.startsAtIso);
    });
  }, [stored.created]);

  const courses = DEMO_COURSES.filter((course) => {
    if (region !== 'all' && course.region !== region) return false;
    if (mood !== 'all' && course.mood !== mood) return false;
    return true;
  });

  const visibleGatherings = gatherings.filter((item) => {
    if (region !== 'all' && item.region !== region) return false;
    if (category !== 'all' && item.category !== category) return false;
    return true;
  });

  const selectTab = (next: TabId, index: number) => {
    go({
      tab: next === 'gatherings' ? 'gatherings' : null,
      course: null,
      gathering: null,
    });
    tabRefs.current[index]?.focus();
  };

  const onTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = TABS.length - 1;
    let next = index;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    selectTab(TABS[next].id, next);
  };

  const remember = (next: ActivitiesDemoState, okMessage: string) => {
    const saved = persist(next);
    showToast(saved ? okMessage : '데모 · 화면에는 반영했지만 이 브라우저에 저장하지 못했어요.');
  };

  const toggleRequest = (id: string) => {
    const gathering = gatherings.find((item) => item.id === id);
    if (!gathering || !ready) return;
    const has = stored.requests[id] === true;
    if (!has && gathering.currentCount >= gathering.capacity) {
      showToast('데모 · 정원이 찬 예시라 요청할 수 없어요.');
      return;
    }
    const requests = { ...stored.requests };
    if (has) delete requests[id];
    else requests[id] = true;
    remember(
      { ...stored, requests },
      has
        ? '데모 · 참가 요청을 취소했어요. 이 브라우저 기록만 바뀌었어요.'
        : '데모 · 참가 요청됨으로 바꿔 두었어요. 모임장에게는 가지 않아요.'
    );
  };

  const vote = (id: string, optionId: string) => {
    const gathering = gatherings.find((item) => item.id === id);
    if (!gathering || !gathering.poll.some((option) => option.id === optionId)) return;
    const votes = { ...stored.votes };
    const retract = votes[id] === optionId;
    if (retract) delete votes[id];
    else votes[id] = optionId;
    remember(
      { ...stored, votes },
      retract
        ? '데모 · 표를 거뒀어요. 이 브라우저에서만 빠집니다.'
        : '데모 · 이 브라우저에만 표를 남겼어요. 다른 사람 화면은 그대로예요.'
    );
  };

  const removeMine = (id: string) => {
    const requests = { ...stored.requests };
    const votes = { ...stored.votes };
    delete requests[id];
    delete votes[id];
    remember(
      {
        requests,
        votes,
        created: stored.created.filter((item) => item.id !== id),
      },
      '데모 · 내가 만든 모임 예시를 이 브라우저에서 지웠어요.'
    );
    go({ gathering: null });
  };

  const clearDemo = () => {
    setClearOpen(false);
    remember(EMPTY_ACTIVITIES_DEMO, '데모 · 이 브라우저의 참가 요청, 투표, 만든 모임을 지웠어요.');
    go({ gathering: null, course: null });
  };

  const listQuery = {
    tab,
    region: region === 'all' ? null : region,
    mood: mood === 'all' ? null : mood,
    category: category === 'all' ? null : category,
  };

  const showingCourse = tab === 'courses' && Boolean(courseId);
  const showingGathering = tab === 'gatherings' && Boolean(gatheringId);

  return (
    <>
      <SubpageHero
        eyebrow="MODULE 02 · ACTIVITIES"
        status={{ label: '2차 · 데모 체험', dev: true }}
        title="데이트와 소모임, 함께하는 하루"
        motif={<MotifIcon name="spark" size={56} />}
      >
        예시 코스를 고르고, 소모임 참가 요청과 일정 투표를 이 브라우저에서만 눌러 봅니다.
      </SubpageHero>
      <section className="shell subpage act-page" aria-labelledby="act-demo-heading">
        <h2 id="act-demo-heading" className="act-sr">
          데이트·소모임 데모
        </h2>
        <p className="act-preview-badge">데모 데이터로 동작하는 2차 미리보기</p>
        <p className="act-lead">
          서버와 계정은 쓰지 않아요. 참가 요청, 투표, 직접 만든 모임은 이 브라우저의 데모 기록으로만 남습니다.
          {ready ? ` 저장해 둔 데모 모임 ${stored.created.length}개.` : ' 데모 기록을 확인하고 있어요.'}
        </p>

        <div className="act-tabs" role="tablist" aria-label="데이트 코스와 소모임">
          {TABS.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`act-tab-${item.id}`}
              className="act-tab"
              aria-selected={tab === item.id}
              aria-controls="act-panel"
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => selectTab(item.id, index)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="act-panel" aria-labelledby={`act-tab-${tab}`}>
          {showingCourse ? (
            <CourseDetail
              course={courseId ? findCourse(courseId) : undefined}
              onBack={() => go({ course: null }, true)}
              onShare={() =>
                showToast('데모 · 우리 사이에 공유하지 않았어요. 알림만 띄우고 전송하지 않습니다.')
              }
            />
          ) : showingGathering && !ready && !gatherings.some((item) => item.id === gatheringId) ? (
            <p className="act-fallback" role="status">
              데모 기록을 확인하고 있어요.
            </p>
          ) : showingGathering ? (
            <GatheringDetail
              gathering={gatherings.find((item) => item.id === gatheringId)}
              requested={ready && stored.requests[gatheringId ?? ''] === true}
              ready={ready}
              myVote={ready && gatheringId ? (stored.votes[gatheringId] ?? null) : null}
              onBack={() => go({ gathering: null }, true)}
              onToggleRequest={() => gatheringId && toggleRequest(gatheringId)}
              onVote={(optionId) => gatheringId && vote(gatheringId, optionId)}
              onRemove={() => gatheringId && removeMine(gatheringId)}
              onToast={showToast}
            />
          ) : (
            <div className="act-page">
              <fieldset className="act-filters">
                <legend className="act-sr">목록 필터</legend>
                <label className="act-field">
                  <span>지역</span>
                  <select
                    value={region}
                    onChange={(event) => go({ region: event.target.value })}
                  >
                    <option value="all">전체 지역</option>
                    {ACTIVITY_REGIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="act-field">
                  <span>{tab === 'courses' ? '분위기' : '분위기 (데이트 코스)'}</span>
                  <select value={mood} onChange={(event) => go({ mood: event.target.value })}>
                    <option value="all">전체 분위기</option>
                    {COURSE_MOODS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="act-field">
                  <span>{tab === 'gatherings' ? '카테고리' : '카테고리 (소모임)'}</span>
                  <select value={category} onChange={(event) => go({ category: event.target.value })}>
                    <option value="all">전체 카테고리</option>
                    {GATHERING_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
              <p className="act-note">
                {tab === 'courses'
                  ? '지역·분위기는 이 코스 목록에 바로 적용돼요. 카테고리는 소모임 탭에서 쓰입니다.'
                  : '지역·카테고리는 이 모임 목록에 바로 적용돼요. 분위기는 데이트 코스 탭에서 쓰입니다.'}
              </p>

              <div className="act-toolbar">
                <p className="act-count" role="status">
                  {tab === 'courses'
                    ? `예시 코스 ${courses.length}개`
                    : `예시 모임 ${visibleGatherings.length}개`}
                </p>
                {(region !== 'all' || mood !== 'all' || category !== 'all') && (
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => go({ region: null, mood: null, category: null })}
                  >
                    필터 지우기
                  </button>
                )}
                <Link className="btn primary" href="/activities/new/">
                  모임 만들기
                </Link>
                <span className="act-demo-mark">데모</span>
                <button type="button" className="btn outline" onClick={() => setClearOpen(true)} disabled={!ready}>
                  데모 기록 지우기
                </button>
              </div>

              {tab === 'courses' ? (
                courses.length === 0 ? (
                  <p className="act-empty" role="status">
                    이 조건의 예시 코스가 없어요. 필터를 바꿔 보세요.
                  </p>
                ) : (
                  <ul className="act-grid">
                    {courses.map((course) => {
                      const totals = courseTotals(course);
                      return (
                        <li key={course.id}>
                          <Link
                            className="act-card"
                            href={activitiesHref({ ...listQuery, tab: 'courses', course: course.id })}
                          >
                            <div className="act-chips">
                              <span className="act-chip">{course.region}</span>
                              <span className="act-chip">{course.mood}</span>
                              <span className="act-demo-mark">데모</span>
                            </div>
                            <h3>{course.title}</h3>
                            <p className="act-meta">
                              {budgetBand(totals.costWon)} · {formatDuration(totals.minutes)} · 단계 {course.steps.length}개
                            </p>
                            <p className="act-clamp">{course.summary}</p>
                            <span className="act-card-go">동선 보기 →</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : visibleGatherings.length === 0 ? (
                <p className="act-empty" role="status">
                  이 조건의 예시 모임이 없어요. 필터를 바꾸거나 데모 모임을 만들어 보세요.
                </p>
              ) : (
                <ul className="act-grid">
                  {visibleGatherings.map((item) => {
                    const requested = stored.requests[item.id] === true;
                    const seats = item.capacity - item.currentCount;
                    return (
                      <li key={item.id}>
                        <Link
                          className="act-card"
                          href={activitiesHref({ ...listQuery, tab: 'gatherings', gathering: item.id })}
                        >
                          <div className="act-chips">
                            <span className="act-chip">{item.category}</span>
                            <span className="act-chip">{item.region}</span>
                            {item.mine && <span className="act-chip">내 데모</span>}
                            <span className="act-demo-mark">{requested ? '요청됨' : '데모'}</span>
                          </div>
                          <h3>{item.title}</h3>
                          <p className="act-meta">
                            {item.startsAtLabel} · {item.hostNickname}
                          </p>
                          <p className="act-meta">
                            예시 {item.currentCount}명 / 정원 {item.capacity}명
                            {seats <= 0 ? ' · 마감' : ` · 빈 자리 ${seats}`}
                          </p>
                          <p className="act-clamp">{item.intro}</p>
                          <span className="act-card-go">모임 보기 →</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <Link className="btn outline" href="/">
          ← 통합 홈으로
        </Link>

        {clearOpen && (
          <DemoDialog titleId="act-clear-title" title="데모 기록 지우기" onClose={() => setClearOpen(false)}>
            <p>
              <span className="act-demo-mark">데모</span> 참가 요청, 일정 투표, 직접 만든 모임이 이 브라우저에서 사라집니다. 서버에는
              원래 없습니다.
            </p>
            <div className="act-actions">
              <button type="button" className="btn primary" onClick={clearDemo}>
                데모 기록 지우기
              </button>
              <button type="button" className="btn outline" onClick={() => setClearOpen(false)}>
                닫기
              </button>
            </div>
          </DemoDialog>
        )}

        <div className="act-toast-slot" aria-live="polite">
          {toast && (
            <div className="act-toast" role="status">
              <p>{toast}</p>
              <button type="button" className="btn outline act-icon-btn" onClick={() => setToast(null)}>
                닫기
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
