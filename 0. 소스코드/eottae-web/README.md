# 어때? 단일 PWA 기본 골격 — 김민기 초기 담당
**완성된 MVP가 아닌 실행 가능한 화면 기본 틀(소스 스캐폴드)**. 로그인, 19+ 본인/성인확인, 추천/좋아요, 실시간 채팅, PG 결제, PWA 푸시·서비스워커는 아직 구현하지 않았습니다.

## 시작
Node.js 20+ 및 npm 필요.
```
npm install
npm run dev
npm run typecheck
npm run build
```
기본 주소 `http://localhost:3000`.

### 검증 상태 (2026-10-23 기록)
- `npm install`: 실행 완료, `package-lock.json` 생성됨.
- `npm audit`: 초기 postcss 취약점 2건(중1·고1) → `package.json`의 `overrides`로 postcss 8.5.31 고정 후 **0건**.
- `npm run typecheck`: **PASS** (수정 후 재실행 동일).
- `npm run build`: **PASS** (정적 페이지 7개 + 동적 `/api/health`, 수정 후 재실행 동일).
- 코드 대비 점검: 다크 `.btn.primary` 1.39:1 결함 발견 → CTA 전용 토큰(`--cta-bg`/`--cta-ink`)으로 **8.19:1** 수정. `.eyebrow.dark`·카드 라벨은 `--brand` 적용(라이트 4.6:1↑).
- 브라우저 수동 테스트(360/390/768/1440px, 라이트·다크): 코드 기준으로 구성했으나 **실기기 시각 검증 미실행** — 시연 전 캡처 필요.

## 라우트
`/` 통합 허브 / `/match` 매칭 소개·구현 대기 / `/activities` 2차 소개·구현 대기 / `/invitations` 3차 소개·구현 대기 / `/safety` 미운영 안전 정책 / `/privacy` 개인정보·계정 삭제 안내 / `/api/health` 개발 헬스 체크. `not-found`·`error`·`loading` 공통 경계 포함.

## 구조
- `src/app/layout.tsx` — 공통 shell, 메타데이터(manifest·theme-color·apple), 스킵 링크
- `src/components/shared/` — `site-header`/`site-nav`(현재 페이지 표시)/`site-footer`/`service-card`
- `src/app/globals.css` — 라이트·다크 토큰, 360/760/1024px 반응형, 접근성 포커스
- `public/` — 로고 원본·PWA 아이콘·manifest

## 로고
`public/eottae-logo-light.png`, `public/eottae-logo-dark.png`: **사용자 원본 보존**, 각 1678×937px. 다크 이미지는 검정 배경 불투명이며 차분한 파스텔 재작업은 보류(과제 `BRAND-004`). 다크모드에서는 `<picture>`가 다크 원본을 자동 선택.

## PWA (CORE-003)
- `public/manifest.webmanifest`: name·start_url·display·theme_color·**icons(192/512/maskable)** 구성.
- `public/icons/`: 원본 로고를 정사각 캔버스에 배치해 생성한 **개발용 임시 아이콘**(크롭 아님). 정식 아이콘은 디자인 검수 후 별도 제작(BRAND-004와 함께).
- iOS: `apple-touch-icon` 180px + `appleWebApp` 메타 설정. iOS 설치는 Safari '공유 → 홈 화면에 추가' 경로이며 푸시는 별도 조건 필요.
- **미구현**: 서비스워커·오프라인 캐시·푸시. 설치-ready라고 주장하지 않음 — manifest 구성과 아이콘 점검까지만 완료.

## 팀 협업
작업 브랜치 예: `feat/CORE-001-hub-shell`. `.env.example` 값은 PLACEHOLDER 전용. 운영 키나 사용자 데이터는 절대 Git에 올리지 말 것. 실제 기능 승인 조건은 상위 문서 참고.
