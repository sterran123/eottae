'use client';

import { useId, useState } from 'react';
import DemoDialog from '@/components/activities/DemoDialog';

export const ACTIVITY_REPORT_REASONS = [
  '불쾌하거나 위험한 안내',
  '사칭·광고',
  '공개되지 않은 장소로 유도',
  '업데이트가 필요해요',
  '기타',
] as const;

export type ActivityReportReason = (typeof ACTIVITY_REPORT_REASONS)[number];

export const ACTIVITY_REPORT_NOTE_MAX = 200;

type Props = {
  subject: string;
  /** 후기 신고에는 영업·폐업 확인 사유를 두지 않는다. */
  allowUpdate?: boolean;
  onClose: () => void;
  onConfirm: (reason: ActivityReportReason, note: string) => void;
};

export default function ActivityReportDialog({ subject, allowUpdate = true, onClose, onConfirm }: Props) {
  const reasons = allowUpdate
    ? ACTIVITY_REPORT_REASONS
    : ACTIVITY_REPORT_REASONS.filter((item) => item !== '업데이트가 필요해요');
  const [reason, setReason] = useState<ActivityReportReason | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const titleId = useId();
  const reasonName = useId();
  const noteId = useId();
  const errorId = useId();
  const other = reason === '기타';

  const submit = () => {
    if (!reason) {
      setError('신고 사유를 선택해 주세요.');
      return;
    }
    const text = note.trim();
    if (reason === '기타' && text.length === 0) {
      setError('기타 사유를 입력하세요.');
      return;
    }
    if (reason === '기타' && text.length > ACTIVITY_REPORT_NOTE_MAX) {
      setError(`기타 사유는 ${ACTIVITY_REPORT_NOTE_MAX}자까지 적을 수 있어요.`);
      return;
    }
    onConfirm(reason, reason === '기타' ? text : '');
  };

  return (
    <DemoDialog
      titleId={titleId}
      title="신고하기"
      onClose={onClose}
      panelClassName="act-report-modal"
      backdropClassName="act-report-backdrop"
    >
      <p className="act-report-prompt">어떤 문제가 있나요?</p>
      <p>
        <span className="act-demo-mark">데모</span> {subject} 예시입니다.{' '}
        {allowUpdate
          ? '일반 신고는 저장하거나 전송하지 않아요. 「업데이트가 필요해요」만 이 브라우저의 확인 요청으로 남깁니다.'
          : '이 신고는 확인만 하고 저장하거나 전송하지 않아요.'}
      </p>
      <fieldset className="act-choice-list">
        <legend className="act-sr">신고 사유</legend>
        {reasons.map((item) => (
          <label className="act-choice" key={item}>
            <input
              type="radio"
              name={reasonName}
              value={item}
              checked={reason === item}
              onChange={() => {
                setReason(item);
                setError('');
              }}
            />
            <span>{item}</span>
          </label>
        ))}
      </fieldset>
      <label className="act-field" htmlFor={noteId}>
        <span>기타 사유를 입력하세요{other ? ' (필수)' : ''}</span>
        <textarea
          id={noteId}
          className="act-report-note"
          rows={3}
          maxLength={ACTIVITY_REPORT_NOTE_MAX}
          value={note}
          disabled={!other}
          placeholder="기타 사유를 입력하세요"
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setNote(event.target.value);
            setError('');
          }}
        />
        <small className="act-meta">
          {note.length}/{ACTIVITY_REPORT_NOTE_MAX}
        </small>
      </label>
      <p id={errorId} className="act-form-error" role="alert" hidden={error.length === 0}>
        {error || '사유를 확인해 주세요.'}
      </p>
      <div className="act-actions">
        <button type="button" className="btn primary" onClick={submit}>
          데모로 보내기
        </button>
        <button type="button" className="btn outline" onClick={onClose}>
          닫기
        </button>
      </div>
    </DemoDialog>
  );
}
