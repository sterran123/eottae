// ============================================================
//  저장 경로: src/app/match/chat/page.tsx
//  담당: 손준혁 · MATCH-007 (실시간 1:1 채팅)
//  역할: 채팅 라우트 진입점. /eottae/match/chat/
//
//  [경계] 실제로는 로그인·성인 인증·활성 match 구성원 확인(주한태)이
//         선행돼야 한다. 1차 DEMO 단계에서는 게이트 없이 UI만 노출하며
//         화면에 미구현 상태를 명시한다 (RULES 3, 6).
// ============================================================

import { Suspense } from 'react';
import type { Metadata } from 'next';
import ChatRoom from '@/components/chat/ChatRoom';
import './match-chat.css';

export const metadata: Metadata = {
  title: '1:1 채팅',
  description: '상호 매칭된 상대와의 1:1 채팅 화면 (DEMO)',
};

export default function MatchChatPage() {
  return (
    // 레이아웃이 이미 <main id="content">를 제공하므로 main 중첩을 피해 section 사용
    <section className="mt-chat-page">
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--match-hint)' }}>채팅방을 준비하고 있어요...</div>}>
        <ChatRoom />
      </Suspense>
    </section>
  );
}
