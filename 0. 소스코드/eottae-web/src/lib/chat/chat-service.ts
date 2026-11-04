// ============================================================
//  저장 경로: src/lib/chat/chat-service.ts
//  담당: 손준혁 · MATCH-007 (실시간 1:1 채팅 데이터 소스 분리)
//  역할: ChatRoom 컴포넌트에서 setTimeout 데모 응답 로직과 Supabase Realtime 연동 로직을 분리한 데이터 소스 계층.
//        - Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가
//          없거나 데모 대화방(`!isUuid`)에서는 데모 데이터 소스(createDemoChatDataSource)로 동작해
//          GitHub Pages 정적 배포 사이트가 깨지지 않도록 보장한다 (ADR-005).
//        - 데모 탭 사이 전달은 demo-store(BroadcastChannel)가 맡고, 실계정 UUID 대화방은
//          Supabase `public.messages` INSERT 및 Realtime(postgres_changes) 구독으로 동작한다.
// ============================================================

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DEMO_REPLIES } from './demo-data';
import {
  isUuid,
  MAX_MESSAGE_LENGTH,
  toChatMessage,
  type ChatMessage,
  type MessageInsertRow,
  type MessageRow,
  type MessagesCursorPage,
} from './types';

let demoReplySeq = 0;
const nextDemoReplyId = () => `demo-reply-${Date.now()}-${demoReplySeq++}`;

/**
 * Supabase 공개 환경변수가 설정되어 있는지 확인한다.
 * `src/lib/supabase/client.ts`의 `isSupabaseConfigured`를 재사용해 단일 진입점을 유지한다.
 * [ADR-002 / ADR-005] 환경변수가 없을 때 알려진 기본 키로 폴백하지 않고 데모 모드로만 동작한다.
 */
export function isSupabaseChatConfigured(): boolean {
  return isSupabaseConfigured;
}

export interface ChatDataSourceCallbacks {
  /** 내 메시지가 서버(또는 데모 타이머)에서 전송 완료 처리되었을 때 */
  onMessageSent: (messageId: string) => void;
  /** 내 메시지 전송이 실패했을 때 */
  onMessageFailed?: (messageId: string) => void;
  /** 상대방 '입력 중' 상태가 바뀔 때 */
  onTypingChange: (typing: boolean) => void;
  /** 상대방 새 메시지가 도착했을 때 (데모 자동응답 또는 Supabase Realtime INSERT) */
  onIncomingMessage: (message: ChatMessage) => void;
}

export interface ChatDataSource {
  /** 메시지 전송 요청 */
  sendMessage: (messageId: string, body: string) => void;
  /** 차단 또는 언마운트 시 대기 중인 전송·자동응답 타이머·실시간 구독을 즉시 정리 (TC-009) */
  dispose: () => void;
}

/**
 * 데모 전용 채팅 데이터 소스.
 * - 전송 후 400ms 뒤 `sent` 상태로 전이하고 상대 '입력 중' 표시를 켠다.
 * - 1600ms 뒤 `DEMO_REPLIES` 순환 응답을 전달하며, 연속 전송 시 마지막 응답까지 '입력 중'을 유지한다.
 * - `dispose()` 호출 시 대기 중인 모든 타이머를 취소하고 '입력 중' 표시를 즉시 끈다.
 */
export function createDemoChatDataSource(
  callbacks: ChatDataSourceCallbacks,
  partnerId: string,
): ChatDataSource {
  const timers: Array<ReturnType<typeof setTimeout>> = [];
  let replyIdx = 0;
  let pendingReplies = 0;
  let disposed = false;

  function schedule(fn: () => void, ms: number) {
    if (disposed) return;
    const timer = setTimeout(() => {
      const idx = timers.indexOf(timer);
      if (idx !== -1) timers.splice(idx, 1);
      if (!disposed) fn();
    }, ms);
    timers.push(timer);
  }

  return {
    sendMessage(messageId: string, _body: string) {
      if (disposed) return;
      pendingReplies += 1;

      schedule(() => {
        callbacks.onMessageSent(messageId);
        callbacks.onTypingChange(true);
      }, 400);

      schedule(() => {
        const replyBody = DEMO_REPLIES[replyIdx++ % DEMO_REPLIES.length];
        pendingReplies = Math.max(0, pendingReplies - 1);
        callbacks.onTypingChange(pendingReplies > 0);
        callbacks.onIncomingMessage({
          id: nextDemoReplyId(),
          senderId: partnerId,
          sender: 'partner',
          body: replyBody,
          createdAt: new Date().toISOString(),
          status: 'sent',
        });
      }, 1600);
    },

    dispose() {
      disposed = true;
      timers.forEach(clearTimeout);
      timers.length = 0;
      pendingReplies = 0;
      callbacks.onTypingChange(false);
    },
  };
}

