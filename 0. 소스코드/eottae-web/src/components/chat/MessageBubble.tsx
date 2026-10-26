// ============================================================
//  저장 경로: src/components/chat/MessageBubble.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 말풍선 1개. 내 메시지는 오른쪽, 상대는 왼쪽. 시간·전송 상태 표시.
//  [보안] 본문은 React 텍스트 노드로만 렌더링 (dangerouslySetInnerHTML 금지).
// ============================================================

import type { ChatMessage } from '@/lib/chat/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: 'numeric',
  minute: '2-digit',
});

const STATUS_LABEL: Record<ChatMessage['status'], string> = {
  sending: '전송 중',
  sent: '',
  failed: '전송 실패',
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const mine = message.sender === 'me';
  const time = timeFormatter.format(new Date(message.createdAt));
  const statusLabel = STATUS_LABEL[message.status];

  return (
    <li className={`mt-chat-row ${mine ? 'is-me' : 'is-partner'}`}>
      <div className="mt-chat-bubble" data-status={message.status}>
        {message.body}
      </div>
      <span className="mt-chat-meta">
        {statusLabel && <span className="mt-chat-status">{statusLabel} · </span>}
        <time dateTime={message.createdAt}>{time}</time>
      </span>
    </li>
  );
}
