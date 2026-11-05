'use client';

// ============================================================
//  저장 경로: src/components/match/ProfileQna.tsx
//  담당: 오하율 · MATCH-009 (프로필 문답 · 백엔드 연동)
//  역할: 문답 메인 화면. 헤더(진행률) + 오늘의 추천 질문(관계 맞춤 랜덤)
//        + 전체 문답(카테고리 탭) + 질문 답하기 모달.
//
//  [백엔드 연동] matchService.loadMyQnaAnswers / saveMyQnaAnswer /
//               deleteMyQnaAnswer를 통해 Supabase `public.profile_answers`와
//               동기화하며, 키 미설정 환경에서는 데모 폴백으로 동작한다 (ADR-005).
//  [랜덤] 추천 셔플은 마운트 후(useEffect)에만 수행 → 정적 빌드 hydration 안전.
//  [관계] relationGoal 로 추천 카테고리 결정(RELATION_TO_CATEGORIES).
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEMO_QUESTIONS,
  QNA_TABS,
  RELATION_TO_CATEGORIES,
} from '@/lib/match/demo-qna';
import {
  acknowledgeDemoDraftReload,
  DEMO_DRAFT_CLEARED_MESSAGE,
  isDemoDraftCleared,
  matchService,
  subscribeDemoDraftCleared,
  type MatchOperatingMode,
} from '@/lib/match/match-service';
import type {
  QnaAnswer,
  QnaCategory,
  QnaQuestion,
  RelationGoal,
} from '@/lib/match/types';
import { IconChevronLeft, IconChevronRight, IconRefresh, IconX } from './icons';
import QnaQuestionCard from './QnaQuestionCard';

interface ProfileQnaProps {
  /** 온보딩에서 받은 관계 목적. 미지정 시 저장된 온보딩 설정 또는 'serious' 사용. */
  relationGoal?: RelationGoal;
  questions?: QnaQuestion[];
}

const RECOMMEND_COUNT = 3;

