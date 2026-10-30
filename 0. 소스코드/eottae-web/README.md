# 어때? 단일 PWA — 김민기 초기 담당
**1차 MVP 개발 중(데모).** 완성된 출시 제품이 아닙니다. 통합 홈·6테마·설정(`/settings`)·PWA 오프라인 셸은 동작합니다(서비스워커·오프라인은 TC-012 Android PASS). 매칭(온보딩·추천·문답·공통 질문·채팅·신고/차단)은 데모 데이터 화면입니다. 로그인·성인 인증·DB 연동은 #21 진행 중. PG 결제·푸시는 미구현입니다.

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
- `npm run typecheck`: **PASS** (SW·오프라인·폰트 반영 후 재실행 동일).
- `npm run build`: **PASS** (정적 8페이지 + `/offline` + 동적 `/api/health`).
- 코드 대비 점검: 다크 `.btn.primary` 1.39:1 결함 발견 → CTA 전용 토큰(`--cta-bg`/`--cta-ink`)으로 **8.19:1** 수정. `.eyebrow.dark`·카드 라벨은 `--brand` 적용(라이트 4.6:1↑).
- 브라우저 수동 테스트(360/390/768/1440px, 라이트·다크): 코드 기준으로 구성했으나 **당시 실기기 시각 검증 미실행**.
- **이후 (plan_v2 중간 점검 1차):** PWA 오프라인 TC-012 Android PASS (2026-10-28). `/settings` 추가. 매칭 화면은 데모 데이터. 로그인·DB는 #21 진행 중.

## 협업 문서 (docs/)
- `AI_REPORT_LOG.md` — 작업 이력 로그 (본인 이름 태그 필수)
- `AI_에이전트_협업_가이드.md` — 팀원용 에이전트 지시문 템플릿·로그 규칙
- `HANDOFF_김민기.md` — 환경 정렬·최초 셋업·다음 담당 진입점
- `AI_도구_MCP_권장.md` — MCP/플러그인/라이브러리 권장 후보
- `README_테스트배포.md` — 실행·검증·배포 단계와 PWA 점검 표

## 라우트
`/` 통합 허브 / `/match` 매칭 소개·데모 진입 / `/match/onboarding` `/match/recommend` `/match/qna` `/match/common` `/match/chat` 매칭 데모 / `/activities` 2차 준비중 / `/invitations` 3차 준비중 / `/settings` 설정(테마·계정 안내) / `/safety` 안전 정책 / `/privacy` 개인정보·계정 삭제 안내 / `/offline` PWA 오프라인 폴백 / `/api/health` 개발 헬스 체크. `not-found`·`error`·`loading` 공통 경계 포함.

## 구조
- `src/app/layout.tsx` — 공통 shell, 메타데이터(manifest·theme-color·apple), 스킵 링크
- `src/components/shared/` — `site-header`/`site-nav`(현재 페이지 표시)/`site-footer`/`service-card`
- `src/app/globals.css` — 6테마 토큰 + 아기자기 스킨(스캘럽 물결선·스티커 테이프·점선 원·스프링 모션), 360/760/1024px 반응형, 접근성 포커스·모션 감소 대응
- `public/` — 로고 원본·PWA 아이콘·manifest

## 로고
`public/eottae-logo-light.png`: 사용자 원본 보존(1678×937, 투명 배경 일부).
`public/eottae-logo-dark.png`: 사용자 제공 원본(검정 불투명 배경, 보존용).
`public/eottae-logo-dark-transparent.png`: BRAND-004 산출물 — 원본을 `tools/make_dark_logo.py`로 투명 알파+차분한 파스텔 변환. 헤더 다크모드에서는 이 파일을 사용.

## 테마 (6종)
헤더 피커에서 선택 — **라이트(기본)** · 컵케잌(파스텔) · 사이버펑크(다크+네온) · 디즈니(캐슬블루+골드) · 다크 · 시스템(OS 추적). `data-theme` 속성 + localStorage(`eottae-theme`) 저장, globals.css 토큰 기반이라 전 페이지에 적용. FOUC 방지 인라인 스크립트가 첫 페인트 전에 적용하고 `theme-color` 메타도 테마색으로 동기화.

## PWA (CORE-003)
- `public/manifest.webmanifest`: name·start_url·display·theme_color·**icons(192/512/maskable)** 구성.
- `public/icons/`: 원본 로고를 정사각 캔버스에 배치해 생성한 **개발용 임시 아이콘**(크롭 아님). 정식 아이콘은 디자인 검수 후 별도 제작.
- `public/sw.js`: 오프라인 셸 서비스워커 — 문서 network-first→`/offline`, 정적 자산 cache-first. `src/components/shared/sw-register.tsx`가 **프로덕션에서만** 등록.
- `src/app/offline/page.tsx`: 네트워크 끊김 안내 페이지.
- iOS: `apple-touch-icon` 180px + `appleWebApp` 메타 설정. iOS 설치는 Safari '공유 → 홈 화면에 추가' 경로이며 푸시는 별도 조건 필요.
- **오프라인**: 서비스워커·오프라인 셸 동작. TC-012 Android 실기기 PASS (2026-10-28). iPhone Safari는 미실행.
- **미구현/미검증**: 푸시·백그라운드 동기화, iOS 설치·오프라인, HTTPS 배포 환경 installability 검증.

## 팀 협업
작업 브랜치 예: `feat/CORE-001-hub-shell`. `.env.example` 값은 PLACEHOLDER 전용. 운영 키나 사용자 데이터는 절대 Git에 올리지 말 것. 실제 기능 승인 조건은 상위 문서 참고.

PR을 올리면 로컬 Grok이 자동 코드 리뷰합니다(`ai-review` 상태, 하나씩 순서대로, 보통 4~17분). 이슈·PR **일반 댓글**에 `@grok 질문`을 쓰면 코드를 읽고 답만 답니다(수정 안 함, 줄 단위 리뷰 코멘트는 안 됨). 저장소 write 권한 팀원만, 👀 = 처리 중, 답은 김민기 계정 이름·요청자 멘션. 김민기 PC 작업자가 5분마다 확인하므로 PC가 꺼져 있으면 늦어집니다. 2026-10-28부터 Devin은 쓰지 않습니다. 상세: `docs/HANDOFF_김민기.md` §9~§11-1.
