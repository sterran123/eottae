'use client';

// ============================================================
//  저장 경로: src/components/chat/MessageBubble.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 말풍선 1개. 내 메시지는 오른쪽, 상대는 왼쪽. 시간·전송 상태 표시.
//  [보안] 본문은 React 텍스트 노드로만 렌더링 (dangerouslySetInnerHTML 금지).
// ============================================================

import { useEffect, useRef, useState } from 'react';
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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mine = message.sender === 'me';
  const time = timeFormatter.format(new Date(message.createdAt));
  const statusLabel = STATUS_LABEL[message.status];

  const isVoice = message.body.startsWith('🎙️ 음성 메모');
  const voiceDur = isVoice ? message.body.match(/\((.*?)\)/)?.[1] || '0:05' : '';

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  function playVoiceSample() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        timerRef.current = setTimeout(() => setIsPlaying(false), 2000);
        return;
      }
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // 부드러운 도-미-솔-도 아르페지오 화음 합성 (외부 음원 로딩 없이 100% 즉시 출력)
      const notes = [261.63, 329.63, 392.0, 523.25];
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.28);

        gain.gain.setValueAtTime(0, now + idx * 0.28);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.28 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.28 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.28);
        osc.stop(now + idx * 0.28 + 0.6);
      });

      const totalDur = notes.length * 0.28 + 0.6;
      timerRef.current = setTimeout(() => {
        setIsPlaying(false);
        try {
          ctx.close();
        } catch {}
      }, totalDur * 1000);
    } catch {
      timerRef.current = setTimeout(() => setIsPlaying(false), 2000);
    }
  }

  function togglePlay() {
    if (isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
        audioCtxRef.current = null;
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playVoiceSample();
    }
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
              title={isPlaying ? '일시정지' : '재생'}
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
