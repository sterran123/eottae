'use client';

// ============================================================
//  저장 경로: src/components/safety/ReportModal.tsx
//  담당: 손준혁 · MATCH-008
//  역할: 신고 접수 모달 — 사유 선택(필수) → 상세 입력 → (선택)동시 차단 → 완료 안내.
//  [정직성] 데모 모드에서는 이 기기 기록만 안내하고, 실계정(Supabase) 모드에서는
//           서버 INSERT가 실제로 성공한 뒤에만 안전센터 접수 완료 화면으로 전환한다 (RULES 6).
// ============================================================

import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  MAX_REPORT_DETAIL_LENGTH,
  REPORT_CATEGORIES,
  type ReportCategory,
  type ReportRequest,
} from '@/lib/safety/types';
import SafetyDialog from './SafetyDialog';

export interface ReportSubmitOutcome {
  ok: boolean;
  mode?: 'demo' | 'supabase';
  errorMessage?: string;
}

interface ReportModalProps {
  open: boolean;
  partnerId: string;
  partnerName: string;
  /** 실계정(Supabase) 대화방 여부 — 생략 시 데모 모드로 동작 */
  liveMode?: boolean;
  /** 신고 제출 시 호출. Promise<ReportSubmitOutcome>을 반환하면 성공 시에만 완료 화면으로 전환한다. */
  onSubmit: (req: ReportRequest) => void | Promise<ReportSubmitOutcome | void>;
  onClose: () => void;
}

export default function ReportModal({
  open,
  partnerId,
  partnerName,
  liveMode = false,
  onSubmit,
  onClose,
}: ReportModalProps) {
  const titleId = useId();
  const detailId = useId();
  const categoryName = useId();

  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [doneMode, setDoneMode] = useState<'demo' | 'supabase'>('demo');
  const [error, setError] = useState('');

  // 열릴 때마다 폼 초기화
  useEffect(() => {
    if (open) {
      setCategory(null);
      setDescription('');
      setAlsoBlock(true);
      setSubmitting(false);
      setDone(false);
      setDoneMode(liveMode ? 'supabase' : 'demo');
      setError('');
    }
  }, [open, liveMode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!category) {
      setError('신고 사유를 선택해 주세요.');
      return;
    }
    const detail = description.trim();
    if (category === 'other' && detail.length === 0) {
      setError('기타를 선택한 경우 내용을 적어 주세요.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const outcome = await onSubmit({
        reportedUserId: partnerId,
        category,
        description: detail,
        alsoBlock,
      });

      if (outcome && typeof outcome === 'object' && !outcome.ok) {
        setError(outcome.errorMessage || '신고 접수를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }

      const resolvedMode =
        outcome && typeof outcome === 'object' && outcome.mode
          ? outcome.mode
          : liveMode
            ? 'supabase'
            : 'demo';
      setDoneMode(resolvedMode);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafetyDialog open={open} onClose={onClose} titleId={titleId}>
      {done ? (
        <form method="dialog" className="mt-safety-form">
          <h2 id={titleId} className="mt-safety-title">
            신고 내용을 확인했어요
          </h2>
          <p className="mt-safety-text">
            {doneMode === 'supabase' ? (
              <>
                {alsoBlock ? `${partnerName}님과의 대화를 차단 처리했어요. ` : ''}
                안전센터에 신고가 접수되었어요.
              </>
            ) : (
              <>
                {alsoBlock ? `${partnerName}님은 이 기기에서 차단되었어요. ` : ''}
                이 기기의 내 신고 내역에 남았어요. 서버로는 보내지 않아요.
              </>
            )}
          </p>
          <div className="mt-safety-actions">
            <button type="submit" className="mt-safety-btn is-primary">
              확인
            </button>
          </div>
        </form>
      ) : (
        <form className="mt-safety-form" onSubmit={handleSubmit} noValidate>
          <h2 id={titleId} className="mt-safety-title">
            {partnerName}님 신고하기
          </h2>

          <fieldset className="mt-safety-fieldset">
            <legend className="mt-safety-legend">어떤 점이 문제였나요?</legend>
            {REPORT_CATEGORIES.map((c) => (
              <label key={c.id} className="mt-safety-radio">
                <input
                  type="radio"
                  name={categoryName}
                  value={c.id}
                  checked={category === c.id}
                  onChange={() => {
                    setCategory(c.id);
                    setError('');
                  }}
                />
                <span>
                  <strong>{c.label}</strong>
                  <small>{c.hint}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="mt-safety-field" htmlFor={detailId}>
            <span className="mt-safety-legend">
              자세한 내용 {category === 'other' ? '(필수)' : '(선택)'}
            </span>
            <textarea
              id={detailId}
              className="mt-safety-textarea"
              rows={3}
              maxLength={MAX_REPORT_DETAIL_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상황을 간단히 적어 주세요"
            />
            <small className="mt-safety-count">
              {description.length}/{MAX_REPORT_DETAIL_LENGTH}
            </small>
          </label>

          <label className="mt-safety-check">
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
            />
            <span>신고와 함께 이 사용자를 차단할게요</span>
          </label>

          <p className="mt-safety-error" role="alert">
            {error}
          </p>
          <p className="mt-safety-demo">
            {liveMode
              ? '신고 내용은 안전센터에 접수돼요.'
              : '데모 · 서버로 보내지 않고 이 기기에만 남아요.'}
          </p>

          <div className="mt-safety-actions">
            <button type="button" className="mt-safety-btn" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button type="submit" className="mt-safety-btn is-primary" disabled={submitting}>
              {submitting ? '접수 중…' : '신고하기'}
            </button>
          </div>
        </form>
      )}
    </SafetyDialog>
  );
}
