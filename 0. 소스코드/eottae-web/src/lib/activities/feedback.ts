// 데이트 코스·소모임의 데모 반응과 영업·폐업 확인 표시.
// 네트워크로 세지 않는다.

import { DEMO_REACTION_SEED } from './demo-data';
import type { InfoCheckRequest, InfoCheckStatus } from './demo-storage';

export const UPDATE_NEEDED_REASON = '업데이트가 필요해요' as const;

export type ActivityKind = 'course' | 'gathering';

export type ActivitySort = 'recommend' | 'like' | 'latest';

export type ReactionBase = {
  likes: number;
  recommends: number;
  listedAt: string;
};

export function reactionKey(kind: ActivityKind, id: string): string {
  return `${kind}:${id}`;
}

export function reactionBase(item: {
  id: string;
  demoLikes?: number;
  demoRecommends?: number;
  listedAt?: string;
  startsAtIso?: string;
}): ReactionBase {
  const seed = DEMO_REACTION_SEED[item.id];
  return {
    likes: clampCount(item.demoLikes ?? seed?.likes ?? 0),
    recommends: clampCount(item.demoRecommends ?? seed?.recommends ?? 0),
    listedAt: item.listedAt ?? seed?.listedAt ?? item.startsAtIso ?? '2026-11-01T00:00',
  };
}

export function shownCount(base: number, mine: boolean): number {
  return base + (mine ? 1 : 0);
}

function clampCount(value: number): number {
  if (!Number.isInteger(value) || value < 0) return 0;
  return Math.min(value, 9999);
}

export function compareBySort(
  sort: ActivitySort,
  a: { title: string; base: ReactionBase; liked: boolean; recommended: boolean },
  b: { title: string; base: ReactionBase; liked: boolean; recommended: boolean }
): number {
  if (sort === 'like') {
    const delta = shownCount(b.base.likes, b.liked) - shownCount(a.base.likes, a.liked);
    if (delta !== 0) return delta;
  } else if (sort === 'recommend') {
    const delta = shownCount(b.base.recommends, b.recommended) - shownCount(a.base.recommends, a.recommended);
    if (delta !== 0) return delta;
  } else if (a.base.listedAt !== b.base.listedAt) {
    return b.base.listedAt.localeCompare(a.base.listedAt);
  }
  return a.title.localeCompare(b.title, 'ko');
}

const STATUS_LABEL: Record<InfoCheckStatus, string> = {
  pending: '정보 확인 중',
  confirmed: '확인 완료',
  planned: '수정 예정',
};

export function infoStatusLabel(rows: readonly Pick<InfoCheckRequest, 'status' | 'atIso'>[]): string | null {
  if (rows.length === 0) return null;
  if (rows.some((row) => row.status === 'pending')) return STATUS_LABEL.pending;
  const latest = [...rows].sort((a, b) => b.atIso.localeCompare(a.atIso))[0];
  return STATUS_LABEL[latest.status];
}

export function infoStatusText(status: InfoCheckStatus): string {
  return STATUS_LABEL[status];
}
