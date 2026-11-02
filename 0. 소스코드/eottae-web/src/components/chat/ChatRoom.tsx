'use client';

// ============================================================
//  저장 경로: src/components/chat/ChatRoom.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 채팅방. 보내기 확인과 자동응답은 setTimeout 데모를 유지한다.
//        내가 보낸 말은 이 브라우저 기록으로 남고, 다른 탭에 전달된다.
//  [MATCH-008] 차단하면 보내기를 바로 막고, 그 이후 상대 말은 받지 않는다.
// ============================================================

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createDemoChatDataSource, type ChatDataSource } from '@/lib/chat/chat-service';
import { appendDemoMessage, loadVisibleMessages, subscribeChatDemo } from '@/lib/chat/demo-store';
import type { ChatMessage, ChatRoomInfo } from '@/lib/chat/types';
import type { ReportRequest } from '@/lib/safety/types';
import {
  isDemoBlocked,
  removeDemoBlock,
  saveDemoBlock,
  saveDemoReport,
  subscribeSafetyDemo,
} from '@/lib/safety/demo-store';
import BlockConfirmModal from '@/components/safety/BlockConfirmModal';
import ReportModal from '@/components/safety/ReportModal';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';

let seq = 0;
const nextId = (actorId: string) => `local-${actorId}-${Date.now()}-${seq++}`;

