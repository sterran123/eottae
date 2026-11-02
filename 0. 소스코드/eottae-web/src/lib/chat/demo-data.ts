// ============================================================
//  저장 경로: src/lib/chat/demo-data.ts
//  담당: 손준혁 · MATCH-007
//  역할: 데모 대화방. 상대 id·nickname은 추천 프로필(rec_*)과 같다.
//        시각은 ISO 8601. 실제 사용자 데이터가 아니다.
// ============================================================

import { DEMO_RECOMMENDATIONS } from '@/lib/match/demo-recommendations';
import type { ChatMessage, ChatPartner, ChatRoomInfo } from './types';

/** 이 탭의 기본 데모 사용자. 추천 카드에는 없는 내 자리. */
export const DEMO_SELF: ChatPartner = { id: 'demo_me', nickname: '나' };

function recommendPartner(id: string): ChatPartner {
  const found = DEMO_RECOMMENDATIONS.find((item) => item.id === id);
  return { id, nickname: found?.nickname ?? '상대' };
}

function message(id: string, senderId: string, body: string, createdAt: string): ChatMessage {
  return {
    id,
    senderId,
    sender: senderId === DEMO_SELF.id ? 'me' : 'partner',
    body,
    createdAt,
    status: 'sent',
  };
}

const BADA = recommendPartner('rec_bada');
const GAEUL = recommendPartner('rec_gaeul');
const HANEUL = recommendPartner('rec_haneul');
const DOYUN = recommendPartner('rec_doyun');

export const DEMO_ROOMS: ChatRoomInfo[] = [
  {
    id: 'demo-room-1',
    partner: BADA,
    members: [DEMO_SELF, BADA],
    timeLabel: '방금',
    unread: 1,
    initialMessages: [
      message('r1-m1', BADA.id, '안녕하세요! 서로 관심을 표시해서 대화가 열렸어요 :)', '2026-10-26T12:00:00+09:00'),
      message('r1-m2', BADA.id, '요즘 즐겨 보는 영화가 있나요?', '2026-10-26T12:01:00+09:00'),
    ],
  },
  {
    id: 'demo-room-2',
    partner: GAEUL,
    members: [DEMO_SELF, GAEUL],
    timeLabel: '10분 전',
    unread: 2,
    initialMessages: [
      message('r2-m1', GAEUL.id, '안녕하세요! 러닝 좋아하신다고 해서 반가웠어요.', '2026-10-26T09:10:00+09:00'),
      message('r2-m2', DEMO_SELF.id, '네! 주말마다 가볍게 뛰어요.', '2026-10-26T09:12:00+09:00'),
      message('r2-m3', GAEUL.id, '이번 주말 여의도 러닝 어떠세요?', '2026-10-26T09:15:00+09:00'),
    ],
  },
  {
    id: 'demo-room-3',
    partner: HANEUL,
    members: [DEMO_SELF, HANEUL],
    timeLabel: '어제',
    unread: 0,
    initialMessages: [
      message('r3-m1', HANEUL.id, '성수동 전시 같이 가보고 싶어요.', '2026-10-25T18:00:00+09:00'),
      message('r3-m2', DEMO_SELF.id, '좋아요! 시간 맞춰봐요.', '2026-10-25T18:05:00+09:00'),
      message('r3-m3', HANEUL.id, '티켓 예매 성공했어요!', '2026-10-25T18:20:00+09:00'),
    ],
  },
  {
    id: 'demo-room-4',
    partner: DOYUN,
    members: [DEMO_SELF, DOYUN],
    timeLabel: '2일 전',
    unread: 0,
    initialMessages: [
      message('r4-m1', DEMO_SELF.id, '보드게임 카페 추천해주실 수 있어요?', '2026-10-24T20:00:00+09:00'),
      message('r4-m2', DOYUN.id, '스플렌더 확장판 해보셨어요?', '2026-10-24T20:10:00+09:00'),
    ],
  },
];

/** 데모 자동 응답 순환 목록. 다른 탭 사용자가 보낸 말이 아니다. */
export const DEMO_REPLIES: string[] = [
  '오 저도 그거 좋아해요!',
  '그렇군요, 더 얘기해 주세요.',
  '주말엔 보통 뭐 하세요?',
  '재미있네요 ㅎㅎ',
];

