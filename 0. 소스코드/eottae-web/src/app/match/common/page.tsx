// ============================================================
//  저장 경로: src/app/match/common/page.tsx
//  담당: 오하율 · MATCH-009 (공통 질문 · 궁합)
//  역할: 공통 질문 라우트. /eottae/match/common/
//
//  [경계] 쌍방 관심(매칭) 성사 후 진입하는 화면.
//         live만 공통 질문을 연다. unverified는 사유만 보여 주고 시연 버튼은 두지 않는다.
//         데모는 NEXT_PUBLIC_DEMO_ADULT_BYPASS가 '1'이고 시연 확인이 유효할 때만 연다.
//         실제 상대/답은 주한태·손준혁 연동. 궁합은 겹친 개수만(블라인드).
// ============================================================

import type { Metadata } from 'next';
import CommonQna from '@/components/match/CommonQna';
import DemoEntryGuard from '@/components/demo/DemoEntryGuard';
import './match-common.css';

export const metadata: Metadata = {
  title: '공통 질문',
  description: '매칭된 상대와 블라인드로 답을 주고받고 통한 답을 확인하는 공통 질문 (DEMO)',
};

export default function MatchCommonPage() {
  return (
    <div className="mt-cq-page">
      <DemoEntryGuard area="common">
        <CommonQna />
      </DemoEntryGuard>
    </div>
  );
}