export interface SupabaseChatDataSourceOptions {
  /** `public.conversations.id` (UUID). 데모 방 ID(`demo-room-*`)인 경우 자동으로 데모 데이터 소스로 폴백한다. */
  conversationId: string;
  /** 상대방 ID (`ChatPartner.id`). 데모 폴백 시 자동응답 `senderId`로 사용한다. */
  partnerId: string;
  /** 현재 로그인한 사용자 UUID (`auth.uid()` === `public.users.id`). 생략 시 `auth.getUser()`로 조회한다. */
  myUserId?: string | null;
}

/**
 * Supabase `public.messages` + Realtime(Postgres Changes) 기반 채팅 데이터 소스 (MATCH-007, ADR-005).
 * - `src/lib/supabase/client.ts`의 `getSupabase()`를 재사용하며 별도 클라이언트를 생성하지 않는다.
 * - 환경변수가 없거나 `conversationId`가 UUID가 아니면(`demo-room-*` 등) 즉시 `createDemoChatDataSource`로 폴백한다.
 * - `sendMessage`: `public.messages` INSERT 성공 시 `onMessageSent`, RLS 거부(차단·비구성원 등) 또는 오류 시 `onMessageFailed` 호출.
 * - Realtime 구독: 해당 `conversation_id`의 `INSERT` 이벤트를 수신해 상대방 메시지를 `toChatMessage`로 변환 후 `onIncomingMessage`에 전달.
 * - `dispose()`: 차단(`TC-009`) 또는 언마운트 시 Realtime 채널 구독을 즉시 해제한다.
 * - [보안 / DB_논리모델_전체3단계.md:41] 메시지 본문(`body`)은 콘솔·로그에 출력하지 않는다.
 */
