'use client';

// ============================================================
//  저장 경로: src/components/chat/ChatRoom.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 채팅방 컨테이너 — 헤더, 메시지 목록(자동 스크롤), 입력창.
//        전송은 로컬 state 데모: sending → (400ms) → sent, 이어서 상대 자동 응답.
//
//  [경계] 실제 서버 연동(주한태 API/RLS)·실시간 구독은 별도 설계 리뷰 후 착수.
//         아래 sendMessage 내부가 API 호출로 교체될 지점이다.
//  [TODO MATCH-008] 헤더 더보기 메뉴에 차단/신고 연결, 차단 시 composer disabled.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/chat/types';
import {
  DEMO_INITIAL_MESSAGES,
  DEMO_PARTNER,
  DEMO_REPLIES,
} from '@/lib/chat/demo-data';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';

let seq = 0;
const nextId = () => `local-${Date.now()}-${seq++}`;

export default function ChatRoom() {
  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_INITIAL_MESSAGES);
  const [typing, setTyping] = useState(false);
  const listEndRef = useRef<HTMLLIElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const replyIdx = useRef(0);

  // 새 메시지·입력중 표시마다 맨 아래로 스크롤
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, typing]);

  // 언마운트 시 대기 중 타이머 정리
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const sendMessage = useCallback(
    (body: string) => {
      const id = nextId();
      setMessages((prev) => [
        ...prev,
        { id, sender: 'me', body, createdAt: new Date().toISOString(), status: 'sending' },
      ]);

      // [DEMO] 서버 응답 대신 타이머로 전송 완료·상대 응답을 흉내낸다.
      later(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: 'sent' } : m)),
        );
        setTyping(true);
      }, 400);

      later(() => {
        const reply = DEMO_REPLIES[replyIdx.current++ % DEMO_REPLIES.length];
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            sender: 'partner',
            body: reply,
            createdAt: new Date().toISOString(),
            status: 'sent',
          },
        ]);
      }, 1600);
    },
    [later],
  );

  return (
    <section className="mt-chat" aria-label={`${DEMO_PARTNER.nickname}님과의 1:1 채팅`}>
      <header className="mt-chat-head">
        <div className="mt-chat-avatar" aria-hidden="true">
          {DEMO_PARTNER.nickname.slice(0, 1)}
        </div>
        <div className="mt-chat-head-text">
          <h1 className="mt-chat-title">{DEMO_PARTNER.nickname}</h1>
          <span className="mt-chat-demo">DEMO · 실제 채팅이 아니에요</span>
        </div>
      </header>

      <div className="mt-chat-notice" role="note">
        체험용 화면입니다. 로그인·성인 확인·실시간 서버 연동은 아직 구현되지 않았고, 입력한
        메시지는 저장되거나 전송되지 않습니다.
      </div>

      <ul className="mt-chat-list" aria-live="polite" aria-label="메시지 목록">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {typing && (
          <li className="mt-chat-row is-partner" aria-label="상대가 입력 중">
            <div className="mt-chat-bubble mt-chat-typing" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </li>
        )}
        <li ref={listEndRef} aria-hidden="true" />
      </ul>

      <MessageComposer onSend={sendMessage} />
    </section>
  );
}
