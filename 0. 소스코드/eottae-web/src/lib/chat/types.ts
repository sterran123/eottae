// ============================================================
//  저장 경로: src/lib/chat/types.ts
//  담당: 손준혁 · MATCH-007 (실시간 1:1 채팅)
//  역할: 채팅 UI DTO 및 Supabase `public.messages` 테이블 행(MessageRow) 매퍼.
//        ADR-005 결정에 따라 DB 행 구조와 화면 렌더링 모델을 분리하고,
//        `toChatMessage(row, myId)`로 변환한다.
// ============================================================

/** 'system' = 차단/해제 등 안내 문구 (MATCH-008) */
export type MessageSender = 'me' | 'partner' | 'system';

/** 전송 상태 — 클라이언트 전용 상태. 데모·낙관적 전송에서는 sending → sent, 차단·오류 시 failed 로 전이한다. */
export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  body: string;
  /** ISO 8601 */
  createdAt: string;
  status: MessageStatus;
}

/**
 * Supabase `public.messages` 테이블 행 타입 (ADR-005, MATCH-007).
 * RLS 정책에 따라 활성 match 구성원이고 상호 미차단·성인 인증 완료(ACTIVE) 계정일 때만 select/insert가 허용된다.
 */
export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  /** ISO 8601 (timestamptz) */
  created_at: string;
}

/**
 * DB `public.messages` 행을 화면 렌더링용 `ChatMessage`로 변환한다.
 * `sender_id === myId`이면 `'me'`, 아니면 `'partner'`로 판정하며,
 * `status`는 클라이언트에서만 쓰는 값이므로 기본값 `'sent'`를 부여한다.
 */
export function toChatMessage(
  row: MessageRow,
  myId: string,
  status: MessageStatus = 'sent',
): ChatMessage {
  return {
    id: row.id,
    sender: row.sender_id === myId ? 'me' : 'partner',
    body: row.body,
    createdAt: row.created_at,
    status,
  };
}

export interface ChatPartner {
  id: string;
  nickname: string;
}

/**
 * 채팅방 목록 1건 (MATCH-007 목록 뷰). 서버 연동 시 `conversations` 조회 응답과 매핑.
 * [ADR-003 / ADR-005 보안] 실제 서버 연동 시 대화방 목록과 메시지 열람은
 * match 구성원 본인 확인 및 차단 여부를 Postgres RLS 정책으로 강제 필터링해야 한다.
 */
export interface ChatRoomInfo {
  id: string;
  partner: ChatPartner;
  initialMessages: ChatMessage[];
  /** 목록에 표시할 초기 시각 문구 — 시간대·현재 시각에 따라 SSG/hydration이 어긋나지 않도록 고정 문구 사용 */
  timeLabel: string;
  /** 목록에 표시할 초기 안 읽은 메시지 수 */
  unread: number;
}

/** 메시지 본문 최대 길이 (DB `check (char_length(body) between 1 and 500)` 와 동일) */
export const MAX_MESSAGE_LENGTH = 500;
