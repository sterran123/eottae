// ============================================================
//  저장 경로: src/app/match/onboarding/page.tsx
//  담당: 오하율 · MATCH-001 (취향/가치관 입력)
//  역할: 온보딩 라우트 진입점. /eottae/match/onboarding/
//
//  [경계] 실제로는 이 페이지 진입 전에 로그인·성인인증(주한태)이
//         완료돼야 한다. 1차 DEMO 단계에서는 게이트 없이 폼만 노출하며,
//         상단 안내로 미구현 상태를 솔직히 표시한다 (RULES 6).
// ============================================================

import type { Metadata } from 'next';
import OnboardingForm from '@/components/match/OnboardingForm';
import './match-onboarding.css';

export const metadata: Metadata = {
  title: '취향 온보딩',
  description: '취향과 가치관을 입력해 겹치는 상대를 추천받는 매칭 온보딩 (DEMO)',
};

export default function MatchOnboardingPage() {
  return (
    <main className="mt-onb-page">
      <OnboardingForm />
    </main>
  );
}
