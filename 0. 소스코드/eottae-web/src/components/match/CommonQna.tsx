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

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEMO_PARTNER_ANSWERS,
  DEMO_QUESTIONS,
  demoCompatibility,
} from '@/lib/match/demo-qna';
import { matchService, type MatchOperatingMode } from '@/lib/match/match-service';
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
  partnerName,
  questions = DEMO_QUESTIONS,
}: CommonQnaProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [listReady, setListReady] = useState(false);
  /** loadMyQnaAnswers가 끝낸 모드. 끝나기 전에는 답을 저장하지 않는다. */
  const [loadedMode, setLoadedMode] = useState<MatchOperatingMode | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const demoStorageRef = useRef(false);
  // 조회 전에는 빈 맵. 데모 답·데모 상대는 mode === 'demo'일 때만 채운다.
  const [myAnswers, setMyAnswers] = useState<
    Record<string, { optionId: string | null; customText?: string }>
  >({});
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(() => new Set());
  // 데모가 아니면 비운다. 서버 행은 state === 'revealed'인 상대 답만 넣는다.
  // 이 클라이언트에는 공통 질문 조회 RPC가 없어 실계정 상대 답은 비어 있다.
  const [partner, setPartner] = useState<
    Record<string, { optionId: string | null; customText?: string }>
  >({});

  useEffect(() => {
    let active = true;
    void matchService.loadMyQnaAnswers().then(({ context, answers, errorMessage }) => {
      if (!active) return;
      const demo = context.mode === 'demo';
      demoStorageRef.current = demo;
      setLoadedMode(context.mode);
      setIsDemoMode(context.isDemo && demo);
      if (demo) {
        setPartner(DEMO_PARTNER_ANSWERS);
        setDeclinedIds(new Set(matchService.loadDeclinedCommonQuestions('demo')));
      } else {
        setPartner({});
        setDeclinedIds(new Set());
      }
      const mapped: Record<string, { optionId: string | null; customText?: string }> = {};
      for (const [qid, a] of Object.entries(answers)) {
        mapped[qid] = {
          optionId: a.optionId,
          ...(a.customText ? { customText: a.customText } : {}),
        };
      }
      setMyAnswers(mapped);
      setActionError(
        !demo && context.gateMessage ? context.gateMessage : (errorMessage ?? null),
      );
      setListReady(true);
    });
    return () => {
      active = false;
    };
  }, [loadKey]);

  function persistDeclined(ids: string[]) {
    if (!demoStorageRef.current) return;
    matchService.saveDeclinedCommonQuestions(ids, 'demo');
  }

  // 데모는 나 또는 샘플 상대가 답한 문항만. 실계정·상대 id 없음은 문항을 그리지 않는다.
  const items = useMemo(() => {
    if (!listReady) return [];
    if (isDemoMode) {
      return questions.filter((q) => myAnswers[q.id] || partner[q.id]);
    }
    return questions;
  }, [questions, myAnswers, partner, listReady, isDemoMode]);

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
      persistDeclined(Array.from(nextDeclined));
    }

    const qnaMap: Record<string, QnaAnswer> = {};
    for (const [qid, a] of Object.entries(nextMine)) {
      qnaMap[qid] = { questionId: qid, optionId: a.optionId, customText: a.customText };
    }
    if (loadedMode == null) {
      setMyAnswers(myAnswers);
      setActionError('문답을 불러온 뒤에 저장해 주세요.');
      return;
    }
    const modeAtSave = loadedMode;
    setActionError(null);
    void matchService.saveMyQnaAnswer(
      { questionId: q.id, optionId },
      qnaMap,
      modeAtSave,
    ).then((res) => {
      if (!res.ok) {
        setActionError(res.error.message);
        if (res.mode !== modeAtSave) {
          setLoadedMode(null);
          setListReady(false);
          setLoadKey((key) => key + 1);
          return;
        }
        setMyAnswers(myAnswers);
      }
    });
  }

  function declineQuestion(qId: string) {
    // 상대 행이 생기기 전에는 거절을 저장하지 않으므로, 저장된 것처럼 말하지 않는다.
    if (!demoStorageRef.current) {
      setActionError('서로 관심이 성사된 뒤에 공통 질문이 열려요.');
      return;
    }
    setDeclinedIds((prev) => {
      const next = new Set(prev);
      next.add(qId);
      persistDeclined(Array.from(next));
      return next;
    });
  }

  function restoreQuestion(qId: string) {
    if (!demoStorageRef.current) return;
    setDeclinedIds((prev) => {
      const next = new Set(prev);
      next.delete(qId);
      persistDeclined(Array.from(next));
      return next;
    });
  }

  if (!listReady) {
    return (
      <section className="mt-cq" aria-label="공통 질문">
        <p role="status">공통 질문을 확인하고 있어요.</p>
      </section>
    );
  }

  // 이 화면은 매칭 상대 id를 받지 않는다. 실계정이면 가을·문항·거절을 그리지 않는다.
  if (!isDemoMode) {
    return (
      <section className="mt-cq" aria-label="공통 질문">
        {actionError ? <p role="status">{actionError}</p> : null}
        <p role="status">서로 관심이 성사된 뒤에 공통 질문이 열려요.</p>
      </section>
    );
  }

  const displayPartnerName = partnerName ?? '가을';

  return (
    <section className="mt-cq" aria-label={`${displayPartnerName}님과의 공통 질문`}>
      <CompatToast partnerName={displayPartnerName} summary={summary} />

      <header className="mt-cq__head">
        <div className="mt-cq__avatar" aria-hidden="true" />
        <div className="mt-cq__head-text">
          <div className="mt-cq__title">{displayPartnerName}님과의 공통 질문</div>
          <div className="mt-cq__sub">둘 다 답하면 서로 답이 공개돼요 · 원치 않는 질문은 거절 가능</div>
        </div>
      </header>

      {actionError && (
        <p role="alert">{actionError}</p>
      )}

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
                    <span className="mt-cq-ans__who">{displayPartnerName}</span>
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
                    <span className="mt-cq-ans__who">{displayPartnerName}</span>
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
