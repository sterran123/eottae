# AI Report Log — 「어때?」

## 기록 규칙 (팀 공통)
- 헤더: `## YYYY-MM-DD 작업 주제 (본인 이름 작업)` — 이름은 김민기 / 오하율 / 주한태 / 손준혁 중 본인
- 항목: `- [태그] 대상 파일 | 변경·해결 내용`
- 태그: `[신규]` `[변경]` `[버그수정]` `[검증]` `[보안]` `[보존]` `[통합]` `[배포]` `[제안]` `[미구현/보류]`
- 실제로 실행하지 않은 검증은 `[검증]`으로 쓰지 않는다. 미실행 항목은 `[미구현/보류]`로 명시한다.

---

## 2026-10-23 프로젝트 구조 분석·스캐폴드 검증 (김민기 작업)
- [신규] 0. 소스코드/eottae-web | Next.js 15.5 + React 19 + TypeScript strict 스캐폴드 정리 (package.json, tsconfig.json, next-env.d.ts)
- [신규] src/app/api/health/route.ts | 개발 헬스 체크 라우트 `{status:'ok', phase:'scaffold-only'}`
- [신규] .env.example | Supabase 환경변수 PLACEHOLDER만 기재 (실키 없음)
- [보존] supabase/migrations/0000_planning_only.sql | DB 스키마는 주석 수준 계획만 유지 — 실행 금지 명시
- [검증] `npm install` 실행 → package-lock.json 생성
- [보안] `npm audit`에서 postcss transitive 취약 2건 발견 → package.json `overrides`로 postcss 8.5.31 고정 후 0건 확인
- [검증] `npm run typecheck` PASS (최초 실행)

## 2026-10-23 통합 홈·공통 셸·반응형·PWA 기본 틀 (김민기 작업)
- [신규] src/app/layout.tsx | 공통 셸 — metadata(manifest·icons·appleWebApp·openGraph), viewport(theme-color 라이트/다크), 스킵 링크, ko lang
- [신규] src/components/shared/site-header.tsx | 브랜드 로고 `<picture>` 라이트/다크 자동 전환 + 홈 링크
- [신규] src/components/shared/site-nav.tsx | 3모듈+안전센터 내비, usePathname으로 `aria-current='page'` 처리, 로그인 자리는 비활성 표시
- [신규] src/components/shared/site-footer.tsx | 팀 명단·정책 링크 푸터
- [신규] src/components/shared/service-card.tsx | 서비스 카드 공통 컴포넌트(index/tag/motif/cta)
- [신규] src/app/page.tsx | 통합 허브 — 히어로, 3개 서비스 카드, 이용 흐름 4단계, 안전 강조, FAQ
- [신규] src/app/match/page.tsx | 1차 매칭 진입 화면 — "개발 대상" 뱃지 + 기능 미구현 경고 박스 명시
- [신규] src/app/activities/page.tsx, invitations/page.tsx | 2·3차 서비스 준비중 화면
- [신규] src/app/safety/page.tsx | 안전 정책 초안 (성인 전용·상호 동의·차단신고·청소년 보호)
- [신규] src/app/privacy/page.tsx | 계정·데이터 삭제 요청 경로 안내 (CORE-004 문서 부분)
- [신규] src/app/loading.tsx, error.tsx, not-found.tsx | 공통 경계 화면
- [신규] src/app/globals.css | 브랜드 토큰 라이트/다크(prefers-color-scheme), 1024/760/380px 반응형, 포커스·스킵링크·모션감소
- [신규] public/manifest.webmanifest | name/scope/display/theme_color/icons 구성
- [신규] public/icons/ | 원본 로고를 정사각 캔버스에 배치한 개발용 아이콘 192·512·maskable·apple-touch (정식 아이콘 별도 제작 예정)
- [버그수정] globals.css | 다크모드 `.btn.primary` 대비 1.39:1 결함 발견 → CTA 전용 토큰(`--cta-bg`/`--cta-ink`) 추가로 8.19:1 확보
- [검증] `npm run typecheck` PASS, `npm run build` PASS (정적 7페이지 + 동적 /api/health), `npm audit` 0건
- [미구현/보류] 서비스워커·오프라인 캐시·푸시 미구현, 브라우저 실기기 시각 검증 미실행
- [미구현/보류] 로그인·성인 인증·매칭·채팅·DB — 다른 팀원 소유 영역, 임의 구현하지 않음
- [문서] README.md, docs/README_테스트배포.md | 구현/미구현 구분과 검증 이력 기록

