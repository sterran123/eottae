'use client';

// ============================================================
//  저장 경로: src/components/match/ProfileQna.tsx
//  담당: 오하율 · MATCH-009 (프로필 문답 · 백엔드 연동)
//  역할: 문답 메인 화면. 헤더(진행률) + 오늘의 추천 질문(관계 맞춤 랜덤)
//        + 전체 문답(카테고리 탭) + 질문 답하기 모달.
//
//  [백엔드 연동] matchService.loadMyQnaAnswers / saveMyQnaAnswer /
//               deleteMyQnaAnswer를 통해 Supabase `public.profile_qna_answers`와
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
import { matchService } from '@/lib/match/match-service';
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

  // 조회 전에는 빈 맵. 데모 답은 mode === 'demo' 응답 이후에만 채운다.
  const [answers, setAnswers] = useState<Record<string, QnaAnswer>>({});
  const [activeTab, setActiveTab] = useState<'all' | QnaCategory>('all');
  const [openQid, setOpenQid] = useState<string | null>(null);
  // 추천 질문 id 목록. 마운트 후 셔플(hydration 안전).
  const [recommendIds, setRecommendIds] = useState<string[]>([]);
  const [reshuffle, setReshuffle] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const relationGoal = relationGoalProp ?? resolvedRelationGoal;

  useEffect(() => {
    let active = true;
    void Promise.all([
      matchService.loadMyQnaAnswers(),
      matchService.loadOnboarding(),
    ]).then(([qnaRes, onbRes]) => {
      if (!active) return;
      setIsDemoMode(qnaRes.context.isDemo && qnaRes.context.mode === 'demo');
      setAnswers(qnaRes.answers);
      if (qnaRes.context.mode !== 'demo' && qnaRes.context.gateMessage) {
        setQnaError(qnaRes.context.gateMessage);
      } else if (qnaRes.errorMessage) {
        setQnaError(qnaRes.errorMessage);
      } else {
        setQnaError(null);
      }
      if (!relationGoalProp && onbRes.draft?.relationGoal) {
        setResolvedRelationGoal(onbRes.draft.relationGoal);
      }
    });
    return () => {
      active = false;
    };
  }, [relationGoalProp]);

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

  // 추천 질문: 관계 우선 카테고리의 '미답변' 질문을 셔플해 N개.
  useEffect(() => {
    const cats = RELATION_TO_CATEGORIES[relationGoal];
    const pool = questions.filter(
      (q) => cats.includes(q.category) && !answers[q.id],
    );
    const fallback = questions.filter((q) => !answers[q.id]);
    const source = pool.length >= RECOMMEND_COUNT ? pool : fallback;
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    setRecommendIds(shuffled.slice(0, RECOMMEND_COUNT).map((q) => q.id));
    setCarouselIdx(0);
    if (carouselRef.current) carouselRef.current.scrollLeft = 0;
    // answers 변화 시 추천 갱신은 과하므로 relation/reshuffle 에만 반응.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationGoal, reshuffle, questions]);

  const listQuestions = useMemo(
    () =>
      activeTab === 'all'
        ? questions
        : questions.filter((q) => q.category === activeTab),
    [activeTab, questions],
  );

  function handleSave(a: QnaAnswer) {
    const prev = answers;
    const next = { ...prev, [a.questionId]: a };
    setAnswers(next);
    setOpenQid(null);
    setQnaError(null);
    void matchService.saveMyQnaAnswer(a, prev).then((res) => {
      if (!res.ok) {
        setAnswers(prev);
        setQnaError(res.error.message);
      }
    });
  }
  function handleDelete(qid: string) {
    const prev = answers;
    const next = { ...prev };
    delete next[qid];
    setAnswers(next);
    setOpenQid(null);
    setQnaError(null);
    void matchService.deleteMyQnaAnswer(qid, prev).then((res) => {
      if (!res.ok) {
        setAnswers(prev);
        setQnaError(res.error.message);
      }
    });
  }

  const openQuestion = openQid ? byId.get(openQid) ?? null : null;

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

        {recommendIds.length === 0 ? (
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
          className="mt-qna__modal"
          role="dialog"
          aria-modal="true"
          aria-label={openQuestion.question}
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
