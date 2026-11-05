'use client';

// ============================================================
//  저장 경로: src/components/chat/ChatHub.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 대화 목록과 우측 패널. 탭마다 데모 사용자를 고르고,
//        구성원이 아닌 방은 열지 않는다.
// ============================================================

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth';
import {
  checkConversationMembership,
  fetchMyLiveConversations,
} from '@/lib/chat/chat-service';
import {
  DEMO_ACTORS,
  DEMO_ROOMS,
  DEMO_SELF,
  actorFromQuery,
  counterpartDemoLink,
  demoRoomAccess,
  findDemoRoomId,
  viewRoomForActor,
} from '@/lib/chat/demo-data';
import { ensureChatSeed, loadVisibleMessages, subscribeChatDemo } from '@/lib/chat/demo-store';
import { isUuid, type ChatMessage, type ChatRoomInfo } from '@/lib/chat/types';
import { subscribeSafetyDemo } from '@/lib/safety/demo-store';
import SafetyDemoPanels from '@/components/safety/SafetyDemoPanels';
import ChatList, { type ChatRoomPreview } from './ChatList';
import ChatRoom from './ChatRoom';

/** 이 탭에서 그 방의 메시지를 어디까지 봤는지. 예시 unread를 다시 더하지 않는다. */
type SeenCursor = { id: string; at: string };

function rememberSeen(seen: Record<string, SeenCursor>, actorId: string, roomId: string) {
  const messages = loadVisibleMessages(roomId, actorId);
  const last = messages[messages.length - 1];
  if (!last) return;
  seen[`${actorId}|${roomId}`] = { id: last.id, at: last.createdAt };
}

function previewFor(
  room: ChatRoomInfo,
  actorId: string,
  open: boolean,
  seen: SeenCursor | undefined,
): ChatRoomPreview {
  const viewed = viewRoomForActor(room, actorId);
  const messages = loadVisibleMessages(room.id, actorId);
  // 삭제로 보이는 저장이 없으면 본문도 빈다. 예시 마지막 문장과 room.unread로 되돌리면 목록만 남는다.
  if (messages.length === 0) {
    return { lastMessage: '', timeLabel: '', unread: 0 };
  }
  const last = messages[messages.length - 1];
  const seedIds = new Set(room.initialMessages.map((message) => message.id));
  const lastIsSeed = seedIds.has(last.id);
  let unread = 0;
  if (!open) {
    if (seen) {
      const index = messages.findIndex((message) => message.id === seen.id);
      const after = index >= 0
        ? messages.slice(index + 1)
        : messages.filter((message) => Date.parse(message.createdAt) > Date.parse(seen.at));
      unread = after.filter((message) => message.sender === 'partner').length;
    } else {
      const fresh = messages.filter((message) => message.sender === 'partner' && !seedIds.has(message.id)).length;
      unread = (viewed?.unread ?? 0) + fresh;
    }
  }
  return {
    lastMessage: last.body,
    timeLabel: lastIsSeed ? (viewed?.timeLabel ?? room.timeLabel) : '방금',
    unread: Math.min(99, unread),
  };
}

