// 3차 모바일 청첩장 예시 데이터 (INV-001)
// 실존 인물·실주소·실전화번호가 없는 순수 가상 데이터만 사용한다.
// 2차 가상 지역(노을구·달동네·한들시 등)을 재사용한다.

import type { Guest, Invitation, Rsvp } from './types';

export const DEMO_INVITATIONS: readonly Invitation[] = [
  {
    id: 'demo-inv-1',
    ownerId: 'user-demo-me',
    title: '민수와 지원의 결혼식에 초대합니다',
    hostNames: '신랑 김민수 · 신부 박지원',
    weddingDate: '2026-11-28 14:00',
    venueLabel: '노을구 달빛웨딩홀 2층 그랜드볼룸',
    greeting:
      '서로 마주 보며 다져온 사랑을 이제 한곳을 바라보며 걸어가고자 합니다.\n소중한 걸음으로 축복해 주시면 더없는 기쁨으로 간직하겠습니다.',
    sharingToken: 'sh-autumn-2026-minsu-jiwon',
    visibility: 'public',
    expiry: '2026-12-31T23:59:59',
    themeId: 'spring-card',
    status: 'published',
    viewerIsOwner: true,
    createdAt: '2026-10-15T10:00:00',
    updatedAt: '2026-11-01T15:30:00',
    notice: '식사는 식장 내 연회장에 정성껏 준비되어 있습니다. 주차는 건물 지하 1~3층 이용 가능합니다.',
    contactNote: '가상 문의 안내: 모바일 청첩장 데모 환경입니다.',
  },
  {
    id: 'demo-inv-2',
    ownerId: 'user-demo-me',
    title: '도현 & 서연의 소박하고 따뜻한 언약식',
    hostNames: '신랑 이도현 · 신부 정서연',
    weddingDate: '2026-12-19 12:30',
    venueLabel: '달동네 별빛하우스 야외가든',
    greeting:
      '겨울의 초입, 소박하지만 따스한 온기로 둘만의 새로운 약속을 맺습니다.\n가까운 분들을 모시고 감사의 마음을 나누고자 합니다.',
    sharingToken: 'sh-winter-2026-dohyun-seoyeon',
    visibility: 'unlisted',
    expiry: '2027-01-31T23:59:59',
    themeId: 'moon-garden',
    status: 'published',
    viewerIsOwner: true,
    createdAt: '2026-10-28T09:00:00',
    updatedAt: '2026-11-02T18:20:00',
    notice: '소규모 스몰 웨딩으로 진행됩니다. 편안한 마음으로 참석해 주세요.',
    contactNote: '가상 문의 안내: 모바일 청첩장 데모 환경입니다.',
  },
  {
    id: 'demo-inv-3',
    ownerId: 'user-demo-other',
    title: '태윤과 하은의 혼례 잔칫날',
    hostNames: '신랑 최태윤 · 신부 강하은',
    weddingDate: '2027-01-16 11:00',
    venueLabel: '한들시 파도마루 전통연회장',
    greeting:
      '새로운 인연의 결실을 맺는 자리에 귀한 분들을 정중히 모십니다.\n밝은 앞날을 함께 축복해 주시기 바랍니다.',
    sharingToken: 'sh-spring-2027-taeyun-haeun',
    visibility: 'public',
    expiry: '2027-02-28T23:59:59',
    themeId: 'hanji',
    status: 'published',
    viewerIsOwner: false,
    createdAt: '2026-11-01T14:00:00',
    updatedAt: '2026-11-01T14:00:00',
    notice: '전통 혼례 식순으로 진행되며, 식후 피로연이 준비되어 있습니다.',
    contactNote: '타인의 예시 청첩장(열람 전용)입니다.',
  },
];

/** 예시 하객 (손준혁·주한태 작업 연동용) */
export const DEMO_GUESTS: readonly Guest[] = [
  {
    id: 'guest-1',
    invitationId: 'demo-inv-1',
    displayName: '김단비',
    guestToken: 'tok-danbi-01',
    createdAt: '2026-10-20T11:00:00',
    memo: '고등학교 동창',
  },
  {
    id: 'guest-2',
    invitationId: 'demo-inv-1',
    displayName: '최시우',
    guestToken: 'tok-siwoo-02',
    createdAt: '2026-10-20T11:05:00',
    memo: '동아리 선배',
  },
  {
    id: 'guest-3',
    invitationId: 'demo-inv-1',
    displayName: '윤도윤',
    guestToken: 'tok-doyun-03',
    createdAt: '2026-10-21T09:30:00',
    memo: '직장 동료',
  },
  {
    id: 'guest-4',
    invitationId: 'demo-inv-2',
    displayName: '한수아',
    guestToken: 'tok-suah-04',
    createdAt: '2026-10-30T14:00:00',
    memo: '가족 지인',
  },
];

/** 예시 RSVP 응답 */
export const DEMO_RSVPS: readonly Rsvp[] = [
  {
    invitationId: 'demo-inv-1',
    guestToken: 'tok-danbi-01',
    response: 'yes',
    partySize: 2,
    note: '결혼 축하해! 둘 다 너무 잘 어울려.',
    respondedAt: '2026-10-22T14:20:00',
  },
  {
    invitationId: 'demo-inv-1',
    guestToken: 'tok-siwoo-02',
    response: 'yes',
    partySize: 1,
    note: '꼭 참석해서 축하해줄게!',
    respondedAt: '2026-10-23T18:10:00',
  },
  {
    invitationId: 'demo-inv-1',
    guestToken: 'tok-doyun-03',
    response: 'maybe',
    partySize: 1,
    note: '일정 확인 후 참석 여부 다시 알려줄게.',
    respondedAt: '2026-10-24T12:00:00',
  },
];
