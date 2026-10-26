'use client';

// ============================================================
//  저장 경로: src/components/chat/MessageComposer.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 메시지 입력창 + 전송 버튼. Enter 전송, Shift+Enter 줄바꿈.
//  [연동 예정] disabled 는 MATCH-008 차단 시 입력 정지에 사용한다.
// ============================================================

import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setValue((prev) => (prev ? `${prev} [사진: ${file.name}]` : `[사진: ${file.name}]`));
    }
    // 동일 파일 재선택 가능하게 리셋
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleVoiceMemo() {
    setValue((prev) => (prev ? `${prev} 🎙️ [음성 메모 0:12]` : '🎙️ [음성 메모 0:12]'));
  }

  return (
    <form className="mt-chat-composer" onSubmit={handleSubmit}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="mt-chat-sr"
        onChange={handlePhotoUpload}
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        className="mt-chat-media-btn"
        aria-label="사진 첨부"
        title="사진 첨부"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>
      <button
        type="button"
        className="mt-chat-media-btn"
        aria-label="음성 메모"
        title="음성 메모"
        disabled={disabled}
        onClick={handleVoiceMemo}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

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
