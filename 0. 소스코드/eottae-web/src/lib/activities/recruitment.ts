// 소모임 모집 뱃지. 색만으로 상태를 구분하지 않도록 문구를 붙인다.

import { parseLocalDateTime } from './demo-data';
import type { Gathering } from './types';

export type RecruitmentBadge = {
  id: 'capacity' | 'seats' | 'soon' | 'closed';
  label: string;
};

export type RecruitmentView = {
  badges: RecruitmentBadge[];
  /** 정원 도달, 마감 시각이 지남, 모집 종료 */
  closed: boolean;
  /** 남은 자리. 마감이면 0 */
  seats: number;
  shownCount: number;
};

type Input = Pick<
  Gathering,
  'capacity' | 'currentCount' | 'startsAtIso' | 'recruitmentEndsAt' | 'recruitmentClosed'
>;

function deadlinePassed(value: string | undefined, now: Date): boolean {
  if (!value) return false;
  const deadline = parseLocalDateTime(value);
  if (!deadline) return false;
  return now.getTime() >= deadline.getTime();
}

export function recruitmentView(gathering: Input, requested: boolean, now: Date): RecruitmentView {
  const capacity = gathering.capacity;
  const shownCount = Math.min(capacity, gathering.currentCount + (requested ? 1 : 0));
  const seats = Math.max(0, capacity - shownCount);
  const deadline = gathering.recruitmentEndsAt ?? gathering.startsAtIso;
  const closed =
    gathering.recruitmentClosed === true || shownCount >= capacity || deadlinePassed(deadline, now);
  const badges: RecruitmentBadge[] = [{ id: 'capacity', label: `정원 ${capacity}명` }];
  if (closed) {
    badges.push({ id: 'closed', label: '마감' });
  } else {
    badges.push({ id: 'seats', label: `빈자리 ${seats}` });
    if (seats >= 1 && seats <= 2) badges.push({ id: 'soon', label: '마감 임박' });
  }
  return { badges, closed, seats, shownCount };
}
