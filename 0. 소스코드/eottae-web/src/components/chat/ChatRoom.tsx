'use client';

// ============================================================
//  저장 경로: src/components/chat/ChatRoom.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 채팅방.
//        - 데모 대화방(`!isLiveRoom`): 보내기 확인·자동응답 setTimeout 데모와
//          `demo-store`(BroadcastChannel) 기반 두 탭 전달을 그대로 유지한다.
//        - 실계정 대화방(`isLiveRoom`): `createSupabaseChatDataSource`를 통해
//          `public.messages` INSERT·Realtime 구독을 수행한다.
//  [MATCH-008] 차단하면 보내기를 바로 막고, 그 이후 상대 말은 받지 않는다.
//              실계정 대화방에서는 `public.blocks` INSERT/DELETE 성공 후에만 잠금/해제를 확정한다.
// ============================================================

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  createChatDataSource,
  fetchConversationMessages,
  isSupabaseChatConfigured,
  type ChatDataSource,
} from '@/lib/chat/chat-service';
import {
  appendDemoMessage,
  chatDemoEpoch,
  loadVisibleMessages,
  subscribeChatDemo,
} from '@/lib/chat/demo-store';
import { isUuid, type ChatMessage, type ChatRoomInfo } from '@/lib/chat/types';
import {
  checkIsBlockedOnServer,
  removeServerBlock,
  submitBlock,
  submitReport,
} from '@/lib/safety/safety-service';
import type { BlockRequest, ReportRequest } from '@/lib/safety/types';
import {
  isDemoBlocked,
  removeDemoBlock,
  safetyDemoEpoch,
  saveDemoBlock,
  saveDemoReport,
  subscribeSafetyDemo,
} from '@/lib/safety/demo-store';
import BlockConfirmModal from '@/components/safety/BlockConfirmModal';
import ReportModal, { type ReportSubmitOutcome } from '@/components/safety/ReportModal';
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
  /** 질문을 처리한 뒤 호출한다. 주소의 q는 부모가 지운다. */
  onQuestionConsumed?: () => void;
  onClose: () => void;
  /** 새 메시지가 붙을 때마다 목록 미리보기 갱신용으로 알린다 */
  onLastMessage?: (roomId: string, message: ChatMessage) => void;
}

