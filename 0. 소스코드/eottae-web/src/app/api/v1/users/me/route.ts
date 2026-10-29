// src/app/api/v1/users/me/route.ts
// MATCH-003: 내 프로필 및 세션 검증 API 논리 계약 (ADR-005 준수)
// 정적 export(GitHub Pages) 호환을 위해 force-static 선언.
// 실제 런타임에서는 브라우저가 src/lib/auth/auth-service.ts (authService.getMyAccount)를 통해
// Supabase Auth + public.users RLS(id = auth.uid())를 직접 호출한다.

import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    api: '/api/v1/users/me',
    authRequired: true,
    contract: {
      description: '내 세션 및 계정 상태 조회 (Supabase Auth + public.users RLS, 미인증 시 UNAUTHORIZED)',
      sampleResponse: {
        id: '11111111-1111-4111-8111-111111111111',
        nickname: '어때데모',
        fullName: '홍길동',
        birthYear: 1995,
        accountStatus: 'ACTIVE',
        signupCompletedAt: '2026-10-29T00:00:00Z',
        adultVerified: false,
        adultVerificationExpiresAt: null,
      },
    },
  });
}