/** 이 탭에서 고를 수 있는 데모 사용자. */
export const DEMO_ACTORS: ChatPartner[] = [DEMO_SELF, BADA, GAEUL, HANEUL, DOYUN];

/** 추천 프로필 id → 대화방. 구성원 id와 같다. */
export const DEMO_RECOMMENDATION_ROOM_MAP: Readonly<Record<string, string>> = {
  rec_bada: 'demo-room-1',
  rec_gaeul: 'demo-room-2',
  rec_haneul: 'demo-room-3',
  rec_doyun: 'demo-room-4',
};

/** 방 id 또는 상대 id로 데모 방을 찾는다. 없으면 null. */
export function findDemoRoomId(roomOrPartnerId: string | null | undefined): string | null {
  if (!roomOrPartnerId) return null;
  const byRoom = DEMO_ROOMS.find((room) => room.id === roomOrPartnerId);
  if (byRoom) return byRoom.id;
  const mapped = DEMO_RECOMMENDATION_ROOM_MAP[roomOrPartnerId];
  if (mapped && DEMO_ROOMS.some((room) => room.id === mapped)) return mapped;
  const byPartner = DEMO_ROOMS.find((room) =>
    room.members.some((member) => member.id !== DEMO_SELF.id && member.id === roomOrPartnerId),
  );
  return byPartner?.id ?? null;
}

export type DemoRoomAccess = 'absent' | 'member' | 'denied';

/** 요청한 방이 없거나, 이 사용자가 구성원이 아니면 denied. */
export function demoRoomAccess(
  actorId: string,
  roomOrPartnerId: string | null | undefined,
): DemoRoomAccess {
  if (!roomOrPartnerId) return 'absent';
  const roomId = findDemoRoomId(roomOrPartnerId);
  if (!roomId) return 'denied';
  const room = DEMO_ROOMS.find((item) => item.id === roomId);
  if (!room?.members.some((member) => member.id === actorId)) return 'denied';
  return 'member';
}

/** 지금 탭 사용자 기준으로 상대와 말풍선 좌우를 다시 정한다. */
export function viewRoomForActor(room: ChatRoomInfo, actorId: string): ChatRoomInfo | null {
  if (!room.members.some((member) => member.id === actorId)) return null;
  const partner = room.members.find((member) => member.id !== actorId);
  if (!partner) return null;
  return {
    ...room,
    partner,
    unread: actorId === DEMO_SELF.id ? room.unread : 0,
    initialMessages: room.initialMessages.map((item) => ({
      ...item,
      sender: item.sender === 'system' ? 'system' : item.senderId === actorId ? 'me' : 'partner',
    })),
  };
}

export function actorFromQuery(asId: string | null | undefined): ChatPartner {
  if (!asId) return DEMO_SELF;
  const known = DEMO_ACTORS.find((actor) => actor.id === asId);
  if (known) return known;
  const id = asId.slice(0, 80);
  return { id, nickname: '알 수 없는 계정' };
}

export function nicknameForDemoId(id: string): string {
  if (id === DEMO_SELF.id) return DEMO_SELF.nickname;
  const actor = DEMO_ACTORS.find((item) => item.id === id);
  if (actor) return actor.nickname;
  const found = DEMO_RECOMMENDATIONS.find((item) => item.id === id);
  return found?.nickname ?? '상대';
}

/** 다른 탭에서 열 상대 계정과 그 사람이 들어가는 방. */
export function counterpartDemoLink(actorId: string): { actorId: string; nickname: string; roomId: string } {
  if (actorId === DEMO_SELF.id) {
    const room = DEMO_ROOMS[0];
    return { actorId: room.partner.id, nickname: room.partner.nickname, roomId: room.id };
  }
  const room = DEMO_ROOMS.find((item) => item.members.some((member) => member.id === actorId));
  return {
    actorId: DEMO_SELF.id,
    nickname: DEMO_SELF.nickname,
    roomId: room?.id ?? DEMO_ROOMS[0].id,
  };
}
