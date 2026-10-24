'use client';

// ============================================================
//  저장 경로: src/components/match/QnaQuestionCard.tsx
//  담당: 오하율 · MATCH-009 (프로필 문답)
//  역할: 문항 1개 답하기 카드. choice(4지선다+자유입력) / animal(그리드).
//
//  [DEMO] 저장은 onSave 콜백(상위에서 로컬 상태). 실제는 주한태 API.
//  [자유입력] allowCustom 문항은 5번째 '직접 입력' 제공. 선택지와 배타.
// ============================================================

import { useState } from 'react';
import type { QnaAnswer, QnaQuestion } from '@/lib/match/types';
import { QNA_CATEGORY_LABELS } from '@/lib/match/demo-qna';
import { IconCheck, IconPencil, IconTrash } from './icons';

interface QnaQuestionCardProps {
  question: QnaQuestion;
  answer?: QnaAnswer;
  onSave: (answer: QnaAnswer) => void;
  onDelete?: (questionId: string) => void;
  /** 추천 캐러셀용 축약 표시. */
  compact?: boolean;
}

export default function QnaQuestionCard({
  question,
  answer,
  onSave,
  onDelete,
  compact = false,
}: QnaQuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(
    answer?.optionId ?? null,
  );
  const [customOn, setCustomOn] = useState<boolean>(
    Boolean(answer?.customText),
  );
  const [customText, setCustomText] = useState<string>(answer?.customText ?? '');
  const [error, setError] = useState<string | null>(null);

  const isAnimal = question.type === 'animal';

  function pickOption(id: string) {
    setSelected(id);
    setCustomOn(false);
    setError(null);
  }
  function pickCustom() {
    setCustomOn(true);
    setSelected(null);
    setError(null);
  }

  function handleSave() {
    if (customOn) {
      if (customText.trim().length === 0) {
        setError('직접 입력할 내용을 적어 주세요.');
        return;
      }
      onSave({ questionId: question.id, optionId: null, customText: customText.trim() });
      return;
    }
    if (selected === null) {
      setError('답변을 선택해 주세요.');
      return;
    }
    onSave({ questionId: question.id, optionId: selected });
  }

  return (
    <div className={`mt-qna-card${compact ? ' mt-qna-card--compact' : ''}`}>
      <div className="mt-qna-card__cat">
        {QNA_CATEGORY_LABELS[question.category]}
      </div>
      <div className="mt-qna-card__q">{question.question}</div>

      {isAnimal ? (
        <div className="mt-qna-animals" role="radiogroup" aria-label={question.question}>
          {question.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected === opt.id}
              className={`mt-qna-animal${selected === opt.id ? ' is-on' : ''}`}
              onClick={() => pickOption(opt.id)}
            >
              <span className="mt-qna-animal__emoji" aria-hidden="true">
                {opt.emoji}
              </span>
              <span className="mt-qna-animal__label">{opt.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-qna-opts" role="radiogroup" aria-label={question.question}>
          {question.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected === opt.id}
              className={`mt-qna-opt${selected === opt.id ? ' is-on' : ''}`}
              onClick={() => pickOption(opt.id)}
            >
              <span className="mt-qna-opt__radio" aria-hidden="true" />
              <span>{opt.label}</span>
            </button>
          ))}

          {question.allowCustom && (
            <div className={`mt-qna-custom${customOn ? ' is-on' : ''}`}>
              <button
                type="button"
                className="mt-qna-custom__toggle"
                aria-pressed={customOn}
                onClick={pickCustom}
              >
                <IconPencil className="mt-ico mt-ico--xs" />
                직접 입력
              </button>
              {customOn && (
                <input
                  className="mt-qna-custom__input"
                  type="text"
                  value={customText}
                  maxLength={40}
                  placeholder="내 답을 적어 주세요 (최대 40자)"
                  onChange={(e) => {
                    setCustomText(e.target.value);
                    setError(null);
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-qna-card__err" role="alert">
          {error}
        </p>
      )}

      <div className="mt-qna-card__actions">
        {answer && onDelete && (
          <button
            type="button"
            className="mt-qna-card__del"
            onClick={() => onDelete(question.id)}
          >
            <IconTrash className="mt-ico mt-ico--xs" />
            답변 삭제
          </button>
        )}
        <button
          type="button"
          className="mt-qna-card__save"
          onClick={handleSave}
        >
          <IconCheck className="mt-ico mt-ico--xs" />
          저장
        </button>
      </div>
    </div>
  );
}
