'use client';

// ============================================================
//  저장 경로: src/components/match/ProfileQna.tsx
//  담당: 오하율 · MATCH-009 (프로필 문답)
//  역할: 문답 메인 화면. 헤더(진행률) + 오늘의 추천 질문(관계 맞춤 랜덤)
//        + 전체 문답(카테고리 탭) + 질문 답하기 모달.
//
//  [DEMO] 답변은 로컬 상태. 실제 저장/조회/삭제는 주한태 API.
//  [랜덤] 추천 셔플은 마운트 후(useEffect)에만 수행 → 정적 빌드 hydration 안전.
//  [관계] relationGoal 로 추천 카테고리 결정(RELATION_TO_CATEGORIES).
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  DEMO_MY_ANSWERS,
  DEMO_QUESTIONS,
  QNA_TABS,
  RELATION_TO_CATEGORIES,
} from '@/lib/match/demo-qna';
import type {
  QnaAnswer,
  QnaCategory,
  QnaQuestion,
  RelationGoal,
} from '@/lib/match/types';
import { IconRefresh, IconX } from './icons';
import QnaQuestionCard from './QnaQuestionCard';

interface ProfileQnaProps {
  /** 온보딩에서 받은 관계 목적. DEMO 기본값 진지한 연애. */
  relationGoal?: RelationGoal;
  questions?: QnaQuestion[];
}

const RECOMMEND_COUNT = 3;

export default function ProfileQna({
  relationGoal = 'serious',
  questions = DEMO_QUESTIONS,
}: ProfileQnaProps) {
  // 답변 상태(로컬). 초기엔 DEMO 답변.
  const [answers, setAnswers] = useState<Record<string, QnaAnswer>>(() => {
    const init: Record<string, QnaAnswer> = {};
    for (const [qid, a] of Object.entries(DEMO_MY_ANSWERS)) {
      init[qid] = { questionId: qid, optionId: a.optionId, customText: a.customText };
    }
    return init;
  });
  const [activeTab, setActiveTab] = useState<'all' | QnaCategory>('all');
  const [openQid, setOpenQid] = useState<string | null>(null);
  // 추천 질문 id 목록. 마운트 후 셔플(hydration 안전).
  const [recommendIds, setRecommendIds] = useState<string[]>([]);
  const [reshuffle, setReshuffle] = useState(0);

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
    setAnswers((prev) => ({ ...prev, [a.questionId]: a }));
    setOpenQid(null);
  }
  function handleDelete(qid: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
    setOpenQid(null);
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
          <div className="mt-qna__carousel mt-noscroll">
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

      <p className="mt-qna__demo">
        DEMO · 추천 질문은 매번 랜덤 · 답변 저장/삭제는 연동 예정
      </p>

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
            <button
              type="button"
              className="mt-qna__modal-close"
              aria-label="닫기"
              onClick={() => setOpenQid(null)}
            >
              <IconX className="mt-ico mt-ico--sm" />
            </button>
            <QnaQuestionCard
              question={openQuestion}
              answer={answers[openQuestion.id]}
              onSave={handleSave}
              onDelete={handleDelete}
            />
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
