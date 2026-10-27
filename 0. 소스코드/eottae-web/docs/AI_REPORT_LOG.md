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

## 2026-10-23 팀원 온보딩 경로 보강 (김민기 작업)
- [미구현/보류] Collaborator 자동 추가 시도 — GitHub API가 이메일 초대를 지원하지 않아(사용자명 필요) 중단. 팀원 GitHub ID 확보 후 `gh api .../collaborators/{id}`로 추가 예정. 이메일 초대는 저장소 웹 UI에서 소유자가 직접 가능
- [변경] docs/HANDOFF_김민기.md | 계정 미보유 팀원용 전체 온보딩 경로 추가 (GitHub 가입→ID 전달→초대→수락→clone), push 인증 방법 A(GCM)/B(gh) 명시

## 2026-10-23 팀원 Collaborator 초대·CODEOWNERS 실계정 반영 (김민기 작업)
- [검증] gh api로 팀원 계정 실존 확인: @HaYul0611, @gksxogksxo1001-sketch, @sonjunhyek2
- [변경] .github/CODEOWNERS | 팀원 영역을 실제 계정으로 교체 — 리뷰 자동 요청 활성화
- [변경] docs/HANDOFF_김민기.md | 초대 상태 표 추가 (3명 초대 발송·수락 대기)

## 2026-10-23 저장소 공개 전환 + main 브랜치 보호 (김민기 작업)
- [검증] CI 워크플로 실제 실행 확인 — 최근 push 5건 전부 success (39~57초)
- [문제] private 저장소 브랜치 보호 시도 → GitHub 403 (무료 계정은 private 보호 규칙 불가)
- [결정] 팀 합의로 저장소 public 전환 (포트폴리오 용도) — 전환 전 git 이력 전체 이메일/전화번호 스캔 완료 (실계정 없음, 010-0000-0000 예시만 존재)
- [변경] 저장소 public 전환 + main 보호 규칙 적용: PR 필수·CI `check` 필수·리뷰 1건·force push 차단 (enforce_admins=false — 소유자 우회 가능)
- [변경] docs/HANDOFF_김민기.md | private→public 문구, 브랜치 보호 조항, 초대 상태(오하율·손준혁 수락) 갱신
- [참고] 주한태 부재중 — 초대 유지, public이라 clone/로컬 작업은 초대 수락 전에도 가능

## 2026-10-23 SEC-002 실행 스크린샷 7장 확보 (김민기 작업)
- [문제] MCP 브라우저 도구로 캡처한 스크린샷 7장이 모두 동일 파일로 복사됨 — take_screenshot이 첫 호출만 임시파일에 기록하고 이후엔 응답에만 첨부. 해시 비교로 발견 (전부 동일 sha256)
- [해결] Chrome DevTools Protocol 직접 사용하는 `tools/capture_screenshots.mjs` 작성 (Node 22+ 내장 WebSocket, 외부 의존성 0) — 뷰포트·다크모드 에뮬레이션 + 전체페이지 캡처, 재실행으로 언제든 재생성 가능
- [버그수정] 캡처 중 dev 서버 ChunkLoadError 발견 (stale HMR 상태) — dev 서버 재시작으로 해소. 프로덕션 빌드와 무관한 개발환경 이슈
- [완수] docs/screenshots/ 에 7장 확보: 홈 모바일390 라이트·데스크톱1440 라이트·다크, /match·/activities·/invitations·/offline 모바일. SEC-002 '5장 이상' 충족
- [변경] QA_최종검증보고서.md | '후속 갱신' 섹션 추가 — 개발 전 한계 문구 유지 + 실검증 결과 병기
- [한계] 에뮬레이션 뷰포트 기준 — 실기기 수동 확인은 별도 필요

## 2026-10-23 디자인 폴리시·PWA 실검증 라운드 (김민기 작업)
- [완수] Pretendard 자체 호스팅 — jsDelivr 실제 패키지 경로 확인 후 woff2(2MB)를 `public/fonts/`에 다운로드, `@font-face` 등록. 런타임 CDN 의존 제거
- [완수] 수동 테마 토글 — 시스템/라이트/다크 3단 순환, localStorage 유지, `<head>` 인라인 스크립트로 FOUC 방지, `data-theme`+CSS 변수로 라이트/다크 토큰 전환, 헤더 로고 스왑 연동 (이전 "후속 과제" 클리어)
- [완수] 디자인 폴리시 — 히어로 파티클(♡✦✉ 모티프, 순수 CSS), 스크롤 리빌(IntersectionObserver+reduced-motion 우회), 카드/버튼 인터랙션 강화
- [완수] ima2-gen 브랜드 일러스트 — 로컬 127.0.0.1:3333 `POST /api/generate`로 폰 마스코트 일러스트 생성, PNG→WebP 27KB 압축해 `/brand/hero-visual.webp` 적용 (데스크톱 전용 노출)
- [버그수정] 수화 불일치 — 인라인 테마 스크립트가 `<html data-theme>`을 수화 전 변경해 React 경고 발생 → `<html suppressHydrationWarning>` 추가(next-themes 공식 패턴). 콘솔 클린 확인
- [문제] 신규 정적자산 404 미스터리 — `/fonts/`,`/brand/` 파일이 404 → 원인은 stale Next.js dev 서버 4개(포트 3000/3001/3002/3100)가 이전 스냅샷을 서빙한 것. 전체 프로세스 종료 + `.next` 삭제 + 3100 재기동으로 해소. 파일은 정상이었음
- [버그수정] 캡처 스크립트 전면 개선 — ① `Page.navigate` 무응답은 stale Chrome 탭/서버 원인이었음 ② `captureBeyondViewport`가 transformed 애니메이션 요소(hero-visual)·sticky 헤더를 합성에서 누락하는 Chromium 결함 발견 → **뷰포트 높이를 scrollHeight로 에뮬레이션**하는 방식으로 전환 (IO 리빌도 자연 발동)
- [버그수정] public/sw.js — ① fonts/·brand/ 경로가 프리캐시·캐시우선 모두 누락돼 오프라인 시 폰트/일러스트 깨짐 → PRECACHE+정규식 보강 ② 404 등 에러 응답도 캐시하던 결함 → `response.ok`만 캐시. 캐시명 v1→v2
- [검증] 프로덕션 SW 오프라인 실테스트 (next start :3200 + 서버 실종료) — SW `activated`/`controlled`, 서버 다운 상태에서 `/`·`/match` 캐시 렌더, 미방문 경로 `/never-visited-xyz-9` → `/offline` 폴백("지금은 오프라인이에요") 실제 표출 확인. CDP `Network.emulateNetworkConditions`는 페이지 fetch만 차단하고 SW fetch는 통과하는 Chromium 한계를 확인하여 실종료 방식으로 검증
- [검증] `npm run typecheck` PASS, `npm run build` PASS (정적 11페이지 + /api/health), 프로덕션 빌드에서 스크린샷 7장 재캡처 — 전부 고유 sha256, dev 오버레이 없는 증빙본

