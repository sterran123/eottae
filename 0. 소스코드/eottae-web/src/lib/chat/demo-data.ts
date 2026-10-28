// ============================================================
//  저장 경로: src/lib/chat/demo-data.ts
//  담당: 손준혁 · MATCH-007
//  역할: DEMO 전용 가상 대화방 목록·초기 메시지·자동 응답. 실제 사용자 데이터 아님(RULES 7).
// ============================================================

import type { ChatMessage, ChatRoomInfo } from './types';

function partnerMsg(id: string, body: string, createdAt: string): ChatMessage {
  return { id, sender: 'partner', body, createdAt, status: 'sent' };
}
function myMsg(id: string, body: string, createdAt: string): ChatMessage {
  return { id, sender: 'me', body, createdAt, status: 'sent' };
}

export const DEMO_ROOMS: ChatRoomInfo[] = [
  {
    id: 'demo-room-1',
    partner: { id: 'demo-partner-1', nickname: '데모 상대' },
    timeLabel: '방금',
    unread: 1,
    initialMessages: [
      partnerMsg('r1-m1', '안녕하세요! 서로 관심을 표시해서 대화가 열렸어요 :)', '2026-10-26T12:00:00+09:00'),
      partnerMsg('r1-m2', '요즘 즐겨 보는 영화가 있나요?', '2026-10-26T12:01:00+09:00'),
    ],
  },
  {
    id: 'demo-room-2',
    partner: { id: 'demo-partner-2', nickname: '러닝 메이트' },
    timeLabel: '10분 전',
    unread: 2,
    initialMessages: [
      partnerMsg('r2-m1', '안녕하세요! 러닝 좋아하신다고 해서 반가웠어요.', '2026-10-26T09:10:00+09:00'),
      myMsg('r2-m2', '네! 주말마다 가볍게 뛰어요.', '2026-10-26T09:12:00+09:00'),
      partnerMsg('r2-m3', '이번 주말 여의도 러닝 어떠세요?', '2026-10-26T09:15:00+09:00'),
    ],
  },
  {
    id: 'demo-room-3',
    partner: { id: 'demo-partner-3', nickname: '전시 친구' },
    timeLabel: '어제',
    unread: 0,
    initialMessages: [
      partnerMsg('r3-m1', '성수동 전시 같이 가보고 싶어요.', '2026-10-25T18:00:00+09:00'),
      myMsg('r3-m2', '좋아요! 시간 맞춰봐요.', '2026-10-25T18:05:00+09:00'),
      partnerMsg('r3-m3', '티켓 예매 성공했어요!', '2026-10-25T18:20:00+09:00'),
    ],
  },
  {
    id: 'demo-room-4',
    partner: { id: 'demo-partner-4', nickname: '보드게임 러버' },
    timeLabel: '2일 전',
    unread: 0,
    initialMessages: [
      myMsg('r4-m1', '보드게임 카페 추천해주실 수 있어요?', '2026-10-24T20:00:00+09:00'),
      partnerMsg('r4-m2', '스플렌더 확장판 해보셨어요?', '2026-10-24T20:10:00+09:00'),
    ],
  },
];

/** 데모 자동 응답 순환 목록 */
export const DEMO_REPLIES: string[] = [
  '오 저도 그거 좋아해요!',
  '그렇군요, 더 얘기해 주세요.',
  '주말엔 보통 뭐 하세요?',
  '재미있네요 ㅎㅎ',
];
