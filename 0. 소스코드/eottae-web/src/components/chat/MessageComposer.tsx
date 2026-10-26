'use client';

// ============================================================
//  저장 경로: src/components/chat/MessageComposer.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 메시지 입력창 + 사진 첨부 + 음성 메모 녹음 (Record Audio).
// ============================================================

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const trimmed = value.trim();
  const canSend = !disabled && (trimmed.length > 0 || isRecording);

  // 녹음 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function submitText() {
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isRecording) {
      finishRecording();
    } else {
      submitText();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submitText();
    }
  }

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onSend(`📷 [사진 첨부] ${file.name}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ---- 녹음 시작 ----
  async function startRecording() {
    if (disabled || isRecording) return;
    setIsRecording(true);
    setRecordSeconds(0);

    // 1초 단위 타이머
    timerRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);

    // 실제 마이크 접근 시도 (권한 거부 시 타이머 시뮬레이션으로 동작)
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        mr.start();
      } catch {
        // 마이크 권한 미허용 시에도 UI 시뮬레이션 정상 동작
      }
    }
  }

  // ---- 녹음 완료 및 전송 ----
  function finishRecording() {
    if (!isRecording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const min = Math.floor(recordSeconds / 60);
    const sec = recordSeconds % 60;
    const durStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    const finalDur = durStr === '0:00' ? '0:01' : durStr;

    // 음성 메시지 전송 (텍스트 입력란에 넣지 않고 바로 전송)
    onSend(`🎙️ 음성 메모 (${finalDur})`);

    setIsRecording(false);
    setRecordSeconds(0);
  }

  // ---- 녹음 취소 ----
  function cancelRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setRecordSeconds(0);
  }

  function handleMicClick() {
    if (isRecording) {
      finishRecording();
    } else {
      startRecording();
    }
  }

  const recMin = Math.floor(recordSeconds / 60);
  const recSec = (recordSeconds % 60).toString().padStart(2, '0');

  return (
    <form className="mt-chat-composer" onSubmit={handleSubmit}>
      {/* 음성 녹음 중 상태 바: 실시간 높낮이 음성 파형 애니메이션 포함 */}
      {isRecording && (
        <div className="mt-chat-rec-bar" role="status" aria-live="polite">
          <div className="mt-chat-rec-left">
            <span className="mt-chat-rec-dot" aria-hidden="true" />
            <span className="mt-chat-rec-label">음성 녹음 중...</span>
            <div className="mt-chat-rec-waves-live" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="mt-chat-rec-time">{recMin}:{recSec}</span>
          </div>
          <div className="mt-chat-rec-right">
            <button
              type="button"
              className="mt-chat-rec-btn mt-chat-rec-btn--stop"
              onClick={finishRecording}
              aria-label="녹음 완료 및 전송"
            >
              <span className="mt-chat-rec-stop-square" />
            </button>
            <button
              type="button"
              className="mt-chat-rec-btn mt-chat-rec-btn--cancel"
              onClick={cancelRecording}
              aria-label="녹음 취소"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="mt-chat-composer-row">
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
          disabled={disabled || isRecording}
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
          className={`mt-chat-media-btn ${isRecording ? 'is-recording' : ''}`}
          aria-label={isRecording ? '음성 녹음 완료 및 전송' : '음성 메모 녹음'}
          disabled={disabled}
          onClick={handleMicClick}
        >
          {isRecording ? (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="5" y="6" width="3" height="12" rx="1.5" />
              <rect x="10.5" y="3" width="3" height="18" rx="1.5" />
              <rect x="16" y="7" width="3" height="10" rx="1.5" />
            </svg>
          ) : (
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
          )}
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
          disabled={disabled || isRecording}
          placeholder={
            disabled
              ? (disabledReason ?? '메시지를 보낼 수 없어요')
              : isRecording
              ? '음성 메모를 녹음하고 있어요...'
              : '메시지를 입력하세요'
          }
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          className="mt-chat-send"
          disabled={!canSend}
        >
          {isRecording ? '완료' : '전송'}
        </button>
      </div>
    </form>
  );
}