## 2026-10-23 코드 리뷰 후속 수정 (김민기 작업)
- [버그수정] scroll-reveal.tsx — 클라이언트 내비게이션으로 `/` 진입 시 `[data-reveal]` 전부 `opacity:0`로 남는 결함. 원인: 레이아웃은 페이지 이동에 리마운트되지 않는데 `useEffect([])`가 최초 1회만 관찰 → `usePathname()` 의존 추가로 경로 변경마다 재관찰. 실브라우저 재현(/match 직접 진입 → 로고 클릭 → 11개 요소 스크롤 후에도 0개 visible)으로 확인 후 수정·재검증
- [신규] layout.tsx `<noscript>` 폴백 — JS 비활성 시 `[data-reveal]`이 영구 숨김 상태가 되는 점진적 향상 결함 → noscript 내 `<style>`로 `opacity:1;transform:none` 강제
- [신규] `3. 구현 이미지(5장이상)/` — SEC-002 제출 폴더에 실제 실행 캡처 7장 배치(01~07, 가이드 명명 규칙) + `captions.csv`(날짜·테스트 환경·요구 ID 연결). 두 README의 "0장" 문구 갱신
- [변경] QA_최종검증보고서.md — 후속 갱신 3차 추가 (스크린샷 제출 폴더 이전, 리빌 버그 수정 내역)
- [검증] `npm run typecheck` PASS, `npm run build` PASS — 수정 후 재실행

## 2026-10-23 주기적 팀 동기화 스케줄러 구축 (김민기 작업)
- [신규] .github/workflows/team-sync.yml | 매주 월 09:00 KST(cron `0 0 * * 1`)+수동 dispatch — main 건강검사(npm ci→typecheck→build) → 팀 활동 리포트 → 매니페스트 재생성 → `auto/team-sync` 브랜치 PR 자동 생성. main 보호 규칙상 머지는 리뷰·사람이 수행
- [신규] tools/team_activity_report.mjs | GitHub REST로 팀원별 커밋·PR·요구사항 ID·CI 상태·비활동 팀원 집계 → `docs/TEAM_ACTIVITY.md` 한국어 갱신. gh CLI→GH_TOKEN→비인증(public) 3단 fallback
- [버그수정] tools/update_package_manifest.py | tsbuildinfo·`.env*`·log·OS 파일이 매니페스트에 포함돼 typecheck마다 해시 검증이 깨지던 결함 → gitignore 규칙과 동일하게 휘발성 파일 제외(`.env.example`은 유지, 비밀 파일 존재 자체가 목록에 안 남도록)
- [버그수정] team-sync.yml | ① heredoc 들여쓰기로 YAML 블록 스칼라가 조기 종료되던 문제 → 스크립트 기준 들여쓰기로 교정 + `bash -n` 실검증 ② 리포트 생성이 매니페스트 재생성보다 늦어 TEAM_ACTIVITY.md 해시가 stale로 커밋되던 순서 결함 → 단계 순서 교정
- [검증] team_activity_report.mjs 로컬 실실행 — GitHub API에서 main 커밋 12건·CI check 통과·열린 PR 0건 조회, TEAM_ACTIVITY.md 생성 확인
- [검증] python으로 team-sync.yml 파싱 OK(6 steps), 추출한 셸 스크립트 `bash -n` PASS, MANIFEST.sha256 재생성 후 `sha256sum -c` 146/146 OK
- [참고] GITHUB_TOKEN이 만든 PR은 워크플로 재트리거 불가(재규 방지) — 동일 검증을 잡에서 통과 후 커밋 상태 `check`를 API로 직접 기록해 필수 체크 충족. PR 머지 자체는 사람이 한다
- [변경] docs/HANDOFF_김민기.md — §8 스케줄러 안내 추가 + stale 항목 정리(테마 토글 완료·폰트 자체호스팅·CODEOWNERS 실계정·초대 수락 완료 반영)
- [변경] docs/AI_에이전트_협업_가이드.md — §8 자동 주기 점검 절차 추가
- [미구현/보류] 팀원 실제 push/PR 발생 시의 리포트 다변화는 자동 실행 후 확인 — 현재 3명 활동 없음이 정상 집계됨

## 2026-10-23 team-sync 코드리뷰 결함 수정 (김민기 작업)
- [버그수정] .github/workflows/team-sync.yml | permissions에 `checks: read` 누락 — check-runs API가 스케줄 실행에서 403 → main/열린 PR CI 상태가 항상 '기록 없음'으로 빠지던 결함. 로컬은 public 비인증이라 통과해 드러나지 않았음
- [버그수정] tools/team_activity_report.mjs | `REPORT_DAYS`에 숫자 아닌 값이 들어오면 `Math.max(1, NaN)`→`toISOString()` RangeError로 잡 전체 실패 → `Number.isFinite`+`>=1` 검증 후 7일 폴백 (abc·0 입력 재현 확인)
- [버그수정] tools/team_activity_report.mjs | '열린 PR' 카운트가 기간 내 갱신된 PR만 세던 문제 → `pulls?state=open` 별도 조회 후 PR 번호 합집합으로 stale 열린 PR도 집계
- [변경] .github/workflows/team-sync.yml | checkout을 `ref: main`으로 고정 — dispatch를 다른 브랜치에서 실행해도 건강검사·리포트·auto/team-sync 기준이 항상 main과 일치
- [검증] `REPORT_DAYS=abc|0|30` 실실행 통과, team-sync.yml YAML 파싱 OK(6 steps), 추출 셸 `bash -n` PASS, `sha256sum -c MANIFEST.sha256` 재검증

