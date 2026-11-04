// ============================================================
//  저장 경로: src/app/match/qna/page.tsx
//  담당: 오하율 · MATCH-009 (프로필 문답)
//  역할: 프로필 문답 라우트. /eottae/match/qna/
//
//  [경계] live만 문답을 연다. unverified는 사유만 보여 주고 시연 버튼은 두지 않는다.
//         데모는 NEXT_PUBLIC_DEMO_ADULT_BYPASS가 '1'이고 시연 확인이 유효할 때만 연다.
//         relationGoal 은 실제로는 온보딩 저장값. DEMO 기본 '진지한 연애'.
// ============================================================

import type { Metadata } from 'next';
import ProfileQna from '@/components/match/ProfileQna';
import DemoEntryGuard from '@/components/demo/DemoEntryGuard';
import './match-qna.css';

export const metadata: Metadata = {
  title: '프로필 문답',
  description: '40개 문답으로 나를 표현하고 겹치는 답을 찾는 프로필 문답 (DEMO)',
};

export default function MatchQnaPage() {
  return (
    <div className="mt-qna-page">
      <DemoEntryGuard area="qna">
        <ProfileQna />
      </DemoEntryGuard>
    </div>
  );
}
