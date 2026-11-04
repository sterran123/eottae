// ============================================================
//  저장 경로: src/app/match/onboarding/page.tsx
//  담당: 오하율 · MATCH-001 (취향/가치관 입력)
//  역할: 온보딩 라우트 진입점. /eottae/match/onboarding/
//
//  [경계] live만 폼을 연다. unverified는 사유만 보여 주고 시연 버튼은 두지 않는다.
//         데모는 NEXT_PUBLIC_DEMO_ADULT_BYPASS가 '1'이고 시연 확인이 유효할 때만 연다.
//         온보딩 폼은 생년월일을 저장하지 않는다. 앞선 시연 확인만 만 나이를 판정하고 원본은 남기지 않는다.
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