## 2026-10-23 GitHub Pages 정적 배포 파이프라인 (김민기 작업)
- [신규] eottae-web/next.config.mjs | `output:'export'` + `basePath:'/eottae'` + `trailingSlash:true` + `images.unoptimized` + `NEXT_PUBLIC_BASE_PATH` 주입 — Pages 프로젝트 사이트(sterran123.github.io/eottae)용 정적 export
- [신규] .github/workflows/deploy-pages.yml | main push/dispatch → npm ci→typecheck→build → out/을 pages artifact로 업로드 → deploy-pages 잡 배포. permissions에 contents:read 명시(지정 시 미명시 스코프는 none이라 checkout이 죽음)
- [버그수정] api/health/route.ts | 정적 export에서 API 라우트는 빌드 실패 원인 → `force-static`으로 빌드타임 정적 파일(out/api/health) 전환, 헬스 체크 기능 보존
- [버그수정] 절대경로 자산 참조 전수 수정 — basePath 아래에서 404 나던 항목: globals.css @font-face, layout manifest/icons 메타, site-header 로고 2종, page.tsx 히어로, manifest.webmanifest(start_url/scope/icons), error.tsx `<a href="/">`→Link
- [버그수정] public/sw.js | 루트 기준 경로(`/offline`·PRECACHE·자산 정규식)가 '/eottae/' 스코프에서 전부 어긋나던 결함 → `self.registration.scope` 기준 상대경로로 재작성(루트/서브경로 공용), 캐시 v2→v3
- [변경] sw-register.tsx | `NEXT_PUBLIC_BASE_PATH`로 '/eottae/sw.js' 등록 — 스코프 일치
- [신규] .gitattributes `* text=auto eol=lf` | Windows autocrlf 체크아웃(CRLF)과 리눅스 러너(LF)에서 MANIFEST.sha256 검증이 깨지던 크로스플랫폼 결함 → 작업트리 바이트를 LF로 통일
- [검증] `npm run typecheck` PASS, `npm run build` PASS — out/ 정적 산출물 11페이지+api/health 확인, HTML 내 모든 자산/링크에 /eottae 접두사·후행슬래시 확인
- [검증] 배포 경로 모의 서빙(out/을 /eottae/ 아래 http.server) — /eottae/·match/·offline/·match(301)·manifest·sw.js·api/health·font 200 확인
- [검증] 저장소 Pages 활성화 — `POST /repos/sterran123/eottae/pages` build_type=workflow (201) 후 실패 런 재실행 → build·deploy 잡 모두 success
- [검증] 실사이트 확인 — https://sterran123.github.io/eottae/ 및 match/·offline/·manifest·sw.js·api/health(JSON 실응답)·아이콘·폰트 전부 200
- [미구현/보류] 실사이트 HTTPS 상에서 SW 설치·오프라인 전환·Lighthouse 검증은 별도 수행 (배포 자체는 완료)

## 2026-10-23 Pages 전환 후속 — 깨진 로컬 미리보기 경로 정리 (리뷰 반영)
- [버그수정] eottae-web/package.json `start` | `output:'export'` 전환으로 `next start`가 즉시 실패(`"next start" does not work with "output: export"` 재현) → `node ../../tools/serve_pages_preview.mjs`로 교체
- [신규] tools/serve_pages_preview.mjs | out/을 '/eottae/' 하위로 서빙하는 무의존 정적 서버 — Pages와 동일 경로라 SW 스코프까지 재현, 커스텀 404.html 폴백·out/ 밖 경로 이탈(403) 차단
- [버그수정] HANDOFF_김민기.md §6 | SW 확인 명령이 깨진 `next start`를 가리키던 안내 → 새 start 동작(미리보기 서버) 명시
- [검증] `npm run start` 실실행 — / → /eottae/ 302, /eottae/·match/·manifest·sw.js(text/javascript)·font 200, api/health JSON 실응답, 미존재 경로 404.html, /eottae/ 밖 경로 404, %2e%2e 이탈 차단 확인
- [미실행] 실사이트 SW 설치·오프라인 전환·Lighthouse (위 보류 항목과 동일)

## 2026-10-23 미리보기 서버 디렉터리 301 누락 수정 (2차 리뷰 반영)
- [버그수정] tools/serve_pages_preview.mjs | 확장자 없는 디렉터리 URL(`/eottae/match`·`/eottae/offline`)이 404를 반환하던 결함 → Pages와 동일하게 `pathname + '/'`로 301 (query 보존). sw.js precache의 `${BASE}offline`(슬래시 없음)이 404 → `cache.addAll` 거부 → SW install 실패하던 문제와 capture_screenshots.mjs의 `/match` 등 무슬래시 경로가 404를 찍던 문제를 동시 해소
- [보완] PORT 비숫자 입력 시 즉시 명확한 오류로 종료, listen 바인드를 127.0.0.1로 제한
- [검증] `npm run start` 실실행(PORT=3317) — `/eottae/match`·`/eottae/offline`·`/eottae/activities`·`/eottae/invitations` 301→200, `?x=1` query 보존, `/eottae/api/health` 200(octet-stream, Pages와 동일), `/eottae/api/health/` 404, `..%2f`·`..%5c`·`%2e%2e` 이탈 차단 유지, `PORT=abc` 오류 종료 확인
- [미실행] 실사이트 SW 설치·오프라인 전환·Lighthouse (기존 보류 항목과 동일)

