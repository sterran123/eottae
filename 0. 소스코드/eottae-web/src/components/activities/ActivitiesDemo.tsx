'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ActivityCover from '@/components/activities/ActivityCover';
import ActivityMoreMenu, { type MoreMenuItem } from '@/components/activities/ActivityMoreMenu';
import ActivityReactions from '@/components/activities/ActivityReactions';
import ActivityReportDialog, { type ActivityReportReason } from '@/components/activities/ActivityReportDialog';
import CourseDetail from '@/components/activities/CourseDetail';
import DemoDialog from '@/components/activities/DemoDialog';
import GatheringDetail from '@/components/activities/GatheringDetail';
import RecruitmentBadges from '@/components/activities/RecruitmentBadges';
import SubpageHero from '@/components/shared/subpage-hero';
import { MotifIcon } from '@/components/shared/motif-icon';
import { budgetBand, courseTotals, DEMO_COURSES, DEMO_GATHERINGS, findCourse, formatDuration, formatKoreanDateTime } from '@/lib/activities/demo-data';
import {
  compareBySort,
  infoStatusLabel,
  reactionBase,
  reactionKey,
  shownCount,
  UPDATE_NEEDED_REASON,
  type ActivityKind,
  type ActivitySort,
} from '@/lib/activities/feedback';
import { activitiesHref } from '@/lib/activities/href';
import {
  ACTIVITIES_DEMO_STORAGE_KEY,
  applyJoin,
  EMPTY_ACTIVITIES_DEMO,
  loadActivitiesDemo,
  saveActivitiesDemo,
  takeActivitiesNotice,
  type ActivitiesDemoState,
  type InfoCheckRequest,
  type InfoCheckStatus,
} from '@/lib/activities/demo-storage';
import { presentGathering, rosterPeople, withPersonStatus } from '@/lib/activities/demo-roster';
import { recruitmentView } from '@/lib/activities/recruitment';
import { canWriteReview, collectReviews } from '@/lib/activities/reviews';
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

const SORTS: { id: ActivitySort; label: string }[] = [
  { id: 'recommend', label: '추천순' },
  { id: 'like', label: '좋아요순' },
  { id: 'latest', label: '최신순' },
];

type ReportTarget = { kind: ActivityKind; id: string; title: string };

function toggleFlag(map: Record<string, true>, key: string): Record<string, true> {
  const next = { ...map };
  if (next[key]) delete next[key];
  else next[key] = true;
  return next;
}

function isHostGathering(gathering: Pick<Gathering, 'viewerIsHost' | 'mine'> | undefined): boolean {
  return gathering?.viewerIsHost === true || gathering?.mine === true;
}