export default function ChatHub() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const forbiddenTitleId = useId();

  const roomParam = searchParams.get('room');
  const partnerParam = searchParams.get('partner');
  const initialQuestion = searchParams.get('q');
  const asParam = searchParams.get('as');

  const liveSessionId =
    auth.status === 'signed-in' && isUuid(auth.user?.id) ? auth.user.id : null;
  const isDemoOverride = Boolean(asParam && !isUuid(asParam));
  const useLive = !isDemoOverride && liveSessionId !== null;

  const actor = useMemo(
    () =>
      useLive && liveSessionId
        ? { id: liveSessionId, nickname: auth.account?.nickname?.trim() || '내 계정' }
        : actorFromQuery(asParam),
    [asParam, auth.account?.nickname, liveSessionId, useLive],
  );

  const isUuidRoom = isUuid(roomParam);
  const isUuidPartner = isUuid(partnerParam);

  const [liveRooms, setLiveRooms] = useState<ChatRoomInfo[]>([]);
  const [liveRoomsLoading, setLiveRoomsLoading] = useState(false);
  const [liveRoomsFailed, setLiveRoomsFailed] = useState(false);
  const [uuidRoomStatus, setUuidRoomStatus] = useState<
    'idle' | 'pending' | 'member' | 'forbidden' | 'error'
  >(() => (useLive && isUuid(roomParam) ? 'pending' : 'idle'));
  const [liveRetryNonce, setLiveRetryNonce] = useState(0);

  useEffect(() => {
    if (!useLive) {
      setLiveRooms([]);
      setLiveRoomsLoading(false);
      setLiveRoomsFailed(false);
      setUuidRoomStatus('idle');
      return;
    }

    let cancelled = false;
    setLiveRoomsLoading(true);
    setLiveRoomsFailed(false);
    setUuidRoomStatus(isUuidRoom ? 'pending' : 'idle');

    void Promise.all([
      fetchMyLiveConversations(liveSessionId),
      isUuidRoom && roomParam
        ? checkConversationMembership(roomParam)
        : Promise.resolve('idle' as const),
    ]).then(([rooms, membership]) => {
      if (cancelled) return;
      setLiveRoomsLoading(false);
      if (rooms === null) {
        setLiveRooms([]);
        setLiveRoomsFailed(true);
      } else {
        setLiveRooms(rooms);
        setLiveRoomsFailed(false);
      }

      if (isUuidRoom) {
        if (membership === 'member' && rooms === null) {
          setUuidRoomStatus('error');
        } else {
          setUuidRoomStatus(membership);
        }
      } else {
        setUuidRoomStatus('idle');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [liveRetryNonce, liveSessionId, roomParam, isUuidRoom, useLive]);

  const demoVisibleRooms = useMemo(
    () =>
      DEMO_ROOMS.map((room) => viewRoomForActor(room, actor.id)).filter(
        (room): room is ChatRoomInfo => room !== null,
      ),
    [actor.id],
  );

  const visibleRooms = useLive ? liveRooms : demoVisibleRooms;

  const requested = roomParam || partnerParam || '';
  const demoAccess = !useLive && !isUuidRoom ? demoRoomAccess(actor.id, requested || null) : 'none';

  const openedRoomId = useMemo(() => {
    if (!useLive) {
      return demoAccess === 'member' ? findDemoRoomId(requested) : null;
    }
    if (isUuidRoom) {
      if (uuidRoomStatus === 'member' && roomParam && visibleRooms.some((r) => r.id === roomParam)) {
        return roomParam;
      }
      return null;
    }
    if (isUuidPartner && partnerParam) {
      return visibleRooms.find((r) => r.partner.id === partnerParam)?.id ?? null;
    }
    return null;
  }, [demoAccess, isUuidPartner, isUuidRoom, partnerParam, requested, roomParam, useLive, uuidRoomStatus, visibleRooms]);

  const shouldAutoOpen = Boolean(openedRoomId && (roomParam || partnerParam || initialQuestion));

  const forbidden = useMemo(() => {
    if (auth.status === 'loading' && (isUuidRoom || isUuidPartner)) {
      return false;
    }
    if (!useLive) {
      if (isUuidRoom || (partnerParam && isUuidPartner)) {
        return true;
      }
      return demoAccess === 'denied';
    }
    if (isUuidRoom) {
      return uuidRoomStatus === 'forbidden';
    }
    if (partnerParam) {
      if (!isUuidPartner) return true;
      return !liveRoomsLoading && !liveRoomsFailed && !visibleRooms.some((r) => r.partner.id === partnerParam);
    }
    return false;
  }, [auth.status, demoAccess, isUuidPartner, isUuidRoom, liveRoomsFailed, liveRoomsLoading, partnerParam, useLive, uuidRoomStatus, visibleRooms]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [storedPreviews, setStoredPreviews] = useState<Record<string, ChatRoomPreview> | null>(null);
  const [previewActor, setPreviewActor] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  // 닫아도 유지한다. 열린 동안 허브는 inert이고 딤이 클릭을 받아, 닫힌 뒤 링크가 다른 방으로 바뀌면 안 된다.
  const linkRoomRef = useRef<string | null>(null);
  const prevActive = useRef<string | null>(null);
  const openedToken = useRef<string | null>(null);
  const seenRef = useRef<Record<string, SeenCursor>>({});

  useEffect(() => {
    activeRef.current = activeId;
    if (!activeId) return;
    const member = DEMO_ROOMS.some(
      (room) => room.id === activeId && room.members.some((person) => person.id === actor.id),
    );
    if (member) rememberSeen(seenRef.current, actor.id, activeId);
  }, [activeId, actor.id]);

  useEffect(() => {
    ensureChatSeed();
    const apply = () => {
      const next: Record<string, ChatRoomPreview> = {};
      for (const room of DEMO_ROOMS) {
        if (!room.members.some((member) => member.id === actor.id)) continue;
        const open = activeRef.current === room.id;
        if (open) rememberSeen(seenRef.current, actor.id, room.id);
        next[room.id] = previewFor(room, actor.id, open, seenRef.current[`${actor.id}|${room.id}`]);
      }
      setPreviewActor(actor.id);
      setStoredPreviews(next);
    };
    apply();
    const offChat = subscribeChatDemo(apply);
    const offSafety = subscribeSafetyDemo(apply);
    return () => {
      offChat();
      offSafety();
    };
  }, [actor.id]);

  useEffect(() => {
    const visibleIds = visibleRooms.map((room) => room.id);
    const openToken = `${actor.id}|${roomParam ?? ''}|${partnerParam ?? ''}|${openedRoomId ?? ''}`;
    const token = `${openToken}|${initialQuestion ?? ''}`;
    const auto = shouldAutoOpen && openedRoomId ? openedRoomId : null;
    if (openedToken.current === token) return;
    const questionCleared = Boolean(openedToken.current?.startsWith(`${openToken}|`) && !initialQuestion);
    openedToken.current = token;
    if (questionCleared) return;
    setActiveId((current) => {
      if (auto) return auto;
      if (current && visibleIds.includes(current)) return current;
      return null;
    });
    setVisited((current) => {
      const kept = current.filter((id) => visibleIds.includes(id));
      if (auto && !kept.includes(auto)) return [...kept, auto];
      return kept;
    });
    if (auto) {
      linkRoomRef.current = auto;
      activeRef.current = auto;
      if (!isUuid(auto)) rememberSeen(seenRef.current, actor.id, auto);
      setStoredPreviews((current) => {
        if (!current?.[auto]) return current;
        return { ...current, [auto]: { ...current[auto], unread: 0 } };
      });
    }
  }, [actor.id, initialQuestion, openedRoomId, partnerParam, roomParam, shouldAutoOpen, visibleRooms]);

  useEffect(() => {
    if (activeId) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeId]);

  function openRoom(id: string) {
    linkRoomRef.current = id;
    activeRef.current = id;
    if (!isUuid(id)) rememberSeen(seenRef.current, actor.id, id);
    setActiveId(id);
    setVisited((current) => (current.includes(id) ? current : [...current, id]));
    setStoredPreviews((current) => {
      const room = DEMO_ROOMS.find((item) => item.id === id);
      const base = current?.[id] ?? (room
        ? previewFor(room, actor.id, true, seenRef.current[`${actor.id}|${id}`])
        : { lastMessage: '', timeLabel: '', unread: 0 });
      return { ...(current ?? {}), [id]: { ...base, unread: 0 } };
    });
  }

  function closeRoom() {
    activeRef.current = null;
    setActiveId(null);
  }

  const consumeQuestion = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has('q')) return;
    params.delete('q');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  function chooseActor(nextId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('as', nextId);
    params.delete('q');
    const room = params.get('room');
    const partner = params.get('partner');
    if (room && (isUuid(room) || demoRoomAccess(nextId, room) !== 'member')) params.delete('room');
    if (partner && (isUuid(partner) || demoRoomAccess(nextId, partner) !== 'member')) params.delete('partner');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const handleLastMessage = (roomId: string, message: ChatMessage) => {
    setStoredPreviews((current) => {
      const room = visibleRooms.find((item) => item.id === roomId);
      const base = current?.[roomId] ?? {
        lastMessage: '',
        timeLabel: room?.timeLabel ?? '방금',
        unread: 0,
      };
      return {
        ...(current ?? {}),
        [roomId]: { ...base, lastMessage: message.body, timeLabel: '방금' },
      };
    });
  };

  useEffect(() => {
    const prev = prevActive.current;
    prevActive.current = activeId;
    if (activeId) {
      document.querySelector<HTMLElement>(`#mt-chat-panel-${activeId} .mt-chat-close`)?.focus();
    } else if (prev) {
      document.getElementById(`mt-chatlist-item-${prev}`)?.focus();
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const panel = document.getElementById(`mt-chat-panel-${activeId}`);
    if (!panel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      if (panel.querySelector('dialog[open]')) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([tabindex="-1"]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.closest('dialog:not([open])') && element.getClientRects().length > 0);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const inside = panel.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      const activePanel = document.getElementById(`mt-chat-panel-${activeId}`);
      if (activePanel?.querySelector('dialog[open], .mt-chat-menu-list')) return;
      closeRoom();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeId]);

  const seedPreviews: Record<string, ChatRoomPreview> = Object.fromEntries(
    visibleRooms.map((room) => {
      const last = room.initialMessages[room.initialMessages.length - 1];
      return [room.id, { lastMessage: last?.body ?? '', timeLabel: room.timeLabel, unread: room.unread }];
    }),
  );
  const previews =
    previewActor === actor.id && storedPreviews ? { ...seedPreviews, ...storedPreviews } : seedPreviews;
  const pair = counterpartDemoLink(actor.id, activeId ?? linkRoomRef.current);
  const deniedParams = new URLSearchParams();
  if (actor.id !== DEMO_SELF.id) deniedParams.set('as', actor.id);
  deniedParams.set('room', 'not-a-match');
  const actors = DEMO_ACTORS.some((item) => item.id === actor.id) ? DEMO_ACTORS : [...DEMO_ACTORS, actor];

  return (
    <>
      <div className="mt-chathub" inert={activeId !== null}>
        <header className="mt-chathub-head">
          <h1 className="mt-chathub-title">채팅</h1>
          <p className="mt-chathub-note" role="note">
            {useLive
              ? '매칭된 상대와의 실시간 대화예요. 매칭 구성원만 대화를 열람하고 주고받을 수 있어요.'
              : '데모 · 가상 대화예요. 서버로는 가지 않고 이 브라우저에 남아요. 다른 탭에서 상대 계정을 고르면 메시지를 주고받을 수 있어요.'}
          </p>
        </header>

        {!useLive && (
          <div className="mt-chat-tools">
            <label className="mt-chat-actor-label">
              이 탭의 데모 사용자
              <select
                className="mt-chat-actor"
                value={actor.id}
                onChange={(event) => chooseActor(event.target.value)}
              >
                {actors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nickname}
                  </option>
                ))}
              </select>
            </label>
            <Link
              className="mt-chat-tool-link"
              href={`/match/chat?as=${encodeURIComponent(pair.actorId)}&room=${encodeURIComponent(pair.roomId)}`}
              target="_blank"
              rel="noreferrer"
            >
              새 탭에서 {pair.nickname} 계정으로 이 대화 열기 (데모)
            </Link>
            <Link className="mt-chat-tool-link" href={`/match/chat?${deniedParams.toString()}`}>
              구성원이 아닌 방 열어보기 (데모)
            </Link>
          </div>
        )}

        {(uuidRoomStatus === 'error' || (useLive && liveRoomsFailed)) && (
          <section className="mt-chat-forbidden" role="status">
            <h2>대화를 불러오지 못했어요</h2>
            <p>네트워크 연결을 확인한 뒤 다시 시도해 주세요.</p>
            <button
              type="button"
              className="mt-safety-btn"
              onClick={() => setLiveRetryNonce((n) => n + 1)}
            >
              다시 시도
            </button>
          </section>
        )}

        {forbidden && (
          <section className="mt-chat-forbidden" role="status" aria-labelledby={forbiddenTitleId}>
            <h2 id={forbiddenTitleId}>볼 수 없는 대화</h2>
            <p>이 방의 매칭 구성원이 아니라 메시지를 볼 수 없어요.</p>
            {!useLive && !isUuidRoom && <p className="mt-chat-demo">데모</p>}
          </section>
        )}

        {(auth.status === 'loading' && (isUuidRoom || isUuidPartner)) || (useLive && liveRoomsLoading) || uuidRoomStatus === 'pending' ? (
          <p className="mt-report-empty" role="status">
            대화 목록을 불러오는 중이에요…
          </p>
        ) : visibleRooms.length === 0 ? (
          <p className="mt-report-empty">
            {useLive ? '열린 대화가 없어요.' : '이 데모 사용자로 열린 대화가 없어요.'}
          </p>
        ) : (
          <ChatList rooms={visibleRooms} previews={previews} activeId={activeId} onOpen={openRoom} />
        )}

        <SafetyDemoPanels actorId={actor.id} isDemoOverride={isDemoOverride} />
      </div>

      {activeId && <div className="mt-chat-backdrop" aria-hidden="true" onClick={closeRoom} />}

      {visibleRooms.filter((room) => visited.includes(room.id)).map((viewed) => (
        <div
          key={`${actor.id}-${viewed.id}`}
          id={`mt-chat-panel-${viewed.id}`}
          className="mt-chat-panel"
          role="dialog"
          aria-modal="true"
          aria-label={`${viewed.partner.nickname}님과의 채팅`}
          hidden={activeId !== viewed.id}
        >
          <ChatRoom
            room={viewed}
            actorId={actor.id}
            sessionUserId={liveSessionId}
            active={activeId === viewed.id}
            initialQuestion={viewed.id === openedRoomId ? initialQuestion : null}
            onQuestionConsumed={consumeQuestion}
            onClose={closeRoom}
            onLastMessage={handleLastMessage}
          />
        </div>
      ))}
    </>
  );
}
