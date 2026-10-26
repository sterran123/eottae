// ============================================================
//  저장 경로: src/app/match/recommend/page.tsx
//  담당: 오하율 · MATCH-002 (추천 카드·질문 UI)
//  역할: 추천 리스트 라우트. /eottae/match/recommend/
//
//  [경계] 실제로는 로그인·성인인증·취향입력 완료 후 진입.
//         1차 DEMO 단계에서는 게이트 없이 샘플 추천만 노출한다.
// ============================================================

import type { Metadata } from 'next';
import RecommendList from '@/components/match/RecommendList';
import './match-recommend.css';

export const metadata: Metadata = {
  title: '오늘의 추천',
  description: '취향이 겹치는 상대를 추천받는 매칭 리스트 (DEMO)',
};

export default function MatchRecommendPage() {
  return (
    <div className="mt-rec-page">
      <RecommendList />
    </div>
  );
}
