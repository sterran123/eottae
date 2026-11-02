'use client';

// ============================================================
//  저장 경로: src/components/match/CommonQna.tsx
//  담당: 오하율 · MATCH-009 (공통 질문 · 블라인드 · 백엔드 연동)
//  역할: 매칭 상대와 공통 질문을 블라인드로 주고받는 화면.
//        둘 다 답해야 서로 답 공개. 원치 않는 질문은 거절 가능. 궁합 토스트 상단 노출.
//
//  [백엔드 연동] matchService.loadMyQnaAnswers / saveMyQnaAnswer를 통해
//               내 답변 및 거절 상태를 동기화하며, 키 미설정 환경에서는
//               데모 폴백으로 동작한다 (ADR-005).
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  DEMO_MY_ANSWERS,
  DEMO_PARTNER_ANSWERS,
  DEMO_QUESTIONS,
  demoCompatibility,
} from '@/lib/match/demo-qna';
import { matchService } from '@/lib/match/match-service';
import type {
  CommonQuestionState,
  QnaAnswer,
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
  const [isDemoMode, setIsDemoMode] = useState(true);
  // 내 답. 초기엔 DEMO 답변으로 렌더링하고 마운트 후 저장된 답변 동기화.
  const [myAnswers, setMyAnswers] = useState<
    Record<string, { optionId: string | null; customText?: string }>
  >(() => ({ ...DEMO_MY_ANSWERS }));
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(() => new Set());
  const partner = DEMO_PARTNER_ANSWERS;

  useEffect(() => {
    let active = true;
    const declined = matchService.loadDeclinedCommonQuestions();
    if (declined.length > 0) {
      setDeclinedIds(new Set(declined));
    }
    void matchService.loadMyQnaAnswers().then(({ context, answers }) => {
      if (!active) return;
      setIsDemoMode(context.isDemo);
      const mapped: Record<string, { optionId: string | null; customText?: string }> = {};
      for (const [qid, a] of Object.entries(answers)) {
        mapped[qid] = {
          optionId: a.optionId,
          ...(a.customText ? { customText: a.customText } : {}),
        };
      }
      setMyAnswers(mapped);
    });
    return () => {
      active = false;
    };
  }, []);

  // 공통 질문으로 다룰 문항: 나 또는 상대가 답했거나, 추천 대상.
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
    const nextMine: Record<string, { optionId: string | null; customText?: string }> = {
      ...myAnswers,
      [q.id]: { optionId },
    };
    setMyAnswers(nextMine);

    const nextDeclined = new Set(declinedIds);
    if (nextDeclined.has(q.id)) {
      nextDeclined.delete(q.id);
      setDeclinedIds(nextDeclined);
      matchService.saveDeclinedCommonQuestions(Array.from(nextDeclined));
    }

    const qnaMap: Record<string, QnaAnswer> = {};
    for (const [qid, a] of Object.entries(nextMine)) {
      qnaMap[qid] = { questionId: qid, optionId: a.optionId, customText: a.customText };
    }
    void matchService.saveMyQnaAnswer(
      { questionId: q.id, optionId },
      qnaMap,
    );
  }

  function declineQuestion(qId: string) {
    setDeclinedIds((prev) => {
      const next = new Set(prev);
      next.add(qId);
      matchService.saveDeclinedCommonQuestions(Array.from(next));
      return next;
    });
  }

  function restoreQuestion(qId: string) {
    setDeclinedIds((prev) => {
      const next = new Set(prev);
      next.delete(qId);
      matchService.saveDeclinedCommonQuestions(Array.from(next));
      return next;
    });
  }

  return (
    <section className="mt-cq" aria-label={`${partnerName}님과의 공통 질문`}>
      <CompatToast partnerName={partnerName} summary={summary} />

      <header className="mt-cq__head">
        <div className="mt-cq__avatar" aria-hidden="true" />
        <div className="mt-cq__head-text">
          <div className="mt-cq__title">{partnerName}님과의 공통 질문</div>
          <div className="mt-cq__sub">둘 다 답하면 서로 답이 공개돼요 · 원치 않는 질문은 거절 가능</div>
        </div>
      </header>

      <div className="mt-cq__body">
        {items.map((q) => {
          const isDeclined = declinedIds.has(q.id);
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
              className={`mt-cq-item${st === 'revealed' ? ' is-revealed' : ''}${isDeclined ? ' is-declined' : ''}`}
            >
              <div className="mt-cq-item__q-row">
                <span className="mt-cq-item__q">Q. {q.question}</span>
                {same && <span className="mt-cq-item__hit">통했어요 ✓</span>}
                {isDeclined && <span className="mt-cq-item__declined-badge">거절됨</span>}
              </div>

              {st === 'unanswered' && !isDeclined && (
                <>
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
                  <div className="mt-cq-item__decline-row">
                    <button
                      type="button"
                      className="mt-cq-item__decline-btn"
                      onClick={() => declineQuestion(q.id)}
                    >
                      이 질문 거절하기 / 건너뛰기
                    </button>
                  </div>
                </>
              )}

              {st === 'unanswered' && isDeclined && (
                <div className="mt-cq-item__declined-panel">
                  <span className="mt-cq-item__declined-desc">
                    질문 공유를 거절했습니다. 상대방에게 답변이 전달되지 않아요.
                  </span>
                  <button
                    type="button"
                    className="mt-cq-item__restore-btn"
                    onClick={() => restoreQuestion(q.id)}
                  >
                    다시 답변하기
                  </button>
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

      {isDemoMode && (
        <p className="mt-cq__demo">
          DEMO · 궁합은 겹친 개수만 · 서로 답해야 공개
        </p>
      )}
    </section>
  );
}
