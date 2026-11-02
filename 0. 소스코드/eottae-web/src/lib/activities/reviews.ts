// 종료 모임 후기 데모. 예시 문장과 이 브라우저에 남긴 한 줄만 합친다.

import { DEMO_REVIEWS } from './demo-data';
import type { MyJoinStatus, StoredReview } from './demo-storage';
import type { Gathering } from './types';

export type ReviewRow = {
  id: string;
  nickname: string;
  stars: number;
  body: string;
  atLabel: string;
  mine: boolean;
};

/** 후기 탭은 종료 표시가 있는 예시만 연다. 시작 시각만 지나서는 열지 않는다. */
export function isEndedGathering(gathering: Pick<Gathering, 'ended'>): boolean {
  return gathering.ended === true;
}

export function canWriteReview(gathering: Gathering, join: MyJoinStatus | null): boolean {
  if (!isEndedGathering(gathering)) return false;
  if (gathering.viewerIsHost === true || gathering.mine === true || gathering.demoAttended === true) return true;
  return join === 'accepted';
}

export function collectReviews(
  gatheringId: string,
  hiddenIds: readonly string[],
  mine: readonly StoredReview[] | undefined
): ReviewRow[] {
  const hidden = new Set(hiddenIds);
  const samples: ReviewRow[] = DEMO_REVIEWS.filter(
    (review) => review.gatheringId === gatheringId && !hidden.has(review.id)
  ).map((review) => ({
    id: review.id,
    nickname: review.nickname,
    stars: review.stars,
    body: review.body,
    atLabel: review.atLabel,
    mine: false,
  }));
  const own: ReviewRow[] = (mine ?? [])
    .filter((review) => review.mine === true)
    .map((review) => ({
      id: review.id,
      nickname: review.nickname,
      stars: review.stars,
      body: review.body,
      atLabel: review.atLabel,
      mine: true,
    }));
  return [...own, ...samples];
}

export function averageStars(rows: readonly { stars: number }[]): number | null {
  if (rows.length === 0) return null;
  const sum = rows.reduce((total, row) => total + row.stars, 0);
  return Math.round((sum / rows.length) * 10) / 10;
}
