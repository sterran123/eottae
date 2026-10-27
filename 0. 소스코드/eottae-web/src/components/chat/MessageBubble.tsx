// ============================================================
//  저장 경로: src/components/chat/MessageBubble.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 말풍선 1개. 내 메시지는 오른쪽, 상대는 왼쪽. 시간·전송 상태 표시.
//  [보안] 본문은 React 텍스트 노드로만 렌더링 (dangerouslySetInnerHTML 금지).
// ============================================================

import { useState } from 'react';
import type { ChatMessage } from '@/lib/chat/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

// 빌드 서버(UTC)와 브라우저(KST)의 시간대 차이로 SSG HTML과 hydration 결과가 달라지지 않도록 고정.
const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Seoul',
});

const STATUS_LABEL: Record<ChatMessage['status'], string> = {
  sending: '전송 중',
  sent: '',
  failed: '전송 실패',
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const mine = message.sender === 'me';
  const time = timeFormatter.format(new Date(message.createdAt));
  const statusLabel = STATUS_LABEL[message.status];

  const isVoice = message.body.startsWith('🎙️ 음성 메모');
  const voiceDur = isVoice ? message.body.match(/\((.*?)\)/)?.[1] || '0:05' : '';

  function togglePlay() {
    setIsPlaying((p) => !p);
  }

  // 차단/해제 안내 — 말풍선이 아닌 가운데 정렬 알림
  if (message.sender === 'system') {
    return (
      <li className="mt-chat-system">
        <span>{message.body}</span>
      </li>
    );
  }

  return (
    <li className={`mt-chat-row ${mine ? 'is-me' : 'is-partner'}`}>
      <div className="mt-chat-bubble" data-status={message.status}>
        {isVoice ? (
          <div className="mt-chat-voice-msg">
            <button
              type="button"
              className="mt-chat-voice-play-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? '음성 메모 일시정지' : '음성 메모 재생'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <div className={`mt-chat-voice-waves ${isPlaying ? 'is-playing' : ''}`} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="mt-chat-voice-dur">{voiceDur}</span>
          </div>
        ) : (
          message.body
        )}
      </div>
      <span className="mt-chat-meta">
        {statusLabel && <span className="mt-chat-status">{statusLabel} · </span>}
        <time dateTime={message.createdAt} suppressHydrationWarning>{time}</time>
      </span>
    </li>
  );
}
