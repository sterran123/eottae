'use client';

// ============================================================
//  저장 경로: src/components/chat/MessageComposer.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 메시지 입력창 + 전송 버튼. Enter 전송, Shift+Enter 줄바꿈.
//  [연동 예정] disabled 는 MATCH-008 차단 시 입력 정지에 사용한다.
// ============================================================

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { MAX_MESSAGE_LENGTH } from '@/lib/chat/types';

interface MessageComposerProps {
  onSend: (body: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export default function MessageComposer({
  onSend,
  disabled = false,
  disabledReason,
}: MessageComposerProps) {
  const [value, setValue] = useState('');
  const trimmed = value.trim();
  const canSend = !disabled && trimmed.length > 0;

  function submit() {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // 한글 IME 조합 중 Enter 는 전송하지 않는다.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form className="mt-chat-composer" onSubmit={handleSubmit}>
      <label htmlFor="mt-chat-input" className="mt-chat-sr">
        메시지 입력
      </label>
      <textarea
        id="mt-chat-input"
        className="mt-chat-input"
        rows={1}
        value={value}
        maxLength={MAX_MESSAGE_LENGTH}
        disabled={disabled}
        placeholder={disabled ? (disabledReason ?? '메시지를 보낼 수 없어요') : '메시지를 입력하세요'}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="submit" className="mt-chat-send" disabled={!canSend}>
        전송
      </button>
    </form>
  );
}
