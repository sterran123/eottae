// ============================================================
//  저장 경로: src/lib/chat/types.ts
//  담당: 손준혁 · MATCH-007 (실시간 1:1 채팅)
//  역할: 채팅 UI 전용 DTO. API_계약_초안 `/conversations/:id/messages`
//        응답 형태에 맞춰 추후 서버 연동 시 그대로 교체할 수 있게 둔다.
// ============================================================

/** 'system' = 차단/해제 등 안내 문구 (MATCH-008) */
export type MessageSender = 'me' | 'partner' | 'system';

/** 전송 상태 — 데모에서는 sending → sent, 차단 시 미전송분은 failed 로 전이한다. */
export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  body: string;
  /** ISO 8601 */
  createdAt: string;
  status: MessageStatus;
}

export interface ChatPartner {
  id: string;
  nickname: string;
}

/** 메시지 본문 최대 길이 (API 계약: body length 검증) */
export const MAX_MESSAGE_LENGTH = 500;
