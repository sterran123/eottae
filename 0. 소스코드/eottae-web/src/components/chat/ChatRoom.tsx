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

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ChatMessage } from '@/lib/chat/types';
import type { ReportRequest } from '@/lib/safety/types';
import {
  DEMO_INITIAL_MESSAGES,
  DEMO_PARTNER,
  DEMO_REPLIES,
} from '@/lib/chat/demo-data';
import BlockConfirmModal from '@/components/safety/BlockConfirmModal';
import ReportModal from '@/components/safety/ReportModal';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';

let seq = 0;
const nextId = () => `local-${Date.now()}-${seq++}`;

export default function ChatRoom() {
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get('q');
  const hasHandledQuestion = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_INITIAL_MESSAGES);
  const [typing, setTyping] = useState(false);
  const listEndRef = useRef<HTMLLIElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const replyIdx = useRef(0);
  // 아직 응답이 오지 않은 내 메시지 수 — 연속 전송 시 '입력 중' 표시가 먼저 꺼지지 않게 한다.
  const pendingReplies = useRef(0);

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
    const t = setTimeout(() => {
      // 실행이 끝난 타이머는 배열에서 제거해 누적을 막는다.
      const i = timers.current.indexOf(t);
      if (i !== -1) timers.current.splice(i, 1);
      fn();
    }, ms);
    timers.current.push(t);
  }, []);

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

  // 차단 적용: 대기 중 전송·자동응답 타이머 전부 취소, 미전송 메시지는 실패 처리
  const applyBlock = useCallback(() => {
    if (blockedRef.current) return;
    blockedRef.current = true;
    setBlocked(true);
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    pendingReplies.current = 0;
    setTyping(false);
    setMessages((prev) =>
      prev.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' } : m)),
    );
    pushSystem(`${DEMO_PARTNER.nickname}님을 차단했어요. 더 이상 대화할 수 없어요.`);
  }, [pushSystem]);

  const releaseBlock = useCallback(() => {
    if (!blockedRef.current) return;
    blockedRef.current = false;
    setBlocked(false);
    pushSystem('차단을 해제했어요. 다시 대화할 수 있어요.');
  }, [pushSystem]);

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

  const sendMessage = useCallback(
    (body: string) => {
      if (blockedRef.current) return; // 차단 중에는 어떤 경로로도 전송 금지
      const id = nextId();
      pendingReplies.current += 1;
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
        pendingReplies.current -= 1;
        setTyping(pendingReplies.current > 0);
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

  // 추천 카드에서 "가볍게 물어보기" 버튼 클릭하여 진입한 경우, 해당 질문을 즉시 전송
  useEffect(() => {
    if (initialQuestion && !hasHandledQuestion.current) {
      hasHandledQuestion.current = true;
      sendMessage(initialQuestion);
    }
  }, [initialQuestion, sendMessage]);

  return (
    <section className="mt-chat" aria-label={`${DEMO_PARTNER.nickname}님과의 1:1 채팅`}>
      <header className="mt-chat-head">
        <div className="mt-chat-avatar" aria-hidden="true">
          {DEMO_PARTNER.nickname.slice(0, 1)}
        </div>
        <div className="mt-chat-head-text">
          <h1 className="mt-chat-title">{DEMO_PARTNER.nickname}</h1>
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
            aria-controls="mt-chat-menu-list"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span aria-hidden="true">⋯</span>
          </button>
          {menuOpen && (
            <ul id="mt-chat-menu-list" className="mt-chat-menu-list">
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
        disabled={blocked}
        disabledReason="차단한 상대와는 대화할 수 없어요"
      />

      <BlockConfirmModal
        open={blockOpen}
        mode={confirmMode}
        partnerName={DEMO_PARTNER.nickname}
        onConfirm={confirmMode === 'unblock' ? releaseBlock : applyBlock}
        onClose={closeBlockConfirm}
      />
      <ReportModal
        open={reportOpen}
        partnerId={DEMO_PARTNER.id}
        partnerName={DEMO_PARTNER.nickname}
        onSubmit={handleReportSubmit}
        onClose={closeReport}
      />
    </section>
  );
}
