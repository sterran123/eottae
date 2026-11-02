'use client';

import { useId, useState } from 'react';
import DemoDialog from '@/components/activities/DemoDialog';

export const ACTIVITY_REPORT_REASONS = ['불쾌하거나 위험한 안내', '사칭·광고', '공개되지 않은 장소로 유도', '기타'] as const;

type Props = {
  subject: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export default function ActivityReportDialog({ subject, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState<(typeof ACTIVITY_REPORT_REASONS)[number]>(ACTIVITY_REPORT_REASONS[0]);
  const reasonName = useId();

  return (
    <DemoDialog titleId="act-report-title" title="신고 확인 (데모)" onClose={onClose}>
      <p>
        <span className="act-demo-mark">데모</span> {subject} 예시를 신고하는 척만 합니다. 사유는 어디에도 저장되지 않아요.
      </p>
      <fieldset className="act-choice-list">
        <legend>예시 사유</legend>
        {ACTIVITY_REPORT_REASONS.map((item) => (
          <label className="act-choice" key={item}>
            <input
              type="radio"
              name={reasonName}
              value={item}
              checked={reason === item}
              onChange={() => setReason(item)}
            />
            <span>{item}</span>
          </label>
        ))}
      </fieldset>
      <div className="act-actions">
        <button type="button" className="btn primary" onClick={() => onConfirm(reason)}>
          데모로 확인
        </button>
        <button type="button" className="btn outline" onClick={onClose}>
          닫기
        </button>
      </div>
    </DemoDialog>
  );
}
