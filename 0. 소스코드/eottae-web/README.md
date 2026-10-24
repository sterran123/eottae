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
- `npm run typecheck`: **PASS** (SW·오프라인·폰트 반영 후 재실행 동일).
- `npm run build`: **PASS** (정적 8페이지 + `/offline` + 동적 `/api/health`).
- 코드 대비 점검: 다크 `.btn.primary` 1.39:1 결함 발견 → CTA 전용 토큰(`--cta-bg`/`--cta-ink`)으로 **8.19:1** 수정. `.eyebrow.dark`·카드 라벨은 `--brand` 적용(라이트 4.6:1↑).
- 브라우저 수동 테스트(360/390/768/1440px, 라이트·다크): 코드 기준으로 구성했으나 **실기기 시각 검증 미실행** — 시연 전 캡처 필요. Playwright MCP 도입 시 자동화 가능(`docs/AI_도구_MCP_권장.md`).

## 협업 문서 (docs/)
- `AI_REPORT_LOG.md` — 작업 이력 로그 (본인 이름 태그 필수)
- `AI_에이전트_협업_가이드.md` — 팀원용 에이전트 지시문 템플릿·로그 규칙
- `HANDOFF_김민기.md` — 환경 정렬·최초 셋업·다음 담당 진입점
- `AI_도구_MCP_권장.md` — MCP/플러그인/라이브러리 권장 후보
- `README_테스트배포.md` — 실행·검증·배포 단계와 PWA 점검 표

## 라우트
`/` 통합 허브 / `/match` 매칭 소개·구현 대기 / `/activities` 2차 소개·구현 대기 / `/invitations` 3차 소개·구현 대기 / `/safety` 미운영 안전 정책 / `/privacy` 개인정보·계정 삭제 안내 / `/api/health` 개발 헬스 체크. `not-found`·`error`·`loading` 공통 경계 포함.

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
- **미구현/미검증**: 푸시·백그라운드 동기화, 실기기 설치·오프라인 시나리오, HTTPS 배포 환경 installability 검증.

## 팀 협업
작업 브랜치 예: `feat/CORE-001-hub-shell`. `.env.example` 값은 PLACEHOLDER 전용. 운영 키나 사용자 데이터는 절대 Git에 올리지 말 것. 실제 기능 승인 조건은 상위 문서 참고.
