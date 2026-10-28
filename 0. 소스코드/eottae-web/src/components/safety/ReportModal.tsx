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
          <div className="mt-safety-head">
            <div>
              <h2 id={titleId} className="mt-safety-title">
                신고 내용을 확인했어요
              </h2>
              <p className="mt-safety-desc">
                안전하고 쾌적한 커뮤니티를 위해 신속하게 조치하겠습니다.
              </p>
            </div>
            <button
              type="submit"
              className="mt-safety-close-btn"
              aria-label="닫기"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="mt-safety-text">
            {alsoBlock ? `상대방(${partnerName}) 계정은 즉시 차단 처리되었습니다. ` : ''}
            지금은 체험(DEMO) 화면이라 신고가 실제로 접수되거나 저장되지는 않아요.
          </p>
          <div className="mt-safety-actions" style={{ marginTop: '16px' }}>
            <button type="submit" className="mt-safety-btn is-primary">
              확인
            </button>
          </div>
        </form>
      ) : (
        <form className="mt-safety-form" onSubmit={handleSubmit} noValidate>
          <div className="mt-safety-head">
            <div>
              <h2 id={titleId} className="mt-safety-title">
                {partnerName}님 신고하기
              </h2>
              <p className="mt-safety-desc">
                접수 즉시 안전센터에서 검토하며, 상대방과의 안전한 소통을 지원합니다.
              </p>
            </div>
            <button
              type="button"
              className="mt-safety-close-btn"
              onClick={onClose}
              aria-label="닫기"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <fieldset className="mt-safety-fieldset">
            <legend className="mt-safety-legend">어떤 점이 문제였나요?</legend>
            <div className="mt-safety-radio-group">
              {REPORT_CATEGORIES.map((c) => {
                const isChecked = category === c.id;
                return (
                  <label key={c.id} className={`mt-safety-radio ${isChecked ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name={categoryName}
                      value={c.id}
                      checked={isChecked}
                      onChange={() => {
                        setCategory(c.id);
                        setError('');
                      }}
                    />
                    <span className="mt-safety-radio-content">
                      <strong>{c.label}</strong>
                      <small>{c.hint}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="mt-safety-field" htmlFor={detailId}>
            <span className="mt-safety-field-label">
              자세한 내용 {category === 'other' ? '(필수)' : '(선택)'}
            </span>
            <textarea
              id={detailId}
              className="mt-safety-textarea"
              rows={3}
              maxLength={MAX_REPORT_DETAIL_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상황을 간단히 적어 주세요 (예: 비매너 언행, 상업적 유도 등)"
            />
            <div className="mt-safety-textarea-footer">
              <small className="mt-safety-count">
                {description.length}/{MAX_REPORT_DETAIL_LENGTH}
              </small>
            </div>
          </label>

          <label className={`mt-safety-check ${alsoBlock ? 'is-checked' : ''}`}>
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
            />
            <span className="mt-safety-check-text">
              <strong>신고와 함께 이 사용자를 차단할게요</strong>
              <small>차단 시 상대방과의 대화 및 매칭이 즉시 중단됩니다.</small>
            </span>
          </label>

          {error && (
            <p className="mt-safety-error" role="alert">
              {error}
            </p>
          )}

          <div className="mt-safety-demo">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>DEMO · 제출해도 서버로 전송되지 않아요.</span>
          </div>

          <div className="mt-safety-actions">
            <button type="button" className="mt-safety-btn mt-safety-btn--cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="mt-safety-btn is-primary">
              신고 접수하기
            </button>
          </div>
        </form>
      )}
    </SafetyDialog>
  );
}
