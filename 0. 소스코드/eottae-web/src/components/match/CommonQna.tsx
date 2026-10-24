'use client';

// ============================================================
//  저장 경로: src/components/match/CommonQna.tsx
//  담당: 오하율 · MATCH-009 (공통 질문 · 블라인드)
//  역할: 매칭 상대와 공통 질문을 블라인드로 주고받는 화면.
//        둘 다 답해야 서로 답 공개. 궁합 토스트 상단 노출.
//
//  [DEMO] 상대 답은 DEMO_PARTNER_ANSWERS. 실제는 주한태 API.
//         추천 단계가 아니라 '쌍방 관심 후' 화면이므로 답 내용 공개 허용.
//  [풀 공유] 질문은 프로필 문답과 같은 40문항 풀(DEMO_QUESTIONS) 재사용.
// ============================================================

import { useMemo, useState } from 'react';
import {
  DEMO_MY_ANSWERS,
  DEMO_PARTNER_ANSWERS,
  DEMO_QUESTIONS,
  demoCompatibility,
} from '@/lib/match/demo-qna';
import type {
  CommonQuestionState,
  QnaQuestion,
} from '@/lib/match/types';
import CompatToast from './CompatToast';

interface CommonQnaProps {
  partnerName?: string;
  questions?: QnaQuestion[];
}

export default function CommonQna({
  partnerName = '가을',
  questions = DEMO_QUESTIONS,
}: CommonQnaProps) {
  // 내 답(로컬). 상대 답은 DEMO 고정.
  const [myAnswers, setMyAnswers] = useState<
    Record<string, { optionId: string | null; customText?: string }>
  >(() => ({ ...DEMO_MY_ANSWERS }));
  const partner = DEMO_PARTNER_ANSWERS;

  // 공통 질문으로 다룰 문항: 나 또는 상대가 답했거나, 추천 대상.
  // DEMO 에서는 둘 중 한 명이라도 답한 문항을 보여준다.
  const items = useMemo(
    () =>
      questions.filter((q) => myAnswers[q.id] || partner[q.id]),
    [questions, myAnswers, partner],
  );

  const summary = useMemo(
    () => demoCompatibility(myAnswers, partner),
    [myAnswers, partner],
  );

  function stateOf(q: QnaQuestion): CommonQuestionState {
    const mine = myAnswers[q.id];
    const theirs = partner[q.id];
    if (!mine) return 'unanswered';
    if (!theirs) return 'waiting';
    return 'revealed';
  }

  function labelOf(q: QnaQuestion, optionId: string | null, custom?: string) {
    if (custom) return custom;
    if (!optionId) return '';
    return q.options.find((o) => o.id === optionId)?.label ?? '';
  }

  function answerQuestion(q: QnaQuestion, optionId: string) {
    setMyAnswers((prev) => ({
      ...prev,
      [q.id]: { optionId },
    }));
  }

  return (
    <section className="mt-cq" aria-label={`${partnerName}님과의 공통 질문`}>
      <CompatToast partnerName={partnerName} summary={summary} />

      <header className="mt-cq__head">
        <div className="mt-cq__avatar" aria-hidden="true" />
        <div className="mt-cq__head-text">
          <div className="mt-cq__title">{partnerName}님과의 공통 질문</div>
          <div className="mt-cq__sub">둘 다 답하면 서로 답이 공개돼요</div>
        </div>
      </header>

      <div className="mt-cq__body">
        {items.map((q) => {
          const st = stateOf(q);
          const mine = myAnswers[q.id];
          const theirs = partner[q.id];
          const same =
            st === 'revealed' &&
            mine?.optionId !== null &&
            mine?.optionId === theirs?.optionId;

          return (
            <article
              key={q.id}
              className={`mt-cq-item${st === 'revealed' ? ' is-revealed' : ''}`}
            >
              <div className="mt-cq-item__q-row">
                <span className="mt-cq-item__q">Q. {q.question}</span>
                {same && <span className="mt-cq-item__hit">통했어요 ✓</span>}
              </div>

              {st === 'unanswered' && (
                <div className="mt-cq-item__opts" role="radiogroup" aria-label={q.question}>
                  {q.options.slice(0, 4).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="mt-cq-item__opt"
                      onClick={() => answerQuestion(q, opt.id)}
                    >
                      {opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label}
                    </button>
                  ))}
                </div>
              )}

              {st === 'waiting' && (
                <div className="mt-cq-item__answers">
                  <div className="mt-cq-ans mt-cq-ans--mine">
                    <span className="mt-cq-ans__who">나</span>
                    <span className="mt-cq-ans__text">
                      {labelOf(q, mine!.optionId, mine!.customText)}
                    </span>
                  </div>
                  <div className="mt-cq-ans mt-cq-ans--locked">
                    <span className="mt-cq-ans__who">{partnerName}</span>
                    <span className="mt-cq-ans__lock">답하면 공개돼요</span>
                  </div>
                </div>
              )}

              {st === 'revealed' && (
                <div className="mt-cq-item__answers">
                  <div className="mt-cq-ans mt-cq-ans--mine">
                    <span className="mt-cq-ans__who">나</span>
                    <span className="mt-cq-ans__text">
                      {labelOf(q, mine!.optionId, mine!.customText)}
                    </span>
                  </div>
                  <div className={`mt-cq-ans${same ? ' mt-cq-ans--hit' : ' mt-cq-ans--theirs'}`}>
                    <span className="mt-cq-ans__who">{partnerName}</span>
                    <span className="mt-cq-ans__text">
                      {labelOf(q, theirs!.optionId, theirs!.customText)}
                    </span>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="mt-cq__demo">
        DEMO · 궁합은 겹친 개수만 · 서로 답해야 공개
      </p>
    </section>
  );
}
