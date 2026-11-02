// ============================================================
//  저장 경로: src/app/match/chat/page.tsx
//  담당: 손준혁 · MATCH-007 (실시간 1:1 채팅)
//  역할: 채팅 라우트 진입점. /eottae/match/chat/
//
//  [경계] live만 채팅 화면을 연다. unverified는 ChatHub를 마운트하지 않고 사유만 보여 준다.
//         데모는 NEXT_PUBLIC_DEMO_ADULT_BYPASS가 '1'이고 시연 확인이 유효할 때만 연다.
//         미구현 상태는 채팅 화면 안에서 그대로 밝힌다.
// ============================================================

import { Suspense } from 'react';
import type { Metadata } from 'next';
import ChatHub from '@/components/chat/ChatHub';
import DemoEntryGuard from '@/components/demo/DemoEntryGuard';
import './match-chat.css';

export const metadata: Metadata = {
  title: '채팅',
  description: '상호 매칭된 상대와의 대화방 목록과 1:1 채팅 화면 (DEMO)',
};

export default function MatchChatPage() {
  return (
    // 레이아웃이 이미 <main id="content">를 제공하므로 main 중첩을 피해 section 사용
    <section className="mt-chat-page">
      <DemoEntryGuard area="chat">
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--match-hint)' }}>채팅방을 준비하고 있어요...</div>}>
          <ChatHub />
        </Suspense>
      </DemoEntryGuard>
    </section>
  );
}