## 2026-10-23 Git 저장소 초기화 + 김민기 잔여 과제 완수 (김민기 작업)
- [신규] .gitignore (프로젝트 루트) | node_modules/.next/out/.env/tsbuildinfo/log/OS 파일 제외, .env.example만 추적
- [신규] git 저장소 초기화(`git init -b main`) 및 최초 커밋 111개 파일 — 시크릿 스캔 선행(발견 없음)
- [신규] tools/make_dark_logo.py | BRAND-004 — 다크 로고 검정 배경 → 알파 언멀티플라이 + 탈채도 15%/밝기 +6% 파스텔 보정, 재생성 가능 스크립트
- [신규] public/eottae-logo-dark-transparent.png | 위 스크립트 출력물 (원본 eottae-logo-dark.png와 브랜드_에셋 원본은 그대로 보존)
- [변경] site-header.tsx | 다크 로고를 투명 변형 파일로 교체 — 검정 박스 제거 (BRAND-004)
- [신규] public/sw.js | CORE-003 오프라인 셸 — precache(홈·오프라인·manifest·아이콘·로고), 문서 network-first→/offline, 정적 자산 cache-first
- [신규] src/app/offline/page.tsx | 오프라인 안내 페이지
- [신규] src/components/shared/sw-register.tsx | 프로덕션 전용 서비스워커 등록 컴포넌트, layout에 마운트
- [변경] layout.tsx | Pretendard Variable(jsDelivr CDN, subset) 폰트 링크 추가
- [버그수정] globals.css | 스티키 헤더가 `#services` 앵커를 가리던 문제 → `scroll-padding-top: 96px` 수정
- [변경] globals.css | Pretendard 폰트 스택, `::selection`, 버튼/내비/카드 transition+호버, 히어로 그라데이션 드리프트, FAQ 셰브론+`::details-content` 펼침 애니메이션, reduced-motion 보강
- [신규] docs/AI_REPORT_LOG.md (본 문서), docs/AI_에이전트_협업_가이드.md, docs/HANDOFF_김민기.md, docs/AI_도구_MCP_권장.md
- [버그수정] src/types/assets.d.ts | IDE TS 서버가 `import './globals.css'` 부수 효과 import 미해결 오류 표시 → 순수 CSS 앰비언트 선언 추가 (Next 내장 선언은 `*.module.css`만 커버)
- [검증] `npm run typecheck` PASS, `npm run build` PASS (정적 8페이지 + /offline + /api/health), `npm audit` 0건 — 재실행 기준
- [미구현/보류] SW 실기기 설치·오프라인 동작은 로컬 `next start`에서만 부분 확인 — 배포 환경 Lighthouse 검증은 향후
- [미구현/보류] 테마 수동 토글·설정 저장은 브랜드 가이드상 별도 후속 과제로 분리됨
- [제안] 다음 담당자 진입점은 docs/HANDOFF_김민기.md 참조

## 2026-10-23 핸드오프 강제성 보강 (김민기 작업)
- [버그수정] .github/pull_request_template.md | eottae-web 내부 → 저장소 루트로 이동 (GitHub은 루트 .github만 인식하므로 기존 위치에선 미적용이었음)
- [신규] .github/workflows/ci.yml | 모든 push/PR에 npm ci→typecheck→build 자동 검증 (CI 실패 PR 머지 금지 규칙화)
- [신규] .github/CODEOWNERS | 파일 소유 영역별 리뷰 자동 요청 (팀원 GitHub ID는 TODO로 대기)
- [변경] package.json | `engines: node>=20` 추가 — 팀 환경 버전 하한 강제
- [변경] AGENTS.md | 리포트 로그 기록 의무 + main 직접 push 금지·PR/CI 규칙 명시
- [변경] docs/HANDOFF_김민기.md | 저장소 전용으로 재작성 — Collaborator 선행 조건, clone 실경로(`eottae/0. 소스코드/eottae-web`), git 작성자 설정, GCM 인증, 강제 체크리스트 추가
- [변경] docs/AI_에이전트_협업_가이드.md | 저장소 구조·CI 강제·PR 자동 요소 섹션 추가
- [신규] tools/update_package_manifest.py | FILE_INDEX/MANIFEST 재생성 스크립트 (팀원도 실행 가능)
- [검증] sha256sum -c MANIFEST.sha256 전체 123파일 OK / npm run typecheck PASS
