'use client';

import type { InfoCheckRequest, InfoCheckStatus } from '@/lib/activities/demo-storage';
import { infoStatusText } from '@/lib/activities/feedback';

type Props = {
  rows: readonly InfoCheckRequest[];
  canResolve: boolean;
  onResolve: (id: string, status: Exclude<InfoCheckStatus, 'pending'>) => void;
};

export default function InfoChecks({ rows, canResolve, onResolve }: Props) {
  if (rows.length === 0) {
    return canResolve ? (
      <p className="act-empty" role="status">
        아직 영업·폐업 확인 요청이 없어요.
      </p>
    ) : null;
  }

  return (
    <ul className="act-stack">
      {rows.map((row) => (
        <li className="act-person" key={row.id}>
          <p className="act-person-name">{infoStatusText(row.status)}</p>
          <p>사유 · {row.reason}</p>
          <p className="act-meta">
            요청 시각 · {row.atLabel} · 데모
          </p>
          {canResolve && row.status === 'pending' && (
            <div className="act-actions">
              <button type="button" className="btn primary" onClick={() => onResolve(row.id, 'confirmed')}>
                확인 완료
              </button>
              <button type="button" className="btn outline" onClick={() => onResolve(row.id, 'planned')}>
                수정 예정
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
