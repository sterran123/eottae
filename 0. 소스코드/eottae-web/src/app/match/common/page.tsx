// ============================================================
//  저장 경로: src/app/match/common/page.tsx
//  담당: 오하율 · MATCH-009 (공통 질문 · 궁합)
//  역할: 공통 질문 라우트. /eottae/match/common/
//
//  [경계] 쌍방 관심(매칭) 성사 후 진입하는 화면. 1차 DEMO 는 게이트 없이 노출.
//         실제 상대/답은 주한태·손준혁 연동. 궁합은 겹친 개수만(블라인드).
// ============================================================

import type { Metadata } from 'next';
import CommonQna from '@/components/match/CommonQna';
import './match-common.css';

export const metadata: Metadata = {
  title: '공통 질문',
  description: '매칭된 상대와 블라인드로 답을 주고받고 통한 답을 확인하는 공통 질문 (DEMO)',
};

export default function MatchCommonPage() {
  return (
    <div className="mt-cq-page">
      <CommonQna />
    </div>
  );
}
