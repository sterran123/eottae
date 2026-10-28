// ============================================================
//  저장 경로: src/lib/chat/chat-service.ts
//  담당: 손준혁 · MATCH-007 (실시간 1:1 채팅 데이터 소스 분리)
//  역할: ChatRoom 컴포넌트에서 setTimeout 데모 응답 로직을 분리한 데이터 소스 계층.
//        - Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가
//          없거나 백엔드 연동 전에는 데모 데이터 소스(createDemoChatDataSource)로 동작해
//          GitHub Pages 정적 배포 사이트가 깨지지 않도록 보장한다 (ADR-005).
//        - 추후 주한태 PR(Supabase Auth·0003_match_core.sql) 머지 후 Supabase Realtime
//          구현체를 같은 ChatDataSource 인터페이스로 연결한다.
// ============================================================

import { DEMO_REPLIES } from './demo-data';
import type { ChatMessage } from './types';

let demoReplySeq = 0;
const nextDemoReplyId = () => `demo-reply-${Date.now()}-${demoReplySeq++}`;

/**
 * Supabase 공개 환경변수가 설정되어 있는지 확인한다.
 * [ADR-002 / ADR-005] 환경변수가 없을 때 알려진 기본 키로 폴백하지 않고 데모 모드로만 동작한다.
 */
export function isSupabaseChatConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
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