export default function ProfileQna({
  relationGoal: relationGoalProp,
  questions = DEMO_QUESTIONS,
}: ProfileQnaProps) {
  const [resolvedRelationGoal, setResolvedRelationGoal] = useState<RelationGoal>(
    relationGoalProp ?? 'serious',
  );
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [qnaError, setQnaError] = useState<string | null>(null);
  /** 조회가 성공한 모드. 실패하거나 끝나기 전에는 null이라 저장·삭제하지 않는다. */
  const [loadedMode, setLoadedMode] = useState<MatchOperatingMode | null>(null);
  const [qnaLoaded, setQnaLoaded] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const reloadEpoch = useRef(0);
  const demoModeRef = useRef(false);

  // 조회 전에는 빈 맵. 데모 답은 mode === 'demo' 응답 이후에만 채운다.
  const [answers, setAnswers] = useState<Record<string, QnaAnswer>>({});
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const [activeTab, setActiveTab] = useState<'all' | QnaCategory>('all');
  const [openQid, setOpenQid] = useState<string | null>(null);
  // 추천 질문 id 목록. 조회가 끝난 뒤 셔플(hydration 안전).
  const [recommendIds, setRecommendIds] = useState<string[]>([]);
  const [reshuffle, setReshuffle] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const relationGoal = relationGoalProp ?? resolvedRelationGoal;

  function discardClearedQna() {
    reloadEpoch.current += 1;
    setQnaError(DEMO_DRAFT_CLEARED_MESSAGE);
    reloadAfterModeChange();
  }

  useEffect(() => {
    let active = true;
    const epoch = reloadEpoch.current;
    void Promise.all([
      matchService.loadMyQnaAnswers(),
      matchService.loadOnboarding(),
    ]).then(([qnaRes, onbRes]) => {
      if (!active || epoch !== reloadEpoch.current) return;
      demoModeRef.current = qnaRes.context.mode === 'demo';
      setIsDemoMode(qnaRes.context.isDemo && qnaRes.context.mode === 'demo');
      setAnswers(qnaRes.answers);
      setQnaLoaded(true);
      if (!relationGoalProp && onbRes.draft?.relationGoal) {
        setResolvedRelationGoal(onbRes.draft.relationGoal);
      }
      // 조회 실패 시 저장·삭제를 막는다. 성공한 빈 결과(서버 행 0건)는 첫 저장을 허용한다.
      if (qnaRes.errorMessage) {
        setLoadedMode(null);
        setQnaError(qnaRes.errorMessage);
        return;
      }
      setLoadedMode(qnaRes.context.mode);
      if (qnaRes.context.mode === 'demo') {
        acknowledgeDemoDraftReload('qna');
      }
      if (qnaRes.context.mode !== 'demo' && qnaRes.context.gateMessage) {
        setQnaError(qnaRes.context.gateMessage);
      } else {
        setQnaError((current) => (current === DEMO_DRAFT_CLEARED_MESSAGE ? current : null));
      }
    });
    return () => {
      active = false;
    };
  }, [relationGoalProp, loadKey]);

  useEffect(() => {
    return subscribeDemoDraftCleared('qna', () => {
      if (!demoModeRef.current) return;
      discardClearedQna();
    });
  }, []);

  // 스크롤 시 현재 중앙에 위치한 슬라이드 인덱스 추적
  function handleCarouselScroll() {
    const el = carouselRef.current;
    if (!el) return;
    const slides = Array.from(el.querySelectorAll<HTMLElement>('.mt-qna__slide'));
    if (slides.length === 0) return;

    const currentCenter = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let minDiff = Infinity;
    slides.forEach((slide, i) => {
      const center = slide.offsetLeft + slide.offsetWidth / 2;
      const diff = Math.abs(center - currentCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    });
    setCarouselIdx(closest);
  }

  // 부드러운 가감속 모션으로 다음/이전 슬라이드 이동 (네이티브 smooth scroll 활용)
  function scrollCarousel(dir: 'left' | 'right') {
    const el = carouselRef.current;
    if (!el) return;

    const slides = Array.from(el.querySelectorAll<HTMLElement>('.mt-qna__slide'));
    if (slides.length === 0) return;

    const targetIdx = dir === 'right'
      ? Math.min(slides.length - 1, carouselIdx + 1)
      : Math.max(0, carouselIdx - 1);

    const targetSlide = slides[targetIdx];
    if (!targetSlide) return;

    const targetScrollLeft = Math.max(
      0,
      targetSlide.offsetLeft - (el.clientWidth - targetSlide.offsetWidth) / 2,
    );

    const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: targetScrollLeft, behavior: isReduced ? 'auto' : 'smooth' });
    setCarouselIdx(targetIdx);
  }

  const answeredCount = Object.keys(answers).length;
  const total = questions.length;

  const byId = useMemo(() => {
    const m = new Map<string, QnaQuestion>();
    for (const q of questions) m.set(q.id, q);
    return m;
  }, [questions]);

  // 추천 질문: 조회가 끝난 답으로 미답변만 한 번 고른다.
  // 이후 답 저장마다 다시 섞지 않는다.
  useEffect(() => {
    if (!qnaLoaded) return;
    const saved = answersRef.current;
    const cats = RELATION_TO_CATEGORIES[relationGoal];
    const pool = questions.filter(
      (q) => cats.includes(q.category) && !saved[q.id],
    );
    const fallback = questions.filter((q) => !saved[q.id]);
    const source = pool.length >= RECOMMEND_COUNT ? pool : fallback;
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    setRecommendIds(shuffled.slice(0, RECOMMEND_COUNT).map((q) => q.id));
    setCarouselIdx(0);
    if (carouselRef.current) carouselRef.current.scrollLeft = 0;
  }, [relationGoal, reshuffle, questions, qnaLoaded]);

  const listQuestions = useMemo(
    () =>
      activeTab === 'all'
        ? questions
        : questions.filter((q) => q.category === activeTab),
    [activeTab, questions],
  );

  function reloadAfterModeChange() {
    setLoadedMode(null);
    setQnaLoaded(false);
    setRecommendIds([]);
    setLoadKey((key) => key + 1);
  }

  function handleSave(a: QnaAnswer) {
    if (loadedMode == null) {
      setQnaError('문답을 불러온 뒤에 저장해 주세요.');
      return;
    }
    if (loadedMode === 'demo' && isDemoDraftCleared('qna')) {
      discardClearedQna();
      return;
    }
    const modeAtSave = loadedMode;
    const prev = answers;
    const next = { ...prev, [a.questionId]: a };
    setAnswers(next);
    setOpenQid(null);
    setQnaError(null);
    void matchService.saveMyQnaAnswer(a, prev, modeAtSave).then((res) => {
      if (!res.ok) {
        if (res.demoDraftCleared) {
          discardClearedQna();
          return;
        }
        setQnaError(res.error.message);
        if (res.mode !== modeAtSave) {
          reloadAfterModeChange();
          return;
        }
        setAnswers(prev);
      }
    });
  }
  function handleDelete(qid: string) {
    if (loadedMode == null) {
      setQnaError('문답을 불러온 뒤에 저장해 주세요.');
      return;
    }
    if (loadedMode === 'demo' && isDemoDraftCleared('qna')) {
      discardClearedQna();
      return;
    }
    const modeAtSave = loadedMode;
    const prev = answers;
    const next = { ...prev };
    delete next[qid];
    setAnswers(next);
    setOpenQid(null);
    setQnaError(null);
    void matchService.deleteMyQnaAnswer(qid, prev, modeAtSave).then((res) => {
      if (!res.ok) {
        if (res.demoDraftCleared) {
          discardClearedQna();
          return;
        }
        setQnaError(res.error.message);
        if (res.mode !== modeAtSave) {
          reloadAfterModeChange();
          return;
        }
        setAnswers(prev);
      }
    });
  }

  const openQuestion = openQid ? byId.get(openQid) ?? null : null;
  const qnaModalRef = useRef<HTMLDivElement | null>(null);

  // 답하기 모달 키보드 접근성 (Esc 닫기, 탭 가두기, 열릴 때 포커스 이동, 닫힐 때 복귀)
  useEffect(() => {
    if (!openQuestion) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = qnaModalRef.current;

    function focusableIn(root: HTMLElement | null): HTMLElement[] {
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]',
        ),
      );
    }

    const initial = focusableIn(dialog);
    if (initial[0]) initial[0].focus();
    else dialog?.focus();

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpenQid(null);
        return;
      }
      if (event.key !== 'Tab') return;
      const root = qnaModalRef.current;
      if (!root) return;
      const focusable = focusableIn(root);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !focusable.includes(active)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [openQuestion]);

  return (
    <section className="mt-qna" aria-label="프로필 문답">
      <header className="mt-qna__head">
        <div className="mt-qna__title">프로필 문답</div>
        <div className="mt-qna__progress">
          {answeredCount} / {total}
        </div>
      </header>
      {qnaError && (
        <p className="mt-qna-card__err" role="alert">
          {qnaError}
        </p>
      )}

      {/* 오늘의 추천 질문 (관계 맞춤 랜덤) */}
      <div className="mt-qna__rec">
        <div className="mt-qna__rec-head">
          <span className="mt-qna__rec-title">오늘의 추천 질문</span>
          <span className="mt-qna__rec-badge">
            {relationLabel(relationGoal)} 맞춤
          </span>
          <button
            type="button"
            className="mt-qna__rec-refresh"
            aria-label="추천 질문 새로고침"
            onClick={() => setReshuffle((n) => n + 1)}
          >
            <IconRefresh className="mt-ico mt-ico--sm" />
          </button>
        </div>

        {!qnaLoaded ? (
          <p className="mt-qna__rec-empty">추천 질문을 고르고 있어요.</p>
        ) : recommendIds.length === 0 ? (
          <p className="mt-qna__rec-empty">
            추천할 새 질문이 없어요. 전체 문답에서 더 답해보세요.
          </p>
        ) : (
          <div className="mt-qna__carousel-wrap">
            <button
              type="button"
              className="mt-qna__nav-btn mt-qna__nav-btn--prev"
              aria-label="이전 추천 질문 보기"
              disabled={carouselIdx <= 0}
              onClick={() => scrollCarousel('left')}
            >
              <IconChevronLeft className="mt-ico mt-ico--sm" />
            </button>

            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="mt-qna__carousel mt-noscroll"
            >
              {recommendIds.map((qid) => {
                const q = byId.get(qid);
                if (!q) return null;
                return (
                  <div key={qid} className="mt-qna__slide">
                    <QnaQuestionCard
                      question={q}
                      answer={answers[qid]}
                      onSave={handleSave}
                      compact
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="mt-qna__nav-btn mt-qna__nav-btn--next"
              aria-label="다음 추천 질문 보기"
              disabled={carouselIdx >= recommendIds.length - 1}
              onClick={() => scrollCarousel('right')}
            >
              <IconChevronRight className="mt-ico mt-ico--sm" />
            </button>
          </div>
        )}
      </div>

      {/* 전체 문답 (카테고리 탭) */}
      <div className="mt-qna__all">
        <div className="mt-qna__all-title">전체 문답 둘러보기</div>
        <div className="mt-qna__tabs mt-noscroll" role="tablist">
          {QNA_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`mt-qna__tab${activeTab === t.id ? ' is-on' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ul className="mt-qna__list">
          {listQuestions.map((q) => {
            const a = answers[q.id];
            const answeredLabel = a
              ? a.customText ?? optionLabel(q, a.optionId)
              : null;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  className={`mt-qna__row${a ? ' is-done' : ''}`}
                  onClick={() => setOpenQid(q.id)}
                >
                  <div className="mt-qna__row-main">
                    <span className="mt-qna__row-q">{q.question}</span>
                    {answeredLabel ? (
                      <span className="mt-qna__row-ans">↳ {answeredLabel}</span>
                    ) : (
                      <span className="mt-qna__row-todo">아직 답하지 않았어요</span>
                    )}
                  </div>
                  <span
                    className={`mt-qna__row-tag${a ? ' is-done' : ''}`}
                  >
                    {a ? '완료' : '답하기'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {isDemoMode && (
        <p className="mt-qna__demo">
          DEMO · 추천 질문은 매번 랜덤 · 답변 저장/삭제는 이 브라우저에만 남아요
        </p>
      )}

      {/* 질문 답하기 모달 */}
      {openQuestion && (
        <div
          ref={qnaModalRef}
          className="mt-qna__modal"
          role="dialog"
          aria-modal="true"
          aria-label={openQuestion.question}
          tabIndex={-1}
        >
          <div
            className="mt-qna__modal-dim"
            onClick={() => setOpenQid(null)}
          />
          <div className="mt-qna__modal-body">
            <div className="mt-qna__modal-header">
              <span className="mt-qna__modal-title">문답 답하기</span>
              <button
                type="button"
                className="mt-qna__modal-close"
                aria-label="닫기"
                onClick={() => setOpenQid(null)}
              >
                <IconX className="mt-ico mt-ico--sm" />
              </button>
            </div>
            <div className="mt-qna__modal-content">
              <QnaQuestionCard
                question={openQuestion}
                answer={answers[openQuestion.id]}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ---- 헬퍼 ----
function relationLabel(goal: RelationGoal): string {
  switch (goal) {
    case 'neighbor_friend':
      return '동네 친구';
    case 'casual':
      return '썸';
    case 'serious':
      return '진지한 연애';
    case 'open':
      return '열린 만남';
  }
}

function optionLabel(q: QnaQuestion, optionId: string | null): string {
  if (!optionId) return '';
  return q.options.find((o) => o.id === optionId)?.label ?? '';
}
