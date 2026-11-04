'use client';

import { useEffect, useId, useState } from 'react';
import DemoDialog from '@/components/activities/DemoDialog';
import type { ReviewRow } from '@/lib/activities/reviews';

type Props = {
  rows: readonly ReviewRow[];
  averageLabel: string;
  canWrite: boolean;
  lockedReason: string;
  onSave: (stars: number, body: string) => void;
  onDelete: () => void;
  onReport: (row: ReviewRow) => void;
};

function starText(stars: number): string {
  return `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} ${stars}점`;
}

export default function GatheringReviews({
  rows,
  averageLabel,
  canWrite,
  lockedReason,
  onSave,
  onDelete,
  onReport,
}: Props) {
  const mine = rows.find((row) => row.mine) ?? null;
  const [stars, setStars] = useState<number | null>(mine?.stars ?? null);
  const [body, setBody] = useState(mine?.body ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const starName = useId();
  const errorId = useId();

  useEffect(() => {
    setStars(mine?.stars ?? null);
    setBody(mine?.body ?? '');
    setError(null);
  }, [mine?.id, mine?.stars, mine?.body]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = body.trim();
    if (!stars) {
      setError('별점을 1점에서 5점 사이로 골라 주세요.');
      return;
    }
    if (text.length < 2 || text.length > 80) {
      setError('한줄 후기는 2자에서 80자 사이로 적어 주세요.');
      return;
    }
    setError(null);
    onSave(stars, text);
  };

  return (
    <div className="act-stack">
      <div className="act-subhead">
        <h3 id="act-review-title">후기</h3>
        <span className="act-demo-mark">데모</span>
      </div>
      <p role="status">{averageLabel}</p>
      <p className="act-note">욕설과 연락처·주소 같은 개인정보는 적지 마세요. 이 후기는 데모이고 이 브라우저에만 남아요.</p>
      <p className="act-note">참가 확정자만 후기를 쓸 수 있어요. {lockedReason}</p>

      {canWrite ? (
        <form className="act-stack" onSubmit={submit} noValidate>
          <fieldset className="act-stars">
            <legend>별점</legend>
            {[1, 2, 3, 4, 5].map((score) => (
              <label className="act-choice" key={score}>
                <input
                  type="radio"
                  name={starName}
                  value={score}
                  checked={stars === score}
                  onChange={() => setStars(score)}
                />
                <span>{score}점</span>
              </label>
            ))}
          </fieldset>
          <label className="act-field">
            <span>한줄 후기</span>
            <input
              type="text"
              maxLength={80}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              aria-describedby={error ? errorId : undefined}
            />
          </label>
          {error && (
            <p id={errorId} className="act-form-error" role="alert" tabIndex={-1}>
              {error}
            </p>
          )}
          <div className="act-actions">
            <button type="submit" className="btn primary">
              {mine ? '후기 수정' : '후기 남기기'}
            </button>
            {mine && (
              <button type="button" className="btn outline" onClick={() => setConfirmDelete(true)}>
                후기 삭제
              </button>
            )}
            <span className="act-demo-mark">데모</span>
          </div>
        </form>
      ) : (
        <div className="act-actions">
          <button type="button" className="btn primary" disabled>
            후기 남기기
          </button>
          <span className="act-demo-mark">확정자만 · 데모</span>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="act-empty" role="status">
          아직 남은 후기가 없어요.
        </p>
      ) : (
        <ul className="act-stack" aria-label="후기 목록">
          {rows.map((row) => (
            <li className="act-review" key={row.id}>
              <p className="act-review-name">
                {row.nickname}
                {row.mine ? ' · 내 후기' : ''}
              </p>
              <p className="act-review-stars">{starText(row.stars)}</p>
              <p>{row.body}</p>
              <p className="act-meta">{row.atLabel} · 데모</p>
              {!row.mine && (
                <div className="act-actions">
                  <button type="button" className="btn outline" onClick={() => onReport(row)}>
                    후기 신고
                  </button>
                  <span className="act-demo-mark">데모 · 확인만</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {confirmDelete && (
        <DemoDialog titleId="act-review-delete-title" title="후기 삭제 (데모)" onClose={() => setConfirmDelete(false)}>
          <p>
            <span className="act-demo-mark">데모</span> 내가 쓴 한줄 후기를 이 브라우저에서 지웁니다. 예시 후기는 그대로예요.
          </p>
          <div className="act-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setConfirmDelete(false);
                onDelete();
              }}
            >
              데모로 삭제
            </button>
            <button type="button" className="btn outline" onClick={() => setConfirmDelete(false)}>
              닫기
            </button>
          </div>
        </DemoDialog>
      )}
    </div>
  );
}
