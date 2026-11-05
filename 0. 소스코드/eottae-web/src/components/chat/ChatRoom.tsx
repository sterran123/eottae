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
  checkConversationMembership,
  createChatDataSource,
  fetchConversationMessages,
  isLiveChatRoom,
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

/**
 * 실계정 방: 서버에서 조회한 기록(빈 배열 포함)을 기준으로 두고,
 * 조회가 끝나기 전에 생긴 낙관적 전송·Realtime 수신·시스템 안내는 지우지 않고 합친다.
 * 이 방의 상태는 예시 메시지로 시작하지 않으므로, 서버 기록에 없는 행은 모두 이 세션에서 생긴 행이다.
 */
function mergeLiveHistory(prev: ChatMessage[], loaded: ChatMessage[]): ChatMessage[] {
  const ids = new Set(loaded.map((message) => message.id));
  const keep = prev.filter((message) => !ids.has(message.id));
  return [...loaded, ...keep].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

interface ChatRoomProps {
  room: ChatRoomInfo;
  actorId: string;
  sessionUserId?: string | null;
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
  sessionUserId,
  active,
  initialQuestion,
  onQuestionConsumed,
  onClose,
  onLastMessage,
}: ChatRoomProps) {
  const menuId = useId();
  const forbiddenTitleId = useId();
  const partner = room.partner;
  const isLiveRoom = Boolean(
    isUuid(actorId) &&
      sessionUserId &&
      actorId === sessionUserId &&
      isLiveChatRoom(room.id, partner.id),
  );
  const questionToken = useRef<string | null>(null);

  // 실계정 방은 예시 메시지로 시작하지 않는다 — 화면에는 서버 기록만 보인다.
  const [messages, setMessages] = useState<ChatMessage[]>(isLiveRoom ? [] : room.initialMessages);
  const [hydrated, setHydrated] = useState(false);
  const [typing, setTyping] = useState(false);
  const listEndRef = useRef<HTMLLIElement>(null);
  const dataSourceRef = useRef<ChatDataSource | null>(null);
  const pendingRef = useRef<Map<string, { body: string; createdAt: string }>>(new Map());

  // 실계정 방: 서버 차단 조회가 끝나 데이터 소스가 생긴 뒤에만 보내기를 연다.
  const [liveReady, setLiveReady] = useState(false);
  const liveReadyRef = useRef(false);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [lookupTick, setLookupTick] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);
  const [membership, setMembership] = useState<'pending' | 'member' | 'forbidden' | 'error'>(
    isLiveRoom ? 'pending' : 'member',
  );
  const forbidden = isLiveRoom && membership === 'forbidden';
  const [subscriptionLost, setSubscriptionLost] = useState(false);
  const [, setSubscriptionStatus] = useState<string>('IDLE');

  const setLiveReadyBoth = useCallback((ready: boolean) => {
    liveReadyRef.current = ready;
    setLiveReady(ready);
  }, []);

  const [blocked, setBlocked] = useState(false);
  const blockedRef = useRef(false);
  // 상대방 차단 등으로 INSERT가 42501 거부된 잠금 (내가 차단한 상태와 분리하여 해제 버튼으로 되돌리지 않음)
  const [peerBlocked, setPeerBlocked] = useState(false);
  const peerBlockedRef = useRef(false);
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
        onMessageSent: (messageId, serverId) => {
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
          setMessages((prev) => {
            // 실계정: 낙관적 로컬 id를 서버 행 id로 바꾼다. 재조회·Realtime으로 이미 같은 서버 행이 있으면 로컬 행만 뺀다.
            if (isLiveRoom && serverId && serverId !== messageId) {
              if (prev.some((message) => message.id === serverId)) {
                return prev.filter((message) => message.id !== messageId);
              }
              return prev.map((message) =>
                message.id === messageId ? { ...message, id: serverId, status: 'sent' } : message,
              );
            }
            return prev.map((message) =>
              message.id === messageId ? { ...message, status: 'sent' } : message,
            );
          });
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
          if (blockedRef.current || peerBlockedRef.current) return;
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
          setMessages((prev) => {
            if (prev.some((message) => message.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        },
        onChannelRevoked: () => {
          peerBlockedRef.current = true;
          setPeerBlocked(true);
          setTyping(false);
          setLiveReadyBoth(false);
          dataSourceRef.current?.dispose();
          dataSourceRef.current = null;
          pushSystem('대화가 종료되었거나 차단되어 더 이상 메시지를 보낼 수 없어요.');
        },
        onSubscriptionLost: () => {
          setSubscriptionLost(true);
          setTyping(false);
          setLiveReadyBoth(false);
          dataSourceRef.current?.dispose();
          dataSourceRef.current = null;
        },
        onSubscriptionStatus: (status) => {
          setSubscriptionStatus(status);
          if (status === 'SUBSCRIBED') {
            setSubscriptionLost(false);
          }
        },
      },
    );
  }, [actorId, isLiveRoom, partner.id, pushSystem, room.id, setLiveReadyBoth]);

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

  // 실계정 대화방(UUID): RLS 범위 내 과거 메시지 초기 로드 및 구성원 자격 검증 (TC-008).
  // 비구성원(제3자)은 빈 방으로 열리지 않고 채널 생성 전에 차단하여 '볼 수 없는 대화'로 둔다.
  useEffect(() => {
    if (!isLiveRoom) {
      setMembership('member');
      return;
    }
    let cancelled = false;
    setHistoryLoaded(false);
    setHistoryFailed(false);
    setMembership('pending');

    void (async () => {
      const memberStatus = await checkConversationMembership(room.id);
      if (cancelled) return;
      if (memberStatus === 'forbidden') {
        setMembership('forbidden');
        return;
      }
      if (memberStatus === 'error') {
        setMembership('error');
        setHistoryFailed(true);
        return;
      }
      setMembership('member');

      const loaded = await fetchConversationMessages(room.id, isUuid(actorId) ? actorId : null);
      if (cancelled) return;
      if (loaded) {
        setMessages((prev) => mergeLiveHistory(prev, loaded));
        setHistoryLoaded(true);
      } else {
        setHistoryFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorId, historyTick, isLiveRoom, room.id]);

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

    // 실계정: 구성원 자격이 'member'로 확정된 뒤에만 차단 조회 및 채널 생성을 진행한다 (TC-008).
    if (membership !== 'member' || peerBlockedRef.current) {
      setLiveReadyBoth(false);
      dataSourceRef.current?.dispose();
      dataSourceRef.current = null;
      return;
    }

    // 실계정: 조회가 끝나기 전에는 보내기를 열지 않는다 (데이터 소스가 없어 메시지가 sending에 머무는 창을 없앤다).
    let cancelled = false;
    setLiveReadyBoth(false);
    setLookupFailed(false);
    setSubscriptionLost(false);
    void checkIsBlockedOnServer(partner.id).then((status) => {
      if (cancelled) return;
      if (status === 'blocked') {
        blockedRef.current = true;
        setBlocked(true);
        dataSourceRef.current?.dispose();
        dataSourceRef.current = null;
        setMessages((prev) =>
          prev.map((message) =>
            message.status === 'sending' ? { ...message, status: 'failed' } : message,
          ),
        );
        return;
      }
      if (status === 'unknown') {
        // 확인하지 못한 것을 미차단으로 간주하지 않는다. 입력은 닫아 두고 다시 시도할 수 있게 한다.
        setLookupFailed(true);
        return;
      }
      blockedRef.current = false;
      setBlocked(false);
      createSource();
      setLiveReadyBoth(true);
    });

    return () => {
      cancelled = true;
      dataSourceRef.current?.dispose();
      dataSourceRef.current = null;
    };
  }, [actorId, createSource, isLiveRoom, lookupTick, membership, partner.id, setLiveReadyBoth]);

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
      blockedRef.current = true;
      const saved = saveDemoBlock(actorId, partner.id);
      if (!saved) {
        blockedRef.current = false;
        pushSystem('이 기기에서 차단을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
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
    if (peerBlockedRef.current) {
      pushSystem('상대방에 의해 차단된 상태에서는 대화를 다시 열 수 없어요.');
      return;
    }
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
      if (peerBlockedRef.current) return;
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
      setLiveReadyBoth(true);
      pushSystem('차단을 해제했어요. 다시 대화할 수 있어요.');
    });
  }, [actorId, createSource, isLiveRoom, partner.id, pushSystem, setLiveReadyBoth]);

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

    if (!req.alsoBlock) {
      return { ok: true, mode: 'supabase', blocked: false };
    }

    // 신고와 함께 차단: 서버 차단까지 끝난 뒤에만 「차단 처리했어요」를 안내하고 채팅을 잠근다.
    const block = await submitBlock({ blockedUserId: partner.id });
    if (!block.ok || block.mode !== 'supabase') {
      return {
        ok: true,
        mode: 'supabase',
        blocked: false,
        errorMessage:
          '신고는 접수되었어요. 차단은 서버에 반영되지 않았어요. 잠시 후 다시 시도해 주세요.',
      };
    }
    if (!blockedRef.current) confirmBlockLock();
    return { ok: true, mode: 'supabase', blocked: true };
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
      if (blockedRef.current || peerBlockedRef.current) return;
      if (!isLiveRoom && isDemoBlocked(actorId, partner.id)) return;
      // 실계정은 차단 조회가 끝나 데이터 소스가 생긴 뒤에만 보낸다 (입력도 그때까지 disabled).
      if (isLiveRoom && !liveReadyRef.current) return;
      const id = nextId(actorId);
      const createdAt = new Date().toISOString();
      const source = dataSourceRef.current;
      pendingRef.current.set(id, { body, createdAt });
      setMessages((prev) => [
        ...prev,
        {
          id,
          senderId: actorId,
          sender: 'me',
          body,
          createdAt,
          status: source ? 'sending' : 'failed',
        },
      ]);
      if (!source) {
        // 데이터 소스가 없으면 sending에 머물지 않고 바로 실패로 보인다.
        pendingRef.current.delete(id);
        return;
      }
      source.sendMessage(id, body);
    },
    [actorId, isLiveRoom, partner.id],
  );

  useEffect(() => {
    if (!hydrated || !initialQuestion) return;
    // 실계정은 차단 조회·데이터 소스·기록 로드가 끝난 뒤에 보낸다. 그 전에는 질문을 소모하지 않는다.
    // 차단으로 판정되면 보내지 않고 소모한다.
    if (isLiveRoom && !blocked && !peerBlocked && !(liveReady && historyLoaded)) return;
    const token = `${room.id}|${actorId}|${initialQuestion}`;
    if (questionToken.current === token) return;
    questionToken.current = token;
    const already = isLiveRoom
      ? messages.some((message) => message.sender === 'me' && message.body === initialQuestion)
      : loadVisibleMessages(room.id, actorId).some(
          (message) => message.senderId === actorId && message.body === initialQuestion,
        );
    if (!already && !peerBlocked) sendMessage(initialQuestion);
    onQuestionConsumed?.();
  }, [
    actorId,
    blocked,
    historyLoaded,
    hydrated,
    initialQuestion,
    isLiveRoom,
    liveReady,
    messages,
    onQuestionConsumed,
    peerBlocked,
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
            {blocked || peerBlocked ? '차단됨 · ' : ''}
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
                  disabled={peerBlocked}
                  onClick={() => {
                    setMenuOpen(false);
                    if (!peerBlocked) openBlockConfirm();
                  }}
                >
                  {peerBlocked ? '상대방에 의해 차단됨' : blocked ? '차단 해제하기' : '상대방 차단하기'}
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
          ? '매칭된 두 사람의 1:1 대화방이에요. 대화는 서버(public.messages)에 안전하게 저장됩니다.'
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

      {peerBlocked && !blocked && (
        <div className="mt-chat-blocked-bar" role="status">
          <span>상대방과의 대화가 제한되어 메시지를 보낼 수 없어요</span>
        </div>
      )}

      {isLiveRoom && subscriptionLost && !blocked && !peerBlocked && !forbidden && (
        <div className="mt-chat-blocked-bar" role="status">
          <span>실시간 연결이 끊어졌어요</span>
          <button type="button" onClick={() => setLookupTick((tick) => tick + 1)}>
            다시 연결
          </button>
        </div>
      )}

      {isLiveRoom && lookupFailed && !blocked && !peerBlocked && (
        <div className="mt-chat-blocked-bar" role="status">
          <span>차단 상태를 확인하지 못해 보내기를 잠시 닫았어요</span>
          <button type="button" onClick={() => setLookupTick((tick) => tick + 1)}>
            다시 확인
          </button>
        </div>
      )}

      {isLiveRoom && forbidden && (
        <section className="mt-chat-forbidden" role="status" aria-labelledby={forbiddenTitleId}>
          <h2 id={forbiddenTitleId}>볼 수 없는 대화</h2>
          <p>이 방의 매칭 구성원이 아니라 메시지를 볼 수 없어요.</p>
        </section>
      )}

      {isLiveRoom && historyFailed && !blocked && !peerBlocked && !forbidden && (
        <div className="mt-chat-blocked-bar" role="status">
          <span>대화를 불러오지 못했어요</span>
          <button type="button" onClick={() => setHistoryTick((tick) => tick + 1)}>
            다시 시도
          </button>
        </div>
      )}

      <MessageComposer
        onSend={sendMessage}
        disabled={
          blocked ||
          peerBlocked ||
          !active ||
          (isLiveRoom && (forbidden || subscriptionLost || !liveReady || !historyLoaded || historyFailed))
        }
        disabledReason={
          blocked
            ? '차단한 상대와는 대화할 수 없어요'
            : peerBlocked
              ? '상대방과의 대화가 제한되어 메시지를 보낼 수 없어요'
              : isLiveRoom && (forbidden || subscriptionLost || !liveReady || !historyLoaded || historyFailed)
                ? forbidden
                  ? '구성원이 아니라 메시지를 보낼 수 없어요'
                  : subscriptionLost
                    ? '실시간 연결이 끊어져 보내기를 닫았어요'
                    : historyFailed
                      ? '대화를 불러오지 못해 보내기를 닫았어요'
                      : lookupFailed
                        ? '차단 상태를 확인한 뒤에 보낼 수 있어요'
                        : !historyLoaded
                          ? '이전 대화를 불러오고 있어요'
                          : '대화방을 준비하고 있어요'
                : undefined
        }
        textOnly={isLiveRoom}
      />

      <BlockConfirmModal
        open={blockOpen}
        mode={confirmMode}
        partnerName={partner.nickname}
        liveMode={isLiveRoom}
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
