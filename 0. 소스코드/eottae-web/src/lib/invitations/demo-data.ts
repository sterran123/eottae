// 3차 모바일 청첩장 예시 데이터 (INV-001)
// 실존 인물(팀원 실명 포함)·실주소·실전화번호가 없는 순수 가상 데이터만 사용한다.
// 2차 가상 지역(노을구·달동네·한들시 등)을 재사용한다.
// 요구사항 인수 조건: 예시 청첩장 정확히 2~3개 준수 (3건)

import type { Guest, Invitation, Rsvp } from './types';

export const DEMO_INVITATIONS: readonly Invitation[] = [
  {
    id: 'demo-inv-1',
    ownerId: 'user-demo-me',
    title: '이서윤과 박하람의 결혼식에 초대합니다',
    hostNames: '신랑 이서윤 · 신부 박하람',
    weddingDate: '2026-11-28T14:00:00+09:00',
    venueLabel: '노을구 달빛웨딩홀 2층 그랜드볼룸',
    greeting:
      '서로 마주 보며 다져온 사랑을 이제 한곳을 바라보며 걸어가고자 합니다.\n소중한 걸음으로 축복해 주시면 더없는 기쁨으로 간직하겠습니다.',
    sharingToken: 'k7Qm2pL9xRt4vNw8aB3cYd6e',
    visibility: 'public',
    expiry: '2026-12-31T23:59:59+09:00',
    themeId: 'spring-card',
    status: 'published',
    viewerIsOwner: true,
    createdAt: '2026-10-15T10:00:00+09:00',
    updatedAt: '2026-11-01T15:30:00+09:00',
    notice: '식사는 식장 내 연회장에 정성껏 준비되어 있습니다. 주차는 건물 지하 1~3층 이용 가능합니다.',
    contactNote: '가상 문의 안내: 모바일 청첩장 데모 환경입니다.',
    layoutStyle: 'classic',
    bgmPreset: 'romantic',
    sectionOrder: ['greeting', 'schedule', 'location', 'account', 'rsvp_preview'],
  },
  {
    id: 'demo-inv-2',
    ownerId: 'user-demo-me',
    title: '한결과 은우의 소박하고 따뜻한 언약식',
    hostNames: '신랑 조한결 · 신부 송은우',
    weddingDate: '2026-12-19T12:30:00+09:00',
    venueLabel: '달동네 별빛하우스 야외가든',
    greeting:
      '겨울의 초입, 소박하지만 따스한 온기로 둘만의 새로운 약속을 맺습니다.\n가까운 분들을 모시고 감사의 마음을 나누고자 합니다.',
    sharingToken: 'm3Xp8vY2wT6zQr1kL5nBd9aF',
    visibility: 'unlisted',
    expiry: '2027-01-31T23:59:59+09:00',
    themeId: 'moon-garden',
    status: 'published',
    viewerIsOwner: true,
    createdAt: '2026-10-28T09:00:00+09:00',
    updatedAt: '2026-11-02T18:20:00+09:00',
    notice: '소규모 스몰 웨딩으로 진행됩니다. 편안한 마음으로 참석해 주세요.',
    contactNote: '가상 문의 안내: 모바일 청첩장 데모 환경입니다.',
    layoutStyle: 'modern',
    bgmPreset: 'piano',
    sectionOrder: ['greeting', 'location', 'schedule', 'account', 'rsvp_preview'],
  },
  {
    id: 'demo-inv-3',
    ownerId: 'user-demo-other',
    title: '김구름과 최별의 혼례 잔칫날',
    hostNames: '신랑 김구름 · 신부 최별',
    weddingDate: '2027-01-16T11:00:00+09:00',
    venueLabel: '한들시 파도마루 전통연회장',
    greeting:
      '새로운 인연의 결실을 맺는 자리에 귀한 분들을 정중히 모십니다.\n밝은 앞날을 함께 축복해 주시기 바랍니다.',
    sharingToken: 'j4Nm7qR1tW5xZv9yC2sAe8bK',
    visibility: 'public',
    expiry: '2027-02-28T23:59:59+09:00',
    themeId: 'hanji',
    status: 'published',
    viewerIsOwner: false,
    createdAt: '2026-11-01T14:00:00+09:00',
    updatedAt: '2026-11-01T14:00:00+09:00',
    notice: '전통 혼례 식순으로 진행되며, 식후 피로연이 준비되어 있습니다.',
    contactNote: '타인의 예시 청첩장(열람 전용)입니다.',
    layoutStyle: 'minimal',
    bgmPreset: 'acoustic',
    sectionOrder: ['greeting', 'schedule', 'location', 'rsvp_preview', 'account'],
  },
];

/** 예시 하객 (닉네임 기반 가상 데이터, 손준혁·주한태 작업 연동용) */
export const DEMO_GUESTS: readonly Guest[] = [
  {
    id: 'guest-1',
    invitationId: 'demo-inv-1',
    displayName: '솜사탕',
    guestToken: 'gt-x8k2m9p1',
    createdAt: '2026-10-20T11:00:00+09:00',
    memo: '동아리 지인',
  },
  {
    id: 'guest-2',
    invitationId: 'demo-inv-1',
    displayName: '종이배',
    guestToken: 'gt-q4v7w2n6',
    createdAt: '2026-10-20T11:05:00+09:00',
    memo: '고향 친구',
  },
  {
    id: 'guest-3',
    invitationId: 'demo-inv-1',
    displayName: '별사탕',
    guestToken: 'gt-z3y6r8b5',
    createdAt: '2026-10-21T09:30:00+09:00',
    memo: '직장 동료',
  },
  {
    id: 'guest-4',
    invitationId: 'demo-inv-2',
    displayName: '구름달',
    guestToken: 'gt-t9j1s5d2',
    createdAt: '2026-10-30T14:00:00+09:00',
    memo: '취미 모임 지인',
  },
];

/** 예시 RSVP 응답 */
export const DEMO_RSVPS: readonly Rsvp[] = [
  {
    invitationId: 'demo-inv-1',
    guestToken: 'gt-x8k2m9p1',
    response: 'yes',
    partySize: 2,
    note: '결혼 축하해! 둘 다 너무 잘 어울려.',
    respondedAt: '2026-10-22T14:20:00+09:00',
  },
  {
    invitationId: 'demo-inv-1',
    guestToken: 'gt-q4v7w2n6',
    response: 'yes',
    partySize: 1,
    note: '꼭 참석해서 축하해줄게!',
    respondedAt: '2026-10-23T18:10:00+09:00',
  },
  {
    invitationId: 'demo-inv-1',
    guestToken: 'gt-z3y6r8b5',
    response: 'maybe',
    partySize: 1,
    note: '일정 확인 후 참석 여부 다시 알려줄게.',
    respondedAt: '2026-10-24T12:00:00+09:00',
  },
];
