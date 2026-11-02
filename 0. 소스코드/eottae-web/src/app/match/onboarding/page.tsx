// ============================================================
//  저장 경로: src/app/match/onboarding/page.tsx
//  담당: 오하율 · MATCH-001 (취향/가치관 입력)
//  역할: 온보딩 라우트 진입점. /eottae/match/onboarding/
//
//  [경계] 실계정(live/unverified)은 match-service 흐름을 그대로 쓴다.
//         데모 모드에서만 폼 앞에 성인 확인(시연)을 둔다. 생년월일은 받지 않는다.
// ============================================================

import type { Metadata } from 'next';
import OnboardingForm from '@/components/match/OnboardingForm';
import DemoEntryGuard from '@/components/demo/DemoEntryGuard';
import './match-onboarding.css';

export const metadata: Metadata = {
  title: '취향 온보딩',
  description: '취향과 가치관을 입력해 겹치는 상대를 추천받는 매칭 온보딩 (DEMO)',
};

export default function MatchOnboardingPage() {
  return (
    <div className="mt-onb-page">
      <DemoEntryGuard area="onboarding">
        <OnboardingForm />
      </DemoEntryGuard>
    </div>
  );
}
