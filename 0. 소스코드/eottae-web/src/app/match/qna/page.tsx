// ============================================================
//  저장 경로: src/app/match/qna/page.tsx
//  담당: 오하율 · MATCH-009 (프로필 문답)
//  역할: 프로필 문답 라우트. /eottae/match/qna/
//
//  [경계] 로그인·성인인증·취향입력 후 진입. 1차 DEMO 는 게이트 없이 노출.
//         relationGoal 은 실제로는 온보딩 저장값. DEMO 기본 '진지한 연애'.
// ============================================================

import type { Metadata } from 'next';
import ProfileQna from '@/components/match/ProfileQna';
import './match-qna.css';

export const metadata: Metadata = {
  title: '프로필 문답',
  description: '40개 문답으로 나를 표현하고 겹치는 답을 찾는 프로필 문답 (DEMO)',
};

export default function MatchQnaPage() {
  return (
    <div className="mt-qna-page">
      <ProfileQna />
    </div>
  );
}
