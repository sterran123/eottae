// src/app/api/v1/users/me/route.ts
// MATCH-003: 내 프로필 및 세션 검증 API (API 계약 초안 준수)
// 정적 export(GitHub Pages) 호환을 위해 force-static 선언

import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  // 정적 빌드 시점의 기본 계약 DTO 응답 (실제 런타임 클라이언트에서는 src/lib/auth/client-auth 및 lib/server/auth.ts 검증 로직 사용)
  return NextResponse.json({
    status: 'ok',
    api: '/api/v1/users/me',
    authRequired: true,
    contract: {
      description: '내 세션 및 인증 상태 조회 (미인증/만료/차단 시 401/403 Fail-closed)',
      sampleResponse: {
        userId: '11111111-1111-4111-8111-111111111111',
        nickname: '어때데모',
        accountStatus: 'ACTIVE',
        adultVerified: true,
      },
    },
  });
}