function mergeMessages(prev: ChatMessage[], stored: ChatMessage[]): ChatMessage[] {
  const storedIds = new Set(stored.map((message) => message.id));
  const extra = prev.filter(
    (message) =>
      !storedIds.has(message.id) &&
      (message.sender === 'system' || message.status === 'failed' || message.status === 'sending'),
  );
  const status = new Map(prev.map((message) => [message.id, message.status]));
  const base = stored.map((message) =>
    status.get(message.id) === 'sending' ? { ...message, status: 'sending' as const } : message,
  );
  return [...base, ...extra].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

interface ChatRoomProps {
  room: ChatRoomInfo;
  actorId: string;
  /** 패널이 열려 있는지 — 닫힌 채 유지되는 방은 스크롤 보정을 건너뛴다 */
  active: boolean;
  /** 추천 카드의 "가볍게 물어보기"로 진입했을 때 즉시 보낼 질문 */
  initialQuestion?: string | null;
  onClose: () => void;
  /** 새 메시지가 붙을 때마다 목록 미리보기 갱신용으로 알린다 */
  onLastMessage?: (roomId: string, message: ChatMessage) => void;
}

export default function ChatRoom({
  room,
  actorId,
  active,
  initialQuestion,
  onClose,
  onLastMessage,
}: ChatRoomProps) {
  const menuId = useId();
  const partner = room.partner;
  const questionToken = useRef<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(room.initialMessages);
  const [hydrated, setHydrated] = useState(false);
  const [typing, setTyping] = useState(false);
  const listEndRef = useRef<HTMLLIElement>(null);
  const dataSourceRef = useRef<ChatDataSource | null>(null);
  const pendingRef = useRef<Map<string, { body: string; createdAt: string }>>(new Map());

  const [blocked, setBlocked] = useState(false);
  const blockedRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'block' | 'unblock'>('block');
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, typing, active]);

  const lastNotifiedId = useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.sender !== 'system' || last.id === lastNotifiedId.current) return;
    lastNotifiedId.current = last.id;
    onLastMessage?.(room.id, last);
  }, [messages, room.id, onLastMessage]);

  useEffect(() => {
    const reload = () => {
      setMessages((prev) => mergeMessages(prev, loadVisibleMessages(room.id, actorId)));
    };
    reload();
    setHydrated(true);
    const offChat = subscribeChatDemo(reload);
    const offSafety = subscribeSafetyDemo(reload);
    return () => {
      offChat();
      offSafety();
    };
  }, [room.id, actorId]);

  const pushSystem = useCallback((body: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(actorId),
        senderId: '',
        sender: 'system',
        body,
        createdAt: new Date().toISOString(),
        status: 'sent',
      },
    ]);
  }, [actorId]);

  const createSource = useCallback(() => {
    dataSourceRef.current?.dispose();
    dataSourceRef.current = createDemoChatDataSource({
      onMessageSent: (messageId) => {
        if (blockedRef.current) {
          setMessages((prev) =>
            prev.map((message) => (message.id === messageId ? { ...message, status: 'failed' } : message)),
          );
          return;
        }
        const pending = pendingRef.current.get(messageId);
        pendingRef.current.delete(messageId);
        if (pending) {
          appendDemoMessage({
            id: messageId,
            conversationId: room.id,
            senderId: actorId,
            body: pending.body,
            createdAt: pending.createdAt,
            status: 'sent',
          });
        }
        setMessages((prev) =>
          prev.map((message) => (message.id === messageId ? { ...message, status: 'sent' } : message)),
        );
      },
      onTypingChange: (isTyping) => {
        setTyping(blockedRef.current ? false : isTyping);
      },
      onIncomingMessage: (incoming) => {
        if (blockedRef.current) return;
        appendDemoMessage({
          id: `auto-${actorId}-${incoming.id}`,
          conversationId: room.id,
          senderId: partner.id,
          body: incoming.body,
          createdAt: incoming.createdAt,
          status: 'sent',
          autoForActorId: actorId,
        });
      },
    }, partner.id);
  }, [actorId, partner.id, room.id]);

  useEffect(() => {
    if (isDemoBlocked(actorId, partner.id)) {
      blockedRef.current = true;
      setBlocked(true);
      return;
    }
    blockedRef.current = false;
    setBlocked(false);
    createSource();
    return () => {
      dataSourceRef.current?.dispose();
    };
  }, [actorId, partner.id, createSource]);

  useEffect(() => {
    const onSafety = () => {
      const now = isDemoBlocked(actorId, partner.id);
      if (now === blockedRef.current) return;
      if (now) {
        blockedRef.current = true;
        setBlocked(true);
        dataSourceRef.current?.dispose();
        setTyping(false);
        setMessages((prev) =>
          prev.map((message) => (message.status === 'sending' ? { ...message, status: 'failed' } : message)),
        );
        pushSystem(`${partner.nickname}님을 차단했어요. 더 이상 대화할 수 없어요.`);
        return;
      }
      blockedRef.current = false;
      setBlocked(false);
      createSource();
      pushSystem('차단을 해제했어요. 다시 대화할 수 있어요.');
    };
    return subscribeSafetyDemo(onSafety);
  }, [actorId, partner.id, partner.nickname, createSource, pushSystem]);

  const applyBlock = useCallback(() => {
    if (blockedRef.current) return;
    blockedRef.current = true;
    setBlocked(true);
    saveDemoBlock(actorId, partner.id);
    dataSourceRef.current?.dispose();
    setTyping(false);
    setMessages((prev) =>
      prev.map((message) => (message.status === 'sending' ? { ...message, status: 'failed' } : message)),
    );
    pushSystem(`${partner.nickname}님을 차단했어요. 더 이상 대화할 수 없어요.`);
  }, [actorId, partner.id, partner.nickname, pushSystem]);

  const releaseBlock = useCallback(() => {
    if (!blockedRef.current) return;
    blockedRef.current = false;
    setBlocked(false);
    removeDemoBlock(actorId, partner.id);
    createSource();
    pushSystem('차단을 해제했어요. 다시 대화할 수 있어요.');
  }, [actorId, partner.id, createSource, pushSystem]);

  function handleReportSubmit(req: ReportRequest) {
    saveDemoReport({
      reporterId: actorId,
      targetId: partner.id,
      nickname: partner.nickname,
      category: req.category,
      description: req.description,
    });
    if (req.alsoBlock) applyBlock();
  }

  function openBlockConfirm() {
    setConfirmMode(blockedRef.current ? 'unblock' : 'block');
    setBlockOpen(true);
  }

  function closeBlockConfirm() {
    setBlockOpen(false);
    menuBtnRef.current?.focus();
  }
  function closeReport() {
    setReportOpen(false);
    menuBtnRef.current?.focus();
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const sendMessage = useCallback((body: string) => {
    if (blockedRef.current || isDemoBlocked(actorId, partner.id)) return;
    const id = nextId(actorId);
    const createdAt = new Date().toISOString();
    pendingRef.current.set(id, { body, createdAt });
    setMessages((prev) => [
      ...prev,
      { id, senderId: actorId, sender: 'me', body, createdAt, status: 'sending' },
    ]);
    dataSourceRef.current?.sendMessage(id, body);
  }, [actorId, partner.id]);

  useEffect(() => {
    if (!hydrated || !initialQuestion) return;
    const token = `${room.id}|${actorId}|${initialQuestion}`;
    if (questionToken.current === token) return;
    questionToken.current = token;
    sendMessage(initialQuestion);
  }, [hydrated, initialQuestion, room.id, actorId, sendMessage]);

  return (
    <section className="mt-chat" aria-label={`${partner.nickname}님과의 1:1 채팅`}>
      <header className="mt-chat-head">
        <div className="mt-chat-avatar" aria-hidden="true">
          {partner.nickname.slice(0, 1)}
        </div>
        <div className="mt-chat-head-text">
          <h2 className="mt-chat-title">{partner.nickname}</h2>
          <span className="mt-chat-demo">
            {blocked ? '차단됨 · ' : ''}데모 · 이 브라우저 안에서만 대화해요
          </span>
        </div>

        <div className="mt-chat-menu" ref={menuRef}>
          <button
            ref={menuBtnRef}
            type="button"
            className="mt-chat-menu-btn"
            aria-label="더보기 메뉴"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">⋯</span>
          </button>
          {menuOpen && (
            <ul id={menuId} className="mt-chat-menu-list">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openBlockConfirm();
                  }}
                >
                  {blocked ? '차단 해제하기' : '상대방 차단하기'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                >
                  상대방 신고하기
                </button>
              </li>
            </ul>
          )}
        </div>
        <button
          type="button"
          className="mt-chat-close"
          aria-label="채팅방 닫기"
          onClick={onClose}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      <div className="mt-chat-notice" role="note">
        데모 화면이에요. 메시지는 이 기기에만 저장되고, 서버로는 전송되지 않아요.
      </div>

      <ul className="mt-chat-list" aria-live="polite" aria-label="메시지 목록">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
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

      {blocked && (
        <div className="mt-chat-blocked-bar" role="status">
          <span>차단한 상대와는 대화할 수 없어요</span>
          <button type="button" onClick={openBlockConfirm}>
            차단 해제
          </button>
        </div>
      )}

      <MessageComposer
        onSend={sendMessage}
        disabled={blocked || !active}
        disabledReason={blocked ? '차단한 상대와는 대화할 수 없어요' : undefined}
      />

      <BlockConfirmModal
        open={blockOpen}
        mode={confirmMode}
        partnerName={partner.nickname}
        onConfirm={confirmMode === 'unblock' ? releaseBlock : applyBlock}
        onClose={closeBlockConfirm}
      />
      <ReportModal
        open={reportOpen}
        partnerId={partner.id}
        partnerName={partner.nickname}
        onSubmit={handleReportSubmit}
        onClose={closeReport}
      />
    </section>
  );
}
