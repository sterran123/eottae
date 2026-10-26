// ============================================================
//  저장 경로: src/lib/chat/demo-data.ts
//  담당: 손준혁 · MATCH-007
//  역할: DEMO 전용 가상 상대·초기 메시지·자동 응답. 실제 사용자 데이터 아님(RULES 7).
// ============================================================

import type { ChatMessage, ChatPartner } from './types';

export const DEMO_PARTNER: ChatPartner = {
  id: 'demo-partner-1',
  nickname: '데모 상대',
};

export const DEMO_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'demo-m1',
    sender: 'partner',
    body: '안녕하세요! 서로 관심을 표시해서 대화가 열렸어요 :)',
    createdAt: '2026-10-26T12:00:00+09:00',
    status: 'sent',
  },
  {
    id: 'demo-m2',
    sender: 'partner',
    body: '요즘 즐겨 보는 영화가 있나요?',
    createdAt: '2026-10-26T12:01:00+09:00',
    status: 'sent',
  },
];

/** 데모 자동 응답 순환 목록 */
export const DEMO_REPLIES: string[] = [
  '오 저도 그거 좋아해요!',
  '그렇군요, 더 얘기해 주세요.',
  '주말엔 보통 뭐 하세요?',
  '재미있네요 ㅎㅎ',
];
