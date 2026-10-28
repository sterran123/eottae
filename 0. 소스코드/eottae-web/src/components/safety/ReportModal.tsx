'use client';

// ============================================================
//  저장 경로: src/components/safety/ReportModal.tsx
//  담당: 손준혁 · MATCH-008
//  역할: 신고 접수 모달 — 사유 선택(필수) → 상세 입력 → (선택)동시 차단 → 완료 안내.
//  [정직성] DEMO이므로 서버 접수·검토 일정을 약속하는 문구를 쓰지 않는다 (RULES 6).
//  [개인정보] 신고 내용은 state에만 두고 로그/저장하지 않는다.
// ============================================================

import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  MAX_REPORT_DETAIL_LENGTH,
  REPORT_CATEGORIES,
  type ReportCategory,
  type ReportRequest,
} from '@/lib/safety/types';
import SafetyDialog from './SafetyDialog';

interface ReportModalProps {
  open: boolean;
  partnerId: string;
  partnerName: string;
  /** 신고 제출 시 호출 (DEMO: 부모가 alsoBlock이면 차단 적용) */
  onSubmit: (req: ReportRequest) => void;
  onClose: () => void;
}

export default function ReportModal({
  open,
  partnerId,
  partnerName,
  onSubmit,
  onClose,
}: ReportModalProps) {
  const titleId = useId();
  const detailId = useId();
  const categoryName = useId();

  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // 열릴 때마다 폼 초기화
  useEffect(() => {
    if (open) {
      setCategory(null);
      setDescription('');
      setAlsoBlock(true);
      setDone(false);
      setError('');
    }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!category) {
      setError('신고 사유를 선택해 주세요.');
      return;
    }
    const detail = description.trim();
    if (category === 'other' && detail.length === 0) {
      setError('기타를 선택한 경우 내용을 적어 주세요.');
      return;
    }
    onSubmit({ reportedUserId: partnerId, category, description: detail, alsoBlock });
    setDone(true);
  }

  return (
    <SafetyDialog open={open} onClose={onClose} titleId={titleId}>
      {done ? (
        <form method="dialog" className="mt-safety-form">
          <h2 id={titleId} className="mt-safety-title">
            신고 내용을 확인했어요
          </h2>
          <p className="mt-safety-text">
            {alsoBlock ? `${partnerName}님은 차단되었어요. ` : ''}
            지금은 체험(DEMO) 화면이라 신고가 실제로 접수되거나 저장되지는 않아요.
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
          <p className="mt-safety-demo">DEMO · 제출해도 서버로 전송되지 않아요.</p>

          <div className="mt-safety-actions">
            <button type="button" className="mt-safety-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="mt-safety-btn is-primary">
              신고하기
            </button>
          </div>
        </form>
      )}
    </SafetyDialog>
  );
}