## 2026-10-23 다중 테마 시스템 — 라이트 기본 + 6테마 피커 (사용자 요청)
- [변경] globals.css | 히어로 텍스트 하드코딩(#fff·#cfc1ff·#d8c9eb·#ffe9f7·btn.light rgba) → --hero-title/--hero-eyebrow/--hero-notice/--particle/--hero-btn-* 토큰화. 사용처가 히어로 한정임을 tsx 전수 확인 후 적용
- [신규] globals.css 테마 블록 3종 | `[data-theme='cupcake']` 크림+민트/핑크 파스텔(파스텔 히어로라 히어로 텍스트 자두색 반전), `[data-theme='cyberpunk']` 다크+네온(CTA 네온옐로·상태칩 시안 아웃라인), `[data-theme='disney']` 캐슬 로열 블루+골드 CTA
- [버그수정] globals.css | 시스템 다크 셀렉터 `:root:not([data-theme='light'])` → `:root[data-theme='system']` — 기본값이 라이트인 요구사항과 충돌(미선택+다크OS가 다크로 나오던 결함). `:root[data-theme='system']{color-scheme:light dark}` 추가
- [변경] globals.css 로고 스왑 | 다크 크롬 테마는 dark·cyberpunk 2종 + 시스템 다크만 다크 로고, cupcake/disney는 라이트 로고 유지
- [변경] theme-toggle.tsx | 3단 순환 버튼 → 네이티브 `<select>` 6옵션 피커(라이트·컵케잌·사이버펑크·디즈니·다크·시스템). 'system'도 data-theme/system 저장값으로 명시 유지해 기본 라이트와 구분. 팔레트 SVG 아이콘
- [신규] theme-color 메타 테마 동기화 | layout.tsx viewport를 단일 #7454c4로 단순화 + FOUC 스크립트·syncChrome()이 선택 테마 대표색으로 content 갱신 — 'system'은 OS 다크/라이트에 따라 #10101b/#7454c4, matchMedia change 리스너로 OS 전환 실시간 추적
- [변경] layout.tsx FOUC 스크립트 | 화이트리스트를 6테마로 확장 + 잘못된 저장값 무시(기본 라이트) + theme-color 동기화
- [검증] `npm run typecheck` PASS, `npm run build` PASS — out/ 재생성
- [검증] 미리보기 서버(PORT=3318)+실브라우저 6테마 실전환 — 라이트 #faf9fe / 컵케잌 #faf6f2+파스텔히어로+자두텍스트 / 사이버펑크 #0a0a14+네온옐로CTA+다크로고 / 디즈니 #f7faff+캐슬그라데이션+골드CTA / 다크 #10101b / 시스템 CDP에뮬레이션으로 OS다크↔라이트 양방향 전환·메타 동기화 확인. localStorage 영속(전체 네비게이션 후 유지), 잘못된 값 'sepia-bogus'→라이트 폴백 확인
- [미실행] 신규 테마의 실사이트 배포 확인·스크린샷 문서 갱신 — main push 배포 후 확인 필요

## 2026-10-24 아기자기 디자인 패스 — 스티커·스캘럽·스프링 모션 (사용자 요청)
- [신규] globals.css | `--spring`(cubic-bezier 0.34,1.56,0.64,1) 공통 이징 토큰 — 버튼·카드·스텝·리빌·모티프·FAQ 아이콘 호버/진입에 적용해 통통 튀는 감각 통일
- [신규] 스캘럽 물결선 | 히어로 하단(`.hero::after`, --bg색 반원 홈)·푸터 상단(`.footer::before`, --footer-bg 반원 볼록) radial-gradient 반복 타일 — 6테마 토큰 자동 추적. 기존 footer border-top 제거
- [신규] 배경 도트 패턴 | body에 `color-mix(in srgb, --ink 5%)` 1.1px 도트(22px 타일) — 종이 질감 수준 은은함
- [변경] 히어로 | 일러스트를 유기 블롭 형태(46%/54% 혼합 라디우스)로 자르고 `--hero-btn-line` 점선 스티커 프레임(::before, 2.5° 어긋남) 추가 — overflow:hidden 제거 후 img에 radius 상속. 강조 문구에 `--hero-title` 물결 밑줄(wavy, offset 9px), 안내 문구를 `--hero-btn-*` 토큰 필로 변환
- [신규] 장식 모티프 | `.eyebrow::before/::after` ✦ 양끝 반짝이, `.section-head h2`·`.subpage h1` 꼬리 ♡(--accent-pink), `.safety-highlight::after` 큰 ♡ 워터마크(14%), `.bottom::before` '· ♡ ·' 중앙 구분선 + bottom 섹션 가운데 정렬
- [변경] 버튼 | 전 종류 완전 pill(99px), 호버 translateY(-2px) scale(1.03)·CTA는 rotate(-1deg) 추가·활성 scale(0.96). `.btn.primary` 하드코딩 보라 그림자 → `color-mix(--cta-bg 55%)` 글로우로 교체해 6테마 CTA색 추적
- [신규] 카드 테이프 | `.service-card::before` 상단 마스킹 테이프(--point, -3°, 상단 -7px 클리핑), 호버 -6px 리프트+ -0.6° 기울임, 카드 링크 5px 전진, 모티프 --point 글로우 + 호버 시 무한 bob→1회 motif-pop 교체
- [변경] 뱃지·칩 | 카드 `.index` 원형 뱃지(chip-bg), `.status` 인라인 플렉스+currentColor 도트(`.dev`만 status-blink 2.2s 깜빡임), `.step` 번호 점선 원(dashed --brand-soft)+호버 -10° 흔들림, `.feature > span` 알약 뱃지('CORE-004' 긴 라벨 호환)
- [버그수정] `.step strong` | inline-flex+margin:auto는 인라인 배치돼 원이 라벨 옆으로 붙던 결함 → block flex로 수정, 원 위·라벨 아래 세로 배치 복원 (실브라우저 캡처로 발견·수정 확인)
- [변경] FAQ·경고 | details 16px 라운드+호버/열림 brand-soft 테두리, 셰브론 → '+' → 열리면 45° 회전(× 변형). `.warn`/`.info` 16px 라운드 + 원형 !/i 아이콘(52px 들여쓰기)
- [보완] prefers-reduced-motion | motif-pop·status-blink·브랜드 로고 흔들림·카드 링크·스텝 원 등 신규 모션 전부 정지 목록에 추가
- [검증] `npm run typecheck` PASS, `npm run build` PASS — out/ 재생성
- [검증] 미리보기 서버(PORT=3321)+실브라우저 1440px·390px 실전환 — 라이트/컵케잌/사이버펑크/디즈니/다크 전 테마에서 스캘럽·블롭 프레임·테이프·뱃지·물결 밑줄·워터마크 확인, 시스템 테마 OS 추적 유지
- [미실행] 스크린샷 문서 갱신·실사이트 반영 확인 — main push 배포 후

## 2026-10-24 PR 자동 리뷰 봇 — 주기 점검·승인·머지·코멘트 (사용자 요청)
- [신규] tools/pr_review_bot.mjs | 열린 PR 순회 자동 판정: 봇/드래프트 스킵 → 비협력자 코멘트 → 워크플로/시크릿 파일 수동리뷰 코멘트 → 충돌 코멘트 → behind면 update-branch → CI(check) 실패 코멘트 → 전부 통과 시 승인(sha별 1회)+squash 머지, CODEOWNERS 등에 막히면 '승인 완료·사람 머지 필요' 코멘트. 같은 sha에 같은 코멘트 반복 차단(마커 dedupe). 머지 발생 시 deploy-pages·team-sync dispatch(GITHUB_TOKEN 머지는 push 이벤트 미발생이라 수동 트리거 필요)
- [신규] .github/workflows/pr-review.yml | 2시간 주기 cron + workflow_dispatch. 권한: contents/pull-requests/issues write + checks read + actions write(머지 후 dispatch용). checkout main으로 봇 스크립트 고정. DRY_RUN=1 지원(조회·판정만)
- [검증] `node --check` 통과, `DRY_RUN=1` 실실행 — 열린 PR 2건(#1 취향 온보딩·#2 온보딩+추천, @HaYul0611, COLLABORATOR) 조회·파일 목록·check-run success·mergeable clean 판정 전부 정상, 승인+머지 예정 출력 확인 (쓰기 없이 검증)
- [검증] 판정 교차확인 — 익명 API로 #1(6파일)·#2(12파일) 전부 match/ 경로(하율 CODEOWNERS 영역·자기 PR), check:completed/success, mergeable:true clean 일치 확인
- [미실행] 실제 승인·머지·코멘트는 로컬 토큰 없음으로 미검증 — main push 후 첫 스케줄/수동 실행에서 동작 확인 필요. CODEOWNERS 필수리뷰가 켜져 있으면 자동 머지 대신 안내 코멘트로 떨어짐

## 2026-10-24 PR 리뷰 봇 보안·정합성 보강 (코드 리뷰 반영)
- [버그수정] pr_review_bot.mjs | 파일 목록 `per_page=100` 첫 페이지만 조회하던 결함 → files/comments/reviews/check-runs 전부 전 페이지 조회(`apiAll`, 최대 30페이지) — 100번째 이후 위치에 워크플로·키 파일을 숨겨 민감 파일 검사를 우회하던 경로 차단. `detail.changed_files`와 조회 건수가 다르면(조회 한계 초과) 자동 승인 대신 수동 리뷰 코멘트로 보류
- [보완] 민감 영역 확장 | `.github/workflows/`만 막던 것을 `.github/` 전체 + 임의 위치 CODEOWNERS + 스케줄 잡이 write 토큰으로 실행하는 자동화 스크립트(tools/pr_review_bot.mjs·team_activity_report.mjs·update_package_manifest.py)로 확장 — 워크플로 YAML 대신 실행 스크립트를 수정해 같은 권한을 얻는 자기수정 우회 차단. CODEOWNERS 단독 변경(리뷰 정책 무력화)도 차단
- [버그수정] pr_review_bot.mjs | 목록 API의 지연 계산 mergeable(null/'unknown')을 그대로 판정해 충돌 PR을 승인하고 '보호 규칙'이라는 잘못된 코멘트를 달 수 있던 결함 → PR 상세를 재조회(null이면 2s 간격 최대 2회 재시도)하고 mergeable null/'unknown'이면 다음 주기 보류로 변경. author_association도 최신 상세 값으로 판정
- [보완] TOCTOU 가드 | update-branch에 `expected_head_sha`, merge에 `sha` 조건 추가 — 판정과 쓰기 사이 새 push가 오면 API가 거부해 다음 점검이 새 커밋을 재판정
- [변경] CI 판정 | 'check' check-run만 인정(없으면 보류) — 다른 워크플로의 성공 check-run으로 필수 CI를 대체 판정하지 않음
- [검증] `node --check` 통과, `DRY_RUN=1` 실실행 — 열린 PR 2건(#1·#2, @HaYul0611 COLLABORATOR) 상세 조회·전체 파일 목록·'check' success·mergeable clean 판정 전부 정상, 승인+머지 예정 출력 확인 (쓰기 없이 검증)
- [미실행] 실제 승인·머지·코멘트·update-branch는 토큰 없음으로 미검증 — main push 후 첫 실행에서 확인 필요 (직전 항목과 동일)

## 2026-10-24 PR 리뷰 봇 2차 리뷰 반영 — behind 고착·민감영역 확장·CI 미기록 안내
- [버그수정] pr_review_bot.mjs | behind PR에 `update-branch`(GITHUB_TOKEN으로 main을 head에 머지)를 쓰면 토큰 push는 pull_request 워크플로를 재트리거하지 못해 새 sha에 `check`가 영원히 없음 → 이후 매 주기 'CI 미기록' 보류로 **영구 고착**(check 필수 시 사람 머지 버튼까지 차단) 되던 결함 → 갱신 단계 제거, behind는 head sha CI(작성자 push 때 검증됨)를 그대로 쓰고 바로 머지 시도. '브랜치 최신화 요구' 보호 규칙이 켜져 있으면 merge API 거부 → 기존 await-merge 코멘트로 사람에게 넘김
- [보완] 민감 영역 2차 확장 | `BUILD_CONTROL` 추가 — `package.json`/lock(npm-shrinkwrap·yarn·pnpm·bun)·`.npmrc`/`.yarnrc`/`pnpmfile`·`next.config.*`·`tsconfig*`/`jsconfig*`·babel/postcss/tailwind 설정을 임의 깊이에서 차단. 스케줄 잡(team-sync·deploy-pages)의 `npm ci`/`npm run`/`next build`가 이 파일들이 정의한 코드를 실행 — 진입점 스크립트만 막으면 postinstall 한 줄로 쓰기 토큰 작업에 코드 주입 가능했던 경로 차단
- [보완] SENSITIVE 확장 | `.env*`, `*.pem/key/p12/pfx/asc` 외에 `secret`/`credential` 포함 경로 세그먼트·`id_rsa`/`id_ed25519`/`id_ecdsa`/`id_dsa` 등 확장자 없는 키·`.netrc`/`pgpass`/`pypirc`/`htpasswd`·`*.p8/keystore/jks/tfvars/ovpn/kdbx` 추가 — 공개 저장소에 실수로 올린 키가 자동 머지되면 그대로 공개되므로 오탐 감수하고 넓게 차단(코멘트로 사람 리뷰 요청)
- [변경] 판정 범위 | `base=main` 필터 제거 → 모든 열린 PR을 순회하되 main 외 대상은 'base' 안내 코멘트(sha당 1회)만 — 침묵 방치 해소
- [버그수정] CI 미기록 판정 | 'check' check-run 부재 시 무음 보류만 하던 것 → 커밋 시각 기준 30분 유예 후에도 없으면 'ci-missing' 코멘트로 에스컬레이션(토큰이 올린 head처럼 CI가 절대 안 도는 경우 대응). 진행 중/유예 중은 기존대로 조용히 다음 주기
- [보완] 승인 TOCTOU | reviews POST에 `commit_id` 추가 — 승인도 판정 sha에 고정, 중간 새 push면 API 거부·다음 주기 재판정 (머지의 sha 가드와 동일 수준)
- [보완] API 호출 절감 | base/협력자 판정을 files/reviews 조회 전으로 이동 — 범위 밖·외부 PR은 상세+코멘트만 조회
- [문서] HANDOFF §10·워크플로 주석 갱신 — main 한정 범위·behind 직접 머지·확장된 민감 목록·스케줄 60일 비활성화 주의 명시
- [검증] `node --check` 통과, `DRY_RUN=1` 실실행 — 열린 PR 2건(#1·#2, @HaYul0611 COLLABORATOR, base=main) 전 단계 통과 후 승인+머지 예정 출력, SENSITIVE/BUILD_CONTROL/FORBIDDEN/CODEOWNERS 정규식 24건 차단·12건 통과 교차검증
- [미실행] 실제 승인·머지·코멘트·dispatch는 토큰 없음으로 미검증 — main push 후 첫 실행에서 확인 필요. CODEOWNERS 필수리뷰 켜져 있으면 안내 코멘트로 떨어짐

## 2026-10-24 리뷰 지적 수정 — reduced-motion 점 등 미세 정정
- [버그수정] globals.css | `prefers-reduced-motion` 정지 목록의 `.status::before`(0,1,1)가 `.status.dev::before`(0,2,1)의 `status-blink`에 특정도에서 져 /match '개발 대상' 점이 계속 깜빡이던 결함 → 정지 셀렉터를 `.status.dev::before`로 교체
- [문서] pr_review_bot.mjs·HANDOFF_김민기.md | "승인 commit_id도 새 push면 API 거부"는 과장 — GitHub은 옛 commit_id 승인을 거부하지 않고 stale 리뷰로 기록한다. 실제 차단 게이트는 머지의 sha 조건임을 주석·문서에 정정
- [문서] pr-review.yml | `contents: write` 주석의 '브랜치 업데이트' 제거 — update-branch 단계는 2차 리뷰에서 삭제돼 남은 설명이 부정확
- [검증] `node --check` 통과, `npm run typecheck` PASS, FILE_INDEX·MANIFEST 재생성 반영

## 2026-10-24 Devin 주기 PR 점검 자동화 — schedule:recurring Automation (사용자 요청)
- [신규] .devin/automations/eottae-pr-watch.md | Devin 스케줄 세션용 프롬프트 원본 — tools/pr_review_bot.mjs 판정 규칙 전부 + diff 직접 리뷰(봇과 차별점) + 토큰 없으면 읽기 전용 폴백 명시
- [신규] tools/devin_pr_watch.mjs | Devin v3 Automations API 등록기 — POST /v3/organizations/{org}/automations에 schedule:recurring(RRULE FREQ=HOURLY;INTERVAL=N, 기본 2h)·start_session 액션·max_concurrent_runs=1 페이로드 전송. GET /self로 run_as 자동 감지(서비스 사용자→organization, 개인 토큰→creator), 같은 이름 존재 시 스킵·UPDATE=1이면 PATCH 갱신, DRY_RUN=1 또는 키 없으면 UI 등록 절차+페이로드 출력 후 종료(키 없음 exit 2)
- [보완] pr_review_bot.mjs PIPELINE_TOOLS | tools/devin_pr_watch.mjs 추가 — 스케줄 작업 등록기라 동일 보호 영역
- [문서] HANDOFF_김민기.md §11 신설 | Devin 자동화 역할(봇이 못 보는 코드 품질 리뷰)·등록 방법(API·UI)·프롬프트 원본 위치·쓰기 토큰 없을 때 읽기 전용 동작 명시, §10 민감 목록에 devin_pr_watch.mjs 반영
- [검증] `node --check` 통과, `DRY_RUN=1` 실실행 — 프롬프트 본문 추출·RRULE·run_as·triggers/actions 페이로드 출력 정상, UI 등록 절차 출력 확인
- [미실행] 실제 자동화 생성은 DEVIN_API_KEY·DEVIN_ORG_ID 없음으로 미검증 — 키 발급 후 `node tools/devin_pr_watch.mjs` 또는 UI 등록 필요 (docs.devin.ai v3 automations 스키마 기준 구현)

## 2026-10-24 코드 리뷰 반영 — rename 우회 차단·로컬 dedupe·종료 안정성
- [버그수정] pr_review_bot.mjs | 민감 파일 스캔이 `f.filename`(새 경로)만 봐서 rename으로 보호 영역 우회 가능하던 결함 — `.github/workflows/ci.yml`→`x.yml` 같은 rename은 새 경로가 무해해 보여 자동 승인·머지될 수 있었다 → `previous_filename`까지 스캔 대상에 포함(flatMap). 잘림 판정은 엔트리 건수(files.length)로 유지 — names는 rename당 2건이라 비교 기준 부적합
- [보완] pr_review_bot.mjs | 마커 dedupe가 `github-actions[bot]` 작성 코멘트만 인정 → 로컬 `GH_TOKEN`/gh 인증 실행은 자기 코멘트를 못 알아봐 반복 실행마다 중복 코멘트되던 결함 → `authors()`가 `/user`로 쓰기 주체 로그인을 1회 조회해 인정 집합에 추가 (앱 토큰은 /user 403 → 자동으로 BOT만 유지)
- [버그수정] pr_review_bot.mjs | 치명 오류 경로 `process.exit(1)` → `process.exitCode = 1` — 진행 중인 fetch 소켓 정리를 끊어 Windows에서 libuv assert(UV_HANDLE_CLOSING)로 비정상 종료되던 문제. 403/429 시 GH_TOKEN 인증 힌트 출력 추가
- [문서] eottae-pr-watch.md 규칙 3·HANDOFF_김민기.md §10 — rename 검사(previous_filename)·로컬 dedupe 인정 범위를 동일 규칙으로 명시
- [검증] `node --check` 통과, `npm run typecheck` PASS, 스캔 로직 교차검증 — 실파일에서 FORBIDDEN/CODEOWNERS/BUILD_CONTROL/SENSITIVE 정규식을 추출해 rename 케이스(`.github/workflows/ci.yml`→`x.yml` 등) 차단 확인, FILE_INDEX·MANIFEST 재생성 반영
- [미실행] 실제 승인·머지·코멘트·dispatch는 토큰 없음으로 미검증 (기존 보류 항목과 동일)

## 2026-10-24 1차 매칭 온보딩·추천·문답 UI 구현 (오하율 작업)
- [신규] src/lib/match/types.ts | 매칭 DTO, 프로필 문답/궁합(CompatibilitySummary, CommonQuestionState) 및 RecommendProfile.qnaSharedCount 정의
- [신규] src/lib/match/demo-data.ts | 취향 온보딩 폼 선택지(관심사/대화스타일/MBTI/연령대/거리) 및 데모 데이터
- [신규] src/lib/match/demo-recommendations.ts | 오늘의 추천 카드 데모 데이터 및 문답 겹친 개수(qnaSharedCount) 반영
- [신규] src/lib/match/demo-qna.ts | 프로필 문답 40문항 + 공통 질문 10문항 데모 데이터 및 관심사/카테고리 매핑
- [신규] src/components/match/icons.tsx | 매칭 모듈 전용 인라인 SVG 아이콘 모음 (외부 폰트/CDN 미의존)
- [신규] src/components/match/OnboardingForm.tsx | 취향 온보딩 폼 (카테고리별 아코디언, 태그 복수선택, 프로그레스 바)
- [신규] src/components/match/RecommendCard.tsx | 추천 상대 1명 카드 컴포넌트 (사진 블라인드/미리보기, 취향 공통 태그, 문답 궁합 뱃지)
- [신규] src/components/match/RecommendList.tsx | 추천 카드 리스트 및 상태(로딩 스켈레톤/빈 상태/에러) 처리
- [신규] src/components/match/QnaQuestionCard.tsx | 프로필 문답 질문/선택지 카드 컴포넌트
- [신규] src/components/match/ProfileQna.tsx | 프로필 문답 40문항 목록 및 모달 컴포넌트
- [신규] src/components/match/CompatToast.tsx | 공통 질문 상단 궁합 알림 토스트 컴포넌트 ("N개 통했어요")
- [신규] src/components/match/CommonQna.tsx | 공통 질문 블라인드 답변 비교 및 일치 배지 컴포넌트
- [신규] src/app/match/match-tokens.css | 매칭 모듈 전용 피치 톤 컬러 토큰 정의
- [신규] src/app/match/onboarding/page.tsx & match-onboarding.css | 취향 온보딩 라우트 (/match/onboarding)
- [신규] src/app/match/recommend/page.tsx & match-recommend.css | 추천 리스트 라우트 (/match/recommend)
- [신규] src/app/match/qna/page.tsx & match-qna.css | 프로필 문답 라우트 (/match/qna)
- [신규] src/app/match/common/page.tsx & match-common.css | 공통 질문 라우트 (/match/common)
- [신규] docs/참고_상용앱_문답구조_분석.md | 상용 데이팅 앱 18장 벤치마크 및 문답 구조 분석 보고서 (주한태·손준혁 공유용)
- [신규] 3. 구현 이미지(5장이상)/ | 실제 구현 화면 캡처 8장(08~15) 배치 및 captions.csv 메타데이터 갱신
- [픽스] Next.js 런타임 캐시 오류(Cannot find module './897.js') 해소 — feat/MATCH-009-common 브랜치 병합, .next 캐시 정리 및 클린 재빌드
- [검증] npm run build PASS (정적 15개 라우트 프리렌더 완료), 브라우저 CDP 실검증 완료
- [미결/위임] 성인 인증 게이트(MATCH-003/004) 및 추천/문답 API(MATCH-005/006/009) 연동 -> 주한태 서버 작업 완료 후 연동 예정

## 2026-10-25 디자인 패스 1차 — 테마 완결(A)·서브페이지 통일(B) (김민기 작업)
- [변경] src/app/match/match-tokens.css | 6테마 추적 매핑 추가 — 기존 다크 세트를 `cyberpunk`와 `system`+OS 다크(`@media (prefers-color-scheme: dark)`)에도 적용, cyberpunk는 표면·선만 셸 토큰(`--paper`/`--soft`/`--line`)을 따르게 오버라이드. 피치 액센트(팀 합의 톤)·기존 토큰명은 전부 유지. 수정 전 실캡처에서 cyberpunk·system 다크일 때 매칭 4라우트만 흰 피치 카드로 남던 결함 확인
- [변경] src/app/match/{onboarding,recommend,qna,common}/*.css | 하드코딩 색 16곳을 신규 토큰(`--match-photo-a/b`·`--match-avatar-ink`·`--match-avatar-revealed`·`--match-veil`·`--match-tag-bg`·`--match-on-accent`·`--match-dim`·`--match-toast-shadow`)으로 치환 — 스타일 레이어만, 컴포넌트·로직 불변. 다크에서 사진 자리 그라데이션이 형광 핑크로 뜨던 것·미리보기 태그(흰 배경+밝은 글자) 대비 붕괴 해소
- [변경] src/components/shared/theme-toggle.tsx | 팔레트 아이콘 → 현재 테마 스와치(브랜드·CTA·카드 토큰 점 3개, 테마 변경 시 스프링 팝). 네이티브 select·저장 키 `eottae-theme`·`data-theme` 계약 그대로
- [신규] src/components/shared/subpage-hero.tsx | 서브페이지 공통 머리 — 파스텔 카드 토큰 그라데이션+도트, 히어로와 같은 스캘럽 하단, eyebrow 반짝이·h1 ♡ 꼬리, 데스크톱 점선 스티커+테이프 모티프(♡ ✦ ✉)
- [변경] privacy·safety·offline·invitations·activities·error·not-found·loading | SubpageHero 적용(본문·문구 불변), loading은 하트 3개 통통 로더 추가
- [변경] src/app/globals.css | `.feature` 카드에 마스킹 테이프(짝/홀 각도 교차)+스프링 호버 리프트, 스캘럽 규칙을 `.hero::after, .subhero::after` 공용으로, 신규 모션(스와치 팝·서브히어로 진입/스웨이·하트 로더·feature 호버) 전부 prefers-reduced-motion 정지 목록에 추가
- [검증] `npm ci`·`npm run typecheck`·`npm run build` PASS (정적 15라우트) — 실행 중인 dev 서버가 node_modules의 next-swc 바이너리를 잠가 저장소 내 `npm ci`가 EPERM이라, 동일 소스·lock을 별도 폴더에 복사해 실행
- [검증] 빌드 산출물(out/)을 `/eottae/` 경로 미리보기 서버로 띄우고 헤드리스 Chrome(CDP)로 실캡처 — match 4라우트 × 7모드(light·cupcake·cyberpunk·disney·dark·system 라이트·system 다크) 390px 수정 전/후 비교, invitations·offline 390px 7모드, safety·404 1440px 7모드, activities·privacy·404·offline 390px 4테마, invitations 1440px cyberpunk·disney. 캡처는 reduced-motion 에뮬레이션 상태
- [미실행] loading.tsx 실화면(정적 export에서 직접 진입 경로 없음), error.tsx 실화면(런타임 오류 유발 필요) — 빌드·타입만 확인
- [미실행] 모션 켜진 상태의 스웨이·팝 애니메이션 육안 확인, 실기기(iOS/Android) 확인, 실사이트(Pages) 반영 확인
- [미결/회신] /match 소개 페이지(src/app/match/page.tsx)는 권한표상 match/* "스타일만" 영역이라 SubpageHero 마크업 전환을 보류 — CSS 공통 부분(feature 테이프)만 반영됨. 통일하려면 오하율 합의 필요
- [미결/회신] 매칭 CTA의 흰 글자(#fff) on 피치 액센트(#f2859d) 대비 약 2.4:1로 WCAG AA 미달 — 팀 합의 톤 변경 사안이라 손대지 않음(C.6 접근성 PR에서 결정 필요)
- [미결/회신] match 라우트 page.tsx가 `<main>`을 렌더해 레이아웃의 `<main id="content">` 안에 main이 중첩됨(랜드마크 중복) — match 영역 마크업이라 오하율 담당으로 이관
- [미결/회신] 지시서 A.2의 저장 키 표기 `theme`는 실제 코드의 `eottae-theme`와 다름 — 코드 기준 유지

## 2026-10-26 1차 매칭 1:1 채팅 UI 및 인터랙션 구현 (손준혁 작업)
- [신규] src/lib/chat/types.ts | 채팅 DTO(ChatMessage, ChatPartner, MessageStatus, MAX_MESSAGE_LENGTH=500) 및 전송 상태 정의 (API_계약_초안 /conversations/:id/messages 호환 구조)
- [신규] src/lib/chat/demo-data.ts | DEMO 가상 상대 정보, 초기 안내 메시지, 순환 자동 응답 목업 데이터 (RULES 7 격리 준수)
- [신규] src/components/chat/MessageBubble.tsx | 1:1 채팅 말풍선 컴포넌트 (내/상대 구분 정렬, 전송 상태/시간 포맷, 텍스트 노드 안전 렌더링)
- [신규] src/components/chat/MessageComposer.tsx | 메시지 입력창 컴포넌트 (Enter 전송, Shift+Enter 줄바꿈, 한글 IME 조합 중복 전송 방지, 500자 제한, 차단 연동 대비 disabled 속성 지원)
- [신규] src/components/chat/ChatRoom.tsx | 1:1 채팅방 컨테이너 (헤더, DEMO 안내 노출, 메시지 자동 스크롤, sending→sent 및 1.2초 지연 자동 응답 인터랙션)
- [신규] src/app/match/chat/page.tsx & match-chat.css | 1:1 채팅 라우트 (/match/chat) 및 match-tokens.css 기반 6테마 추적 반응형 스타일 (globals.css 무변경)
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 16개 라우트 프리렌더 완료)
- [검증] 브라우저 /match/chat 대화 목업 인터랙션(메시지 전송, 상태 전이, 자동 스크롤, 상대 타이핑 점 인디케이터) 동작 정상 확인
- [보안] 메시지 본문 HTML 삽입 배제(순수 텍스트 렌더링), DEMO 라벨 및 실제 미전송 안내문구 명시(RULES 6·7 준수)
- [미구현/보류] MATCH-008 차단·신고 모달 및 헤더 더보기 메뉴 연동 — 후속 작업 예정
- [미구현/보류] 성인 인증 게이트(MATCH-003/004) 및 실시간 WebSocket/서버 API(주한태 담당) 연동 대기

## 2026-10-26 MATCH-007 PR #9 코드리뷰(Devin) 피드백 반영 (손준혁 작업)
- [버그수정] src/components/chat/MessageBubble.tsx | `Intl.DateTimeFormat`에 `timeZone: 'Asia/Seoul'` 미지정 → CI(UTC) 빌드 HTML은 "오전 3:00", KST 브라우저는 "오후 12:00"으로 달라져 hydration 불일치 가능. 시간대를 Asia/Seoul로 고정하고 `<time>`에 `suppressHydrationWarning` 추가
- [버그수정] src/components/chat/ChatRoom.tsx | 연속 전송 시 첫 응답 타이머가 `setTyping(false)`를 호출해 두 번째 응답 대기 중 '입력 중' 점이 사라지던 결함 → `pendingReplies` 카운터로 대기 응답이 남아 있으면 유지
- [변경] src/components/chat/ChatRoom.tsx | 실행 끝난 타이머를 `timers` 배열에서 제거해 누적 방지
- [변경] src/app/match/chat/page.tsx | `<main>` → `<section>` — 레이아웃의 `<main id="content">`와 랜드마크 중첩 해소 (채팅 페이지 범위만 수정)
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 16개 라우트)
- [미실행] UTC 시간대 빌드의 out/match/chat/index.html 시간 표기 재확인, 연속 전송 시 '입력 중' 유지 브라우저 육안 확인
- [미구현/보류] /match → /match/chat 진입 링크 — match/page.tsx는 오하율 담당이라 합의 후 추가
- [미결/회신] 다른 match 페이지들의 `<main>` 중첩은 기존 이관 사항 그대로 (오하율 담당)

## 2026-10-27 MATCH-008 신고 사유 모달 및 차단 시스템 구현 (손준혁 작업)
- [신규] src/lib/safety/types.ts | 신고 카테고리 4종(욕설/성희롱/사기/기타), ReportRequest DTO, 상세 200자 제한, BlockState 정의 (API 계약 `POST /safety/reports`, `POST /safety/blocks` 호환)
- [신규] src/components/safety/SafetyDialog.tsx | 웹 표준 가이드 준수 네이티브 `<dialog>` 기반 공통 모달 (Esc 닫기, `showModal()` 포커스 가두기)
- [신규] src/components/safety/BlockConfirmModal.tsx | 상대방 차단 확인 및 주의사항 안내 다이얼로그
- [신규] src/components/safety/ReportModal.tsx | 신고 사유 선택, 200자 상세 사유 검증, 신고와 동시 차단 체크박스 및 DEMO 안내 완료 모달
- [변경] src/lib/chat/types.ts & src/components/chat/MessageBubble.tsx | `system` 발신자 타입 추가 및 차단/해제 중앙 알림 렌더링 지원
- [변경] src/components/chat/ChatRoom.tsx | 헤더 더보기(`⋯`) 메뉴(차단/해제/신고) 연동, `blockedRef` 차단 즉시 전송 거부(TC-009), 대기 타이머 일괄 취소, 차단 안내 바 노출
- [변경] src/app/match/chat/match-chat.css | 메뉴 팝업, 시스템 안내, 차단 바, 모달 및 폼 스타일 추가 (`--match-*` 토큰만 사용해 6테마 완벽 대응)
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 16개 라우트)
- [검증] 브라우저 실검증 완료: 차단 시 입력 잠금 및 추가 응답 정지(TC-009 충족), 차단 해제 토글 정상 동작, 신고 모달 유효성 검증(사유 미선택/기타 빈값 방지) 및 Esc 닫기, 테마 전환 시 모달 스타일 정상 표시 확인
- [보안] 신고/차단 데이터는 클라이언트 DEMO 상태로만 격리(RULES 7), 허위 운영 처리 일정 미약속(RULES 6 준수)
- [미구현/보류] 서버 DB 영속화 및 운영 대기열 RLS 연동(주한태 담당) 대기
