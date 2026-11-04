'use client';

import { useEffect, useId, useState } from 'react';
import type { Invitation } from '@/lib/invitations/types';
import InviteStatus from './InviteStatus';
import {
  WEEKDAY_LABELS,
  buildCalendar,
  countdownCopy,
  daysFromToday,
  formatCellTime,
  formatKoreanClock,
  parseSeoul,
} from './invite-format';
import { INVITE_PREVIEW_MESSAGES } from './sample-content';

type Props = {
  invitation: Invitation;
};

export default function InviteCalendar({ invitation }: Props) {
  const titleId = useId();
  const stamp = parseSeoul(invitation.weddingDate);
  const [days, setDays] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const next = parseSeoul(invitation.weddingDate);
    setDays(next ? daysFromToday(next) : null);
  }, [invitation.weddingDate]);

  const title = stamp ? `예식일 ${stamp.year}년 ${stamp.month}월` : '예식일';
  const rows = stamp ? buildCalendar(stamp.year, stamp.month) : [];
  const cellTime = stamp ? formatCellTime(stamp.hour, stamp.minute) : '';
  const clock = stamp ? formatKoreanClock(stamp.hour, stamp.minute) : '';
  const countdown = days === null ? null : countdownCopy(days);

  return (
    <section className="invite-section" aria-labelledby={titleId} data-invite-reveal>
      <h2 id={titleId} className="invite-h">
        {title}
      </h2>
      {stamp ? (
        <div role="grid" aria-readonly="true" aria-labelledby={titleId} className="invite-cal">
          <div role="row" className="invite-cal-row">
            {WEEKDAY_LABELS.map((label) => (
              <div role="columnheader" key={label} className="invite-cal-head">
                {label}
              </div>
            ))}
          </div>
          {rows.map((row, rowIndex) => (
            <div role="row" className="invite-cal-row" key={row[0]?.key ?? rowIndex}>
              {row.map((cell) => {
                const wedding = cell.inMonth && cell.day === stamp.day;
                const label = wedding
                  ? `${cell.day}일, 예식 ${clock}`
                  : cell.inMonth
                    ? `${cell.day}일`
                    : `${cell.day}일, 이번 달이 아님`;
                return (
                  <div
                    role="gridcell"
                    key={cell.key}
                    className={wedding ? 'invite-cal-cell is-wedding' : cell.inMonth ? 'invite-cal-cell' : 'invite-cal-cell is-out'}
                    aria-current={wedding ? 'date' : undefined}
                    aria-label={label}
                  >
                    <span className="invite-cal-num">{cell.day}</span>
                    {wedding ? <span className="invite-cal-time">{cellTime}</span> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <p>예식일을 읽지 못했어요.</p>
      )}
      {stamp ? (
        <p className="invite-dday" role="status">
          {countdown ? countdown.lead : INVITE_PREVIEW_MESSAGES.loading}
          {countdown ? <span className="invite-dday-badge">{countdown.badge}</span> : null}
        </p>
      ) : null}
      <div className="invite-center">
        <button
          type="button"
          className="invite-btn primary"
          onClick={() => {
            if (!stamp) {
              setStatus('예식일을 읽지 못해서 캘린더에 넣지 않았어요. (데모)');
              return;
            }
            setStatus(
              `캘린더 파일은 만들지 않아요. 예식일은 ${stamp.year}년 ${stamp.month}월 ${stamp.day}일 ${clock}예요. (데모)`,
            );
          }}
        >
          내 캘린더에 저장하기
        </button>
      </div>
      <InviteStatus text={status} />
    </section>
  );
}