export default function ActivitiesDemo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stored, setStored] = useState<ActivitiesDemoState>(EMPTY_ACTIVITIES_DEMO);
  const storedRef = useRef(stored);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [sort, setSort] = useState<ActivitySort>('latest');
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [editTitle, setEditTitle] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const reload = () => {
      const loaded = loadActivitiesDemo();
      storedRef.current = loaded;
      setStored(loaded);
    };
    reload();
    setReady(true);
    const notice = takeActivitiesNotice();
    if (notice) {
      setToast(notice);
      toastTimer.current = window.setTimeout(() => setToast(null), 5000);
    }
    // 다른 탭의 removeItem은 이 탭에 storage를 낸다. 키가 비거나 바뀌면 메모리를 버리고 다시 읽는다.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== ACTIVITIES_DEMO_STORAGE_KEY) return;
      reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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

  const persist = useCallback((recipe: (current: ActivitiesDemoState) => ActivitiesDemoState) => {
    // 저장 전에 키가 비어 있으면 메모리의 후기·모임·커버를 다시 쓰지 않는다.
    if (typeof window !== 'undefined') {
      try {
        if (window.localStorage.getItem(ACTIVITIES_DEMO_STORAGE_KEY) === null) {
          storedRef.current = loadActivitiesDemo();
        }
      } catch {
        // 저장소를 못 읽으면 메모리를 비우지 않는다. 이어지는 저장이 실패를 알린다.
      }
    }
    const next = recipe(storedRef.current);
    storedRef.current = next;
    setStored(() => next);
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
    return merged;
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

  const remember = (recipe: (current: ActivitiesDemoState) => ActivitiesDemoState, okMessage: string) => {
    const saved = persist(recipe);
    showToast(saved ? okMessage : '데모 · 화면에는 반영했지만 이 브라우저에 저장하지 못했어요.');
  };

  const toggleRequest = (id: string) => {
    const gathering = gatherings.find((item) => item.id === id);
    if (!gathering || !ready) return;
    if (isHostGathering(gathering)) return;
    const current = storedRef.current;
    const presented = presentGathering(gathering, current.ops[id]);
    const has = current.joins[id] === 'requested' || current.joins[id] === 'accepted';
    const view = recruitmentView(presented, false, new Date());
    if (!has && view.closed) {
      showToast(
        view.shownCount >= presented.capacity
          ? '데모 · 정원이 찬 예시라 요청할 수 없어요.'
          : '데모 · 마감된 예시라 요청할 수 없어요.'
      );
      return;
    }
    remember(
      (state) => {
        const liveHas = state.joins[id] === 'requested' || state.joins[id] === 'accepted';
        return applyJoin(state, id, liveHas ? null : 'requested');
      },
      has
        ? current.joins[id] === 'accepted'
          ? '데모 · 참가 확정을 취소했어요. 이 브라우저 기록만 바뀌었어요.'
          : '데모 · 참가 요청을 취소했어요. 이 브라우저 기록만 바뀌었어요.'
        : '데모 · 참가 요청됨으로 바꿔 두었어요. 모임장에게는 가지 않아요.'
    );
  };

  const decide = (id: string, personId: string, status: 'accepted' | 'rejected' | 'kicked') => {
    const gathering = gatherings.find((item) => item.id === id);
    if (!gathering || !ready) return;
    const current = storedRef.current;
    if (personId === 'self') {
      if (isHostGathering(gathering)) return;
      if (status !== 'accepted' && status !== 'rejected') return;
      const counted = current.joins[id] === 'requested' || current.joins[id] === 'accepted';
      if (status === 'accepted' && !counted) {
        const presented = presentGathering(gathering, current.ops[id]);
        const view = recruitmentView(presented, false, new Date());
        if (view.shownCount >= presented.capacity) {
          showToast('데모 · 정원이 차서 수락할 수 없어요.');
          return;
        }
      }
      remember(
        (state) => applyJoin(state, id, status),
        status === 'accepted'
          ? '데모 · 내 요청을 수락됨으로 바꿨어요. 이 브라우저에만 남습니다.'
          : '데모 · 내 요청을 거절됨으로 바꿨어요. 인원 뱃지에서 빠집니다.'
      );
      return;
    }
    const currentPeople = rosterPeople(gathering, current.ops[id]);
    if (!currentPeople.some((person) => person.id === personId)) return;
    if (status === 'accepted') {
      const presented = presentGathering(gathering, current.ops[id]);
      const view = recruitmentView(presented, !isHostGathering(gathering) && current.requests[id] === true, new Date());
      if (view.shownCount >= presented.capacity) {
        showToast('데모 · 정원이 차서 수락할 수 없어요.');
        return;
      }
    }
    const message =
      status === 'accepted'
        ? '데모 · 수락했어요. 모집 뱃지 인원이 바로 늘어납니다.'
        : status === 'rejected'
          ? '데모 · 거절했어요. 인원은 그대로입니다.'
          : '데모 · 강퇴했어요. 확정 인원과 모집 뱃지에서 빠집니다.';
    remember((state) => {
      const people = rosterPeople(gathering, state.ops[id]);
      if (!people.some((person) => person.id === personId)) return state;
      if (status === 'accepted') {
        const presented = presentGathering(gathering, state.ops[id]);
        const view = recruitmentView(presented, !isHostGathering(gathering) && state.requests[id] === true, new Date());
        if (view.shownCount >= presented.capacity) return state;
      }
      const prev = state.ops[id] ?? {};
      return {
        ...state,
        ops: {
          ...state.ops,
          [id]: { ...prev, people: withPersonStatus(people, personId, status) },
        },
      };
    }, message);
  };

  const toggleRecruitment = (id: string) => {
    const gathering = gatherings.find((item) => item.id === id);
    if (!gathering || !ready) return;
    const current = storedRef.current;
    const prev = current.ops[id] ?? {};
    const presented = presentGathering(gathering, current.ops[id]);
    const view = recruitmentView(presented, !isHostGathering(gathering) && current.requests[id] === true, new Date());
    const openNow = prev.recruitment === 'open' || (!prev.recruitment && !view.closed);
    const recruitment = openNow ? 'closed' : 'open';
    remember(
      (state) => ({
        ...state,
        ops: { ...state.ops, [id]: { ...(state.ops[id] ?? {}), recruitment } },
      }),
      recruitment === 'closed'
        ? '데모 · 모집을 마감했어요. 뱃지가 마감으로 바뀝니다.'
        : '데모 · 모집을 다시 열었어요. 빈자리가 있으면 뱃지가 바뀝니다.'
    );
  };

  const saveReview = (id: string, stars: number, body: string) => {
    const gathering = gatherings.find((item) => item.id === id);
    const current = storedRef.current;
    if (!gathering || !canWriteReview(gathering, current.joins[id] ?? null)) {
      showToast('데모 · 참가 확정자만 후기를 쓸 수 있어요.');
      return;
    }
    const text = body.trim();
    if (!Number.isInteger(stars) || stars < 1 || stars > 5 || text.length < 2 || text.length > 80) return;
    const atLabel = formatKoreanDateTime(new Date());
    remember(
      (state) => ({
        ...state,
        reviews: {
          ...state.reviews,
          [id]: [
            {
              id: `mine-${id}`,
              nickname: '나 (데모)',
              stars,
              body: text,
              atLabel,
              mine: true,
            },
          ],
        },
      }),
      '데모 · 한줄 후기를 이 브라우저에만 남겼어요.'
    );
  };

  const deleteReview = (id: string) => {
    remember((state) => {
      const reviews = { ...state.reviews };
      delete reviews[id];
      return { ...state, reviews };
    }, '데모 · 내 후기를 이 브라우저에서 지웠어요.');
  };

  const vote = (id: string, optionId: string) => {
    const gathering = gatherings.find((item) => item.id === id);
    if (!gathering || !gathering.poll.some((option) => option.id === optionId)) return;
    const retract = storedRef.current.votes[id] === optionId;
    remember(
      (state) => {
        const votes = { ...state.votes };
        if (votes[id] === optionId) delete votes[id];
        else votes[id] = optionId;
        return { ...state, votes };
      },
      retract
        ? '데모 · 표를 거뒀어요. 이 브라우저에서만 빠집니다.'
        : '데모 · 이 브라우저에만 표를 남겼어요. 다른 사람 화면은 그대로예요.'
    );
  };

  const removeMine = (id: string) => {
    remember((state) => {
      const requests = { ...state.requests };
      const joins = { ...state.joins };
      const votes = { ...state.votes };
      const ops = { ...state.ops };
      const reviews = { ...state.reviews };
      const likes = { ...state.likes };
      const recommends = { ...state.recommends };
      delete requests[id];
      delete joins[id];
      delete votes[id];
      delete ops[id];
      delete reviews[id];
      delete likes[reactionKey('gathering', id)];
      delete recommends[reactionKey('gathering', id)];
      return {
        ...state,
        requests,
        joins,
        votes,
        ops,
        reviews,
        likes,
        recommends,
        infoChecks: state.infoChecks.filter((row) => !(row.kind === 'gathering' && row.targetId === id)),
        created: state.created.filter((item) => item.id !== id),
      };
    }, '데모 · 내가 만든 모임 예시를 이 브라우저에서 지웠어요.');
    go({ gathering: null });
  };

  const clearDemo = () => {
    setClearOpen(false);
    remember(
      () => EMPTY_ACTIVITIES_DEMO,
      '데모 · 이 브라우저의 참가 요청, 투표, 모임장 처리, 후기, 만든 모임, 좋아요·추천, 정보 확인 요청을 지웠어요.'
    );
    go({ gathering: null, course: null });
  };

  const reactionOf = (kind: ActivityKind, id: string, item: { id: string; demoLikes?: number; demoRecommends?: number; listedAt?: string; startsAtIso?: string; title: string }) => {
    const base = reactionBase(item);
    const liked = stored.likes[reactionKey(kind, id)] === true;
    const recommended = stored.recommends[reactionKey(kind, id)] === true;
    return {
      base,
      liked,
      recommended,
      likeCount: shownCount(base.likes, liked),
      recommendCount: shownCount(base.recommends, recommended),
      title: item.title,
    };
  };

  const toggleReaction = (kind: ActivityKind, id: string, field: 'likes' | 'recommends') => {
    if (!ready) return;
    const key = reactionKey(kind, id);
    const had = storedRef.current[field][key] === true;
    remember(
      (state) => ({ ...state, [field]: toggleFlag(state[field], key) }),
      had
        ? field === 'likes'
          ? '데모 · 좋아요를 이 브라우저에서 거뒀어요.'
          : '데모 · 추천을 이 브라우저에서 거뒀어요.'
        : field === 'likes'
          ? '데모 · 좋아요를 이 브라우저에만 남겼어요.'
          : '데모 · 추천을 이 브라우저에만 남겼어요.'
    );
  };

  const copyLink = (kind: ActivityKind, id: string) => {
    const href = activitiesHref(kind === 'course' ? { tab: 'courses', course: id } : { tab: 'gatherings', gathering: id });
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    const url = `${window.location.origin}${base}${href}`;
    const notify = (copied: boolean) =>
      showToast(
        copied
          ? '데모 · 링크를 이 기기에 복사했어요. 서버로는 보내지 않아요.'
          : '데모 · 링크 복사는 이 브라우저에서 막혀 알림만 띄워요.'
      );
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url).then(() => notify(true)).catch(() => notify(false));
      return;
    }
    notify(false);
  };

  const submitReport = (reason: ActivityReportReason, note: string) => {
    const target = reportTarget;
    setReportTarget(null);
    if (!target) return;
    if (!ready) {
      showToast('데모 · 기록을 아직 읽고 있어요. 잠시 후 다시 눌러 주세요.');
      return;
    }
    if (reason !== UPDATE_NEEDED_REASON) {
      showToast(
        reason === '기타'
          ? '데모 · ‘기타’ 신고는 확인만 했어요. 적은 내용은 저장하거나 전송하지 않았습니다.'
          : `데모 · ‘${reason}’ 신고는 확인만 했어요. 저장하거나 전송하지 않았습니다.`
      );
      return;
    }
    const now = new Date();
    const entry: InfoCheckRequest = {
      id: `check-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      kind: target.kind,
      targetId: target.id,
      reason: '업데이트가 필요해요',
      note,
      atLabel: formatKoreanDateTime(now),
      atIso: now.toISOString(),
      status: 'pending',
    };
    remember(
      (state) => ({
        ...state,
        infoChecks: [entry, ...state.infoChecks].slice(0, 40),
      }),
      '관리자와 게시 작성자에게 영업·폐업 확인 승인 요청을 보냈어요(데모)'
    );
  };

  const resolveInfo = (id: string, status: Exclude<InfoCheckStatus, 'pending'>) => {
    const row = storedRef.current.infoChecks.find((item) => item.id === id && item.status === 'pending');
    if (!row) return;
    remember(
      (state) => ({
        ...state,
        infoChecks: state.infoChecks.map((item) => (item.id === id && item.status === 'pending' ? { ...item, status } : item)),
      }),
      status === 'confirmed'
        ? '데모 · 확인 완료로 바꿔 이 브라우저에만 남겼어요.'
        : '데모 · 수정 예정으로 바꿔 이 브라우저에만 남겼어요.'
    );
  };

  const checksFor = (kind: ActivityKind, id: string) =>
    stored.infoChecks.filter((row) => row.kind === kind && row.targetId === id);

  const sortedCourses = [...courses].sort((a, b) =>
    compareBySort(sort, reactionOf('course', a.id, a), reactionOf('course', b.id, b))
  );
  const sortedGatherings = [...visibleGatherings].sort((a, b) =>
    compareBySort(sort, reactionOf('gathering', a.id, a), reactionOf('gathering', b.id, b))
  );

  const listQuery = {
    tab,
    region: region === 'all' ? null : region,
    mood: mood === 'all' ? null : mood,
    category: category === 'all' ? null : category,
  };
  const baseGathering = gatheringId ? gatherings.find((item) => item.id === gatheringId) : undefined;
  const shownGathering = baseGathering ? presentGathering(baseGathering, stored.ops[baseGathering.id]) : undefined;

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
        예시 코스를 고르고, 소모임 참가 요청·모임장 관리·후기를 이 브라우저에서만 눌러 봅니다.
      </SubpageHero>
      <section className="shell subpage act-page" aria-labelledby="act-demo-heading">
        <h2 id="act-demo-heading" className="act-sr">
          데이트·소모임 데모
        </h2>
        <p className="act-preview-badge">데모 데이터로 동작하는 2차 미리보기</p>
        <p className="act-lead">
          서버와 계정은 쓰지 않아요. 참가 요청, 모임장 수락, 후기, 투표, 좋아요·추천, 정보 확인 요청, 직접 만든 모임은 이 브라우저의 데모 기록으로만 남습니다.
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
              ready={ready}
              liked={courseId ? stored.likes[reactionKey('course', courseId)] === true : false}
              recommended={courseId ? stored.recommends[reactionKey('course', courseId)] === true : false}
              likeCount={
                courseId && findCourse(courseId)
                  ? shownCount(reactionBase(findCourse(courseId)!).likes, stored.likes[reactionKey('course', courseId)] === true)
                  : 0
              }
              recommendCount={
                courseId && findCourse(courseId)
                  ? shownCount(
                      reactionBase(findCourse(courseId)!).recommends,
                      stored.recommends[reactionKey('course', courseId)] === true
                    )
                  : 0
              }
              infoChecks={courseId ? checksFor('course', courseId) : []}
              onBack={() => go({ course: null }, true)}
              onShare={() =>
                showToast('데모 · 우리 사이에 공유하지 않았어요. 알림만 띄우고 전송하지 않습니다.')
              }
              onToggleLike={() => courseId && toggleReaction('course', courseId, 'likes')}
              onToggleRecommend={() => courseId && toggleReaction('course', courseId, 'recommends')}
              onCopyLink={() => courseId && copyLink('course', courseId)}
              onReport={() => {
                const course = courseId ? findCourse(courseId) : undefined;
                if (course) setReportTarget({ kind: 'course', id: course.id, title: course.title });
              }}
              onResolveInfo={resolveInfo}
            />
          ) : showingGathering && !ready && !gatherings.some((item) => item.id === gatheringId) ? (
            <p className="act-fallback" role="status">
              데모 기록을 확인하고 있어요.
            </p>
          ) : showingGathering ? (
            <GatheringDetail
              gathering={shownGathering}
              requested={ready && !isHostGathering(shownGathering) && stored.requests[gatheringId ?? ''] === true}
              joinStatus={
                ready && gatheringId && !isHostGathering(shownGathering) ? (stored.joins[gatheringId] ?? null) : null
              }
              ready={ready}
              myVote={ready && gatheringId ? (stored.votes[gatheringId] ?? null) : null}
              people={baseGathering ? rosterPeople(baseGathering, stored.ops[baseGathering.id]) : []}
              recruitmentOverride={gatheringId ? stored.ops[gatheringId]?.recruitment : undefined}
              reviewRows={
                gatheringId ? collectReviews(gatheringId, stored.hiddenReviewIds, stored.reviews[gatheringId]) : []
              }
              onBack={() => go({ gathering: null }, true)}
              onToggleRequest={() => gatheringId && toggleRequest(gatheringId)}
              onVote={(optionId) => gatheringId && vote(gatheringId, optionId)}
              onRemove={() => gatheringId && removeMine(gatheringId)}
              onDecision={(personId, status) => gatheringId && decide(gatheringId, personId, status)}
              onToggleRecruitment={() => gatheringId && toggleRecruitment(gatheringId)}
              onSaveReview={(stars, body) => gatheringId && saveReview(gatheringId, stars, body)}
              onDeleteReview={() => gatheringId && deleteReview(gatheringId)}
              onToast={showToast}
              liked={gatheringId ? stored.likes[reactionKey('gathering', gatheringId)] === true : false}
              recommended={gatheringId ? stored.recommends[reactionKey('gathering', gatheringId)] === true : false}
              likeCount={
                shownGathering
                  ? shownCount(
                      reactionBase(shownGathering).likes,
                      stored.likes[reactionKey('gathering', shownGathering.id)] === true
                    )
                  : 0
              }
              recommendCount={
                shownGathering
                  ? shownCount(
                      reactionBase(shownGathering).recommends,
                      stored.recommends[reactionKey('gathering', shownGathering.id)] === true
                    )
                  : 0
              }
              infoChecks={gatheringId ? checksFor('gathering', gatheringId) : []}
              onToggleLike={() => gatheringId && toggleReaction('gathering', gatheringId, 'likes')}
              onToggleRecommend={() => gatheringId && toggleReaction('gathering', gatheringId, 'recommends')}
              onCopyLink={() => gatheringId && copyLink('gathering', gatheringId)}
              onReportPlace={() => {
                if (shownGathering) setReportTarget({ kind: 'gathering', id: shownGathering.id, title: shownGathering.title });
              }}
              onEdit={() => shownGathering && setEditTitle(shownGathering.title)}
              onAskDelete={() => {
                if (shownGathering?.mine) setDeleteTarget({ id: shownGathering.id, title: shownGathering.title });
              }}
              onResolveInfo={resolveInfo}
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
                  <span>정렬</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value as ActivitySort)}>
                    {SORTS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
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
                  ? '지역·분위기·정렬은 이 코스 목록에 바로 적용돼요. 카테고리는 소모임 탭에서 쓰입니다.'
                  : '지역·카테고리·정렬은 이 모임 목록에 바로 적용돼요. 분위기는 데이트 코스 탭에서 쓰입니다.'}
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
                    {sortedCourses.map((course) => {
                      const totals = courseTotals(course);
                      const reaction = reactionOf('course', course.id, course);
                      const statusLabel = infoStatusLabel(checksFor('course', course.id));
                      const menuItems: MoreMenuItem[] = [
                        {
                          id: 'report',
                          label: '신고하기',
                          onSelect: () => setReportTarget({ kind: 'course', id: course.id, title: course.title }),
                        },
                        { id: 'copy', label: '링크 복사', onSelect: () => copyLink('course', course.id) },
                      ];
                      return (
                        <li key={course.id} className="act-card-slot">
                          <ActivityMoreMenu items={menuItems} />
                          <Link
                            className="act-card"
                            href={activitiesHref({ ...listQuery, tab: 'courses', course: course.id })}
                          >
                            <ActivityCover item={course} />
                            <div className="act-card-body">
                              <div className="act-chips">
                                <span className="act-chip">{course.region}</span>
                                <span className="act-chip">{course.mood}</span>
                                {statusLabel && <span className="act-chip">{statusLabel}</span>}
                                <span className="act-demo-mark">데모</span>
                              </div>
                              <h3>{course.title}</h3>
                              <p className="act-meta">
                                {budgetBand(totals.costWon)} · {formatDuration(totals.minutes)} · 단계 {course.steps.length}개
                              </p>
                              <p className="act-clamp">{course.summary}</p>
                              <span className="act-card-go">동선 보기 →</span>
                            </div>
                          </Link>
                          <ActivityReactions
                            likes={reaction.likeCount}
                            recommends={reaction.recommendCount}
                            liked={reaction.liked}
                            recommended={reaction.recommended}
                            disabled={!ready}
                            onLike={() => toggleReaction('course', course.id, 'likes')}
                            onRecommend={() => toggleReaction('course', course.id, 'recommends')}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : sortedGatherings.length === 0 ? (
                <p className="act-empty" role="status">
                  이 조건의 예시 모임이 없어요. 필터를 바꾸거나 데모 모임을 만들어 보세요.
                </p>
              ) : (
                <ul className="act-grid">
                  {sortedGatherings.map((item) => {
                    const cardHost = isHostGathering(item);
                    const requested = !cardHost && stored.requests[item.id] === true;
                    const join = cardHost ? undefined : stored.joins[item.id];
                    const shown = presentGathering(item, stored.ops[item.id]);
                    const reaction = reactionOf('gathering', item.id, item);
                    const statusLabel = infoStatusLabel(checksFor('gathering', item.id));
                    const mark =
                      join === 'accepted' ? '수락됨' : join === 'rejected' ? '거절됨' : requested ? '요청됨' : '데모';
                    const menuItems: MoreMenuItem[] = [
                      {
                        id: 'report',
                        label: '신고하기',
                        onSelect: () => setReportTarget({ kind: 'gathering', id: item.id, title: item.title }),
                      },
                      ...(item.mine || item.viewerIsHost
                        ? [{ id: 'edit', label: '수정', onSelect: () => setEditTitle(item.title) }]
                        : []),
                      ...(item.mine
                        ? [
                            {
                              id: 'delete',
                              label: '삭제',
                              onSelect: () => setDeleteTarget({ id: item.id, title: item.title }),
                            },
                          ]
                        : []),
                      { id: 'copy', label: '링크 복사', onSelect: () => copyLink('gathering', item.id) },
                    ];
                    return (
                      <li key={item.id} className="act-card-slot">
                        <ActivityMoreMenu items={menuItems} />
                        <Link
                          className="act-card"
                          href={activitiesHref({ ...listQuery, tab: 'gatherings', gathering: item.id })}
                        >
                          <ActivityCover item={item} />
                          <div className="act-card-body">
                            <div className="act-chips">
                              <span className="act-chip">{item.category}</span>
                              <span className="act-chip">{item.region}</span>
                              {item.mine && <span className="act-chip">내 데모</span>}
                              {item.viewerIsHost && <span className="act-chip">내가 모임장</span>}
                              {item.ended && <span className="act-chip">종료 · 후기</span>}
                              {statusLabel && <span className="act-chip">{statusLabel}</span>}
                              <span className="act-demo-mark">{mark}</span>
                            </div>
                            <h3>{item.title}</h3>
                            <p className="act-meta">
                              {item.startsAtLabel} · {item.hostNickname}
                            </p>
                            <RecruitmentBadges gathering={shown} requested={requested} />
                            <p className="act-clamp">{item.intro}</p>
                            <span className="act-card-go">모임 보기 →</span>
                          </div>
                        </Link>
                        <ActivityReactions
                          likes={reaction.likeCount}
                          recommends={reaction.recommendCount}
                          liked={reaction.liked}
                          recommended={reaction.recommended}
                          disabled={!ready}
                          onLike={() => toggleReaction('gathering', item.id, 'likes')}
                          onRecommend={() => toggleReaction('gathering', item.id, 'recommends')}
                        />
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

        {reportTarget && (
          <ActivityReportDialog
            subject={reportTarget.title}
            onClose={() => setReportTarget(null)}
            onConfirm={submitReport}
          />
        )}

        {editTitle && (
          <DemoDialog titleId="act-edit-title" title="수정 (데모)" onClose={() => setEditTitle(null)}>
            <p>
              <span className="act-demo-mark">데모</span> {editTitle}은 이 화면에서 고치지 않아요. 서버로 수정 요청을 보내지
              않습니다.
            </p>
            <div className="act-actions">
              <button type="button" className="btn primary" onClick={() => setEditTitle(null)}>
                닫기
              </button>
            </div>
          </DemoDialog>
        )}

        {deleteTarget && (
          <DemoDialog titleId="act-delete-title" title="삭제 (데모)" onClose={() => setDeleteTarget(null)}>
            <p>
              <span className="act-demo-mark">데모</span> {deleteTarget.title}을 이 브라우저 목록에서만 지워요. 서버에는 원래
              없습니다.
            </p>
            <div className="act-actions">
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  const id = deleteTarget.id;
                  setDeleteTarget(null);
                  removeMine(id);
                }}
              >
                이 브라우저에서 지우기
              </button>
              <button type="button" className="btn outline" onClick={() => setDeleteTarget(null)}>
                닫기
              </button>
            </div>
          </DemoDialog>
        )}

        {clearOpen && (
          <DemoDialog titleId="act-clear-title" title="데모 기록 지우기" onClose={() => setClearOpen(false)}>
            <p>
              <span className="act-demo-mark">데모</span> 참가 요청, 모임장 처리, 후기, 일정 투표, 직접 만든 모임이 이 브라우저에서
              사라집니다. 서버에는 원래 없습니다.
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
