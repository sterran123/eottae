'use client';

// ============================================================
//  저장 경로: src/components/chat/ChatHub.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 대화방 목록(ChatList) + 우측 슬라이드 패널(ChatRoom) 오케스트레이션.
//        방을 열면 패널이 우측에서 열리고, ✕·Esc·바깥(딤) 클릭으로 닫혀 목록으로 돌아온다.
//        한 번 연 방은 닫아도 마운트를 유지해 대화·차단 상태가 보존된다(카카오톡처럼).
//
//  [경계] 대화방·메시지는 모두 DEMO 로컬 state. 서버 연동(주한태)·실시간 구독은 별도 설계 후.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DEMO_ROOMS } from '@/lib/chat/demo-data';
import type { ChatMessage } from '@/lib/chat/types';
import ChatList, { type ChatRoomPreview } from './ChatList';
import ChatRoom from './ChatRoom';

const INITIAL_PREVIEWS: Record<string, ChatRoomPreview> = Object.fromEntries(
  DEMO_ROOMS.map((room) => [
    room.id,
    {
      lastMessage: room.initialMessages[room.initialMessages.length - 1]?.body ?? '',
      timeLabel: room.timeLabel,
      unread: room.unread,
    },
  ]),
);

export default function ChatHub() {
  const searchParams = useSearchParams();
  const initialPartnerId = searchParams.get('partner');
  const initialQuestion = searchParams.get('q');
  // 추천 카드(?partner=&q=) 진입 시 일치하는 partner/room id가 있으면 해당 방을 열고, 없으면 첫 데모 방으로 폴백
  const questionRoomId =
    DEMO_ROOMS.find((r) => r.partner.id === initialPartnerId || r.id === initialPartnerId)?.id ??
    DEMO_ROOMS[0].id;

  const [activeId, setActiveId] = useState<string | null>(null);
  // 한 번이라도 연 방 — 닫아도 마운트를 유지해 상태를 보존한다.
  const [visited, setVisited] = useState<string[]>([]);
  const [previews, setPreviews] = useState(INITIAL_PREVIEWS);

  const activeRef = useRef<string | null>(null);
  const prevActive = useRef<string | null>(null);
  const handledQuestion = useRef(false);

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const openRoom = useCallback((id: string) => {
    setActiveId(id);
    setVisited((v) => (v.includes(id) ? v : [...v, id]));
    setPreviews((p) => ({ ...p, [id]: { ...p[id], unread: 0 } }));
  }, []);

  const closeRoom = useCallback(() => setActiveId(null), []);

  // 패널이 열려 있는 동안 배경 페이지 스크롤 방지
  useEffect(() => {
    if (activeId) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeId]);

  // 추천 카드 "가볍게 물어보기"(?q=) 진입 → 첫 방을 열고 질문을 전송한다.
  // [경계] DEMO에서는 DEMO_ROOMS[0]으로 고정하지만, 서버 연동 시에는 쿼리의 match id 대상 방으로 연결한다.
  useEffect(() => {
    if (initialQuestion && !handledQuestion.current) {
      handledQuestion.current = true;
      openRoom(questionRoomId);
    }
  }, [initialQuestion, openRoom, questionRoomId]);

  // 새 메시지 → 목록 미리보기 갱신. 닫힌 방에 온 상대 메시지는 안 읽음으로 센다.
  const handleLastMessage = useCallback((roomId: string, msg: ChatMessage) => {
    const isOpen = activeRef.current === roomId;
    setPreviews((p) => {
      const cur = p[roomId];
      const incoming = msg.sender === 'partner' && !isOpen;
      return {
        ...p,
        [roomId]: {
          ...cur,
          lastMessage: msg.body,
          timeLabel: '방금',
          unread: incoming ? cur.unread + 1 : cur.unread,
        },
      };
    });
  }, []);

  // 포커스 관리: 열면 닫기 버튼으로, 닫으면 눌렀던 목록 항목으로 복귀
  useEffect(() => {
    const prev = prevActive.current;
    prevActive.current = activeId;
    if (activeId) {
      document
        .querySelector<HTMLElement>(`#mt-chat-panel-${activeId} .mt-chat-close`)
        ?.focus();
    } else if (prev) {
      document.getElementById(`mt-chatlist-item-${prev}`)?.focus();
    }
  }, [activeId]);

  // 패널 내 포커스 트랩: 활성 패널 밖(헤더·푸터 등)으로 Tab 포커스가 빠져나가지 않도록 순환
  useEffect(() => {
    if (!activeId) return;
    const panel = document.getElementById(`mt-chat-panel-${activeId}`);
    if (!panel) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      // 대화상자(dialog[open])는 브라우저가 자체 포커스를 가두므로 양보
      if (panel.querySelector('dialog[open]')) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([tabindex="-1"]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
        // 닫힌 dialog 안·hidden 요소는 제외 (화면에 박스가 없으면 포커스 불가)
      ).filter((el) => !el.closest('dialog:not([open])') && el.getClientRects().length > 0);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const inside = panel.contains(document.activeElement);

      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeId]);

  // Esc로 닫기 — 한글 IME 조합 중이거나 활성 패널 내의 더보기 메뉴·차단/신고 모달이 열려 있으면 양보한다.
  useEffect(() => {
    if (!activeId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return;
      const activePanel = document.getElementById(`mt-chat-panel-${activeId}`);
      if (activePanel?.querySelector('dialog[open], .mt-chat-menu-list')) return;
      closeRoom();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeId, closeRoom]);

  return (
    <>
      {/* 패널이 열려 있는 동안 뒤 목록은 포커스·읽기 대상에서 제외 */}
      <div className="mt-chathub" inert={activeId !== null}>
        <header className="mt-chathub-head">
          <h1 className="mt-chathub-title">채팅</h1>
          <p className="mt-chathub-note" role="note">
            DEMO · 가상 대화방이에요. 실제 상대·서버 연동은 아직 없어요.
          </p>
        </header>
        <ChatList
          rooms={DEMO_ROOMS}
          previews={previews}
          activeId={activeId}
          onOpen={openRoom}
        />
      </div>

      {activeId && <div className="mt-chat-backdrop" aria-hidden="true" onClick={closeRoom} />}

      {DEMO_ROOMS.filter((r) => visited.includes(r.id)).map((room) => (
        <div
          key={room.id}
          id={`mt-chat-panel-${room.id}`}
          className="mt-chat-panel"
          role="dialog"
          aria-modal="true"
          aria-label={`${room.partner.nickname}님과의 채팅`}
          hidden={activeId !== room.id}
        >
          <ChatRoom
            room={room}
            active={activeId === room.id}
            initialQuestion={room.id === questionRoomId ? initialQuestion : null}
            onClose={closeRoom}
            onLastMessage={handleLastMessage}
          />
        </div>
      ))}
    </>
  );
}
