'use client';

// ============================================================
//  저장 경로: src/components/chat/ChatRoom.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 채팅방 컨테이너 — 헤더, 메시지 목록(자동 스크롤), 입력창.
//        전송은 로컬 state 데모: sending → (400ms) → sent, 이어서 상대 자동 응답.
//
//  [경계] 실제 서버 연동(주한태 API/RLS)·실시간 구독은 별도 설계 리뷰 후 착수.
//         아래 sendMessage 내부가 API 호출로 교체될 지점이다.
//  [MATCH-008] 헤더 더보기 메뉴 → 차단/신고. 차단 시 입력·전송·자동응답 즉시 정지(TC-009).
// ============================================================

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createDemoChatDataSource, type ChatDataSource } from '@/lib/chat/chat-service';
import type { ChatMessage, ChatRoomInfo } from '@/lib/chat/types';
import type { BlockRequest, ReportRequest } from '@/lib/safety/types';
import BlockConfirmModal from '@/components/safety/BlockConfirmModal';
import ReportModal from '@/components/safety/ReportModal';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';

let seq = 0;
const nextId = () => `local-${Date.now()}-${seq++}`;

interface ChatRoomProps {
  room: ChatRoomInfo;
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
  active,
  initialQuestion,
  onClose,
  onLastMessage,
}: ChatRoomProps) {
  const menuId = useId();
  const partner = room.partner;
  const hasHandledQuestion = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>(room.initialMessages);
  const [typing, setTyping] = useState(false);
  const listEndRef = useRef<HTMLLIElement>(null);
  const dataSourceRef = useRef<ChatDataSource | null>(null);

  // ---- MATCH-008 안전 기능 ----
  const [blocked, setBlocked] = useState(false);
  // 타이머 콜백이 최신 차단 상태를 보도록 ref로도 보관
  const blockedRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  // 확인 모달이 차단용인지 해제용인지 — 열 때 정해 두어 확정 직후 문구가 바뀌지 않게 한다.
  const [confirmMode, setConfirmMode] = useState<'block' | 'unblock'>('block');
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // 새 메시지·입력중 표시마다 맨 아래로 스크롤 (패널이 열려 있을 때만 의미가 있다)
  useEffect(() => {
    if (active) listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, typing, active]);

  // 마지막 메시지가 바뀌면 목록 미리보기에 알림 (초기 메시지는 목록이 이미 알고 있다)
  const lastNotifiedId = useRef(room.initialMessages[room.initialMessages.length - 1]?.id);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === lastNotifiedId.current) return;
    lastNotifiedId.current = last.id;
    onLastMessage?.(room.id, last);
  }, [messages, room.id, onLastMessage]);

  // 데이터 소스 연결 및 언마운트 시 대기 중 타이머/구독 정리
  const createSource = useCallback(() => {
    dataSourceRef.current?.dispose();
    dataSourceRef.current = createDemoChatDataSource({
      onMessageSent: (messageId) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, status: 'sent' } : m)),
        );
      },
      onTypingChange: (isTyping) => {
        setTyping(isTyping);
      },
      onIncomingMessage: (incoming) => {
        setMessages((prev) => [...prev, incoming]);
      },
    });
  }, []);

  useEffect(() => {
    createSource();
    return () => {
      dataSourceRef.current?.dispose();
    };
  }, [createSource]);

  const pushSystem = useCallback((body: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        sender: 'system',
        body,
        createdAt: new Date().toISOString(),
        status: 'sent',
      },
    ]);
  }, []);

  // 차단 적용: 대기 중 전송·자동응답·구독 전부 해제, 미전송 메시지는 실패 처리
  const applyBlock = useCallback(() => {
    if (blockedRef.current) return;
    const req: BlockRequest = { blockedUserId: partner.id };
    void req; // [DEMO] Supabase 연동 시 blocks 테이블 insert에 사용
    blockedRef.current = true;
    setBlocked(true);
    dataSourceRef.current?.dispose();
    setMessages((prev) =>
      prev.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' } : m)),
    );
    pushSystem(`${partner.nickname}님을 차단했어요. 더 이상 대화할 수 없어요.`);
  }, [pushSystem, partner.id, partner.nickname]);

  const releaseBlock = useCallback(() => {
    if (!blockedRef.current) return;
    blockedRef.current = false;
    setBlocked(false);
    createSource();
    pushSystem('차단을 해제했어요. 다시 대화할 수 있어요.');
  }, [createSource, pushSystem]);

  function handleReportSubmit(req: ReportRequest) {
    // [DEMO] 서버 전송 없음. 신고 내용은 저장·로깅하지 않는다.
    if (req.alsoBlock) applyBlock();
  }

  // 차단/해제 확인 모달 열기 (해제도 실수 방지를 위해 항상 확인을 거친다)
  function openBlockConfirm() {
    setConfirmMode(blockedRef.current ? 'unblock' : 'block');
    setBlockOpen(true);
  }

  // 모달이 닫히면 메뉴 항목이 이미 사라져 포커스가 갈 곳을 잃으므로 트리거로 복귀
  function closeBlockConfirm() {
    setBlockOpen(false);
    menuBtnRef.current?.focus();
  }
  function closeReport() {
    setReportOpen(false);
    menuBtnRef.current?.focus();
  }

  // 더보기 메뉴: 바깥 클릭·Esc로 닫고, Esc일 때 트리거로 포커스 복귀
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
    if (blockedRef.current) return; // 차단 중에는 어떤 경로로도 전송 금지
    const id = nextId();
    setMessages((prev) => [
      ...prev,
      { id, sender: 'me', body, createdAt: new Date().toISOString(), status: 'sending' },
    ]);
    dataSourceRef.current?.sendMessage(id, body);
  }, []);

  // 추천 카드에서 "가볍게 물어보기" 버튼 클릭하여 진입한 경우, 해당 질문을 즉시 전송
  useEffect(() => {
    if (initialQuestion && !hasHandledQuestion.current) {
      hasHandledQuestion.current = true;
      sendMessage(initialQuestion);
    }
  }, [initialQuestion, sendMessage]);

  return (
    <section className="mt-chat" aria-label={`${partner.nickname}님과의 1:1 채팅`}>
      <header className="mt-chat-head">
        <div className="mt-chat-avatar" aria-hidden="true">
          {partner.nickname.slice(0, 1)}
        </div>
        <div className="mt-chat-head-text">
          <h2 className="mt-chat-title">{partner.nickname}</h2>
          <span className="mt-chat-demo">
            {blocked ? '차단됨 · ' : ''}DEMO · 실제 채팅이 아니에요
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
            onClick={() => setMenuOpen((o) => !o)}
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
