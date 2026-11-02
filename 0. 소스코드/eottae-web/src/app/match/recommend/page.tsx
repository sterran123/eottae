// ============================================================
//  저장 경로: src/app/match/recommend/page.tsx
//  담당: 오하율 · MATCH-002 (추천 카드·질문 UI)
//  역할: 추천 리스트 라우트. /eottae/match/recommend/
//
//  [경계] live만 추천 화면을 연다. unverified는 사유만 보여 주고 시연 버튼은 두지 않는다.
//         데모는 NEXT_PUBLIC_DEMO_ADULT_BYPASS가 '1'이고 시연 확인이 유효할 때만 연다.
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
