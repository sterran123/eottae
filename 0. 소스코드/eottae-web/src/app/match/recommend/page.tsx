// ============================================================
//  저장 경로: src/app/match/recommend/page.tsx
//  담당: 오하율 · MATCH-002 (추천 카드·질문 UI)
//  역할: 추천 리스트 라우트. /eottae/match/recommend/
//
//  [경계] 실계정(live/unverified)은 기존 추천 화면을 그대로 연다.
//         데모 모드에서 성인 확인(시연) 전에는 추천 대신 이유를 보여 준다.
// ============================================================

import type { Metadata } from 'next';
import RecommendList from '@/components/match/RecommendList';
import DemoEntryGuard from '@/components/demo/DemoEntryGuard';
import './match-recommend.css';

export const metadata: Metadata = {
  title: '오늘의 추천',
  description: '취향이 겹치는 상대를 추천받는 매칭 리스트 (DEMO)',
};

export default function MatchRecommendPage() {
  return (
    <div className="mt-rec-page">
      <DemoEntryGuard area="recommend">
        <RecommendList />
      </DemoEntryGuard>
    </div>
  );
}