export function createSupabaseChatDataSource(
  options: SupabaseChatDataSourceOptions,
  callbacks: ChatDataSourceCallbacks,
): ChatDataSource {
  const supabase = getSupabase();
  const { conversationId, partnerId } = options;

  if (!supabase || !isUuid(conversationId)) {
    return createDemoChatDataSource(callbacks, partnerId);
  }

  let disposed = false;
  let cachedUserId: string | null = isUuid(options.myUserId) ? options.myUserId : null;

  async function resolveUserId(): Promise<string | null> {
    if (cachedUserId) return cachedUserId;
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    if (!error && isUuid(uid)) {
      cachedUserId = uid;
      return uid;
    }
    return null;
  }

  void resolveUserId();

  const channel = supabase
    .channel(`chat:conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: { new: Record<string, unknown> | null }) => {
        if (disposed) return;
        const row = payload.new as Partial<MessageRow> | null;
        if (
          !row ||
          typeof row.id !== 'string' ||
          typeof row.conversation_id !== 'string' ||
          typeof row.sender_id !== 'string' ||
          typeof row.body !== 'string' ||
          typeof row.created_at !== 'string'
        ) {
          return;
        }
        // 논리 삭제된 행('deleted')은 표시하지 않는다 (0003_match_core.sql:329)
        if (row.soft_delete_state === 'deleted') {
          return;
        }
        void resolveUserId().then((myId) => {
          // 세션 사용자 ID가 확정되지 않았거나 이미 해제되었으면 오분류 방지를 위해 건너뛴다.
          if (disposed || !myId) return;
          // 내가 보낸 메시지는 낙관적 전송(sendMessage)으로 이미 목록에 있으므로 중복 추가하지 않는다.
          if (row.sender_id === myId) return;
          const mapped = toChatMessage(
            {
              id: row.id!,
              conversation_id: row.conversation_id!,
              sender_id: row.sender_id!,
              body: row.body!,
              created_at: row.created_at!,
              soft_delete_state: row.soft_delete_state,
            },
            myId,
            'sent',
          );
          if (!mapped) return;
          callbacks.onTypingChange(false);
          callbacks.onIncomingMessage(mapped);
        });
      },
    )
    .subscribe();

  return {
    sendMessage(messageId: string, body: string) {
      if (disposed) {
        callbacks.onMessageFailed?.(messageId);
        return;
      }

      const trimmed = body.trim();
      if (trimmed.length < 1 || trimmed.length > MAX_MESSAGE_LENGTH) {
        callbacks.onMessageFailed?.(messageId);
        return;
      }

      void (async () => {
        const senderId = await resolveUserId();
        if (disposed) return;
        if (!senderId) {
          callbacks.onMessageFailed?.(messageId);
          return;
        }

        const insertRow: MessageInsertRow = {
          conversation_id: conversationId,
          sender_id: senderId,
          body: trimmed,
        };

        const { error } = await supabase.from('messages').insert(insertRow);
        if (disposed) return;

        if (error) {
          callbacks.onMessageFailed?.(messageId);
          return;
        }

        callbacks.onMessageSent(messageId);
      })();
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      callbacks.onTypingChange(false);
      void supabase.removeChannel(channel);
    },
  };
}

/**
 * 환경변수 및 `conversationId`(UUID 여부)에 따라 적절한 `ChatDataSource`를 반환하는 통합 팩토리.
 * - `isSupabaseConfigured && isUuid(conversationId)`일 때만 Supabase 데이터 소스를 생성하고,
 *   그 외에는 항상 `createDemoChatDataSource(callbacks, options.partnerId)`를 반환한다.
 */
export function createChatDataSource(
  options: SupabaseChatDataSourceOptions,
  callbacks: ChatDataSourceCallbacks,
): ChatDataSource {
  if (isSupabaseConfigured && isUuid(options.conversationId)) {
    return createSupabaseChatDataSource(options, callbacks);
  }
  return createDemoChatDataSource(callbacks, options.partnerId);
}

/**
 * 특정 대화방(`conversationId`)의 메시지를 커서 기반으로 최신순 페이지 조회한 뒤 화면 시간순(오름차순)으로 반환한다.
 * - 데모 대화방이거나 환경변수가 없으면 `null`을 반환한다.
 */
export async function fetchConversationMessagesPage(
  conversationId: string,
  options: { cursor?: string | null; myUserId?: string | null; limit?: number } = {},
): Promise<MessagesCursorPage | null> {
  const supabase = getSupabase();
  if (!supabase || !isUuid(conversationId)) {
    return null;
  }

  let resolvedUserId = isUuid(options.myUserId) ? options.myUserId : null;
  if (!resolvedUserId) {
    const { data, error } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    if (!error && isUuid(uid)) resolvedUserId = uid;
  }
  if (!resolvedUserId) return null;

  const pageSize = Math.min(Math.max(options.limit ?? 50, 1), 100);
  let query = supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, soft_delete_state')
    .eq('conversation_id', conversationId)
    .neq('soft_delete_state', 'deleted')
    .order('created_at', { ascending: false })
    .limit(pageSize + 1);

  if (options.cursor) {
    query = query.lt('created_at', options.cursor);
  }

  const { data, error } = await query;
  if (error || !data) {
    return null;
  }

  const rows = data as MessageRow[];
  const hasMore = rows.length > pageSize;
  const slice = hasMore ? rows.slice(0, pageSize) : rows;
  const nextCursor = hasMore ? slice[slice.length - 1]?.created_at ?? null : null;

  // 최신순으로 가져온 페이지를 화면 렌더링용 시간순(오름차순)으로 뒤집고 null을 걸러낸다.
  const items = slice
    .slice()
    .reverse()
    .map((row) => toChatMessage(row, resolvedUserId, 'sent'))
    .filter((msg): msg is ChatMessage => msg !== null);

  return { items, nextCursor };
}

/**
 * 특정 대화방(`conversationId`)의 최근 메시지를 RLS 범위 내에서 조회해 화면용 `ChatMessage[]`로 반환한다.
 */
export async function fetchConversationMessages(
  conversationId: string,
  myUserId?: string | null,
  limit = 50,
): Promise<ChatMessage[] | null> {
  const page = await fetchConversationMessagesPage(conversationId, { myUserId, limit });
  return page ? page.items : null;
}