export default function ChatRoom({
  room,
  actorId,
  active,
  initialQuestion,
  onQuestionConsumed,
  onClose,
  onLastMessage,
}: ChatRoomProps) {
  const menuId = useId();
  const partner = room.partner;
  const isLiveRoom = isSupabaseChatConfigured() && isUuid(room.id) && isUuid(partner.id);
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

  const lastNotifiedId = useRef<string | null>(
    room.initialMessages[room.initialMessages.length - 1]?.id ?? null,
  );
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === lastNotifiedId.current) return;
    // 데모 방은 일반 메시지를 demo-store 구독(ChatHub)이 이미 반영하므로 시스템 안내만 알리고,
    // 실계정(isLiveRoom) 방은 모든 새 메시지를 부모 미리보기에 알린다.
    if (!isLiveRoom && last.sender !== 'system') return;
    lastNotifiedId.current = last.id;
    onLastMessage?.(room.id, last);
  }, [isLiveRoom, messages, room.id, onLastMessage]);

  const pushSystem = useCallback(
    (body: string) => {
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
    },
    [actorId],
  );

  const createSource = useCallback(() => {
    dataSourceRef.current?.dispose();
    dataSourceRef.current = createChatDataSource(
      {
        conversationId: room.id,
        partnerId: partner.id,
        myUserId: isUuid(actorId) ? actorId : null,
      },
      {
        onMessageSent: (messageId) => {
          if (blockedRef.current) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === messageId ? { ...message, status: 'failed' } : message,
              ),
            );
            return;
          }
          const pending = pendingRef.current.get(messageId);
          pendingRef.current.delete(messageId);
          if (!isLiveRoom && pending) {
            const saved = appendDemoMessage({
              id: messageId,
              conversationId: room.id,
              senderId: actorId,
              body: pending.body,
              createdAt: pending.createdAt,
              status: 'sent',
            });
            if (!saved) {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === messageId ? { ...message, status: 'failed' } : message,
                ),
              );
              return;
            }
          }
          setMessages((prev) =>
            prev.map((message) =>
              message.id === messageId ? { ...message, status: 'sent' } : message,
            ),
          );
        },
        onMessageFailed: (messageId) => {
          pendingRef.current.delete(messageId);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === messageId ? { ...message, status: 'failed' } : message,
            ),
          );
        },
        onTypingChange: (isTyping) => {
          setTyping(blockedRef.current ? false : isTyping);
        },
        onIncomingMessage: (incoming) => {
          if (blockedRef.current) return;
          if (!isLiveRoom) {
            appendDemoMessage({
              id: `auto-${actorId}-${incoming.id}`,
              conversationId: room.id,
              senderId: partner.id,
              body: incoming.body,
              createdAt: incoming.createdAt,
              status: 'sent',
              autoForActorId: actorId,
            });
            return;
          }
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
          );
        },
      },
    );
  }, [actorId, isLiveRoom, partner.id, room.id]);

  // 데모 방: demo-store 조회·구독 및 초기화 세대 동기화
  const chatEpochRef = useRef<number | null>(null);
  useEffect(() => {
    if (isLiveRoom) {
      setHydrated(true);
      return;
    }
    const reload = () => {
      const epoch = chatDemoEpoch();
      const cleared = chatEpochRef.current !== null && epoch !== chatEpochRef.current;
      chatEpochRef.current = epoch;
      if (cleared) {
        pendingRef.current.clear();
        setTyping(false);
        dataSourceRef.current?.dispose();
        dataSourceRef.current = null;
        if (!blockedRef.current && !isDemoBlocked(actorId, partner.id)) createSource();
      }
      const stored = loadVisibleMessages(room.id, actorId);
      setMessages((prev) => (cleared ? stored : mergeMessages(prev, stored)));
    };
    reload();
    setHydrated(true);
    const offChat = subscribeChatDemo(reload);
    const offSafety = subscribeSafetyDemo(reload);
    return () => {
      offChat();
      offSafety();
    };
  }, [actorId, createSource, isLiveRoom, partner.id, room.id]);

  // 실계정 대화방(UUID): RLS 범위 내 과거 메시지 초기 로드 (빈 배열이면 초기 메시지를 지우지 않는다)
  useEffect(() => {
    if (!isLiveRoom) return;
    let cancelled = false;
    void fetchConversationMessages(room.id, isUuid(actorId) ? actorId : null).then((loaded) => {
      if (!cancelled && loaded && loaded.length > 0) {
        setMessages(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [actorId, isLiveRoom, room.id]);

  // 초기 차단 상태 확인 및 데이터 소스 연결
  useEffect(() => {
    if (!isLiveRoom) {
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
    }

    let cancelled = false;
    void checkIsBlockedOnServer(partner.id).then((serverBlocked) => {
      if (cancelled) return;
      if (serverBlocked) {
        blockedRef.current = true;
        setBlocked(true);
        dataSourceRef.current?.dispose();
        return;
      }
      blockedRef.current = false;
      setBlocked(false);
      createSource();
    });

    return () => {
      cancelled = true;
      dataSourceRef.current?.dispose();
    };
  }, [actorId, createSource, isLiveRoom, partner.id]);

  // 데모 방: 다른 탭이나 설정에서 차단 상태가 바뀌었을 때 동기화
  useEffect(() => {
    if (isLiveRoom) return;
    let epochSeen = safetyDemoEpoch();
    const onSafety = () => {
      const epoch = safetyDemoEpoch();
      const wiped = epoch !== epochSeen;
      epochSeen = epoch;
      const now = isDemoBlocked(actorId, partner.id);
      if (now === blockedRef.current) return;
      if (now) {
        blockedRef.current = true;
        setBlocked(true);
        dataSourceRef.current?.dispose();
        setTyping(false);
        setMessages((prev) =>
          prev.map((message) =>
            message.status === 'sending' ? { ...message, status: 'failed' } : message,
          ),
        );
        pushSystem(`${partner.nickname}님을 차단했어요. 더 이상 대화할 수 없어요.`);
        return;
      }
      blockedRef.current = false;
      setBlocked(false);
      createSource();
      // 키 삭제는 차단 목록이 비는 것이지, 이 방에서 해제한 것이 아니다.
      if (wiped) return;
      pushSystem('차단을 해제했어요. 다시 대화할 수 있어요.');
    };
    return subscribeSafetyDemo(onSafety);
  }, [actorId, createSource, isLiveRoom, partner.id, partner.nickname, pushSystem]);

  const confirmBlockLock = useCallback(() => {
    blockedRef.current = true;
    setBlocked(true);
    dataSourceRef.current?.dispose();
    setTyping(false);
    setMessages((prev) =>
      prev.map((message) =>
        message.status === 'sending' ? { ...message, status: 'failed' } : message,
      ),
    );
    pushSystem(`${partner.nickname}님을 차단했어요. 더 이상 대화할 수 없어요.`);
  }, [partner.nickname, pushSystem]);

  const applyBlock = useCallback(() => {
    if (blockedRef.current) return;

    if (!isLiveRoom) {
      saveDemoBlock(actorId, partner.id);
      confirmBlockLock();
      return;
    }

    const req: BlockRequest = { blockedUserId: partner.id };
    void submitBlock(req).then((res) => {
      if (blockedRef.current) return;
      if (!res.ok || res.mode !== 'supabase') {
        pushSystem(
          res.error?.message ??
            '차단 요청을 서버에 반영하지 못했어요. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }
      confirmBlockLock();
    });
  }, [actorId, confirmBlockLock, isLiveRoom, partner.id, pushSystem]);

  const releaseBlock = useCallback(() => {
    if (!blockedRef.current) return;

    if (!isLiveRoom) {
      blockedRef.current = false;
      setBlocked(false);
      removeDemoBlock(actorId, partner.id);
      createSource();
      pushSystem('차단을 해제했어요. 다시 대화할 수 있어요.');
      return;
    }

    void removeServerBlock(partner.id).then((res) => {
      if (!blockedRef.current) return;
      if (!res.ok || res.mode !== 'supabase') {
        pushSystem(
          res.error?.message ??
            '차단 해제를 서버에 반영하지 못했어요. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }
      blockedRef.current = false;
      setBlocked(false);
      createSource();
      pushSystem('차단을 해제했어요. 다시 대화할 수 있어요.');
    });
  }, [actorId, createSource, isLiveRoom, partner.id, pushSystem]);

  async function handleReportSubmit(req: ReportRequest): Promise<ReportSubmitOutcome> {
    if (!isLiveRoom) {
      saveDemoReport({
        reporterId: actorId,
        targetId: partner.id,
        nickname: partner.nickname,
        category: req.category,
        description: req.description,
      });
      if (req.alsoBlock) applyBlock();
      return { ok: true, mode: 'demo' };
    }

    const res = await submitReport(req);
    if (!res.ok || res.mode !== 'supabase') {
      return {
        ok: false,
        mode: 'supabase',
        errorMessage:
          res.error?.message ?? '신고 접수를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
      };
    }

    if (req.alsoBlock) {
      applyBlock();
    }
    return { ok: true, mode: 'supabase' };
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

  const sendMessage = useCallback(
    (body: string) => {
      if (blockedRef.current) return;
      if (!isLiveRoom && isDemoBlocked(actorId, partner.id)) return;
      const id = nextId(actorId);
      const createdAt = new Date().toISOString();
      pendingRef.current.set(id, { body, createdAt });
      setMessages((prev) => [
        ...prev,
        { id, senderId: actorId, sender: 'me', body, createdAt, status: 'sending' },
      ]);
      dataSourceRef.current?.sendMessage(id, body);
    },
    [actorId, isLiveRoom, partner.id],
  );

  useEffect(() => {
    if (!hydrated || !initialQuestion) return;
    const token = `${room.id}|${actorId}|${initialQuestion}`;
    if (questionToken.current === token) return;
    questionToken.current = token;
    const already = isLiveRoom
      ? messages.some((message) => message.sender === 'me' && message.body === initialQuestion)
      : loadVisibleMessages(room.id, actorId).some(
          (message) => message.senderId === actorId && message.body === initialQuestion,
        );
    if (!already) sendMessage(initialQuestion);
    onQuestionConsumed?.();
  }, [
    actorId,
    hydrated,
    initialQuestion,
    isLiveRoom,
    messages,
    onQuestionConsumed,
    room.id,
    sendMessage,
  ]);

  return (
    <section className="mt-chat" aria-label={`${partner.nickname}님과의 1:1 채팅`}>
      <header className="mt-chat-head">
        <div className="mt-chat-avatar" aria-hidden="true">
          {partner.nickname.slice(0, 1)}
        </div>
        <div className="mt-chat-head-text">
          <h2 className="mt-chat-title">{partner.nickname}</h2>
          <span className="mt-chat-demo">
            {blocked ? '차단됨 · ' : ''}
            {isLiveRoom ? '실시간 1:1 대화' : '데모 · 이 브라우저 안에서만 대화해요'}
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
        {isLiveRoom
          ? '매칭된 상대방과의 1:1 대화방이에요. 상호 존중하며 대화를 나눠 보세요.'
          : '데모 화면이에요. 메시지는 이 기기에만 저장되고, 서버로는 전송되지 않아요.'}
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
        liveMode={isLiveRoom}
        onSubmit={handleReportSubmit}
        onClose={closeReport}
      />
    </section>
  );
}
