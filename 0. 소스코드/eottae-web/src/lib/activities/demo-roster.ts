// 모임장 데모의 가상 참가자. 네트워크로 보내지 않는다.

import type { Gathering } from './types';

export type PersonStatus = 'confirmed' | 'pending' | 'accepted' | 'rejected' | 'kicked';

export type VirtualPerson = {
  id: string;
  nickname: string;
  intro: string;
  requestedAtLabel: string;
  bucket: 'confirmed' | 'pending';
  status: PersonStatus;
};

export type GatheringOps = {
  recruitment?: 'closed' | 'open';
  people?: VirtualPerson[];
};

const POOL: readonly { nickname: string; intro: string; requestedAtLabel: string }[] = [
  { nickname: '솜사탕', intro: '말수는 적고, 자리는 출입구 쪽이 편해요.', requestedAtLabel: '2026-11-01 09:20' },
  { nickname: '초록우체통', intro: '처음 참가라 이름표는 닉네임만 쓸게요.', requestedAtLabel: '2026-11-01 11:05' },
  { nickname: '밤산책', intro: '끝날 때 같이 문 앞까지만 걸어 주세요.', requestedAtLabel: '2026-11-01 14:40' },
  { nickname: '도란도란', intro: '듣기만 해도 괜찮은지 미리 적어 둡니다.', requestedAtLabel: '2026-11-01 16:15' },
  { nickname: '작은램프', intro: '음료는 각자 시키고, 메뉴 강요는 싫어요.', requestedAtLabel: '2026-11-01 18:02' },
  { nickname: '하얀봉투', intro: '한 줄 소개 외의 연락처는 적지 않을게요.', requestedAtLabel: '2026-11-01 19:28' },
  { nickname: '수국차', intro: '지각하면 조용히 끝자리에 앉겠습니다.', requestedAtLabel: '2026-11-02 08:10' },
  { nickname: '느긋한고양이', intro: '사진 찍기는 다들 괜찮다고 할 때만 할게요.', requestedAtLabel: '2026-11-02 08:46' },
  { nickname: '종이배', intro: '규칙 설명은 천천히 해 주셔도 됩니다.', requestedAtLabel: '2026-11-02 09:30' },
  { nickname: '별사탕', intro: '알레르기는 없고, 자리는 창가가 좋아요.', requestedAtLabel: '2026-11-02 10:05' },
  { nickname: '조용한라디오', intro: '큰 소리보다 돌아가며 말하는 자리가 좋아요.', requestedAtLabel: '2026-11-02 10:44' },
  { nickname: '따뜻한장갑', intro: '일찍 도착하면 입구에서 기다릴게요.', requestedAtLabel: '2026-11-02 11:18' },
  { nickname: '유리구슬', intro: '모임 뒤 2차 제안은 정중히 거절할게요.', requestedAtLabel: '2026-11-02 12:02' },
  { nickname: '늦은기차', intro: '5분 정도 늦을 수 있어요. 시작은 기다려 주세요.', requestedAtLabel: '2026-11-02 13:26' },
  { nickname: '보라리본', intro: '취미 실력은 초보고, 점수는 매기지 말아 주세요.', requestedAtLabel: '2026-11-02 15:11' },
  { nickname: '모래시계', intro: '끝난 뒤에는 바로 헤어지는 일정이 좋아요.', requestedAtLabel: '2026-11-02 16:40' },
];

function hashId(id: string): number {
  let value = 0;
  for (let index = 0; index < id.length; index += 1) {
    value = (value * 33 + id.charCodeAt(index)) >>> 0;
  }
  return value;
}

export function isVirtualPerson(value: unknown): value is VirtualPerson {
  if (!value || typeof value !== 'object') return false;
  const row = value as VirtualPerson;
  const statusOk =
    row.status === 'confirmed' ||
    row.status === 'pending' ||
    row.status === 'accepted' ||
    row.status === 'rejected' ||
    row.status === 'kicked';
  return (
    typeof row.id === 'string' &&
    row.id.length > 0 &&
    row.id.length <= 40 &&
    typeof row.nickname === 'string' &&
    row.nickname.trim().length >= 2 &&
    row.nickname.length <= 24 &&
    typeof row.intro === 'string' &&
    row.intro.trim().length >= 2 &&
    row.intro.length <= 80 &&
    typeof row.requestedAtLabel === 'string' &&
    row.requestedAtLabel.length > 0 &&
    row.requestedAtLabel.length <= 40 &&
    (row.bucket === 'confirmed' || row.bucket === 'pending') &&
    statusOk
  );
}

/** 확정 인원은 모임장을 뺀 나머지. 대기 요청은 인원에 넣지 않는다. */
export function seedPeople(gathering: Pick<Gathering, 'id' | 'currentCount'>): VirtualPerson[] {
  const start = hashId(gathering.id) % POOL.length;
  const confirmedCount = Math.max(0, Math.min(Math.max(0, gathering.currentCount - 1), POOL.length - 2));
  const people: VirtualPerson[] = [];
  const used = new Set<number>();

  for (let index = 0; index < confirmedCount; index += 1) {
    const poolIndex = (start + index) % POOL.length;
    used.add(poolIndex);
    const row = POOL[poolIndex];
    people.push({
      id: `c-${poolIndex}`,
      nickname: row.nickname,
      intro: row.intro,
      requestedAtLabel: row.requestedAtLabel,
      bucket: 'confirmed',
      status: 'confirmed',
    });
  }

  let pending = 0;
  for (let step = 0; pending < 2 && step < POOL.length; step += 1) {
    const poolIndex = (start + confirmedCount + step) % POOL.length;
    if (used.has(poolIndex)) continue;
    used.add(poolIndex);
    pending += 1;
    const row = POOL[poolIndex];
    people.push({
      id: `p-${poolIndex}`,
      nickname: row.nickname,
      intro: row.intro,
      requestedAtLabel: row.requestedAtLabel,
      bucket: 'pending',
      status: 'pending',
    });
  }

  return people;
}

export function rosterPeople(gathering: Pick<Gathering, 'id' | 'currentCount'>, ops: GatheringOps | undefined): VirtualPerson[] {
  if (ops?.people && ops.people.length > 0) return ops.people;
  return seedPeople(gathering);
}

export function withPersonStatus(
  people: readonly VirtualPerson[],
  personId: string,
  status: PersonStatus
): VirtualPerson[] {
  return people.map((person) => (person.id === personId ? { ...person, status } : person));
}

export function presentGathering(base: Gathering, ops: GatheringOps | undefined): Gathering {
  const people = ops?.people;
  const accepted = people ? people.filter((person) => person.bucket === 'pending' && person.status === 'accepted').length : 0;
  const kicked = people ? people.filter((person) => person.bucket === 'confirmed' && person.status === 'kicked').length : 0;
  const currentCount = Math.max(0, Math.min(base.capacity, base.currentCount + accepted - kicked));
  const next: Gathering = { ...base, currentCount };
  if (ops?.recruitment === 'closed') next.recruitmentClosed = true;
  else if (ops?.recruitment === 'open') {
    next.recruitmentClosed = false;
    next.recruitmentForceOpen = true;
  }
  return next;
}

export function recruitmentToggleLabel(
  presentedClosed: boolean,
  override: GatheringOps['recruitment']
): '모집 마감' | '모집 재개' {
  if (override === 'open') return '모집 마감';
  if (override === 'closed' || presentedClosed) return '모집 재개';
  return '모집 마감';
}
