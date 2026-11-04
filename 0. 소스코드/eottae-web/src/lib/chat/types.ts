// ============================================================
//  저장 경로: src/lib/chat/types.ts
//  담당: 손준혁 · MATCH-007 (실시간 1:1 채팅)
//  역할: 채팅 화면 DTO. match/types.ts와 같이 화면은 camelCase, 행은 snake_case.
//        사람 표기는 id·nickname, 시각은 ISO 8601 (`created_at` → `createdAt`).
//        데모는 이 브라우저에만 남기고 서버를 호출하지 않는다.
// ============================================================

/** 'system' = 차단/해제 등 안내 문구 (MATCH-008) */
export type MessageSender = 'me' | 'partner' | 'system';

/** 전송 상태 — 클라이언트 전용. 데모에서는 sending → sent, 차단·오류 시 failed. */
export type MessageStatus = 'sending' | 'sent' | 'failed';

/** 화면 상대. RecommendProfile과 같이 id·nickname. */
export interface ChatPartner {
  id: string;
  nickname: string;
}

export interface ChatMessage {
  id: string;
  /** 보낸 사람 id. 시스템 안내는 ''. match 화면 id와 같은 표기. */
  senderId: string;
  sender: MessageSender;
  body: string;
  /** ISO 8601. match 행 `created_at`의 화면 이름. */
  createdAt: string;
  status: MessageStatus;
}

/**
 * 데모 저장용 메시지. 두 탭이 같은 기록을 본다.
 * `autoForActorId`가 있으면 그 데모 사용자 화면의 자동응답만이다.
 */
export interface DemoChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  /** ISO 8601 */
  createdAt: string;
  status: MessageStatus;
  autoForActorId?: string;
}

/**
 * 메시지 행. 화면으로 바꿀 때는 `toChatMessage`.
 * 데모 저장은 이 행을 서버에 쓰지 않는다.
 * `soft_delete_state`가 `deleted`인 행은 화면에 넣지 않는다.
 */
export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  /** ISO 8601 */
  created_at: string;
  /** 0003 `messages.soft_delete_state`. 없으면 visible로 본다. */
  soft_delete_state?: 'visible' | 'deleted';
}

/** 행을 화면 메시지로 바꾼다. `deleted`는 null. `sender_id === myId`이면 내가 보낸 말이다. */
export function toChatMessage(
  row: MessageRow,
  myId: string,
  status: MessageStatus = 'sent',
): ChatMessage | null {
  if (row.soft_delete_state === 'deleted') return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    sender: row.sender_id === myId ? 'me' : 'partner',
    body: row.body,
    createdAt: row.created_at,
    status,
  };
}

/** 데모 저장 메시지를 이 탭 시점으로 바꾼다. */
export function toChatMessageFromDemo(row: DemoChatMessage, myId: string): ChatMessage {
  return {
    id: row.id,
    senderId: row.senderId,
    sender: row.senderId === myId ? 'me' : 'partner',
    body: row.body,
    createdAt: row.createdAt,
    status: row.status,
  };
}

/**
 * 채팅방 1건. `members`가 match 구성원이고, `partner`는 지금 탭에서 보는 상대다.
 */
export interface ChatRoomInfo {
  id: string;
  partner: ChatPartner;
  /** 두 명. id·nickname은 추천 프로필과 같다. */
  members: readonly [ChatPartner, ChatPartner];
  initialMessages: ChatMessage[];
  /** 목록 시각. 현재 시각을 쓰지 않아 서버 HTML과 어긋나지 않는다. */
  timeLabel: string;
  unread: number;
}

/** 메시지 본문 최대 길이 */
export const MAX_MESSAGE_LENGTH = 500;

/**
 * 공통 API/RLS 에러 응답 규격 (API_계약_초안.md §공통 규격).
 * 형태: `{"error": {"code": string, "message": string, "requestId"?: string}}`
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

/**
 * 주어진 문자열이 표준 UUID(v1~v5) 형식인지 판별한다.
 * 데모 ID(`demo-room-1`, `demo-partner-1`, `rec_bada` 등)와 실제 Supabase UUID(`auth.uid()`, `conversations.id`)를 구분한다.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/** `public.messages` INSERT 요청 행 DTO (API_계약_초안.md:47-50) */
export interface MessageInsertRow {
  conversation_id: string;
  sender_id: string;
  body: string;
}

/** 커서 기반 메시지 목록 페이지 응답 DTO (API_계약_초안.md:45) */
export interface MessagesCursorPage {
  items: ChatMessage[];
  nextCursor: string | null;
}

