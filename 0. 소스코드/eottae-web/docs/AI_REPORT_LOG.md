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
- [변경] src/app/match/chat/match-chat.css | 메뉴 팝업, 시스템 안내, 차단 바, 모달 및 폼 스타일 추가 (`--match-*` 토큰 사용. 단 `--match-dim`이 main 토큰 파일에 없어 모달 배경 딤·그림자가 표시되지 않던 결함이 있었음 → 아래 후속 항목에서 수정)
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 16개 라우트)
- [검증] 개발자 수동 브라우저 확인(스크린샷·체크리스트 기록 없음): 차단 시 입력 잠금·추가 응답 정지(TC-009 **클라이언트 부분** 확인), 차단 해제 토글, 신고 모달 유효성(사유 미선택/기타 빈값) 및 Esc 닫기. 서버 쪽 "실패/구독 회수"는 미구현이라 TC-009 전체 충족 아님
- [미실행] 360px 폭, 다크·사이버펑크 등 테마별 모달 확인(당시 `--match-dim` 누락으로 배경 딤 미표시 상태였음), 스크린샷 증빙
- [보안] 신고/차단 데이터는 클라이언트 DEMO 상태로만 격리(RULES 7), 허위 운영 처리 일정 미약속(RULES 6 준수)
- [미구현/보류] 서버 DB 영속화 및 운영 대기열 RLS 연동(주한태 담당) 대기. MATCH-008 완료 기준(신고 이력 보존·권한 분리·운영 대기열)과 TC-010은 미구현

## 2026-10-27 MATCH-008 PR #16 리뷰 후속 — 토큰 누락·문구·해제 확인 (손준혁 작업)
- [버그수정] src/app/match/match-tokens.css | `--match-dim` 정의 누락 → 라이트/다크(+cyberpunk)/system-OS다크 3곳에 추가. 모달 `::backdrop` 딤이 실제로 적용됨. (`--match-toast-shadow`는 main에 이미 복원돼 있음 확인) 토큰 파일은 공유 영역이라 값 추가만 수행
- [변경] src/components/safety/BlockConfirmModal.tsx | "서로의 추천 목록에서도 제외돼요"가 데모에서 일어나지 않으므로 "서버 연동 후에는 … 제외될 예정이에요"로 수정(RULES 6). `mode`(block/unblock) prop 추가
- [변경] src/components/chat/ChatRoom.tsx | 차단 해제도 확인 모달을 거치도록 변경(메뉴·차단 바 모두). 모달 닫힘 시 더보기 버튼으로 포커스 복귀
- [변경] src/components/chat/MessageComposer.tsx | 녹음 중 입력이 비활성화(차단)되면 녹음을 취소해 마이크가 켜진 채 남지 않게 함
- [변경] src/lib/safety/types.ts | 쓰이지 않던 `BlockState` 타입 제거(상태는 boolean 사용)
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 17개 라우트)
- [미실행] 브라우저 확인(배경 딤 표시, 해제 확인 모달, 포커스 복귀, 녹음 중 차단 시 마이크 해제), 360px·테마별 확인, 스크린샷
- [미결/회신 — 오하율] 추천 화면 RecommendList.tsx의 별도 신고 모달(사유 문자열)과 채팅의 `src/lib/safety/types.ts` DTO(REPORT_CATEGORIES/ReportRequest) 통합 제안 — 오하율 담당 파일이라 합의 후 진행

## 2026-10-27 디자인 패스 2차 — 홈 리디자인·접근성(C)·반응형(D)·상태(E)·PWA(F)·품질(G)·문서(H) (김민기 작업)
- [버그수정] src/app/match/match-tokens.css | PR #11 머지 때 빠진 테마 추적 복원 — 다크 세트를 cyberpunk·system(OS 다크)에도 적용, cyberpunk 표면은 셸 토큰 추종. match CSS가 참조하는데 정의가 사라졌던 토큰 4개(`--match-photo-a/b`·`--match-avatar-ink`·`--match-toast-shadow`) 재정의 → 사진 자리 그라데이션·토스트 그림자 복구. 오하율의 `--match-accent-solid`·`--match-on-accent` 대비 수정은 그대로 유지
- [변경] 홈(page.tsx)·내비·서비스 카드·푸터 리디자인 | 한국어 어절 단위 줄바꿈(`word-break: keep-all`, 제목 `text-wrap: balance`)로 '이야/기' 같은 낱자 끊김 제거, 섹션 머리 가운데 정렬로 좁은/넓은 섹션 왼쪽 선 어긋남 해소, 카드 모티프를 시스템 글리프 → 점선 링 스티커 + 인라인 SVG(`motif-icon.tsx`), 단계 점선 연결선·설명, 안전 강조 박스(방패 배지·안쪽 점선 프레임, 워터마크-버튼 겹침 해소), FAQ Q 스티커 + PWA 설치 안내 문항, 하단 로드맵 카드, 3열 푸터, 반투명 블러 헤더, 로그인 자리 점선 필
- [변경] 문구 | 매칭은 이제 데모로 체험 가능하므로 히어로 안내·FAQ·카드 CTA를 사실대로 갱신("데모 데이터로 체험 가능, 실제 매칭·대화는 로그인·성인 인증 후")
- [변경] hero-particles.tsx | 파티클을 본문 열 밖(가장자리·캐릭터 주변)으로 재배치, 모바일은 6개만·55% 투명도 — 글자 위 겹침 제거
- [변경] 서브페이지 모티프 | ✦ ✉ ♡ 글리프 → SVG 아이콘(activities·invitations·offline·privacy·safety·loading)
- [접근성 C.5] 포커스 링을 input·select·textarea·[role=button]까지 확장
- [접근성 C.6] 토큰 대비 보정 — 셸: light `--muted` #696680, cupcake `--muted` #775e6c·`--brand` #256f73·`--hero-eyebrow` #632043, disney `--muted` #5a698c / 매칭(라이트 피치 세트, 액센트 피치색은 불변): `--match-sub` #6a595c·`--match-hint` #7c5d64·`--match-accent-ink` #a9415b(이슈 #8 Devin 제안값)·`--match-mutual-ink` #347944·`--match-ok-sub` #527a5b·`--match-warn-ink` #85591a, 다크 `--match-hint` #b89ca2, 다크 '미리보기' 태그 배경 토큰화(`--match-tag-bg`, 기존 1.48:1)
- [반응형 D.8] 터치 타겟 44px — 내비 링크·테마 select·스킵 링크·/match 소개 카드 버튼(인라인 32px→44px, 스타일 값만). 태블릿/모바일 히어로 캐릭터 스티커, 380px 이하 헤더 태그라인 숨김, 모바일 내비 오른쪽 페이드
- [상태 E.10] 공통 스켈레톤(`.skeleton`·`.skeleton-card`) + loading.tsx 카드 자리 스켈레톤
- [PWA F.11·12] manifest `id`·`orientation`·`categories` 추가, 설명 문구 갱신 / FAQ에 iOS·Android 설치 안내(CORE-003 iOS 가이드)
- [성능 G.13·14] Pretendard woff2 `<link rel=preload>`(swap 시 CLS 감소), 미사용 CSS(`.theme-toggle`·`.info`) 제거
- [문서 H] 루트 README.md 신설(GitHub 첫 화면), 3. 구현 이미지 01~07 재캡처 + 16(홈 6테마 비교)·17(매칭 추천 7모드) 추가·captions.csv 갱신, docs/screenshots 01~07 갱신, DESIGN_개선_지시서 저장 키 표기 `theme`→`eottae-theme`(이슈 #8 항목 4)
- [검증] `npm run typecheck`·`npm run build` PASS (정적 16라우트)
- [검증] 헤드리스 Chrome(CDP) WCAG 대비 자동 감사 — 13페이지(셸 8 + 매칭 5) × 7모드 = 91조합, 보이는 텍스트 전부: 수정 전 셸 70건·매칭 165건 미달 → 수정 후 **0건**. 단, 그라데이션 배경은 첫 색 정지값으로 근사
- [검증] 키보드 Tab 45회 순회(셸 8페이지) 포커스 링 누락 0, 320/360/390/768/1024/1440px 가로 넘침 0(셸 8페이지), 셸 터치 타겟 44px 미만 0
- [검증] theme-color 메타·data-theme 7모드 전부 기대값 일치(FOUC 스크립트), manifest 아이콘 any 192/512 + maskable 512, 폰트 preload 적용 확인
- [미실행] 서비스워커 설치·오프라인 폴백 — 검증용 헤드리스 프로필에서 CacheStorage 자체가 내부 오류로 열리지 않아 판정 불가(sw.js 미변경). 실기기/일반 Chrome에서 재확인 필요
- [미실행] 모션 켠 상태 애니메이션 육안 확인(캡처는 reduced-motion), iOS Safari·Android 실기기 설치, 실사이트(Pages) 반영 확인(머지 후 배포)
- [미결/회신 — 오하율] /match/recommend 320~360px에서 '관심' 버튼이 카드 밖으로 넘침, 매칭 컴포넌트 터치 타겟 44px 미만(MBTI 칩 32px·더보기 26px·문답 선택지 38px 등) — 컴포넌트 레이아웃이라 손대지 않음

## 2026-10-27 MATCH-003 로그인 및 세션·RLS 보안 구현 (주한태 작업)
- [신규] supabase/migrations/0001_create_auth_and_users.sql | users 및 consents 테이블 스키마, account_status ENUM(ACTIVE/SUSPENDED/DELETED/PENDING), RLS default deny 및 본인 데이터만 접근 가능한 보안 정책 정의
- [신규] src/lib/auth/types.ts | Auth/Session DTO, AccountStatus, UserSession, AuthError 및 API 응답 인터페이스 정의
- [신규] src/lib/server/session.ts | 세션 토큰 Base64URL 인코딩 및 HMAC 서명/검증 모듈, 24시간 만료 시각 자동 검사 및 Fail-closed 차단 로직
- [신규] src/lib/server/auth.ts | 서버 인증 가드 requireActiveUser(만료 시 401, SUSPENDED/DELETED 시 403 차단), authenticateUser 목업 풀 연동
- [신규] src/lib/auth/client-auth.ts | 클라이언트 세션 스토리지 매니저 (GitHub Pages 정적 환경 호환 로그인/로그아웃/세션 확인/성인 인증 상태 갱신)
- [신규] src/app/api/v1/users/me/route.ts | GET /api/v1/users/me 내 세션 및 인증 상태 조회 API (정적 export force-static 계약 호환)
- [신규] tools/test_auth_match_003.mjs | 세션 서명 무결성, 만료 차단(401), 위변조 토큰 무효화, 정지/탈퇴 계정 차단(403) 단위 검증 테스트 스위트
- [검증] `node tools/test_auth_match_003.mjs` ALL PASS (5개 단위 테스트 통과)
- [검증] `npm run typecheck` PASS / `npm run build` PASS (신규 /api/v1/users/me 포함 정적 17개 라우트 정상 생성)
- [보안] 세션 만료 및 비정상 계정(정지/탈퇴) 접근 시 Fail-closed 원칙 준수 (401/403 차단), 비밀번호/시크릿 하드코딩 배제
- [미구현/보류] MATCH-004 성인 인증 게이트(PASS/실명인증 또는 데모 게이트) 및 Supabase 실제 원격 인스턴스 환경변수 연결 대기

## 2026-10-27 ADR-005 백엔드 결정 — Supabase + GitHub Pages, 이슈 #23 처리 (김민기 작업)
- [결정] 김민기 확정: 프런트 = GitHub Pages 정적 export 유지, 백엔드 = Supabase(Auth·Postgres RLS·Realtime·Storage·Edge Functions). 근거 — Pages는 정적이라 Next API 라우트가 배포 환경에서 돌지 않음, 기존 ERD·supabase/ 폴더와 일치, 배포 파이프라인 유지. 대안(Firebase, Vercel 이전) 검토 내용은 ADR에 기록
- [신규] 아키텍처_결정기록_ADR.md ADR-005 | 보안 경계 = RLS(default deny), 브라우저엔 anon key만·service_role은 Edge Function 시크릿에만, MATCH-003~008·CORE-004 각각의 Supabase 구현 원칙(성인 인증 결과는 Edge Function만 기록·fail-closed, 쌍방 매칭은 security definer RPC/트리거 1건, 채팅 Realtime은 RLS 채널로 차단 즉시 정지), 도식 갱신
- [변경] API_계약_초안.md | `/api/v1` 논리 계약 ↔ Supabase 구현(테이블+RLS / RPC / Edge Function) 대응표 추가
- [변경] .github/workflows/deploy-pages.yml | build 단계에 Secrets `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 주입(없으면 빈 값 → 데모 모드)
- [변경] eottae-web/.env.example | `SUPABASE_SERVICE_ROLE_KEY` 제거(정적 빌드라 어떤 값이든 브라우저 노출 위험), 값 출처·주의 주석
- [변경] .github/CODEOWNERS | 채팅 경로 실제 위치로 수정(`src/app/match/chat/`) + `src/components/safety/`·`src/lib/chat/`·`src/lib/safety/` → 손준혁, `src/lib/supabase/`·`src/lib/auth/` → 주한태
- [검증 기록] 테스트_케이스_마스터.md 실행 기록 신설 — TC-001 PASS, TC-002 PASS(공통 셸)/FAIL(매칭 추천 320·360px 넘침, #20), TC-012 BLOCKED(#26). 근거는 PR #18 실측
- [정리] 로컬 `.env`의 만료 GH_TOKEN 주석 처리(gh CLI 키링 사용), 커밋 안 된 로컬 파일(`nul`·`tools/__devin_runs.mjs`·`tools/__schema.json`) 저장소 밖으로 이동 — 커밋 대상 아님
- [이관] CORE-004 계정 삭제·CORE-003 실기기 오프라인·Supabase Secrets 등록은 로그인/실기기/프로젝트 생성 이후라 #26으로 이관 후 #23 종료
- [검증] 문서·설정 변경 위주 — 로컬 `npm run typecheck`·`npm run build` PASS(정적 16라우트). deploy-pages.yml의 Secrets 주입은 머지 후 배포 실행으로 확인
- [미실행] 실제 Supabase 프로젝트 생성·마이그레이션 적용·RLS 테스트(주한태 #21), Secrets 등록(#26)
- [변경·추가] tools/pr_review_bot.mjs · .devin/automations/eottae-pr-watch.md · HANDOFF_김민기.md §10 | 인증·DB·RLS 보안 경로(`supabase/`, `src/lib/server|auth|supabase/`, `src/app/api/`)를 자동 승인 금지 영역에 추가 — #24(자체 세션 서명·하드코딩 키 기본값)가 CI 통과만으로 05:57 자동 머지된 사례. 정규식은 실제 경로 6건으로 node 검증(보안 경로 true, match/chat·페이지 false), `node --check` PASS
- [후속] 머지된 #24 코드는 어떤 화면에서도 import되지 않음을 확인(실사용자·실데이터 없음) → 되돌리지 않고 #21에서 Supabase Auth로 교체

## 2026-10-27 리뷰 봇 판정 강화 — AI 코드 리뷰·보안 스캔·draft/봇 PR 판정·이슈 자동 종료 안내 (김민기 작업)
- [요청] 김민기: draft·봇 PR도 판정, 보호 영역은 확인 후 머지, 충돌·CI는 재push 시 재검증 유지, 규칙 위반은 항상 안내·재시도 방법 제시, 빌드 확인, **코드가 맞는지·안전한지 확인**, 이슈 자동 종료 방법 안내
- [신규] tools/ai_code_review.mjs + .github/workflows/ai-review.yml | PR head마다(draft 포함) Devin 세션에 diff·PR 설명·저장소 규칙(ADR-002·003·005, 토큰 색·44px·reduced-motion·담당 영역·AI_REPORT_LOG)을 보내 정확성·보안 판정 → PR 코멘트 + 커밋 상태 `ai-review`(success/failure/error). 같은 head 중복 리뷰 생략, `/ai-review` 댓글(협력자)로 재실행, 25분 시간 초과·VERDICT 누락·시크릿 없음은 error로 fail-closed. 스크립트는 main 기준 checkout으로 실행
- [변경] tools/pr_review_bot.mjs | ① 모든 코멘트에 공통 검사 표(작성자·보호 영역·보안 스캔·머지 가능성·빌드 CI·AI 리뷰·연결 이슈) ② 추가된 줄 보안 스캔(차단 10종·경고 3종) ③ AI 리뷰 통과 게이트(사람 Approve가 있으면 사람 판단 우선) ④ 보호 영역은 나머지 검사 완료 후 작성자 외 사람 Approve 시 머지 ⑤ draft는 판정만·Ready 전환 시 머지 ⑥ team-sync 봇 PR은 생성 파일만 허용·커밋 상태 `check`를 빌드 결과로 인정·충돌이면 재생성 대기 ⑦ `Closes #번호` 없으면 안내 ⑧ ai_code_review·devin_mention_bridge를 보호 스크립트에 추가
- [변경] pr-review.yml | ai-review 완료·converted_to_draft에도 재판정, `statuses: read`
- [문서] PR 템플릿 첫 칸 `Closes #`(자동 종료 키워드 설명), README 협업 방법(검사 표·재시도 방법), HANDOFF §10, .devin 점검 프롬프트
- [검증] `node --check` 3개 스크립트 PASS. 보안 스캐너 단위 테스트(가짜 diff 7건 → 차단 4·경고 3, 봇 자신의 정규식 소스 오탐 0). 실제 PR 대입: #24 → 보안 경로 6개 + 차단 2건(비밀값 기본값 `session.ts:11`, 하드코딩 `test_auth_match_003.mjs:10`) + 경고 4건 / #18·#27 → 0건. `DRY_RUN=1` 실저장소 실행 — 봇 PR #25: 생성 파일만·커밋 상태 check 통과 → 머지 단계 진입 확인
- [미실행] Devin AI 리뷰 실제 세션(머지 후 첫 PR에서 확인, PR마다 ACU 소모), 봇 PR 실제 머지(봇 자기 승인 불가 — 브랜치 보호 bypass 설정 전엔 사람 승인 1번 필요)
- [검증·실환경] #29 머지 후 새 봇이 실제로 실행 — 봇 PR #25를 끝까지 판정(생성 파일만·보안 스캔 통과·빌드 상태 check 통과·AI 리뷰 대상 아님)하고 "봇 자기 승인 불가 — 사람 승인 1번 필요" 표 코멘트 게시 확인
- [시도·실패] main 보호 규칙에 github-actions 앱 bypass(리뷰 요구 예외) 추가 → GitHub API **500** (개인 계정 저장소는 클래식 보호 규칙의 앱 bypass 미지원). 설정 변경 없음 확인
- [변경] team-sync.yml | main push마다 실행(생성 파일만 바뀐 push는 paths-ignore로 제외) — 사람·관리자 머지 뒤 봇 PR이 낡은 채 남던 문제 해소 / pr_review_bot.mjs | 봇 PR만 머지된 회차에는 team-sync를 다시 dispatch하지 않음(리포트 PR 무한 반복 방지)
- [버그수정] ai-review 첫 실전(PR #30): Devin 세션 생성·판정 반환까지 성공했으나 PR 코멘트 403(`pull-requests: read`) → `pull-requests: write`로 수정, 판정 커밋 상태를 코멘트보다 먼저 기록하고 코멘트 실패는 best-effort로 처리(상태가 pending에 멈추지 않게)
- [검증·실환경] 권한 수정 후 `/ai-review` 재실행(PR #30) — Devin 세션이 25분 동안 running으로 남아 시간 초과 → 설계대로 ERROR 코멘트 + 상태 `error`(머지 차단) 확인
- [버그수정] ai_code_review.mjs | 세션 상태만 기다리던 폴링을 "매 주기 메시지를 읽어 VERDICT 줄이 나오면 즉시 채택"으로 변경 — Devin이 답을 쓴 뒤에도 세션을 열어 두는 경우 대응
- [검증·실환경] 폴링 수정(#31) 머지 후 `/ai-review` 재실행 — **2분 만에 판정 완료**, PR 코멘트 + 상태 `failure` 기록까지 정상. AI 리뷰가 #31 코드에서 fail-open 결함(중간 줄의 `VERDICT: PASS`도 판정으로 인정) 지적
- [버그수정] ai_code_review.mjs | 판정은 비어 있지 않은 마지막 줄만 인정(`verdictOf`), Devin API 4xx는 즉시 error 처리(25분 대기 없이), 세션 생성 4xx도 실패 경로로 합침 / CODEOWNERS | `tools/` → @sterran123 (AI 리뷰 권장 사항)
- [검증] `node --check` PASS, 판정 파서 단위 테스트 6건(정상 통과·정상 수정필요·중간 PASS+끝 수정필요→수정필요·진행 메시지 PASS만→error·판정 없음·빈 값) 모두 기대대로. [미실행] Devin 메시지 API 페이지네이션 여부(AI 리뷰 권장, API 문서 미확인)

## 2026-10-27 이슈 진행 자동 동기화 — 체크박스 자동 체크·자동 닫기 (김민기 작업)
- [신규] tools/issue_progress.mjs | 머지된 PR이 끝낸 이슈 체크 항목 판정. 후보 이슈 = 본문 Closes/Refs > 작성자 담당 > 요구사항 ID 일치. 게이트(AI 리뷰 통과 또는 작성자 외 사람 Approve) → Devin 항목별 판정(done/partial/not_done/needs_human) → done 근거를 **이 PR의 추가 줄 + 머지 커밋 파일**과 기계 대조해 통과한 항목만 체크. 체크리스트가 전부 [x]면 이슈를 닫음. 사람이 본문에서 마지막 체크를 하면 AI 없이 닫음
- [신규] .github/workflows/issue-progress.yml | 사람 머지(pull_request closed) · 봇 머지 후 dispatch · 이슈 본문 수정(issues edited) 트리거
- [변경] tools/pr_review_bot.mjs | 사람 PR 머지 후 issue-progress dispatch(GITHUB_TOKEN 머지는 이벤트가 안 생김), 키워드 없는 PR에 추정 이슈 표시, Refs 인식, `api()` 객체 필드(JSON stdin) 지원, PIPELINE_TOOLS에 issue_progress 추가
- [변경] .github/pull_request_template.md, README.md | Closes(다 끝냄)/Refs(일부) 구분 안내, 비워 둬도 자동 연결됨을 안내
- [검증] `node --check` 2개 스크립트 PASS
- [검증] `DRY_RUN=1 PR_NUMBER=28` — 키워드 없는 손준혁 PR에서 후보 #22(담당·MATCH-008·TC-009) 탐지, AI 리뷰 없는 PR이라 게이트에서 체크 생략 판정
- [검증] 근거 대조 — PR #28 실데이터로 실제 인용(match-tokens.css:57) 통과, 지어낸 인용·diff 밖 파일은 거부
- [검증] 체크박스 파싱·교체 — CRLF 본문에서 교체가 안 되던 버그 발견 후 수정, 재확인 PASS
- [보안] AI 리뷰(#33) 지적 반영 — 사람 승인 게이트를 협력자·머지 head sha 승인으로 제한(공개 저장소 외부 Approve·옛 커밋 승인 우회 차단), 비협력자·포크 PR 생략
- [버그수정] AI 리뷰(#33) 지적 반영 — 생략·실패 안내 코멘트가 '처리 완료' 마커를 달아 재실행이 막히던 문제 → 안내는 별도 마커(NOTE)
- [변경] 요구사항 ID를 MATCH·ACT·INV·CORE·SEC·FR·TC 접두어로 제한(ADR 번호로 후보 폭증 방지), '46곳·모든·전부' 전수 항목은 자동 체크 안 함, 코드 펜스 안 체크박스 제외, 쓰기 직전 본문 재확인(동시 수정 덮어쓰기 방지), 닫힌 이슈 안내 문구 분기
- [버그수정] AI 재리뷰(#33) 지적 반영 — 프롬프트용 체크박스 id가 코드 펜스를 세서 실제 id와 어긋나던 문제(엉뚱한 항목 체크·오닫기 가능) → id를 boxes() 하나에서 생성, 판정에 항목 문구를 함께 받아 id와 문구가 맞을 때만 체크
- [변경] 실제로 [x]로 바꾼 항목만 '체크함'으로 보고, 같은 문구 fallback은 문구가 하나일 때만, ai-review 상태는 github-actions[bot]이 남긴 것만 인정, 긴 이슈 잘림을 프롬프트에 알림
- [검증] 가짜 Devin 답변으로 판정 단계 E2E(PR #28·이슈 #22 실데이터, 쓰기 없음) — 진짜 근거 1건만 체크, 전수 항목·id/문구 불일치·지어낸 근거 거부, 사람 확인 항목 분리, 남은 항목 6/7 안내 확인
- [보안] AI 3차 리뷰(#33) 지적 반영 — 후보 이슈를 협력자가 쓴 이슈로 제한(공개 저장소 외부 이슈 본문의 프롬프트 인젝션 차단), 이슈 수정 트리거 step에는 Devin 시크릿 미주입, AI가 쓴 이유 문구의 @멘션·링크 무력화·200자 제한
- [변경] 이슈 수정 닫기는 '이번 수정으로 마지막 체크가 된 경우'만(PREV_BODY) — 전부 체크된 채 Reopen한 이슈를 다시 닫지 않음, concurrency 그룹 pr-/issue- 분리
- [버그수정] AI 4차 리뷰(#33) 지적 반영 — PR 템플릿 HTML 주석의 예시 'Closes #20'을 실제 연결로 읽던 문제 → 두 스크립트 모두 주석 제거 후 키워드·ID 검사, 템플릿 예시도 '#이슈번호'로
- [변경] SEC-00x는 후보 근거에서 제외(인프라 PR마다 #22가 후보가 되던 문제), 규칙 봇 추정 이슈를 issue_progress와 같은 기준(협력자 이슈·남은 항목)으로, 근거 대조 실패 사유에도 safe() 적용
- [미구현/보류] Devin 메시지 API 페이지네이션 — ai_code_review.mjs와 같이 첫 페이지만 읽음(리뷰 세션은 메시지 수가 적어 현재 문제 없음)
- [미구현/보류] 실제 Devin 판정·이슈 체크·닫기 — 머지 후 첫 사람 PR에서 확인

## 2026-10-27 이슈 진행 동기화 보강 — 조기 닫힘 방지 (김민기 작업)
- [검증] #33 머지 후 실제 실행 — Devin 판정 43초, 후보 #26·#22 중 끝낸 항목 없음으로 판정, 오체크·오닫기 없음
- [버그수정] tools/issue_progress.mjs | 번호 목록(`1. [ ]`)·인용(`> - [ ]`) 체크박스를 세지 않아 남은 항목이 있어도 이슈가 닫힐 수 있던 문제 (#33 AI 리뷰 권장)
- [변경] tools/issue_progress.mjs | id·문구가 어긋난 진행 중·사람 확인 판정은 보고에서 제외, 닫기 직전 이슈 상태 재확인(동시 실행 중복 닫기 방지)
- [변경] tools/pr_review_bot.mjs | 추정 이슈의 남은 항목 판정도 같은 체크박스 형식으로
- [검증] `node --check` PASS, 새 체크박스 정규식 6가지 형식 대조 PASS

## 2026-10-27 MATCH-001·002·009 1차 매칭 UI 피드백 반영 및 파비콘 최적화 (오하율 작업)
- [변경] src/lib/match/types.ts | PhotoVisibilitySetting DTO 분리(MATCH-001) — 사용자가 직접 고르는 설정값은 'hidden'|'preview'로 제한, 'revealed'는 서버가 쌍방 매칭 시에만 부여하는 fail-closed 계약 확립
- [변경] src/components/match/OnboardingForm.tsx | 사진/프로필 공개범위 라디오 선택 UI 구현 ('실루엣 기본' vs '사진 미리보기 허용')
- [변경] src/components/match/CommonQna.tsx | 공통 질문 거절/건너뛰기 및 다시 답변하기 기능 추가 (MATCH-009)
- [변경] src/app/match/recommend/match-recommend.css | 320~360px 관심 버튼 카드 밖 넘침 보정, 44px 터치 패딩 확보, 추천 캐러셀 데스크톱 호버 네비게이션 적용
- [변경] src/components/match/ProfileQna.tsx, CommonQna.tsx, OnboardingForm.tsx | CSS/TSX 내 하드코딩 색상을 --match-* 토큰으로 전환, 캐러셀 prefers-reduced-motion 및 닫기 버튼 44px 확보
- [신규] tools/generate_favicons.mjs | 탭 파비콘 투명화 및 apple-touch-icon/PWA 아이콘(#faf9fe 불투명 배경) 최적화 생성 스크립트
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 17개 라우트 전수 생성 확인)
- [검증] 360px 및 다크 테마(7모드) 레이아웃 수동 확인 PASS
- [설계] 온보딩 사진 공개범위 DTO fail-closed 설계 (미지정 시 기본 'hidden' 처리, 무단 revealed 조작 방지. 향후 주한태 백엔드 연동 시 DB CHECK 제약 적용 예정)
- [미실행] 서비스워커 오프라인 캐시 및 iOS/Android 실기기 육안 검증 — 김민기님 담당 이슈 #26으로 공식 이관

## 2026-10-27 Supabase 프로젝트 소유자 확정 — 계획서·설계서 반영 (김민기 작업)
- [변경] 2. 프로젝트 설계서/아키텍처_결정기록_ADR.md | ADR-005에 「프로젝트 소유·키 관리」 추가 — 김민기 Owner·주한태 Developer, 서울 리전·무료 플랜, 값별 보관 위치 표, 마이그레이션 흐름(로컬 개발 → PR → 김민기가 `db push`)
- [변경] 1. 프로젝트 계획서/실행_결정대기_로그.md | DEC-04 일부 확정(Pages·Supabase 무료), DEC-08(백엔드·프로젝트 소유) 확정 행 추가
- [변경] 1. 프로젝트 계획서/plan.md, 팀_작업지시서_WBS.md | 김민기 역할에 Supabase 프로젝트·Secrets·운영 DB 적용, 주한태에 Developer 참여·로컬 개발 명시
- [변경] docs/HANDOFF_김민기.md §14 | 대시보드 단계별 할 일·반복 작업
- [변경] .env.example | API Keys 화면 이름·Publishable key 안내
- [미구현/보류] 1. 프로젝트 계획서/어때_팀_WBS_요구사항_테스트_제출체크_통합관리.xlsx — 담당자 변경이 아니라 작업 추가라 엑셀은 그대로 둠
- [미구현/보류] Supabase 프로젝트 실제 생성·Secrets 등록 — 김민기 계정 로그인이 필요해 직접 진행

## 2026-10-27 Supabase 안내 보강 — PR #39 AI 리뷰 권장 반영 (김민기 작업)
- [보안] HANDOFF §14·ADR-005 | service_role은 복사·등록하지 않음(클라우드 Edge Function에 `SUPABASE_SERVICE_ROLE_KEY` 자동 제공), 외부 키만 `secrets set`. Owner 계정 2FA, `db push --dry-run` 선확인, 공개 전 Redirect URL 축소, 부재 시 임시 권한 위임 절차 추가
- [변경] ADR-005·.env.example | 공개 키를 Publishable key로 팀 통일(변수 이름은 ANON_KEY 유지), 앞 문단 표현 통일
- [변경] 실행_결정대기_로그 | DEC-08 행을 DEC-07 뒤로 정렬
- [검증] 문서만 변경 — 코드 실행 없음. 직전 #39 작업도 문서 변경만이라 실행한 검증 없음(빌드 CI만 통과)
- [보안] HANDOFF §14 | 임시 Administrator 위임 뒤 Owner가 Database Password를 다시 만들고 위임·회수 기록을 #26에 남기는 절차 (#40 AI 리뷰 권장)
- [변경] ADR-005 | 마이그레이션 흐름에 `db push --dry-run` 추가(HANDOFF와 통일), Publishable key와 `verify_jwt` 범위(로그인 세션 필요) 명시 · deploy-pages.yml 주석 용어 통일

## 2026-10-27 Supabase 프로젝트 생성·팀원 권한 — 김민기 작업
- [보안] Supabase 조직·프로젝트 `eottae`(ref `zbwdzdwomiokjmaibglt`, Seoul, Free) 생성 — 김민기 브라우저 승인(`supabase login`) 후 Claude Code가 CLI로 생성·공개 키 조회만 한 ADR-005 1회 예외. DB 데이터·스키마는 건드리지 않음, DB 비밀번호·secret 키는 출력하지 않음. 기록은 #26
- [변경] ADR-005·plan.md·실행_결정대기_로그 DEC-08·HANDOFF §14 | 팀원 3명(오하율·주한태·손준혁) 모두 Developer로 초대 — 급할 때 서로 대신 작업. DB 변경은 대시보드가 아니라 마이그레이션 PR로만
- [보안] ADR-005 | 김민기 부재 시 임시 Administrator 위임 예외를 ADR에도 명시, HANDOFF에 `db push` 없이 끝나도 DB 비밀번호 재생성 명시 (#41 AI 리뷰 권장)
- [검증] 공개 키로 `/auth/v1/settings` 호출 200, 틀린 키 401 · GitHub Secrets 2개 등록 확인(`gh secret list`) · 로그인 주소 설정은 김민기 화면 캡처로 확인
- [보안] ADR-005·HANDOFF §14 | Developer 실제 권한(service_role·JWT Secret 읽기, Edge Function 배포, SQL Editor RLS 우회, 백업 복원)을 사실대로 적고 「공유 금지」는 팀 규칙임을 명시, 팀원 이탈·키 노출 시 secret key 재발급 회수 절차 추가 (#42 AI 리뷰 수정 필요). 무료 플랜엔 Read-only 역할 없음
- [변경] .gitignore | supabase/.branches·supabase/.env 추가 · HANDOFF 초대 링크 24시간 유효·CLI 토큰 Revoke 확인
- [미구현/보류] 팀원 초대(대시보드 전용, 김민기) · `npx supabase logout` + Access Tokens Revoke 확인(김민기) · 앱 코드에 Supabase 연결 전이라 배포 번들 반영 확인은 주한태 연결 코드 머지 후

## 2026-10-27 CORE-003 오프라인 폴백 수정 — 김민기 실기기 확인에서 발견
- [변경] public/sw.js | 오프라인 폴백 주소를 `/offline` → `/offline/`로 — `trailingSlash: true`라 Pages가 301을 주고, 서비스워커가 저장한 리다이렉트 응답은 페이지 이동에 쓸 수 없어 `ERR_FAILED`가 났다(안드로이드 실기기 캡처)
- [변경] public/sw.js | `…/index.txt` 주소로의 페이지 이동은 페이지 주소로 302 — Next 15 `output: export`는 RSC 요청이 네트워크 오류로 실패하면 페이로드 주소(index.txt) 그대로 브라우저 이동을 한다(`fetch-server-response.js` catch 분기)
- [변경] public/sw.js | 설치 때 홈·오프라인 페이지 HTML이 참조하는 `/_next/static/` JS·CSS까지 precache — 첫 방문 직후 오프라인으로 열 때 청크가 없어 「Application error」가 나는 경우 방지. 리다이렉트된 응답은 캐시하지 않음, 캐시 이름 v5
- [검증] 로컬 Pages 미리보기 + Chromium(playwright-core, 임시 설치)으로 첫 방문 → 서비스워커 설치 → **서버 종료**(context.setOffline은 서비스워커 fetch를 막지 않아 이전 헤드리스 점검이 판정 불가였던 원인) 후 4가지 확인. 기존 sw.js: 홈 새로고침 ok, 매칭 링크 클릭·index.txt 직접 이동·미방문 페이지 3건 `ERR_FAILED`. 수정본: 4건 모두 정상(홈은 캐시, 나머지는 「지금은 오프라인이에요」), pageerror 0건
- [변경] public/sw.js (#43 AI 리뷰) | index.txt → 페이지 302 때 쿼리 유지(`_rsc`만 제거) — 추천 → 질문 보내기(`/match/chat/?partner=&q=`)의 질문이 사라지던 문제. 셸 자산 경로를 페이지 주소 기준으로 해석, 캐시 저장을 `event.waitUntil`로 묶음
- [검증] 같은 재현에 5번 「쿼리 붙은 index.txt 이동(?partner=p1&q=hello&_rsc=abc)」 추가 → `/match/chat/?partner=p1&q=hello`로 이동·캐시된 채팅 화면 표시, 5건 모두 정상. 테스트_케이스_마스터 TC-012 실행 기록 2줄 추가
- [미구현/보류] 실기기 재확인(TC-012) — 배포 후 김민기가 안드로이드에서 다시 확인. 온라인 상태에서 미리 받아 둔(prefetch) 경로를 오프라인에서 누를 때의 동작은 이번 재현 범위 밖

## 2026-10-27 CORE-003 캐시 키·응답에서 쿼리 제외, 다른 Pages 프로젝트 캐시 보존 (#45, 김민기 작업)
- [보안] public/sw.js | 페이지 이동 응답을 경로 키로, 응답은 본문·헤더만으로 다시 만들어 저장(`rememberPage`) — fetch 응답을 그대로 넣으면 키를 경로로 줘도 응답 url(쿼리 포함)이 CacheStorage에 남는다(#45 2차 AI 리뷰, Chrome 실행 확인). 질문 내용·향후 Auth 콜백 code가 키·응답 url 어디에도 남지 않게
- [보안] public/sw.js | 캐시 이름 v5 → v6 — v5를 이미 받은 기기에 쿼리째 남은 항목·옛 해시 청크를 activate 때 통째로 삭제. 삭제 대상을 `eottae-shell-` 접두 캐시로 좁혀 같은 출처(sterran123.github.io)의 다른 Pages 프로젝트 캐시 보존(v2~v5도 모두 이 접두사)
- [검증] 로컬 재현(#43과 같은 방식) 1~5 정상 유지. 6 「`?partner=p9&q=secret` 채팅 방문 후 캐시」: 쿼리 붙은 키 0, `/eottae/match/chat/` 항목 응답 url `""` — 대조로 직전 커밋(3b4aa2b) sw.js는 응답 url에 `q=secret`이 남아 FAIL. 7 「다른 프로젝트 캐시 보존」 정상(수정본만 실행)
- [검증] 8 「업데이트 정리」: main(#43) sw.js 설치 → 쿼리 붙은 채팅 방문(v5에 쿼리 키) → 수정본으로 교체·`reg.update()` → v5 삭제, v6 쿼리 키 0, 다시 쿼리 붙여 방문해도 v6 항목 응답 url `""`. 처음 몇 번은 테스트 스크립트에서 설치가 멈췄는데 main sw.js의 캐시 이름만 바꾼 대조군도 똑같이 멈춰 스크립트 문제로 판단(업데이트 호출 뒤 대기를 넣자 둘 다 정상)
- [미구현/보류] 옛 해시 청크 누적은 v6로 한 번 정리됨 — 이후에도 이름을 안 바꾸고 배포가 반복되면 다시 쌓이므로 자동 정리는 후속 과제(#26). Auth 콜백처럼 민감한 쿼리를 쓰는 경로는 아예 캐시하지 않는 방안도 로그인 구현 때 검토. 같은 출처를 공유하는 Pages 구조라 CacheStorage를 다른 프로젝트와 분리할 수는 없음

## 2026-10-27 MATCH-007 카카오톡 스타일 채팅 목록(ChatList) 및 우측 슬라이드 패널 구현 (손준혁 작업)
- [요청] 가상 채팅방 목록 3~4개(ChatList), 대화방 클릭 시 카카오톡처럼 우측 팝업/패널(ChatRoom) 오픈, 우측 상단 닫기(X)로 목록 복귀, 기존 차단/신고 기능 100% 유지
- [신규] src/components/chat/ChatList.tsx | 가상 대화방 목록 뷰 — 이니셜 아바타, 닉네임, 마지막 메시지 미리보기(말줄임), 시간 레이블, 안 읽은 메시지 배지(99+ 대응 및 `.mt-chat-sr` 스크린리더 전용 낭독 분리)
- [신규] src/components/chat/ChatHub.tsx | 대화방 목록과 우측 슬라이드 패널 조율 오케스트레이터 — 방 선택 시 `activeId` 상태 전환, 추천 카드(`?partner=&q=`) 진입 시 `partner` id 일치 대화방 매칭(없으면 첫 방 폴백), 패널 열림 중 목록 `inert` 및 `body` 스크롤 락(`overflow: hidden`), 닫힌 `<dialog>`·hidden 요소를 제외한 패널 내 정방향 Tab·역방향 Shift+Tab 포커스 트랩 순환, 백드롭 클릭 및 Esc 닫기(한글 IME 조합 중 `isComposing` 무시 및 활성 패널 내 모달/메뉴 열림 우선 처리), 닫기 시 선택했던 목록 버튼으로 포커스 복귀, 한 번 열린 방 언마운트 없이 상태 보존
- [변경] src/lib/chat/types.ts & src/lib/chat/demo-data.ts | `ChatRoomInfo` 인터페이스 정의(ADR-003 RLS 보안 메모 추가) 및 4개 가상 대화방(데모 상대, 러닝 메이트, 전시 친구, 보드게임 러버) 샘플 데이터/초기 메시지 구성
- [변경] src/components/chat/ChatRoom.tsx | 단일 데모 상대 하드코딩 제거 → `room` props 기반으로 일반화, 우측 상단 닫기(`✕`) 버튼(44px) 추가, 패널 비활성화(`!active`) 시 `MessageComposer`를 `disabled`로 전환해 닫힌 패널에서 마이크 녹음이 계속 돌지 않도록 차단, 메시지 발생 시 목록 미리보기 갱신 콜백(`onLastMessage`) 연동, 차단/신고 모달에 해당 방의 상대 정보 바인딩, 더보기 메뉴 `menuId`에 `useId()` 적용
- [변경] src/components/safety/BlockConfirmModal.tsx & ReportModal.tsx | 다중 방 유지 시 DOM ID 충돌 및 스크린리더 오독(MATCH-008 회귀) 방지를 위해 `titleId`, `detailId`, `categoryName`에 `useId()` 적용
- [변경] src/components/chat/MessageComposer.tsx | 다중 방 유지 시 `inputId`에 `useId()` 적용하여 label-textarea 접근성 바인딩 보장, 녹음 중 또는 `getUserMedia` 권한 대기 중 패널 닫힘(`disabled` 전환) 시 즉시 타이머·`MediaRecorder`·`MediaStream` 트랙(`track.stop()`)을 종료하도록 보강
- [변경] src/app/match/chat/page.tsx | `ChatRoom` 직접 렌더링 대신 `ChatHub` 렌더링으로 라우트 진입점 연결
- [변경] src/app/match/chat/match-chat.css | 목록 카드, 아이템 호버/포커스, 뱃지, 고정 백드롭(`--match-dim`), 우측 슬라이드 패널(`mt-chat-panel`, slide-in 트랜지션, `prefers-reduced-motion` 대응) 스타일 추가. 이슈 #22 및 PR #37 리뷰 피드백 반영: 미디어 첨부·녹음 중지/취소·음성 재생·더보기 메뉴·전송·차단해제·모달 확인 버튼 모두 최소 44px 터치 영역 전수 확보, 녹음 펄스/깜빡임/파형 애니메이션을 `prefers-reduced-motion` 정지 대상에 추가, 녹음 펄스 그림자를 `color-mix(in srgb, var(--match-err-ink) 45%, transparent)`로 보정 및 녹음 바/비주얼라이저/보이스웨이브 하드코딩 색상 약 20곳 `--match-*` 시맨틱 토큰으로 전환
- [문서] 2. 프로젝트 설계서/테스트_케이스_마스터.md | SEC-002 실측 QA 결과 기록 추가 — TC-001(공통 탐색) PASS, TC-002(채팅 반응형·6개 테마 딤·정방향/역방향 Tab 포커스 트랩·44px 터치 영역) PASS, TC-007(클라이언트 데모 PASS / 서버 BLOCKED), TC-009(클라이언트 잠금 PASS / 서버 BLOCKED), TC-008/010은 서버 구현 대기로 BLOCKED 명시
- [문서] 3. 구현 이미지(5장이상)/18_매칭_채팅_목록_및_패널.png, 19_매칭_차단_신고_모달.png, captions.csv & README_캡처_체크리스트.md | 18번 채팅 목록/슬라이드 패널(960x760 데스크톱 라이트) 및 19번 차단/신고 모달(390x844 모바일 라이트) 실제 캡처 이미지 저장 및 캡션(UTF-8 BOM 유지) 등록
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 17개 라우트 생성, `/match/chat` 정상 빌드)
- [검증] 브라우저(CDP) 및 키보드 실검증: 모바일 360·390px 폭에서 패널 전체 너비 렌더링 확인, 6개 테마(라이트/다크/cyberpunk 등) 배경 딤(`--match-dim`) 및 UI 가독성 확인, 키보드 정방향 Tab·역방향 Shift+Tab 포커스 트랩 순환 및 Esc 닫기, 음성 녹음 시작 후 닫기(`✕`) 및 `Esc`로 패널을 닫았을 때 녹음 상태·타이머·마이크 스트림 트랙(`readyState === 'ended'`)이 즉시 종료됨을 확인, 닫기 후 트리거 버튼 포커스 복귀, 다중 방 개설 후 차단/신고 모달 시 상대방 닉네임 일치 확인, `prefers-reduced-motion` 시 애니메이션 생략 확인
- [안전성] 기존 MATCH-008 차단(즉시 입력 비활성화·응답 취소·해제 확인 모달)/신고 모달 로직 100% 온전히 유지
- [미실행] 실제 Supabase DB 영속화/RLS(MATCH-003, ADR-005) 및 Realtime WebSocket 채널 연동(주한태 담당 백엔드 구현 대기)

## 2026-10-28 MATCH-007·008 Supabase 연동 준비 — DTO·매퍼·데모 데이터 소스 분리 및 TC-009 기록 정리 (손준혁 작업)
- [요청] 이슈 #22 Devin/팀 리드 지시사항 중 한태님 백엔드 PR(#21) 대기 없이 즉시 착수 가능한 항목(1~4번) 반영
- [변경] 2. 프로젝트 설계서/테스트_케이스_마스터.md | 실행 기록 39행의 TC-007(대화방 차단)을 TC-009 보조 기록으로 이동 (TC-007은 MATCH-006 추천 필터 항목이라 주한태 추천 RPC 구현 후 기록하도록 분리)
- [변경] src/lib/chat/types.ts | Supabase `public.messages` 테이블 행 타입 `MessageRow { id, conversation_id, sender_id, body, created_at }` 및 클라이언트 `ChatMessage` 변환 함수 `toChatMessage(row, myId)` 추가
- [변경] src/lib/safety/types.ts | `ReportCategory`(`'abuse'|'sexual'|'scam'|'other'`)가 `public.reports.category` CHECK 제약과 일치함을 명시하고 차단 요청 DTO `BlockRequest { blockedUserId }` 추가
- [신규] src/lib/chat/chat-service.ts | `ChatDataSource` 인터페이스 및 `createDemoChatDataSource` 구현체 신설 — `ChatRoom.tsx`의 인라인 `setTimeout` 데모 자동응답 로직을 데이터 소스 계층으로 분리하고, Supabase 환경변수가 없을 때 데모 모드로 안전하게 동작(`isSupabaseChatConfigured`)하도록 구성
- [변경] src/lib/chat/demo-data.ts & src/components/chat/ChatHub.tsx | 추천 카드(`rec_bada`, `rec_haneul`, `rec_gaeul`, `rec_doyun`)에서 `?partner=&q=`로 진입 시 데모 대화방과 매핑하는 `DEMO_RECOMMENDATION_ROOM_MAP`·`resolveDemoRoomId` 추가
- [변경] src/components/chat/ChatRoom.tsx | 인라인 `setTimeout`·타이머 배열을 제거하고 `createDemoChatDataSource`를 통해 전송·자동응답·차단 시 `dispose()` 정리를 수행하도록 리팩터링
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 17개 라우트 정상 생성)
- [미구현/보류] `0004_chat_safety.sql` 마이그레이션(`messages`·`reports`·Storage RLS) 및 프런트 Supabase Realtime 실제 연결 — 주한태 PR(#21 `0003_match_core.sql`) 머지 후 진행 예정

## 2026-10-28 AI 코드 리뷰 — 로컬 Grok 엔진 추가·Devin 크레딧 절약 (김민기 작업)
- [요청] Devin 크레딧 대신 이미 결제한 Grok 구독(X Subscription Ultra)으로 PR 자동 리뷰를 대체할 수 있는지 공식 문서로 검증하고, 가능한 부분은 구현
- [조사] Devin 사용 현황(API 조회, 2026-10-25~28 세션 100개): Devin 쪽 자동화 `eottae-pr-watch`(2시간 주기 + PR 이벤트) 41개, API(ai-review·issue-progress·@devin 브릿지) 59개 — ai-review와 같은 일을 자동화가 한 번 더 함. API의 `acus_consumed`는 모두 0이라 실제 금액은 대시보드에서만 확인 가능
- [조사] Grok CLI 1.0.70(공식 배포, X Corp. 서명 확인): `grok -p`·`--prompt-file`·`--output-format json`·`--cwd`·`--tools`·`--disable-web-search`·`--max-turns`·`--deny` 지원 확인. 로그인 없이 실행하면 JSON 오류 후 종료. 공식 문서는 CI에 `XAI_API_KEY`를 권하고 `auth.json`을 공유 위치에 복사하지 말라고 함. sandbox는 Linux·macOS만
- [신규] tools/grok_review_engine.mjs | Grok CLI 헤드리스 실행 — 읽기 도구만, 웹 없음, `--trust` 없음, 자식 환경에서 XAI_API_KEY·GitHub·Devin 토큰 제거(API 과금 차단), 로그인·사용량 오류는 작업자 정지, 응답에 인증 정보로 보이는 값이 있으면 게시 거부
- [신규] tools/grok_review_worker.mjs | PC에서 "로컬 Grok 리뷰 대기" PR을 찾아 별도 worktree에서 리뷰, PR이 들고 온 에이전트 설정(.grok·.claude·.cursor·.mcp.json) 제거, 실행 기록 runs.jsonl
- [변경] tools/ai_code_review.mjs | `AI_ENGINE=grok` 경로·공통 마무리 분리. 저장소 변수 `AI_REVIEW_ENGINE=grok-local`이면 Actions가 Devin을 부르지 않고 대기 표시만(변수 미설정이면 기존과 같음). 문서·이미지만 바뀐 PR은 AI 리뷰 생략(에이전트 지시 파일·자동화 경로 제외)
- [변경] .github/workflows/ai-review.yml(변수 전달), devin-mention.yml(OWNER만), tools/pr_review_bot.mjs(새 스크립트 보호 영역)
- [검증] Devin 경로 회귀: PR #37·#45·#46 DRY 프롬프트가 수정 전 스크립트와 동일. 가짜 grok으로 9경로(통과·수정 필요·판정 줄 없음·본문 중간 VERDICT·로그인 없음·사용량 한도·JSON 깨짐·비정상 종료·인증 정보 유출) + 시간 초과 — 모두 의도대로(로그인·한도는 작업자 exit 3). 전달 인자·환경 기록상 XAI_API_KEY·GITHUB_TOKEN 0회 전달, worktree 정리 확인. 실제 grok 1.0.70이 같은 인자 조합을 받아들이고 가짜 XAI_API_KEY가 있어도 "로그인 필요"로 끝남
- [검증] 문서 전용 판별: PR #46 생략, #37·#42·#43·#45 리뷰. `.devin/`·AGENTS.md·CLAUDE.md·tools/·src/ 아래 md는 리뷰
- [검증] 실제 Grok(김민기 구독 로그인, API 키 없음) — PR #43 head `00bd86e`(Devin 통과 커밋)를 GitHub 쓰기 없이 리뷰: grok-4.7, 868초, 입력 32.9만·출력 6.3만 토큰, 수정 필요. 캐시 키와 **응답 url에 쿼리가 남는 문제**(Devin은 #45 2차 리뷰에서야 찾음)·activate 전체 캐시 삭제·PR 설명 불일치를 찾음
- [검증] PR #48에 실제 게시: grok-4.7-build-fast, 526초, API 환산 $1.60, 상태·코멘트 정상 기록(작성자 sterran123). 이 PR 코드에서 링크 따라가기 삭제·문서 생략 범위·Windows 홈 읽기·상태 작성자 검사 누락을 찾아 반영
- [보안] Windows에는 sandbox가 없음 → 홈 디렉터리 전체 `--deny Read/Grep`, 작업 폴더는 홈 밖(`C:\eottae-grok-review`). 실제 Grok으로 확인: 작업 폴더 안 읽기 허용, 홈의 미끼 파일 read_file·grep 차단("Denied by permission policy"). list_dir은 deny 규칙을 못 붙여(unknown tool prefix) 허용 도구에서 제외
- [보안] 작업자: PR 트리의 링크를 따라가지 않음, AGENTS.md·CLAUDE.md 등 자동 로드 규칙 파일은 `.pr-content`로 이름 변경(하위 폴더 포함), 포크 PR·봇이 아닌 계정의 대기 표시 무시, 40분 넘게 멈춘 리뷰는 다시 집음, 공개 문구는 고정 문장(CLI 오류 원문은 콘솔만)
- [변경] pr_review_bot.mjs·issue_progress.mjs | `ai-review` 상태는 Actions 봇과 저장소 소유자가 남긴 것만 인정(기존 규칙 봇은 작성자를 보지 않아 협력자가 success를 직접 남길 수 있었음). 문서 생략은 허용 목록(캡처 폴더·AI_REPORT_LOG·테스트_케이스_마스터)으로 좁힘
- [검증] PR #48 2차 Grok 리뷰(9cc854e, 695초, API 환산 $2.19, 수정 필요) 반영: PR 트리 링크는 링크만 삭제, `devin-mention.yml` checkout을 main으로 고정(PR 리뷰 코멘트 이벤트에서 PR이 바꾼 브릿지가 Devin 키로 실행되던 **기존** 문제), 변경 파일 3000건(API 한도) 잘림이면 생략·자동 승인 안 함
- [검증] PR #48 3차 Grok 리뷰(a44549f, 903초, 입력 119만·출력 10만 토큰, API 환산 $2.84) **통과**. 권장 사항 반영: 자식 환경변수 허용 목록(가짜 XAI_API_KEY·DATABASE_URL·npm 토큰이 넘어가지 않음 확인), 읽기 금지를 `C:/Users` 전체·메인 클론으로, 생성 파일 생략도 옛 경로 검사, 작업자 잠금 `wx`(동시 시작 시 하나만 실행 확인), fetch·git 시간 제한, stdout UTF-8, 브릿지 스크립트도 OWNER만. 줄인 환경으로 실제 Grok 정상 동작(5초)
- [미실행] 구독 사용량 차감·추가 결제 여부(김민기 대시보드 확인 필요), Grok Bot(데스크톱 앱 Cursor 로그인·GitHub 연결 필요 — CLI로는 불가). 다른 드라이브 등 사용자 프로필 밖 절대 경로는 읽기 금지로 막지 못함(Windows sandbox 없음 — 작업자 PC에 비밀 파일을 그런 곳에 두지 않기)
- [운영] 2026-10-28 PR #48 머지(e88df6e) 후 Devin 쪽 자동화 `eottae-pr-watch`(2시간 주기 + PR 이벤트, 최근 3.3일 세션의 41%)를 API로 끔(`enabled=false` 확인). ai-review(Actions)와 같은 일을 한 번 더 하던 것. `eottae-pr-mentions`(소유자 `@devin` 응답)는 유지. 되살리려면 `UPDATE=1 node tools/devin_pr_watch.mjs` 또는 Devin Automations 화면에서 켜기
- [미실행] 저장소 변수 `AI_REVIEW_ENGINE=grok-local` 전환은 하지 않음 — 구독 사용량 차감 확인·작업자 상시 실행 여부를 김민기가 정한 뒤

## 2026-10-28 Devin → 로컬 Grok 완전 전환 — 이슈 진행·@grok·상시 작업자 (김민기 작업)
- [요청] 구독 차감·추가 결제 0 확인(김민기 대시보드) 후 "Devin이 하던 AI 리뷰·PR 확인을 전부 Grok으로"
- [변경] tools/issue_progress.mjs | `AI_ENGINE=grok` 경로(머지 커밋 체크아웃에서 판정), `grok-local` 모드면 Actions가 Devin 대신 PR에 대기 표시 코멘트만 남김, 판정 코멘트 중복 검사는 봇·소유자만. Devin 프롬프트는 동일(PR #37·#47 DRY 비교)
- [신규] tools/grok_mention.mjs | 소유자가 쓴 `@grok 요청`에 읽기 전용 답 댓글(👀 반응, 진행 문구 제거, @멘션 끊기) — Devin 멘션 대체. 다른 사람의 `@grok`은 무시
- [변경] tools/grok_review_worker.mjs | AI 리뷰·이슈 진행·@grok 세 큐 처리, 주기마다 origin/main 빨리감기(작업자 코드가 바뀌면 재시작), 첫 실행 전 옛 댓글에는 답하지 않음(state.json)
- [신규] tools/grok_worker_loop.cmd | 작업자 상시 실행(종료 코드별 재시작 대기), `.gitattributes`에 `*.cmd` CRLF
- [변경] devin-mention.yml(grok-local이면 꺼짐)·issue-progress.yml(변수 전달)·pr_review_bot.mjs(로컬 Grok 대기 안내 문구, 새 스크립트 보호 영역)·HANDOFF §11-1 운영 절
- [검증] 실제 Grok(DRY, 쓰기 없음): PR #47 → #22·#21 이슈 진행 판정 193초(API 환산 $0.76) — 첫 실행에서 Devin 전용 변수(`url`) 참조 오류를 찾아 고침. #37의 소유자 댓글에 대한 @grok 답 117초($0.86) — 코드·요구사항·TC 기록을 `파일:줄`로 대조해 "#22는 닫지 않음" 근거 제시
- [검증] 작업자 세 큐 한 바퀴(가짜 grok, DRY) 오류 없음, 첫 실행에 mentionsSince 기록
- [보안] PR #51 Devin 리뷰 반영: Windows cmd·Node는 현재 폴더의 실행 파일(node.cmd·gh.cmd 등)을 PATH보다 먼저 찾아, 팀원이 머지한 루트 파일이 작업자 PC에서 실행될 수 있었음 → 래퍼·작업자가 `NoDefaultCurrentDirectoryInExePath=1`, 작업 폴더를 클론 밖(`C:\eottae-grok-review`)으로, node·timeout 절대 경로. 대조 시험: 설정 없이 `call gh`는 현재 폴더의 가짜 gh.cmd 실행, 설정 후 실제 gh. 규칙 봇은 Windows 실행 파일·스크립트(.cmd·.bat·.exe·.ps1 등, 루트 .js)를 위치와 상관없이 보호 영역으로
- [변경] @grok 댓글 조회 페이지 넘김(최대 1000개)·조회 시작점 이동, 이슈 진행은 가장 최근 대기 표시 기준·재판정(force) 전달 — PR #51 Devin 리뷰
- [문서] HANDOFF §11-1: 로그인 자동 시작은 김민기가 직접 등록(시작프로그램 vbs — 자동 등록은 Claude Code 권한 검사가 지속 실행 등록으로 막아 하지 않음), 처음 설정 순서(클론 → vbs → 실행 확인), 끄기(래퍼 cmd를 프로세스 트리로 종료), 수동 1회 실행은 클론 밖에서 절대 경로 — PR #52 Grok 리뷰 지적 반영
- [미실행] build — 문서만 변경

## 2026-10-29 team-sync 봇 PR 줄이기 — 머지마다 실행 중단·시각만 바뀐 리포트 건너뛰기 (김민기 작업)
- [요청] "자동 갱신이 이전 것과 같으면 또 갱신해야 하나" — 4일(10-25~28)에 봇 PR 10건(#7~#50), 매번 승인 1번 필요
- [변경] tools/team_activity_report.mjs | 집계 기간·제목 날짜·main CI 상태 줄과 시각 표기를 빼고 비교해 기존 리포트와 같으면 파일을 쓰지 않음 → 매니페스트 해시도 그대로, team-sync의 기존 "갱신할 변경 없음" 검사가 실제로 걸림(전에는 집계 시각이 초 단위로 매번 달라 걸리지 않았음)
- [변경] team-sync.yml | main push 트리거 제거 — 주 1회(월 09:00 KST)·수동 실행만. 제출 직전에 수동 실행
- [변경] tools/pr_review_bot.mjs·pr-review.yml | 머지 후 team-sync dispatch 제거(deploy-pages·issue-progress dispatch는 유지)
- [문서] HANDOFF §9·§10, AI_에이전트_협업_가이드 §8
- [검증] 로컬 실행 4가지: ① 실제 변화(#50 머지 등) → 리포트 갱신 ② 직후 재실행(시각만 다름) → 파일 그대로 ③ 그때 MANIFEST.sha256도 그대로 ④ 팀원 커밋 수 1 변경 → 다시 씀. 시험 뒤 생성 파일 원복(커밋에 넣지 않음)
- [검증] PR #53 Grok 리뷰(58f6418, 229초, API 환산 $0.36) 통과. 권장 반영: 시각 패턴을 정규식 고정 대신 `kst()` 실제 출력에서 만듦(ICU 표기가 바뀌어도 따라감), 주석을 실제 동작(main CI 줄만 무시, 열린 PR CI 열은 비교에 남김)에 맞춤. 단위 테스트는 tools에 체계가 없어 보류
- [검증] PR #53 2차 Grok 리뷰(909f538, 673초, API 환산 $0.79) 통과. 권장 반영: 바뀐 게 없어 건너뛸 때 열린 봇 PR은 main보다 낡은 내용이라 자동으로 닫음(충돌 안내와 동작 일치), 건너뛰기 경로에서 `process.exit` 대신 자연 종료(남은 소켓이 있으면 Windows 비정상 종료 가능)
- [변경] PR #53 3차 Grok 리뷰(db4a7c4, 696초, API 환산 $0.96) 통과 후 권장 반영: 봇 PR 닫기 전 main으로 체크아웃(체크아웃 중 브랜치 삭제 거부 대비)·작성자가 Actions 봇인 PR만·실패 시 경고 로그, 문서 범위를 스크립트와 같게(열린 PR 최근 갱신 시각 포함, CI 열·다음 액션은 비교에 남음)
- [변경] PR #53 4차 Grok 리뷰(a2d5192, 1042초, API 환산 $1.26) 통과 후 권장 반영: 머지 목록을 머지 시각 순으로 정렬(조회가 갱신 순이라 본문·댓글만 바뀌어도 순서가 달라져 다시 쓰던 것), 봇 PR 코멘트와 닫기를 나눔(코멘트 실패가 브랜치 삭제를 막지 않게). "봇 PR이 없으면 null이 찍힌다"는 지적은 실제 gh 실행으로 빈 값 확인 — 해당 없음. 닫은 뒤 다음 주 리포트가 한 번 더 바뀌는 점은 주 1건 수준이라 보류
- [미실행] Actions에서 스케줄 실행·열린 봇 PR 자동 닫기 — 다음 월요일(11-02)에 처음 확인됨

## 2026-10-29 @grok을 팀원도 쓰게 — 소유자 전용 → write 권한 이상 협력자 (김민기 작업)
- [요청] "팀원들만은 PR이든 이슈에서든 @grok을 쓸 수 있으면"
- [변경] tools/grok_review_worker.mjs·tools/grok_mention.mjs | `@grok` 댓글 작성자를 GitHub 권한 API(`collaborators/{user}/permission`)로 확인해 write 이상(admin·maintain·write — maintain은 API에서 write로 나옴)만 처리(팀원 목록을 코드에 두지 않음 — 협력자가 바뀌어도 수정 없음). 외부인(공개 저장소라 `read`)·봇은 무시. 작업자가 고를 때와 응답 스크립트 실행 때 두 번 검사
- [변경] tools/grok_mention.mjs | 답 머리에 요청한 팀원을 멘션(알림), 프롬프트에 요청자 표시. 본문의 멘션은 그대로 끊음
- [버그수정] tools/grok_mention.mjs | fetch 직후 `process.exit()`가 Windows에서 libuv assertion(`UV_HANDLE_CLOSING`)으로 죽던 것 → 본문을 `main()`으로 감싸 `process.exitCode`로 종료(계정 문제 종료 코드 3이 사라지지 않게)
- [검증] 권한 API: sterran123 admin, 팀원 3명 write, 외부 계정 2개 read. 가짜 grok·DRY(쓰기 없음): 소유자 댓글 → 답 머리 `@sterran123 요청`·exit 0, 봇 댓글 → 건너뜀·exit 0(3회 반복 assertion 없음, 수정 전에는 assertion), 사용량 한도 → exit 3
- [버그수정] PR #55 Grok 리뷰(5c50d2e, 819초, API 환산 $0.88) **수정 필요** 반영: 권한 조회 실패가 "팀원 아님"과 같아져 조회 시작점이 요청 뒤로 옮겨지면 그 요청이 영영 빠지던 것 → 작업자는 404만 팀원 아님·그 밖은 예외로 이번 주기 조회를 멈춤(시작점 저장 전), 응답 스크립트는 답·👀 없이 exit 1(다음 주기 재시도). 권장 반영: maintain 역할 허용(role_name도 확인), 포크 PR 프롬프트에 "main 체크아웃", 댓글 100개 넘는 스레드는 마지막 두 페이지에서 최신 맥락
- [검증] 권한 API 응답을 가로채(가짜 응답) 응답 스크립트 시험: 502 → 실패 exit 1·답 없음, 404 → 건너뜀 exit 0, maintain → 답, triage → 건너뜀. 작업자 쪽은 실행 시험 없음(큐 조회 예외가 시작점 저장 전 catch로 가는 것을 코드로 확인)
- [변경] PR #55 2차 Grok 리뷰(72ece6b, 1016초, API 환산 $1.12) 통과 후 권장 반영: 권한은 `permission`(기반 역할)만 봄(`role_name`은 조직 커스텀 역할 이름일 수 있음), @grok 조회 시작점 1초 당김(재시도할 요청이 경계에서 빠지지 않게). 줄 단위 리뷰 댓글의 @grok·판정 공통 모듈은 보류
- [미실행] 팀원 계정의 실제 `@grok` 댓글 — 팀원이 처음 쓸 때 확인

## 2026-10-29 계획서 버전 분리 — plan_v1(1차 업로드본)·plan_v2(중간 점검 1차) (김민기 작업)
- [요청] "지금 있는 plan.md는 파일명에 v1을 붙이고, 지금 만드는 건 v2로"
- [변경] 1. 프로젝트 계획서/plan.md → plan_v1.md | 내용은 처음 커밋본(1b1310b, 작성일 10-26 — 계획 v1 업로드 당시)으로 되돌림. 그 뒤 붙은 Supabase 역할 줄(PR #39·#42)은 v2로 옮김
- [추가] 1. 프로젝트 계획서/plan_v2.md | 핵심 기능 3번을 준비중 페이지 → 안전 장치(준비중은 1번에 합침), 완성 기준을 "화면 5장" → 두 계정 실데이터 흐름·권한 거부·차단 반영, 성인 확인은 시연용 테스트 인증까지, 진행 단계에 1차 점검 현황(완료·데모·진행 중 구분), v1→v2 바뀐 점과 이유
- [판단] 목표 문구 수정안은 Claude가 제안, 반영 여부와 버전 이름은 김민기 결정
- [버그수정] PR #56 Grok 리뷰(e2b276a, 289초, API 환산 $0.42) **수정 필요** 반영: 매니페스트에 gitignore된 Supabase CLI 로컬 상태(`supabase/.temp/` 2개)가 섞여 깨끗한 클론에서 `sha256sum -c`가 깨지던 것 → tools/update_package_manifest.py가 `.temp`·`.branches`를 건너뜀. 재생성 뒤 매니페스트 목록이 `git ls-files`와 정확히 같음을 대조. 권장 반영: 완성 기준에 시연 장소 명시(2차 리뷰에서 다시 고침). 요구사항_마스터 SEC-002·WBS의 「캡처 5장」 기준 정렬은 후속 문서 작업으로 보류
- [버그수정] PR #56 2차 Grok 리뷰(8e739cb, 616초, API 환산 $0.82) **수정 필요** 반영: ① `tools/sync_repo.cmd`가 작성자 작업 트리에서 LF(198바이트)라 매니페스트 해시가 깨끗한 클론(`.gitattributes`의 `*.cmd eol=crlf` → 202바이트)과 어긋남 — 규칙이 생기기(PR #51) 전에 받은 파일이 다시 변환되지 않았던 것. 파일을 지우고 다시 받아 CRLF로 맞춘 뒤 재생성(이전 해시 `b8202619…`로 돌아옴), `git ls-files --eol`로 다른 불일치 없음 확인 ② 완성 기준이 공개 배포에서 테스트 인증을 켜는 길을 열어 ADR-002·DEC-01(공개 배포 fail-closed)과 어긋남 → 두 계정 실데이터 흐름은 로컬 시연, 공개 배포는 테스트 인증 끈 채 성인 확인 전 거부 확인으로 나눔, 남은 결정에서 공개 배포 선택지 삭제. HANDOFF·grok_mention·grok_review_worker 해시 변경은 PR #55 뒤 매니페스트가 낡았던 것(깨끗한 클론 해시와 같음 확인). 파일 목록을 `git ls-files` 기준으로 바꾸는 권장은 보류
- [미실행] build — 문서·매니페스트 생성 스크립트만 변경

## 2026-10-29 서비스워커 캐시 상한 정리 — #26 후속 (김민기 작업, 구현은 로컬 Grok)
- [요청] "#26 해결 작업은 Grok으로" — #26의 「(후속) 서비스워커 캐시 정리」(배포가 반복되면 옛 해시 `_next/static` 청크·방문 페이지가 `eottae-shell-v6`에 쌓임)
- [AI] 구현: 로컬 Grok(grok-4.7-build) — 비밀 파일 없는 별도 클론(`C:\eottae-grok-review\dev`)에서 파일 읽기·수정 도구만 허용(명령 실행·웹 검색 없음, 사용자 프로필 읽기·쓰기 거부). 첫 실행은 추론 중 응답이 멈춰 30분 제한에 걸렸고, 같은 세션 재개 → 헤드리스라 쓰기 승인 불가 → 작업 폴더 쓰기 허용 규칙을 붙여 3회째에 완료(구독 사용량 — API 환산 2·3회차 $0.32, 멈춘 1회차는 집계 안 됨)
- [변경] 0. 소스코드/eottae-web/public/sw.js | 런타임 `_next/static` 청크 80개·방문 페이지 30개 상한(넣은 순서로 오래된 것부터 삭제). PRECACHE·홈/오프라인 셸·캐시된 셸 HTML이 참조하는 자산은 세지 않고 지우지 않음. activate 때와 저장할 때마다 정리(sw.js가 안 바뀌는 배포에서도 동작), 겹치면 하나로 합침, 실패는 삼켜 화면을 막지 않음. 홈·오프라인 문서 이동이 성공하면 셸이 참조하는데 캐시에 없는 청크를 받아 둠. 캐시 이름 v6 유지(올리면 받아 둔 오프라인 셸이 통째로 지워짐)
- [판단] Claude가 작업 지시·diff 검토·시험, 반영 여부는 김민기 결정
- [검증] 로컬 Pages 미리보기 + 헤드리스 Chrome e2e 13개 PASS — 테스트_케이스_마스터 TC-012 2026-10-29 행. 처음엔 Chrome 프로필을 8.3 짧은 경로(`DEFAUL~2`) 아래 둬서 CacheStorage가 「Unexpected internal error」로 실패(10-27 헤드리스 「판정 불가」와 같은 증상) → 프로필을 일반 경로로 옮기니 정상
- [미실행] 실기기 재확인(배포 후), iPhone Safari(#26 팀원 도움 요청)

## 2026-10-29 설정 화면·다크 로고 톤 — CORE-002·BRAND-004 (김민기 작업, 구현은 로컬 Grok)
- [요청] `/settings` 공통 설정 틀(테마 재사용, 로그인 전 계정·삭제 비활성, 안전·개인정보 링크, 앱 정보)과 헤더·푸터 설정 링크. 다크 로고 PNG 원본은 수정하지 않고 CSS 필터로 차분한 파스텔. sw.js·패키지·매니페스트는 수정하지 않음
- [AI] 로컬 Grok이 기존 서브페이지·`theme-toggle`·토큰만 읽고 구현. 명령 실행 없음
- [변경] src/app/settings/page.tsx | 설정 라우트 — subpage-hero·metadata, 화면/계정/안전·개인정보/앱 정보 카드. 삭제는 disabled·aria-disabled·설명 연결만, 동작 없음
- [변경] src/components/shared/theme-toggle.tsx | `choices` 변형이 기존 6테마·`eottae-theme`·apply를 라디오로 재사용. 같은 탭 헤더와 맞추는 이벤트
- [변경] src/components/shared/site-nav.tsx · site-footer.tsx · motif-icon.tsx | 설정 링크(모바일 내비 포함), 톱니 모티프
- [변경] src/app/globals.css | 설정 카드·44px 테마 선택, 비활성 버튼은 투명도 없이 토큰 색. `.logo-dark`에 `--logo-dark-filter`(dark·system 다크 saturate 0.7 brightness 0.9, cyberpunk 0.62·0.94). 라이트 로고는 그대로
- [변경] 1. 프로젝트 계획서/실행_결정대기_로그.md | BRAND-004 상태를 CSS 필터 1차 적용(원본 무변경), 실화면 확인 필요로 갱신
- [미실행] 빌드·브라우저 확인은 Claude Code 파이프라인이 실행

## 2026-10-29 MATCH-003 Supabase Auth 전면 전환 및 ADR-005 리뷰 피드백 반영 (주한태 작업)
- [보완] supabase/migrations/0002_auth_profiles.sql, supabase/tests/0002_auth_profiles_test.sql | `public.users.id = auth.users.id`, `grant update (nickname)` 열 단위 권한, `adult_verified` 기본값 false, `complete_signup` auth.uid() 활성화, 동의 3종 검증
  - [보완] `auth.users` AFTER INSERT 시에는 항상 `PENDING` 계정 행만 생성하고, UPDATE 시 `old.email_confirmed_at is null and new.email_confirmed_at is not null` 시점에만 `activate_user`를 호출하여 `ACTIVE`로 전환하도록 트리거 수정
  - [보완] `auth.users` BEFORE INSERT 및 UPDATE 트리거(`sanitize_new_auth_user`)에서 `birth_date` 키를 완전 제거하여 메타데이터에 생년월일 원본이 남지 않도록 보장 (ADR-002)
  - [보완] `public.is_active_adult()`에서 `adult_verification_expires_at is not null and adult_verification_expires_at > now()`로 null 만료 거부 (fail-closed)
- [제거] 자체 세션 화면 경로 완전 제거 (ADR-005 준수)
  - `src/app/api/v1/users/me/route.ts` force-static 모의 라우트 삭제 (ADR-005: 클라이언트가 직접 Supabase Auth + public.users 조회)
  - `tools/test_auth_match_003.mjs` 삭제
  - `src/lib/server/session.ts`의 `SESSION_SECRET` 하드코딩 기본값 제거 (fail-closed)
  - `src/lib/server/auth.ts`의 미등록 이메일 가상 계정 자동 생성 삭제 (인증되지 않은 계정 접근 401 차단)
  - `src/lib/auth/client-auth.ts`의 자체 토큰 생성 및 `localStorage` 저장 로직 제거
  - `src/components/auth/AuthCard.tsx`의 DEMO 안내를 미설정 비활성화 안내(`NotConfiguredNotice`)로 교체
- [보완] src/lib/auth/validation.ts | `sanitizeNextPath`에서 `//`, `/\`, `\` 포함 경로를 `/`로 차단하여 오픈 리다이렉트 방지
- [보완] src/lib/auth/auth-service.ts & use-auth.ts & AuthCallback.tsx | 계정 상태 검증을 통합 함수 `assertAccountAccess()`로 일원화 (이메일 미확인/SUSPENDED/DELETED/조회실패 시 즉시 signOut 및 세션 차단, PENDING은 가입완료 화면으로 유도, ACTIVE만 정상 진입 허용). if (!supabase) 데모 분기를 제거하고 미설정 시 `NOT_CONFIGURED`로 즉시 중단(fail-closed). `rememberNextPath`를 모듈 변수에서 `sessionStorage`로 전환
- [보완] src/components/auth/{LoginForm,SignupForm,AuthCallback}.tsx | DEMO UI 및 테스트 계정 프리셋 제거. 렌더 시점 `getSupabase()` 호출로 인한 SSG/하이드레이션 불일치 해소(`isSupabaseConfigured` 사용). `peekNextPath` / `consumeNextPath` 렌더 중 소비 방지. PKCE `code` 중복 교환 방지(`detectSessionInUrl: false` 및 단일 교환 캐시 적용) 및 고정 에러 문구 적용
- [연결] src/components/shared/site-nav.tsx & globals.css | 헤더 내비게이션의 준비 중 라벨을 `AuthNavSlot`으로 교체 연결하고, `.nav .login-slot.is-ready`, `.nav .login-slot-out` 44px 터치 영역 스타일 추가
- [연결] src/app/settings/page.tsx & src/components/settings/AccountSettingsCard.tsx | 설정 02번 계정 카드를 `useAuth` 실시간 세션 상태(로그인됨/로그인 필요)와 연동
- [정리] src/lib/server/{session,auth}.ts 파일 완전 삭제 (ADR-005: 자체 세션 토큰 서명 및 목업 계정 모듈 완전 제거)
- [보완] src/lib/auth/auth-service.ts & use-auth.ts | signInWithEmail 성공 시 PENDING 계정도 /auth/complete로 이동할 수 있도록 세션 유지, loadAccount 성공 시 status('signed-in') 및 user 즉시 동기화
- [보완] supabase/migrations/0002_auth_profiles.sql | sanitize UPDATE 시 old signup 유지 및 birth_date 제거(메타데이터 조작 방지), private.set_updated_at에 security definer 부여 및 grant update (nickname, updated_at) 추가
- [보완] supabase/migrations/0002_auth_profiles.sql & supabase/tests/0002_auth_profiles_test.sql | `private.jsonb_strip_key()` 재귀 제거 함수 구현으로 `auth.users.raw_user_meta_data` 내 임의 중첩 위치(`extra` 등)의 `birth_date`까지 INSERT/UPDATE 시 전역 제거 보장 (ADR-002 완전 준수), pgTAP 중첩 키 제거 검증 테스트 2종 추가(plan 23)
- [보완] src/lib/supabase/client.ts & src/components/auth/AuthCallback.tsx | `detectSessionInUrl: false` 설정 및 `AuthCallback` 모듈 스코프 1회 전담 교환 캐시(`codeExchange ??= ...`) 적용, 기존 세션이 있는 상태에서 인증 링크 개방 시 `signOut()` 후 링크 검증 진행 (계정 오염 방지)
- [보완] src/components/auth/CompleteSignupForm.tsx | 가입 완료 화면 상단에 현재 인증된 계정 이메일 안내 표시
- [보완] src/components/auth/LoginForm.tsx & globals.css | `peekNextPath` 마운트 후 상태 동기화로 SSG 하이드레이션 불일치 방지, `.nav .login-slot-name` 44px 터치 영역 스타일 보완
- [정리] auth.css & globals.css | 인라인 style 제거(.auth-form-error--spaced 클래스화), 미사용 .auth-preset-* 및 .auth-demo-otp 스타일 삭제, .nav .login-slot-out에 prefers-reduced-motion(transition: none) 적용
- [정리] FILE_INDEX.csv, MANIFEST.sha256 | 삭제된 tools/test_auth_match_003.mjs 항목 정리
- [정리] 0003 매칭·채팅 RLS 파일 커밋에서 제외 (0002/MATCH-003 단위로 PR 범위 분리)
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 21개 라우트 프리렌더 완료, 환경변수 미설정 빌드에서 가입/로그인 버튼 비활성화 확인)
- [미실행] 로컬 Supabase(`npx supabase start`) 마이그레이션 적용 및 `supabase/tests/0002_auth_profiles_test.sql` pgTAP 실행 — 작업 PC에 Docker 미설치로 미실행

## 2026-10-30 README 스크린샷 레이아웃·@grok 안내 갱신 (김민기 작업, 구현은 로컬 Grok)
- [요청] 루트 README 스크린샷 표가 이미지 원본 크기 차로 칸 높이·정렬이 들쭉날쭉하고 빈 칸이 생김. GitHub README에서 같은 종류끼리 같은 행·같은 width·캡션·열 수 맞춤. `@devin` 안내를 `@grok` 현재 운영으로 바꾸고, 로그인·서비스워커 미구현 같은 낡은 상태 표기를 plan_v2 중간 점검 1차에 맞춤. 과거 기록·Devin 코드는 건드리지 않음
- [AI] 로컬 Grok이 HANDOFF §9~§11-1, AI_에이전트_협업_가이드, grok_review_worker.mjs·grok_mention.mjs 머리 주석, plan_v2 「진행 단계」, captions.csv·실제 PNG를 읽고 문서만 수정. 명령 실행 없음
- [변경] README.md | 스크린샷을 데스크톱 1열(다크·6테마·채팅)·모바일 2열(온보딩|추천, 문답|공통질문, 데이트|청첩장)·짧은 화면 1열(신고/차단, 홈 모바일, 오프라인)로 나눔. 행마다 같은 width, 캡션, 빈 td 없음. 경로 인코딩은 기존과 동일(`3.%20구현%20이미지(5장이상)/`). 현재 단계·화면 표에 `/settings`·오프라인·#21. `@devin` → `@grok`(일반 댓글, write 팀원, 👀, 김민기 계정 답·요청자 멘션, 읽기 전용, 5분 주기, 자동 `ai-review` 4~17분)
- [변경] README_처음읽기.md | 단계를 중간 점검 1차로 갱신. AI 협업(@grok) 절 추가
- [변경] 0. 소스코드/eottae-web/README.md | 서비스워커 미구현 문구 삭제, 라우트에 매칭 데모·`/settings`·`/offline`, PWA Android PASS, 팀 협업에 @grok
- [미실행] GitHub 렌더링 확인은 PR 화면에서

## 2026-10-30 MATCH-003 Supabase Auth 추가 리뷰 피드백 반영 및 RLS·함수 방어 강화 (주한태 작업)
- [보완] supabase/migrations/0002_auth_profiles.sql |
  - `private.jsonb_strip_sensitive_birth_keys()` 재귀 제거 함수 추가: `birth_date`뿐만 아니라 `birthdate`, `date_of_birth`, `dob`, `birthday` 대소문자 무관 전역 제거
  - `sanitize_new_auth_user`의 모든 경로(이메일 INSERT, 비-signup INSERT, UPDATE)를 전면 화이트리스트화: `private.jsonb_whitelist_oauth_metadata()` 함수를 통해 허용된 OAuth 프로필 키(`iss, sub, name, full_name, email, picture, avatar_url, provider, provider_id`)이자 string 타입인 값만 보존하고 기존 signup 객체만 유지함으로써 `dateOfBirth` 및 임의 중첩 객체 주입 원천 차단 (ADR-002)
  - `private.validate_signup`에서 약관 버전(`terms_version`, `privacy_version`)을 지정된 초안 버전(`terms-2026-10-draft`, `terms-test`, `privacy-2026-10-draft`, `privacy-test`)으로 검증하여 임의 문자열 동의 방지
  - `complete_signup` RPC에서 호출자의 `email_confirmed_at` 존재 여부를 검증하여 이메일 미확인 세션의 가입 완료 차단
  - RLS `users_select_own` 수정: Supabase Auth 액세스 토큰에 `email_confirmed_at` 클레임이 없는 환경을 지원하기 위해 `public.email_is_confirmed()` security definer 헬퍼 함수를 추가하고, `account_status in ('ACTIVE', 'PENDING') and (account_status = 'ACTIVE' or (account_status = 'PENDING' and email_is_confirmed()))`로 소셜 확인된 PENDING 사용자(/auth/complete)의 본인 행 조회 허용 (ADR-005)
  - RLS `consents_select_own` 수정: `ACTIVE` 또는 `PENDING` 사용자만 본인 동의 내역 조회 허용
  - GoTrue(`supabase_auth_admin`) 역할에 트리거 함수(`sanitize_new_auth_user`, `handle_new_auth_user`) EXECUTE 권한 부여 (회원가입·이메일 확인 시 `permission denied for function` 롤백 결함 해소)
- [보완] supabase/tests/0002_auth_profiles_test.sql |
  - `pg_temp.login_as()` 헬퍼에서 위조된 `email_confirmed_at` 클레임을 넣지 않고 표준 토큰 클레임(sub, role)만 설정하도록 정리
  - 테스트 추가: `supabase_auth_admin` 역할로 auth.users INSERT 성공 검증 (트리거 EXECUTE 권한 확인), 이메일 미확인 PENDING 사용자 users 조회 차단, `auth.users.email_confirmed_at` 채운 후 PENDING 사용자 users 1건 정상 조회, `dateOfBirth` 임의 키 주입(INSERT/UPDATE) 차단 검증 3종, 초안 외 약관 버전 거부(`INVALID_CONSENT_VERSION`), `is_active_adult()`의 `adult_verified = true`이나 만료일 null인 경우 거부(fail-closed), 유효 만료일 정상 통과, 이메일 미확인 사용자의 `complete_signup` 거부 (plan 33건으로 확장)
- [보완] src/lib/supabase/client.ts & src/components/auth/AuthCallback.tsx | `detectSessionInUrl: false` 및 `AuthCallback` 모듈 스코프 1회 전담 교환 캐시(`codeExchange ??= ...`), 기존 세션 개방 시 `signOut()` 선행 후 링크 검증
- [보완] src/components/auth/CompleteSignupForm.tsx | 가입 완료 화면 상단에 현재 인증된 계정 이메일 안내 표시
- [보완] src/components/auth/LoginForm.tsx & globals.css | `peekNextPath` 마운트 후 상태 동기화로 SSG 하이드레이션 불일치 방지, `.nav .login-slot-name` 44px 터치 영역 스타일 보완
- [정리] auth.css & globals.css | 인라인 style 제거, 미사용 .auth-preset-* 및 .auth-demo-otp 스타일 삭제, .nav .login-slot-out에 prefers-reduced-motion(transition: none) 적용
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 21개 라우트 프리렌더 완료) / 시크릿 스캔 PASS (0건)
- [미실행] 로컬 Supabase(`npx supabase start`) 마이그레이션 적용 및 `supabase/tests/0002_auth_profiles_test.sql` pgTAP 실행 — 작업 PC에 Docker 미설치로 미실행

## 2026-11-02 중간 점검 2차 패키지 — plan_v3·제출안·팀원별 추가 작업 (김민기 작업, 구현은 로컬 Grok)
- [요청] 중간 점검 2차 제출일. plan_v3, 팀원 4명 제출 칸 초안, 최종까지 팀원별 할 일, 1차 문서 최소 보강. FILE_INDEX·MANIFEST·.grok-context는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 `.grok-context/state.md`(2026-11-02 09:46, main ea45798), plan_v1·v2, WBS, 결정 로그, 요구사항·TC·ADR, captions.csv, 결과 보고서, src·supabase를 읽고 문서만 작성
- [신규] 1. 프로젝트 계획서/plan_v3.md | 중간 점검 2차 현황(완료/데모/진행 중/미착수, PR 번호). 핵심 루프 실데이터는 미완으로 명시. v2→v3: 설정(#59), 로그인 UI(#57), 생일 기준 만 19세, BBaton 시연·PayApp 테스트 10회 즉시 취소·사업자등록 없이, 신분증/OCR 미수집(#21 10-30)
- [신규] 4. 프로젝트 결과 보고서/중간점검_2차_제출안.md | 공통 URL 2개 + 4인 복사용 칸. 각자 머지 PR만. 오하율은 1차 이후 머지 없음 → 빈 칸+안내
- [신규] 4. 프로젝트 결과 보고서/팀원별_추가작업_2차.md | #21·#22·#26 미체크, PR #57 이후, SEC-002·WBS 캡처 기준, iPhone 문서 미반영. 의존: 준혁 채팅 ← 한태 테이블, 하율 실데이터 ← 한태 API
- [변경] 2. 프로젝트 설계서/요구사항_마스터.md SEC-002 | 캡처 5장 → 19장 충족, 이후는 실데이터 흐름 증빙(plan_v3)
- [변경] 1. 프로젝트 계획서/팀_작업지시서_WBS.md W11~W12 | 같은 기준으로 맞춤. 과거 W1~W10 줄은 유지
- [변경] 1. 프로젝트 계획서/실행_결정대기_로그.md | DEC-01에 10-30 BBaton·만 19세·OCR 미수집을 덧붙임(1차 「미결정」문구 유지). DEC-09 PayApp 행 추가. 다른 행은 유지
- [보존] plan_v2.md 미수정. FILE_INDEX.csv·MANIFEST.sha256·.grok-context/ 미수정
- [판단] 2차 목표(실데이터 핵심 루프)를 완료로 쓰지 않음. iPhone은 구두 PASS만, 문서 미반영을 할 일로 남김
- [미실행] 빌드·브라우저·db push·BBaton/PayApp. 이 세션은 파일 읽기·검색·수정만
- [변경] PR #64 Grok 리뷰(1ba3083) 반영: FILE_INDEX.csv, MANIFEST.sha256 | 신규 문서 3개와 기존 트리에 맞게 재생성. plan_v2.md·.grok-context/ 는 미수정. 위 [보존]의 「FILE_INDEX.csv·MANIFEST.sha256 미수정」은 이 커밋과 다름. 제출안 김민기 칸은 재생성으로 고침. BBaton·PayApp Secrets 등록은 주한태(권한 부족 시에만 김민기 대행), db push는 김민기 Owner로 DEC-01·DEC-09·제출안 문장을 맞춤. plan_v3 「PR #58, #26」은 이슈 #26으로 구분.

## 2026-11-02 매칭 DTO·Supabase 서비스 계층 연동 및 320·360px 반응형 실측·온보딩 잠금 해제 (오하율 작업)
- [요청] 이슈 #20(섹션 5 주한태 백엔드 연동 준비·남은 색 토큰 점검), 이슈 #21(DTO 맞추기), `4. 프로젝트 결과 보고서/팀원별_추가작업_2차.md` 오하율 담당 항목 반영
- [변경] src/lib/match/types.ts & src/lib/match/demo-data.ts | `API_계약_초안.md` 및 `DB_논리모델_전체3단계.md` 기준 Supabase 테이블·RPC 행 타입(`ProfileStatus`, `ProfileRow`, `ProfileInterestRow`, `RecommendationRow`, `LikeDecision`, `LikeActionRow`, `LikeResultDto`, `ProfileQnaAnswerRow`, `CommonQuestionRow`)과 양방향 변환·검증 순수 함수(`validateOnboardingDraft`, `toSaveOnboardingRequest`, `toOnboardingDraft`, `toRecommendProfile`, `toQnaAnswer`) 추가, `DistancePreference` 타입 통합
- [신규] src/lib/match/match-service.ts | 매칭 데이터 서비스 계층 신설 — `isSupabaseConfigured` + `authService.assertAccountAccess()` 및 성인 확인(`adultVerified`·만료 시각 fail-closed) 검증 후 `profiles`·`profile_interests`·`get_recommendations`·`record_like_decision`/`likes`·`blocks`·`reports`·`profile_qna_answers` 호출, 키 미설정 환경에서만 데모·로컬 폴백 동작
- [변경] src/components/match/OnboardingForm.tsx | 찾는 관계·관심사 아코디언·선호 거리 게이지의 잠금 문구(`"MBTI와 만나고 싶은 상대를 먼저 골라주세요."`)를 제거해 상시 개방·선택·수정·저장·취소 복원이 되도록 개선(MATCH-001 AC, TC-005), `matchService` 연동 및 실계정 모드에서 DEMO 배지·푸터 조건부 숨김
- [변경] src/components/match/{RecommendList,ProfileQna,CommonQna}.tsx | 추천 목록 조회·관심/나중에·차단·신고 및 문답 저장/삭제·공통 질문 거절 상태를 `matchService`에 연결, 토스트 닫기 버튼 인라인 스타일 제거, 실계정 모드에서 DEMO 푸터 조건부 숨김
- [변경] src/app/match/recommend/match-recommend.css & src/app/match/qna/match-qna.css | `.mt-report-*` 신고 모달에 남아 있던 하드코딩 `#hex` 색상 58곳과 `.mt-qna__modal-dim`의 하드코딩 `rgba`를 `--match-*` 시맨틱 토큰으로 전수 치환 (매칭 CSS/TSX 내 `#hex` 하드코딩 0건 확인)
- [문서] 2. 프로젝트 설계서/테스트_케이스_마스터.md, 3. 구현 이미지(5장이상)/{08,09,captions.csv}, 4. 프로젝트 결과 보고서/{팀원별_추가작업_2차,중간점검_2차_제출안}.md | 320·360px 포함 매칭 5화면 × 7개 폭 CDP 실측 결과(`TC-002`) 및 온보딩 유효성·저장·복원 검증(`TC-005`) 기록, 잠금 문구가 해제된 `08`·`09`번 온보딩 캡처 갱신, 2차 제출안·추가작업 체크리스트 반영
- [검증] `npm run typecheck` PASS / `npm run build` PASS (정적 21개 라우트 프리렌더 완료)
- [검증] 헤드리스 Chrome(CDP) 실측: 매칭 5화면 × 320·360·390·393·540·768·1500px 가로 넘침 0건, 44×44px 터치 타겟 미달 0건, `/match/recommend` 320px(카드 262px 내 관심·나중에·미리보기 버튼 140×44px)·360px(카드 302px 내 관심 버튼 180×44px) 카드 내부 배치 확인, `/match/qna` 답하기 모달 540px(500px)·768px(540px) 뷰포트 내 배치 확인
- [미실행] 실제 Supabase 원격 DB에서 두 계정 실데이터 온보딩·추천·상호 매칭 E2E 확인 — 주한태 `0003_match_core` 마이그레이션 및 BBaton 성인 인증 머지 후 진행 예정
- [변경] PR #65 Grok 리뷰(f8bba49) 반영: 실계정 온보딩·문답·공통질문 거절은 사용자 ID 없는 localStorage를 읽거나 쓰지 않음(로그인 세션이면 기존 키 삭제, 데모만 로컬 초안). 성인 미인증 문답 저장은 캐시보다 먼저 거부하고 upsert/delete 오류는 ok false. 출생연도 없으면 나이 비움, 19세 바닥 제거, 검증 성별 필드 전에는 성별 문구 없음. 데모가 아니면 상대 답 비움(revealed만 공개, 데모 상대를 쓰는 동안 DEMO 문구 유지). 차단·신고는 미인증 거부·라이브 오류 반환, 화면은 성공일 때만 카드 제거. record_like_decision 실패 시 likes 재기록 없음·매칭 필드는 RPC 값만. 관심사는 새 행 삽입 후 빠진 id만 삭제하고 실패는 ok false. 추천·문답은 판정 전 빈 목록. 권장 반영: 거리·접속 null이면 문구 생략, 성인 게이트에 accountStatus ACTIVE, 계정 조회 실패는 데모와 구분하고 사유 표시, 라이브 도토리 수 숨김, 허위 프로필 신고는 abuse, reduced-motion에 신고 모달·토스트 애니메이션 해제, 온보딩 조회가 늦으면 수정 중 값은 유지, 신고 다이얼로그 Esc·포커스 이동. 보류: CSS/TSX rgba·hex 전수 치환, 클라이언트의 profile_status ACTIVE 기록(RLS 미확인).
- [변경] PR #65 Grok 리뷰(f3e5573) 반영: 실계정 공통 질문은 매칭 상대 없이 가을·문항·거절을 그리지 않고, 서로 관심 이후 안내와 gateMessage만 보여 준다. 가을·DEMO_PARTNER_ANSWERS·거절 로컬 저장은 데모만. 거절은 데모 저장이 아니면 저장했다고 말하지 않는다. 추천 「가볍게 물어보기」는 데모 id(`rec_`)만 채팅 쿼리로 이동하고, 실계정은 전송 없이 채팅 연동 전 안내만 한다. 권장 반영: 비선호 MBTI가 내 MBTI와 같으면 검증 오류, 거리 게이지 바운스와 온보딩 오류 스크롤은 reduced-motion에서 멈춤, 온보딩 배너는 출생연도 차이를 만 나이로 단정하지 않음, 문답 데모 푸터는 이 브라우저 로컬 저장으로 정정, 신고 접수 중 버튼 잠금. 제출안·추가작업의 데모 폴백 문장을 키 없음 또는 세션 없음(localStorage, 세션 시 키 삭제)으로 맞춤. 보류: profile_status ACTIVE 제거(RLS 미확인), get_recommendations 커서 파싱(응답 형태 미확인), match CSS/TSX rgba·hex 전수 치환.
- [변경] PR #65 Grok 리뷰(8faaef3) 반영: 세션 조회 오류는 데모 성공으로 두지 않고 unverified로 막음. 온보딩 저장·문답 저장/삭제·관심·차단·신고는 조회가 끝난 모드와 같을 때만 쓰고, 화면(공통 질문 포함)은 `loadOnboarding`·`loadMyQnaAnswers`·`fetchRecommendations`가 끝낸 모드만 넘김. 모드가 바뀌면 메모리의 데모 초안은 실계정에 올리지 않고 다시 불러옴. 권장 반영: 문답 추천은 조회 후 한 번 다시 고름, 신고 포커스가 목록 밖이면 첫 항목으로 보내고 접수 중에는 배경 클릭으로 닫지 않음, 거리 게이지 너비 전환은 reduced-motion에서 끔, 서비스 머리 주석의 `common_question_answers` 호출 설명을 삭제(그 테이블은 쓰지 않음. 거절은 데모 localStorage만). 데모 폴백은 키 없음 또는 세션 없음. 보류: profile_status ACTIVE 제거(RLS 미확인), get_recommendations 커서(응답 형태 미확인), 44px 미만 터치 영역(레이아웃 실측 없음), match CSS/TSX rgba·hex 전수 치환. 이 절의 기존 줄은 유지.

## 2026-11-02 시연용 성인 확인·모의 결제 (김민기 작업)
- [요청] 중간 점검 2차. 성인 확인과 결제를 외부 연동 없이 예시 데이터 목업의 시연 흐름으로 추가. 정적 export, 상태는 localStorage. 데모 모드만 동작하고 라이브 매칭 로직은 유지. `/activities`·`package.json`·`FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 plan_v3, 실행_결정대기_로그 DEC-01·DEC-09, 안전_개인정보_연령정책, 단계별_로드맵_수익화, ADR-002, `match-service.ts`의 데모/라이브/미인증 판정, 설정·청첩장·매칭 화면을 읽고 시연 UI만 추가
- [변경] `src/lib/demo/demo-adult.ts`, `src/components/demo/{DemoAdultStep,DemoEntryGuard,MatchDemoEntry,DemoSheet}.tsx`, `demo-flow.css`, `src/app/match/{page,onboarding/page,recommend/page,chat/page}.tsx`, `src/components/settings/{AccountSettingsCard,DemoAdultSettingsStatus}.tsx` | 데모 모드에서만 생일 기준 만 19세 안내와 「BBaton으로 확인(시연)」. 생년월일·신분증·주민등록번호는 받지 않음. 「시연용 확인 완료」와 만료 시각(24시간, 한국 시간). 화면 문구 「실제 본인 확인이 아닌 시연용」. 확인 전 추천·채팅은 이유를 보여주고 진입을 막음. `/match` 시작·온보딩 버튼과 온보딩 앞에서 단계 표시. 설정 계정 카드에 「성인 확인(시연): 완료/미완료 · 초기화」. 저장 키 `eottae_demo_adult_v1`. live·unverified는 기존 화면. `match-service.ts`는 수정하지 않고 모드 판정만 `resolveAccessContext` 사용
- [변경] `src/lib/demo/demo-themes.ts`, `src/components/invitations/ThemePreviewSection.tsx`, `src/app/invitations/page.tsx` | 「테마 미리보기」 가상 테마 4종(3,900·5,900·7,900·9,900원, 예시). 「테스트 결제」시트는 카드번호 입력·외부 링크 없음. 「PayApp 테스트 결제 · 실제 청구 없음」. 결제 → 승인 → 즉시 취소가 단계와 데모 영수증에 보임. 완료 후 「구매한 테마(데모)」. 저장 키 `eottae_demo_theme_purchases_v1`. 색은 6테마 CSS 토큰만
- [미실행] 브라우저 실측, `npm run typecheck`, `npm run build`, BBaton·PayApp·Supabase 호출. 이 세션은 파일 읽기·검색·수정만
- [변경] PR #68 Grok 리뷰(3096885) 반영: 매칭 자식은 `live`, 또는 `NEXT_PUBLIC_DEMO_ADULT_BYPASS==='1'`이고 시연 확인이 유효한 `demo`만 연다. `unverified`는 `gateMessage`를 보여주고 시연 버튼은 두지 않는다. 바이패스가 꺼진 데모는 「본인 확인이 연결되지 않아 열 수 없어요」를 보여주고 시연 버튼은 두지 않는다. 두 잠금 화면의 다른 요소는 「매칭 안내로」 링크뿐이다. `onCompleted`는 `resolveAccessContext`로 다시 판정한다. `/match/qna`·`/match/common`과 `/match` 문답 링크도 같은 가드. 로그인 세션이면 `eottae_demo_adult_v1`을 지우고, 계정 카드의 시연 상태는 데모 모드에서만 표시. `deploy-pages.yml`·`next.config.mjs`에는 바이패스 변수를 넣지 않음. `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않음. 이 세션은 파일 읽기·검색·수정만이라 typecheck·build·sha256sum·브라우저는 실행하지 않음.
- [변경] PR #68 Grok 리뷰(75f9ce0) 반영: 충돌 마커 세 줄만 지우고 시연 절과 origin/main의 소모임 데모·`0003`·PR #66 줄은 그대로 둠. 이 절 앞줄이 `match-service.ts`·`FILE_INDEX.csv`·`MANIFEST.sha256`를 수정하지 않았다고 한 것은 저장소와 다름. 로그인 세션이면 `clearSignedInMatchCache`가 `clearDemoAdult`로 `eottae_demo_adult_v1`을 삭제한다. `FILE_INDEX.csv`·`MANIFEST.sha256`에는 시연 파일이 들어 있다. 로그가 바뀌었으나 이 반영에서는 그 두 파일을 재생성하지 않고 `src/`도 수정하지 않음. 기존 로그 줄은 고치지 않음. typecheck·build·sha256sum·브라우저는 실행하지 않음. 권장 중 PR 본문의 로컬 시연 빌드 `NEXT_PUBLIC_DEMO_ADULT_BYPASS=1` 안내, 홈·설정·루트 README 문구, CODEOWNERS 담당 리뷰, PR 본문의 typecheck·build·sha256sum 통과 문장, `demo-flow.css`의 `--match-*`는 남김.
## 2026-11-02 2차 MVP 데이트·소모임 데모 화면 (김민기 작업)
- [요청] 중간 점검 2차. `/activities`를 서버·DB·외부 API 없이 예시 데이터 데모로 체험 가능하게. 데이트 코스 6~8, 소모임 8~10, 탭·필터·상세·일정 투표·참가 요청(localStorage)·모임 만들기·신고 확인 모달·홈 카드 「2차 · 데모 체험」. 1차 매칭 코드·package.json·FILE_INDEX.csv·MANIFEST.sha256는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 plan_v3, 단계 범위(2차 P0 모임·일정 투표 / P1 데이트 코스), 홈 IA, 브랜드 가이드, 안전 정책, 요구사항 ACT-001~004, DB 논리모델 ACTIVITY/MEMBER/POLL, 기존 activities 준비중 페이지·match 데모·globals 토큰을 읽고 정적 export(basePath `/eottae`, trailingSlash)용 클라이언트 화면만 추가
- [신규] src/lib/activities/types.ts | 지역·분위기·카테고리, 코스 단계, 모임·투표 타입
- [신규] src/lib/activities/demo-data.ts | 가상 데이트 코스 8개(단계 2~4), 가상 소모임 10개(취미/밥/운동/스터디/문화). 실존 상호·인물 없음
- [신규] src/lib/activities/demo-storage.ts | 참가 요청·투표·내가 만든 모임만 localStorage `eottae.activities.demo.v1`
- [신규] src/lib/activities/href.ts | `/activities/?course=`·`?gathering=` 쿼리 주소
- [신규] src/app/activities/activities.css | 기존 CSS 변수만 사용. 360px·데스크톱, 터치 44px, reduced-motion
- [신규] src/components/activities/ActivitiesDemo.tsx | 배지, 탭, 지역·분위기·카테고리 필터, 카드 목록, 데모 토스트
- [신규] src/components/activities/CourseDetail.tsx | 단계 동선, 예상 비용·시간, 「우리 사이에 공유」 데모 토스트
- [신규] src/components/activities/GatheringDetail.tsx | 소개·일정, 참가 요청/취소, 일정 투표 막대, 안전 안내, 신고 데모 모달
- [신규] src/components/activities/ActivitiesNewForm.tsx | `/activities/new/` 모임 만들기. 제출 시 데모 목록에만 추가
- [신규] src/components/activities/DemoDialog.tsx | Esc·포커스 이동·배경 닫기
- [변경] src/app/activities/page.tsx | 준비중 안내를 2차 데모 화면으로 교체
- [신규] src/app/activities/new/page.tsx | 모임 만들기 라우트
- [변경] src/app/page.tsx | 데이트·소모임 카드 문구 「2차 · 데모 체험」, live, CTA 「데모 둘러보기」, href `/activities/`. 히어로 안내 문장에 데모 범위 반영
- [변경] src/app/settings/page.tsx | 앱 정보 2차 문구를 데모 체험·실제 연동 전으로 맞춤
- [미실행] 브라우저 확인은 빌드 후. 이 세션은 파일 읽기·검색·수정만이라 typecheck·build도 실행하지 않음
## 2026-11-02 MATCH-005~009 매칭 핵심 스키마 0003 (주한태 작업, 구현은 로컬 Grok)
- [요청] `0003_match_core` 마이그레이션·pgTAP, API 계약 ADR-005 대응표에 RPC·테이블 이름 기입. `0000`~`0002`·`public.users`·`package.json`·`FILE_INDEX.csv`·`MANIFEST.sha256`·`.grok-context/`·`CODEOWNERS`는 유지. Next API 라우트·MVP2/MVP3 테이블·성별·생년월일 원본·BBaton 식별자·토큰 컬럼은 만들지 않음. 명령과 pgTAP은 실행하지 않음. 테스트_케이스_마스터에는 실행 결과를 쓰지 않음
- [AI] 로컬 Grok이 `0002` 마이그레이션·pgTAP, DB 논리모델, ADR-002·003·005, API 대응표, `src/lib/match/types.ts`·`demo-data.ts`의 관심사 50개, `MessageRow`, `src/lib/safety/types.ts`를 읽고 같은 열 권한·RLS 문체로 작성. 명령 실행 없음
- [신규] 0. 소스코드/eottae-web/supabase/migrations/0003_match_core.sql | RLS default deny. `interests`(demo-data id·라벨 50개), `profiles`, `user_interests`, `profile_answers`, `likes`, `matches`, `match_members`(slot 1·2로 한 match 2명), `conversations`, `blocks`, `reports`(FK ON DELETE SET NULL), `user_roles`(시드 없음), `messages`(MessageRow + attachment_path + soft_delete_state). 쌍방 `yes` 트리거는 양쪽 활성 성인·미차단일 때만 match·member·conversation 1건, 쌍 UUID `pg_advisory_xact_lock`. `decision=no`는 match 없음. RPC `save_onboarding`, `save_answers`, `get_recommendations`, `get_common_answers`, `list_reports`(operator 아니면 42501). 추천은 본인·양방향 차단·`account_status <> 'ACTIVE'`·성인 인증 없음/만료·`profile_status <> 'active'` 제외. 휴면 enum은 없고 `SUSPENDED`를 휴면·비활성 제외로 사용(주석). `full_name`·이메일·성별·좌표·상대 관심사 전체는 반환하지 않음. 버킷 `chat-media` 비공개, 경로 `{conversation_id}/{object}`. `messages`를 `supabase_realtime`에 추가. 머리 주석에 down SQL·화면 DTO 대응
- [신규] 0. 소스코드/eottae-web/supabase/tests/0003_match_core_test.sql | `0002`의 `login_as` 재사용. 가짜 UUID. 미성인 likes INSERT 거부, 쌍방 yes에 match 1건, `decision=no`는 0건, UNIQUE 중복, 제3자 messages 0건, 차단 후 INSERT 실패, 추천에서 본인·차단·SUSPENDED·미인증·만료 제외, 일반 계정 `list_reports()` 42501, operator는 읽음, 클라이언트 `matches` INSERT 거부, `adult_verified` 직접 UPDATE 거부, anon·JWT 없음 SELECT 0건. plan 90. 실행하지 않음
- [변경] 2. 프로젝트 설계서/API_계약_초안.md | ADR-005 대응표에 `save_onboarding`, `get_recommendations`, `likes` 트리거, `matches`·`match_members`·`conversations`, `messages`+`supabase_realtime`+`chat-media`, `blocks`, `reports`+`list_reports`, `save_answers`·`get_common_answers`·`profile_answers` 이름을 기입
- [보존] `0000`·`0001`·`0002`, `public.users`의 클라이언트 UPDATE(`nickname`, `updated_at`), `package.json`, `FILE_INDEX.csv`, `MANIFEST.sha256`, `.grok-context/`, `CODEOWNERS`, 테스트_케이스_마스터.md
- [미실행] `npx supabase start`, `npx supabase test db`, db push. pgTAP 90건은 파일만 작성했고 실행 결과로 적지 않음
- [변경] PR #66 Grok 리뷰(d2f3703) 반영: `reports`는 authenticated 본인 행 SELECT와 `INSERT ... RETURNING id`를 허용하고 운영 대기열은 `list_reports()`만 유지. `get_common_answers`는 상대 id를 구한 뒤 양방향 차단이면 42501. anon의 `users`·`reports`·`user_roles` SELECT GRANT는 0002처럼 비움(테스트는 0건 대신 42501). pgTAP plan 96. 권장 중 `birth_year` 유지, `chat-media` UPDATE·DELETE, `save_onboarding` 미사용 필드, `decision=no` 후 match 유지, Realtime 소켓 미확인은 남김. 기존 로그 줄은 고치지 않음. 명령·pgTAP·typecheck·build·sha256sum은 실행하지 않음. `FILE_INDEX.csv`·`MANIFEST.sha256`은 수정하지 않음.
- [변경] PR #66 Grok 리뷰(e32e125) 반영: `likes`·`matches`·`match_members`·`conversations` SELECT에 `is_active_adult()`를 넣음. pgTAP에 만료·`SUSPENDED` 구성원의 `matches`·`match_members`·`conversations`·`likes` SELECT 0건을 추가. `chat-media` UPDATE·DELETE는 `owner = auth.uid()`만. API 계약의 신고 문장은 본인 행 SELECT·`INSERT ... RETURNING id`에 맞추고 `GET /match/mutual`은 검증 성인 구성원으로 적음. anon의 0003 테이블 SELECT GRANT를 비워 테스트는 42501. pgTAP plan 115. 권장 중 `birth_year` 유지, `decision=no` 후 match 유지, `get_common_answers` 문항 범위·상대 성인, Realtime `REPLICA IDENTITY`·소켓, `save_onboarding`의 `bio`, CODEOWNERS는 남김. 기존 로그 줄은 고치지 않음. 명령·pgTAP·typecheck·build·sha256sum은 실행하지 않음. `FILE_INDEX.csv`·`MANIFEST.sha256`은 수정하지 않음.
- [변경] PR #66 Grok 리뷰(67ec9ff) 반영: 온보딩 저장은 `save_onboarding`, 조회는 `profiles`·`user_interests`(nickname·updated_at 없음). 추천 JSON은 `user_id`와 서울 기준 `age`만 주고 `birth_year`는 빼며 클라이언트는 `items`·`next_cursor`를 읽음. `record_like_decision`이 본인 `likes` 행을 쓰고 `match_id`·`conversation_id`를 반환. 차단 열은 `blocked_user_id`. 문답 조회는 `profile_answers`, 저장·삭제는 `save_answers`(거절 행은 유지). pgTAP plan 119, `user_id`·`age`(`birth_year` 없음). 권장 반영: `preferred_distance`는 좌표 뒤에 글자가 있어도 거부, 내 MBTI와 같은 `avoid_mbti`는 거부. 보류: `decision=no` 후 match 유지, `save_onboarding`의 `bio` 인자, `get_common_answers` 문항 범위·상대 성인·카탈로그 40, 차단·신고의 `is_active_adult`, 메시지 `soft_delete_state`·사용자 UPDATE·Realtime `REPLICA IDENTITY`·소켓(미확인), `chat-media` `owner_id`(미확인). 이 줄보다 앞의 로그 문장은 고치지 않음. 이 반영에서는 명령·pgTAP·typecheck·build·sha256sum을 실행하지 않음. `FILE_INDEX.csv`·`MANIFEST.sha256`은 수정하지 않음. 테스트_케이스_마스터에는 결과를 쓰지 않음.
- [변경] PR #66 Grok 리뷰(3b8adea) 반영: `blockUser`와 `reportUser`의 `blocks` upsert에 `ignoreDuplicates: true`를 넣어 `ON CONFLICT DO NOTHING`으로 두고 INSERT 권한만 쓴다. `blocks`에 UPDATE 정책은 열지 않음. 권장 반영: `save_onboarding`의 `preferred_distance`는 공백으로 나뉜 숫자 쌍(`37.5 127.0`)도 거부. pgTAP plan 120. 보류: `decision=no` 후 기존 match 유지, 차단·신고 INSERT의 `is_active_adult`, `get_common_answers`의 상대 상태·`matches.status`, `caller_can_use_conversation`의 상대 성인, `CommonQna`의 `get_common_answers` 연결·`save_answers` 카탈로그 40, 메시지 `soft_delete_state`·사용자 UPDATE·Realtime `REPLICA IDENTITY`·소켓(미확인), `chat-media` `owner_id`(미확인), `save_onboarding`의 `bio`와 추천 필터의 `avoid_mbti`·`target_preference`, `reports.description` 빈 문자열, CODEOWNERS. 이 줄보다 앞의 로그 문장은 고치지 않음. 이 반영에서는 명령·pgTAP·typecheck·build·sha256sum을 실행하지 않음. `FILE_INDEX.csv`·`MANIFEST.sha256`은 수정하지 않음.
- [변경] PR #66 Grok 리뷰(bf4a86d) 반영: 문답 조회가 실패하면 `ProfileQna`·`CommonQna`는 `loadedMode`를 비워 저장·삭제를 막는다. 조회가 성공하고 서버 행이 0건인 첫 저장은 그대로다. `save_answers`는 넘긴 문항만 덮어쓰고, 빠진 문항은 지우지 않으며 `removed: true`인 문항만 지운다. `replaceProfileAnswers`는 거절이 아닌 기존 답을 `next`에 없다고 버리지 않는다. pgTAP plan 126(일부 저장·`removed` 단언 추가). 권장 반영: 추천 `age: null` 행은 페이지 전체를 오류로 두지 않고 건너뜀. 신고 `description`이 빈 문자열이면 NULL로 넣음. API 계약의 문답 문장을 이 저장 방식에 맞춤. 보류: `caller_can_use_conversation`·`get_common_answers`의 상대 성인, `decision=no` 후 match 유지, `save_onboarding`의 `bio`와 추천 필터의 `avoid_mbti`·`target_preference`, `CommonQna`의 `get_common_answers` 연결·내가 안 답한 문항 id, 차단·신고 INSERT의 `is_active_adult`(로그인 안전 조치는 유지), 메시지 `soft_delete_state`·사용자 UPDATE·Realtime `REPLICA IDENTITY`·소켓(미확인), `chat-media` `owner`/`owner_id`(미확인), `private.set_updated_at` EXECUTE 회수, CODEOWNERS·매니페스트 재생성. 이 줄보다 앞의 로그 문장은 고치지 않음. 이 반영에서는 명령·pgTAP·typecheck·build·sha256sum을 실행하지 않음. `FILE_INDEX.csv`·`MANIFEST.sha256`은 수정하지 않음.

## 2026-11-02 데이트·소모임 커버 이미지·첨부(데모)·모집 상태 뱃지 — 오하율 피드백 반영 (김민기 작업)
- [요청] 2차 데이트·소모임 데모에 팀 피드백 반영. 코스·소모임 커버가 없어 몰입이 떨어진다는 지적. 만들 때 이미지 첨부, 없으면 카테고리 예시 이미지가 자동으로 붙기. 인원 숫자 텍스트를 정원·빈자리·마감 뱃지로. 정적 export, basePath `/eottae`, 외부 이미지·CDN·API·새 패키지 없음. 서버·Supabase·package.json·매칭·채팅·FILE_INDEX.csv·MANIFEST.sha256는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 activities 화면·types·demo-data·demo-storage·activities.css·globals 테마 토큰·public 경로·브랜드 가이드를 읽고, 분위기 6·소모임 카테고리 5의 자체 SVG와 브라우저 안 첨부·모집 뱃지만 추가
- [신규] public/activities/covers/*.svg | 데이트 분위기 6(잔잔한 카페·활기찬 액티비티·감성·야외 산책·실내 전시·야경)과 소모임 5(취미·밥·운동·스터디·문화). 16:9, 글자 없음, 배경 포함, 실사·실존 상호 없음
- [신규] src/lib/activities/cover.ts | `coverFor`. 안전하지 않거나 비어 있으면 분위기·카테고리 기본 커버. `NEXT_PUBLIC_BASE_PATH` 접두. 첨부 파일은 jpg/png/webp/gif·2MB 이하만 FileReader로 읽어 줄인 data URL
- [신규] src/lib/activities/recruitment.ts | `정원 N명`, `빈자리 N`, 남은 자리 1~2면 `마감 임박`, 정원 도달·마감 시각 지남·모집 종료면 `마감`
- [신규] src/components/activities/ActivityCover.tsx | 목록·상세 커버. 고정 16:9, object-fit cover, loading=lazy, 제목·분위기 또는 카테고리가 들어간 alt
- [신규] src/components/activities/RecruitmentBadges.tsx | 목록 카드·상세의 모집 뱃지. 글자로 상태를 말함
- [변경] src/lib/activities/types.ts | DateCourse·Gathering에 선택 coverImage. Gathering에 recruitmentEndsAt·recruitmentClosed
- [변경] src/lib/activities/demo-data.ts | 코스 8·소모임 10에 기본 커버 경로. 달동네 아침 스트레칭은 지난 마감 시각, 별포 영화 엔딩은 모집 종료 예시
- [변경] src/lib/activities/demo-storage.ts | 만든 모임의 커버 data URL만 유지. 용량 초과·안전하지 않은 커버는 저장 실패로 돌려 기본 커버로 다시 저장. 안내 문구는 sessionStorage
- [변경] src/components/activities/ActivitiesDemo.tsx | 카드 상단 커버. 인원 `n/m명` 문장을 뱃지로 교체. 참가 요청이 정원을 채우거나 마감이면 뱃지와 요청 가능 여부가 같이 바뀜
- [변경] src/components/activities/CourseDetail.tsx | 상세 상단 큰 커버
- [변경] src/components/activities/GatheringDetail.tsx | 상세 상단 큰 커버와 모집 뱃지. 마감이면 새 참가 요청을 막고, 이미 요청한 사람은 취소 가능
- [변경] src/components/activities/ActivitiesNewForm.tsx | 이미지 첨부·미리보기·삭제. 미첨부는 선택 카테고리 기본 커버라는 안내와 「데모: 이 기기에만 저장」. 서버 업로드 없음
- [변경] src/app/activities/activities.css | 커버 비율·뱃지. 색은 기존 테마 토큰만. 첨부·삭제 버튼은 기존 44px 버튼
- [미실행] 브라우저에서 목록·상세·첨부·참가 요청 뱃지 변화, 360px·데스크톱 확인. 이 세션은 파일 읽기·검색·수정만이라 typecheck·build도 실행하지 않음. 코스 만들기 화면은 원래 없어 이미지 첨부는 소모임 만들기 폼에만 둠. 코스 표지는 분위기 기본 커버

## 2026-11-02 데이트·소모임 모임장 관리·후기(데모) (김민기 작업)
- [요청] 2차 P0 남은 모임장 관리·후기를 `/activities` 데모 데이터로 추가. 정적 export, 상태는 기존 `eottae.activities.demo.v1` localStorage. 서버·Supabase·외부 API·package.json·매칭·채팅·청첩장·FILE_INDEX.csv·MANIFEST.sha256는 수정하지 않음. 커버·모집 뱃지 동작은 유지. 명령 실행 없음
- [AI] 로컬 Grok이 단계 범위(2차 P0 모임 관리·후기), 안전·개인정보·연령 정책, 요구사항 ACT-002, DB 논리모델 ACTIVITY_MEMBER.request_state, 기존 activities 타입·데모 저장·모집 뱃지·신고 모달을 읽고 브라우저 안에서만 동작하는 목업을 추가
- [변경] src/lib/activities/types.ts, recruitment.ts | 모임장 재개 시에만 쓰는 `recruitmentForceOpen`. 플래그가 없으면 정원·빈자리·마감 임박·마감 계산은 이전과 같음
- [변경] src/lib/activities/demo-roster.ts, demo-storage.ts | 가상 참가 요청·확정·강퇴·모집 토글과 내 참가 상태(요청됨/수락됨/거절됨), 내 후기를 같은 데모 키에 저장. 예전 참가 요청 기록은 요청됨으로 이어 받음. 만든 모임에 덮어쓴 임시 플래그는 저장하지 않음
- [변경] src/lib/activities/demo-data.ts, reviews.ts | 종료 모임 3개(온기동 식은 차, 파도읍 짧은 방파제, 노을구 짧은 문장 낭독)와 예시 후기. 앞의 둘은 참가 확정 예시, 낭독은 미확정이라 작성 잠금. 노을 스케치만 `viewerIsHost`
- [변경] src/components/activities/GatheringManage.tsx, GatheringReviews.tsx, ActivityReportDialog.tsx, GatheringDetail.tsx, ActivitiesDemo.tsx, activities.css, activities/page.tsx | 내가 만든 모임과 노을 스케치의 관리 탭: 가상 닉네임·한줄 소개·요청 시각, 수락/거절, 확정 인원, 강퇴 확인 모달, 모집 마감/재개. 수락·강퇴가 모집 뱃지에 바로 반영. 그 외 모임은 참가 요청 뒤 「모임장 시점으로 보기」로 수락됨/거절됨 전환. 종료 모임의 후기 탭: 별점 1~5, 한줄 작성·수정·삭제, 목록·평균, 기존 신고 모달 재사용, 욕설·개인정보 주의 한 줄. 동작에는 데모 표시. 색은 기존 테마 토큰
- [미실행] 브라우저에서 관리 탭 수락·거절·강퇴·모집 토글·뱃지 변화, 모임장 시점 전환, 종료 모임 후기 작성·수정·삭제·신고, 미확정 잠금, 360px·6테마 확인. 이 세션은 파일 읽기·검색·수정만이라 typecheck·build도 실행하지 않음
- [변경] PR #72 Grok 리뷰(dd4c513) 반영: 모임장 모임(`viewerIsHost`·내가 만든 모임)은 참가 요청을 열지 않고 상세·목록 뱃지에 `requested`를 넘기지 않는다. `recruitmentView`도 그 요청을 인원에 더하지 않는다. 저장된 `joins`·`requests`는 읽을 때와 저장할 때 뺀다. `joinStatus`가 없으면 `hostLook`을 끄고, 관리 탭이면 안내로 돌린다. 권장 반영: 관리 문구는 수락·강퇴와 이미 인원에 들어간 내 요청의 거절에 맞추고, 수락됨 버튼은 「참가 취소」, 후기 탭은 `ended === true`만, 수락·강퇴 등 데모 저장은 직전 상태를 이어서 쓴다. 735행은 `FILE_INDEX.csv`·`MANIFEST.sha256`를 수정하지 않았다고 적지만, 현재 두 파일에는 GatheringManage·GatheringReviews·ActivityReportDialog·demo-roster·reviews 항목이 있다. 이 반영에서는 그 두 파일을 고치지 않음. 741행대로 typecheck·build는 미실행이고, 이 반영도 typecheck·build·sha256sum·브라우저는 실행하지 않음. 해시가 파일 바이트와 같은지는 미확인. PR 본문은 저장소에 없어 통과 문장은 빼지 못함.

## 2026-11-02 데이트·소모임 더보기 메뉴·신고 사유 확장·추천/좋아요(데모) — 오하율 요청 (김민기 작업)
- [요청] `/activities` 데모에 점 세 개 더보기(신고·내 글 수정/삭제·링크 복사), 신고 문구 「어떤 문제가 있나요?」, 기타 입력(16px·모달 100dvh 스크롤, 전역 확대 금지 없음), 「업데이트가 필요해요」 영업·폐업 확인 요청(localStorage·정보 확인 중·모임장/작성자 확인 완료·수정 예정), 코스·소모임 좋아요·추천과 추천순/좋아요순/최신순. 서버·Supabase·package.json·매칭·채팅·FILE_INDEX.csv·MANIFEST.sha256는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 activities 화면·types·demo-data·demo-storage·기존 `ActivityReportDialog`·매칭 `ReportModal`(재사용하지 않음, 매칭 동작 유지)·activities.css 토큰을 읽고 브라우저 저장만 확장
- [신규] src/components/activities/ActivityMoreMenu.tsx | 직접 그린 세로 점 세 개 SVG, aria-label 「더보기」, 44px. 메뉴는 Enter/Space·Esc·화살표, 바깥 클릭 닫기, 포커스 복귀
- [신규] src/components/activities/ActivityReactions.tsx, InfoChecks.tsx, src/lib/activities/feedback.ts | ♡ 좋아요·엄지 추천, `aria-pressed`. 확인 요청 목록과 상태 문구
- [변경] src/lib/activities/demo-data.ts, types.ts, demo-storage.ts | 코스 8·소모임 13의 데모 좋아요·추천·최신순 시각. 내 반응과 확인 요청은 기존 키 `eottae.activities.demo.v1`
- [변경] src/components/activities/ActivityReportDialog.tsx, DemoDialog.tsx | 기존 사유 뒤에 「업데이트가 필요해요」「기타」. 제목 아래 「어떤 문제가 있나요?」. 기타만 사유 입력 활성(200자·필수). 신고 모달만 `max-height: 100dvh`·내부 스크롤·입력 16px. 매칭 `ReportModal`은 그대로
- [변경] ActivitiesDemo.tsx, CourseDetail.tsx, GatheringDetail.tsx, GatheringManage.tsx, ActivitiesNewForm.tsx, activities.css, activities/page.tsx | 카드·상세 오른쪽 위 더보기. 내 데모 모임만 수정 안내·삭제 확인. 링크 복사는 데모 토스트(가능하면 이 기기 클립보드). 업데이트 신고 문구는 「관리자와 게시 작성자에게 영업·폐업 확인 승인 요청을 보냈어요(데모)」. 상세·카드에 정보 확인 중/확인 완료/수정 예정. 소모임은 관리 탭, 코스는 작성자 시점 토글에서 처리. 목록 정렬 추가. 커버·모집 뱃지·참가·후기·모임장 수락은 유지. 색은 기존 6테마 토큰
- [미실행] 브라우저에서 360px·더보기 키보드·기타 입력 확대·확인 요청·좋아요 정렬, typecheck·build. 이 세션은 파일 읽기·검색·수정만

## 2026-11-02 중간 점검 2차 제출 문서 — 데모 결과 반영 (김민기 작업)
- [요청] 중간 점검 2차 제출 문서를 2026-11-02 작업 결과로 갱신. 강사 안내로 2차는 예시 데이터 데모. 16:08 집계 머지 #64·#65·#69, 같은 집계의 열린 PR #66·#67·#68, 실연동은 최종 전. 코드·`FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않음. 명령 실행 없음. 근거 없는 수치·완료 주장을 넣지 않음
- [AI] 로컬 Grok이 `plan_v3.md`, `중간점검_2차_제출안.md`, `팀원별_추가작업_2차.md`, `실제진행현황_기록부.md`, `실행_결정대기_로그.md`, `captions.csv`, `src/app/activities`·`match`·`invitations`·`settings`, `src/lib/activities/demo-data.ts`(코스 8·소모임 13, 종료 예시 3개 포함), `demo-adult.ts`(공개 빌드 바이패스 꺼짐), `AI_REPORT_LOG.md`, `TEAM_ACTIVITY.md`를 읽고 문서만 고침
- [변경] 4. 프로젝트 결과 보고서/중간점검_2차_제출안.md | 4명 칸을 자기 PR 기준으로 갱신. 김민기 16:08 집계 머지 #64·#69. #66·#67·#68은 그 집계의 열린 PR. 오하율 머지 #65. 주한태·손준혁은 오늘 머지 없음과 최종 전 실연동. `/activities/` 데모 확인 3단계. 결과물 URL `https://sterran123.github.io/eottae/`
- [변경] 1. 프로젝트 계획서/plan_v3.md | 진행 단계의 중간 점검 2차와, 그 문장과 어긋나던 상태·목표·범위·완성 기준·v2→v3·남은 위험의 2차 MVP 문장. 2차 MVP는 데모로 구현. 새 파일 없음
- [변경] 4. 프로젝트 결과 보고서/실제진행현황_기록부.md | 2차 데모 행 추가. 데모는 데모라고 적음. 소모임 화면은 이 브라우저 데모이고 서버 참가는 최종 전
- [변경] 1. 프로젝트 계획서/실행_결정대기_로그.md | DEC-10. 2026-11-02 결정: 2차 제출은 데모(목업) — 강사 안내, 실연동은 최종 전. DEC-09 상태 칸에 모의 결제 #68을 덧붙임
- [변경] 4. 프로젝트 결과 보고서/팀원별_추가작업_2차.md | 최종 제출까지 할 일을 실연동 중심으로 담당자별 체크박스. #65·온보딩·320px 실측은 완료로 유지. db push·pgTAP·BBaton·PayApp 실가입·Realtime·계정 삭제는 미완
- [보존] 소스 코드. `FILE_INDEX.csv`·`MANIFEST.sha256`는 문서 6개의 크기·sha256만 갱신. sha256sum은 실행하지 않음. 커버 절 다음의 모임장 관리·후기 절과 더보기·추천/좋아요 절은 원문으로 이 로그에 있음
- [판단] 2차 제출 범위는 데모. `0003` 파일 머지와 로컬 pgTAP·클라우드 db push를 구분. 공개 Pages에서 매칭 자식이 잠기는 사실(바이패스 없음)을 확인 방법에 적음. 모임장 수락·거절·강퇴와 후기 화면은 저장소의 이 브라우저 데모다. PR #70이 열려 있는지는 이 세션에서 GitHub를 조회하지 않음
- [미실행] 빌드·브라우저·db push·pgTAP·BBaton·PayApp. 이 세션은 파일 읽기·검색·수정만
- [변경] PR #71 Grok 리뷰(a830e72) 반영: `TEAM_ACTIVITY.md` 2026-11-02 16:08 `gh` 집계의 열린 PR #66·#67·#68을 「이번에 만든 것」·「이미 머지」에서 빼고, SQL·시연 화면은 저장소에 있음과 PR 열림을 나눠 적음. 그날 머지는 #64·#65·#69. [보존]은 문서 6개의 크기·sha256 갱신으로 고침. 이 반영에서는 `FILE_INDEX.csv`·`MANIFEST.sha256`를 다시 고치지 않았고 sha256sum·빌드·pgTAP은 실행하지 않음. 권장 중 정원 문장과 #70 분리, 로그인 세션 없는 창, 범위 3번의 데모 잠금·클라우드 RLS 적용 전, MATCH-005·006 미실행 체크만 반영. PR 본문의 typecheck·build 통과 문장은 남김.
- [변경] PR #71 Grok 리뷰(470f0e8) 반영: 커버·이미지 첨부를 (진행 중 — PR #70 등)에서 빼고, 목록·상세 ActivityCover(분위기·카테고리 기본 SVG)와 소모임 만들기 폼만의 이 브라우저 data URL(서버 업로드 없음)로 적음. 카드 뱃지는 「정원 N명」, 모집 중 「빈자리 N」, 남은 자리 1~2면 「마감 임박」, 정원·마감 시각·모집 종료면 「마감」. 모임장이 모집을 다시 열면(`recruitmentForceOpen`) 마감 시각·모집 종료여도 정원이 남으면 「마감」이 아니다. 모임장 수락·거절·강퇴와 후기(별점·한줄)는 GatheringManage.tsx·GatheringReviews.tsx의 이 브라우저 데모다. 예시 소모임은 13개(종료 예시 3개 포함). `plan_v3.md`의 「매칭 진입 전」은 자식 라우트 `DemoEntryGuard`와 `/match` 안내 페이지 게이트 링크이고 `/match` 본문은 열림. 매니페스트 재생성·PR 본문 통과 문장은 명령 실행 불가와 `FILE_INDEX.csv`·`MANIFEST.sha256` 미수정으로 남김. #69 절의 당시 소모임 10개는 고치지 않음.
- [변경] PR #71 Grok 리뷰(3a87ad4) 반영: 제출 문서의 소모임을 예시 코스 8·소모임 13(종료 예시 3개 포함)으로 고치고, 모임장 수락·거절·강퇴와 후기(별점 1~5·한줄)를 GatheringManage.tsx·GatheringReviews.tsx의 이 브라우저 데모로 적음. 서버 참가·실연동은 최종 전. 「src/components/activities에 이 둘은 없음」과 그 화면만 (진행 중 — PR #70 등)으로 둔 문장은 뺌. #69 뱃지·커버 반복은 김민기 #69와 그 이후 데모에만 두고, 오하율 「이번에 만든 것」은 #65만. 커버 절 다음의 모임장 관리·후기 절과 더보기·추천/좋아요 절은 원문으로 되돌림. 새 절의 소모임 10·「이 둘은 없음」·「기존 줄은 고치지 않음」은 그 기록과 현재 demo-data.ts에 맞춤. #69 절의 당시 소모임 10개는 그대로. 권장 반영: `recruitmentForceOpen`이면 마감 시각·모집 종료여도 정원이 남으면 「마감」이 아님. 더보기(ActivityMoreMenu.tsx)·좋아요·추천(ActivityReactions.tsx)은 데모 범위에 한 줄, 서버 완료 아님. 737행에 해당하던 #66·#67·#68은 16:08 집계의 열린 PR로 구분. 남김: sha256sum과 `FILE_INDEX.csv`·`MANIFEST.sha256`(명령 실행 불가, 두 파일 미수정), PR 본문(저장소에 없음).
- [변경] PR #71 Grok 리뷰(06f8ce7) 반영: 오하율 「바뀐 점」은 서비스 계층(키 없음·세션 없음이면 `mode: 'demo'`, localStorage)과 공개 빌드 매칭 자식 잠금(`NEXT_PUBLIC_DEMO_ADULT_BYPASS` 없음, 「본인 확인이 연결되지 않아 열 수 없어요」, 시연 버튼 없음, 성인 검증이 끝난 `live`만 Supabase)을 나눔. 확인 2번의 캡처 10·TC-002는 그때 측정 기록이고, 세션 없는 창의 자식 라우트는 잠금 문구. 확인 3번의 캡처 12·14도 그때 화면 기록이고, 세션 없는 그 자식도 같은 잠금 문구. 권장 반영: `plan_v3.md`·제출안 #65 문장은 서비스 모드. `GatheringManage.tsx`·`GatheringReviews.tsx`는 모임장 수락·거절·강퇴와 후기에만 붙임. 마감 시각은 `recruitmentEndsAt`가 없으면 `startsAtIso`. 분위기 필터는 코스 탭, 카테고리 필터는 소모임 탭. `eottae-web/README.md`의 매칭 데모 화면·PG 미구현 문장을 자식 잠금·청첩장 테마 모의 결제에 맞춤. 남김: PR 본문(저장소에 없음), `FILE_INDEX.csv`·`MANIFEST.sha256`(미수정), sha256sum·빌드 미실행. 기존 로그 줄은 고치지 않음.
- [변경] PR #71 Grok 리뷰(0ef5945) 반영: `eottae-web/README.md` 2행·31행은 로그인 세션 없는 공개 빌드의 매칭 자식이 「본인 확인이 연결되지 않아 열 수 없어요」이고, 세션 조회 실패·미인증은 `gateMessage`, 성인 검증이 끝난 `live` 세션은 자식 경로가 열린다고 나눔. 오하율 「바뀐 점」은 키가 없거나 세션이 없으면 `mode: 'demo'`(localStorage), 세션 없는 공개 빌드는 잠금 문구, `unverified`는 `gateMessage`, 키가 있으면 세션 조회를 하고 프로필·추천·관심 등 실데이터 호출은 `live`만. 권장 반영: `plan_v3.md`·제출안 52행은 `NEXT_PUBLIC_DEMO_ADULT_BYPASS`가 `'1'`이어도 `eottae_demo_adult_v1` 기록(24시간)이 있어야 데모 자식이 열리고, 기록 전에는 시연 단계 화면. 남김: PR 본문(저장소에 없음), `FILE_INDEX.csv`·`MANIFEST.sha256`(미수정), sha256sum·빌드 미실행, `src/app/match/page.tsx`의 「링크를 클릭해 직접 시연」(`src` 미수정). 기존 로그 줄은 고치지 않음.

## 2026-11-03 이슈 #22 채팅·신고/차단 데모 마무리 (김민기 작업)
- [요청] 이슈 #22(손준혁) MATCH-007 1:1 채팅·MATCH-008 신고/차단을 최종 제출 전까지 목업으로만 마무리. 두 탭이 BroadcastChannel(없으면 storage 이벤트)로 메시지를 주고받고 localStorage에 남긴다. 구성원이 아닌 방 id는 「볼 수 없는 대화」(TC-008). 신고는 이 기기 「내 신고 내역」. 차단은 열린 채팅의 보내기 잠금과 상대 메시지 수신 중단(TC-009). 신고 관리 큐는 「관리자 시점으로 보기」가 꺼지면 「일반 계정은 볼 수 없어요」(TC-010). chat·safety DTO를 match 화면 표기(id·nickname·createdAt, 행은 snake_case)에 맞춘다. 서버·Supabase·마이그레이션·Realtime·package.json·FILE_INDEX.csv·MANIFEST.sha256·supabase/·데이트·소모임·청첩장·설정 테마는 건드리지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 `src/lib/chat/`·`src/lib/safety/types.ts`·채팅·신고·차단 컴포넌트·`/match/chat`·`src/lib/match/types.ts`를 읽고, 이미 있던 setTimeout 자동응답·차단 시 보내기 잠금·신고 모달 검증은 유지한 채 없는 데모만 이 브라우저 저장으로 붙임. `/safety` 정책 페이지와 추천 목록 문구는 그대로
- [변경] src/lib/demo/demo-sync.ts, src/lib/chat/demo-store.ts, src/lib/safety/demo-store.ts | 같은 브라우저 탭 알림(localStorage + BroadcastChannel, 저장 실패 시 상태 전달, 없으면 storage 이벤트). 대화 `eottae.chat.demo.v1`, 신고·차단 `eottae.safety.demo.v1`. 방 20·메시지 200·신고 50·차단 100, id 80자. 자동응답은 `autoForActorId`로 그 탭만
- [변경] src/lib/chat/types.ts, demo-data.ts, chat-service.ts, src/lib/safety/types.ts | 화면은 id·nickname·createdAt, 행은 created_at. `toChatMessage`·`toChatMessageFromDemo`·`toReportHistoryItem`·`toBlockView`. 상대는 추천 프로필 바다·가을·하늘·도윤. 데모 나는 `demo_me`. 모르는 방 id는 첫 방으로 내리지 않음. 자동응답 문구 4개는 유지. setTimeout 400ms·1600ms는 chat-service에 그대로
- [변경] src/components/chat/ChatHub.tsx, ChatRoom.tsx, src/components/safety/SafetyDemoPanels.tsx, ReportModal.tsx, BlockConfirmModal.tsx, src/app/match/chat/match-chat.css | 탭 데모 사용자 선택, 새 탭 링크, 「구성원이 아닌 방 열어보기」. 구성원이 아니면 「볼 수 없는 대화」. 보낸 말은 이 기기에 남고 다른 탭에 전달. 차단하면 보내기 비활성·안내·이후 상대 말 숨김. 신고 내역과 관리 큐. 관리자 토글은 이 화면 상태만(새로고침·다른 데모 사용자는 일반 계정). 꺼져 있으면 큐 목록을 그리지 않음. 색은 기존 `--match-*`. 입력 16px·터치 44px. 동작에 데모 표시
- [변경] src/lib/match/match-service.ts | 데모 모드의 추천 카드 신고·차단만 같은 기기 기록에 남김(`demo_me`). live의 reports·blocks 호출은 그대로
- [유지] 보내기 잠금·신고 사유 검증·`/safety` 정책·추천 목록 문구·성인 확인 게이트. 서버 호출·마이그레이션·package.json·FILE_INDEX.csv·MANIFEST.sha256·supabase/·activities·청첩장·설정 테마는 수정하지 않음
- [미실행] typecheck·build·브라우저. 이 세션은 파일 읽기·검색·수정만. 360px·6테마·두 탭 송수신·TC-008·TC-009·TC-010은 화면에서 확인하지 않음
- [변경] PR #77 Grok 리뷰(8fdd980) 반영: `?q=` 질문은 처리한 뒤 주소에서 지우고, 이 탭 사용자가 같은 본문을 이미 저장했으면 다시 보내지 않는다. 데모 사용자를 바꾸면 `q`를 지우고, 그 계정이 구성원이 아닌 `room`·`partner`는 뺀다. `q`만 빠진 주소 갱신은 닫아 둔 방을 다시 열지 않는다. 목록 안 읽음은 마지막으로 본 메시지 다음의 상대 말만 센다. 관리자 시점은 데모 사용자가 바뀌면 끈다. 「이 대화 열기」는 열린 방이 있으면 그 방의 상대 계정이다. 남김: 두 탭 `commit`을 id로 합치기(동시 전송 미확인, 차단 해제가 되살아날 수 있음), `toChatMessage`의 `soft_delete_state`(호출 없음), `match-service.ts`·`demo-sync.ts` 소유 경계. 778행은 `FILE_INDEX.csv`·`MANIFEST.sha256`를 수정하지 않았다고 적지만 현재 두 파일에 채팅 데모 경로가 있다. 779행의 typecheck·build·브라우저 미실행은 그 기록이다. 이 반영에서는 기존 로그 줄과 그 두 파일을 고치지 않았고 해시는 다시 계산하지 않음. typecheck·build·sha256sum·브라우저는 실행하지 않음. PR 본문은 이 작업 트리에서 찾지 못해 통과 문장은 빼지 못함.
- [변경] PR #77 Grok 리뷰(bc9306d) 반영: 「새 탭에서 이 대화 열기」는 마지막으로 연 방 id를 `activeId`와 따로 두고, 닫을 때 지우지 않는다. 주소로 연 방도 같은 id에 남긴다. `counterpartDemoLink`는 그 id가 현재 사용자 구성원이 아니면 무시한다. 권장 반영: 메시지 입력·신고 상세 textarea는 데모 사용자 선택과 같이 16px. 추천 카드 데모 신고 토스트는 이 기기 내역·서버로 보내지 않음·이 기기 차단으로 두고, live 문장은 그대로. 남김: 두 탭 `commit`을 id·차단 쌍으로 합치기(동시 전송 미확인), 차단된 탭 보내기 잠금 또는 차단 문구(TC-009는 차단한 탭 잠금·이후 상대 말 숨김), `demo_me`와 `demo-self`를 잇기, `toChatMessage`의 `soft_delete_state`(호출 없음, 지금 화면은 데모 매퍼). 778·780행은 고치지 않음. `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음. `match-service.ts`·`demo-sync.ts` 소유 경계는 그대로. typecheck·build·sha256sum·브라우저는 실행하지 않음.
- [변경] PR #77 Grok 리뷰(986de1b) 반영: 탈퇴 키에 `eottae.chat.demo.v1`·`eottae.safety.demo.v1`을 넣었다. `resetChatDemo`·`resetSafetyDemo`로 같은 탭 메모리를 비운 뒤 `removeItem`하고, 키가 모두 비면 같은 탭 이벤트를 보낸다. 다른 탭은 그 키의 storage(`newValue === null` 또는 `key === null`)에서 메모리를 비운 뒤 목록을 다시 그린다. 그 이벤트보다 먼저 키가 되살아났으면 다시 지운다. `read()`는 키가 없을 때 메모리를 비우지 않는다. reset 이후 1.7초(보내기 확인 400ms·자동응답 1600ms) 안의 `appendDemoMessage`는 저장하지 않고, 열린 방은 삭제 세대에서 예약 타이머를 끊고 저장된 목록만 다시 그린다. 설정 「이 브라우저에서 지워지는 것」과 `/privacy` 「지워지는 데모 데이터」에 이 기기의 데모 대화·신고·차단을 적었다. 서버 신고를 익명으로 남기는 문장은 목업이 실행하지 않는 안내로 두었다. 권장 반영: `toChatMessage`는 `soft_delete_state === 'deleted'`이면 null. 남김: 두 탭 `commit`을 id·차단 쌍으로 합치기(동시 전송 미확인), 차단된 탭 보내기 잠금(확인 방법·TC-009는 차단한 탭), `demo_me`와 `demo-self`·추천 건너뛰기, 로그에서 빠진 매칭 로그인·CORE-004 절(이 파일에 원문이 없고 기존 줄은 유지), CODEOWNERS. `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음. typecheck·build·sha256sum·브라우저는 실행하지 않음.
- [변경] PR #77 Grok 리뷰(d441e62) 반영: 보이는 저장 메시지가 없으면 목록 미리보기를 예시 문장·안 읽음으로 채우지 않는다. 방을 열 때 미리보기가 아직 없으면 같은 기준으로 계산한다. 키 삭제로 차단 기록이 없어지면 잠금만 풀고 「차단을 해제했어요」는 붙이지 않는다. 설정·`/privacy`에 채팅을 다시 열면 예시 문장만 다시 만들어진다고 적었다. 남김: 두 탭 `commit`을 id·차단 쌍으로 합치기(동시 전송 미확인), 차단된 탭 보내기 잠금(TC-009·확인 방법은 차단한 탭), `demo_me`와 `demo-self`·추천이 safety 저장을 읽지 않음, 로그에서 빠진 매칭 로그인·CORE-004 절(이 파일에 원문이 없고 기존 줄은 유지), PR 본문 통과 문장(이 작업 트리에 없음), CODEOWNERS. `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음. typecheck·build·sha256sum·브라우저는 실행하지 않음.

## 2026-11-03 배포 사이트 매칭 데모 공개 — 목업 단계 예외 (김민기 작업)
- [요청] 3차까지 목업으로 먼저 확인하기로 해서, 배포 사이트에서도 시연용 성인 확인 후 매칭·채팅 데모가 열리게
- [AI] Claude Code가 배포 빌드에서 매칭이 잠기는 원인(`NEXT_PUBLIC_DEMO_ADULT_BYPASS` 미설정, ADR-002 fail-closed)을 찾아 설정 한 줄을 제안, 김민기 승인
- [변경] .github/workflows/deploy-pages.yml(build env에 `NEXT_PUBLIC_DEMO_ADULT_BYPASS: '1'`), 아키텍처_결정기록_ADR.md(ADR-002 예외 한 줄), 실행_결정대기_로그.md(DEC-11)
- [미실행] 배포 후 실제 화면에서 시연 확인 → 매칭 진입 확인은 배포가 끝난 뒤 사람 확인
- [변경] PR #78 리뷰 반영: 시연 확인(`DemoAdultStep`)에 생년월일 입력을 넣어 오늘 기준 만 나이(`fullAge`, 생일 지남)를 `MIN_SIGNUP_AGE`(19)와 비교한다. 미만이면 「만 19세 이상만 이용할 수 있어요」이고 통과시키지 않는다. 미래 날짜·빈 값·이상값은 거부한다. `completeDemoAdult`는 만 19세 이상 나이 인자를 다시 검사할 때만 저장하고, 기록은 시각과 만 19세 이상 확인 플래그만 남긴다(생년월일 원본은 저장하지 않고 확인 후 입력 상태에서 지움). README·`plan_v3.md`·중간점검 제출안 등 「공개 빌드에는 변수가 없다/배포에서는 매칭이 잠긴다」 문장을 DEC-11에 맞췄다(목업 단계 동안 배포에서도 시연 확인 후 열림, 실데이터 단계에서 되돌림). 이 PR이 `FILE_INDEX.csv`·`MANIFEST.sha256`를 재생성했다.

## 2026-11-03 채팅 신고 모달 체크박스 디자인 수정 — 오하율 피드백 (김민기 작업)
- [요청] `/match/chat` 대화방 → 더보기 → 신고하기 `ReportModal`의 사유 radio와 「차단도 함께」 체크박스 디자인이 깨져 보인다는 오하율 피드백. 컨트롤은 20px 안팎, `accent-color`는 테마 토큰, 글자와 한 줄, 줄 터치 44px 이상, 선택·포커스 링이 분명, 글꼴 16px 이상, 6테마·360px에서 깨지지 않게. 신고 저장·차단·내 신고 내역 동작은 유지. 전역 `input`을 고치면 데이트·소모임 신고, 설정, 온보딩 폼이 깨지지 않게 범위를 좁힘. 서버·Supabase·`package.json`·`FILE_INDEX.csv`·`MANIFEST.sha256`·`supabase/`는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 `ReportModal.tsx`, `match-chat.css`의 `.mt-safety-radio`·`.mt-safety-check`, `globals.css`의 `input`·checkbox·radio, `activities.css`의 `.act-choice`(기준 `ActivityReportDialog`), 설정 `.settings-check`·`.theme-choice`·`.settings-phrase`, 온보딩 `.mt-dist-gauge__input`, 인증 `.auth-check`를 검색. `globals.css`에는 `input { width:100%; padding; appearance; height }`가 없고 `input:focus-visible` 포커스 링만 있다. 깨짐은 채팅 모달 전용 규칙이 radio·checkbox의 크기·flex 고정을 안 해서다. radio는 `align-items: flex-start`와 `margin-top: 3px`만, checkbox는 `accent-color`만 있다. 글자는 0.88rem·0.86rem·0.76rem. 글자 span에 `min-width: 0`이 없고 fieldset 기본 `min-inline-size: min-content`라 360px에서 컨트롤과 글자가 한 줄로 붙지 않고 칸 밖으로 나간다. `.act-choice`는 `activities.css`에만 있어 채팅 페이지에서 클래스 이름만 옮기면 스타일이 없다. 같은 배치를 매칭 토큰으로 `match-chat.css`에 둠. 전역 `input` 선택자는 바꾸지 않음
- [변경] src/app/match/chat/match-chat.css | 사유 radio와 차단 checkbox를 `.act-choice`와 같이 한 줄(nowrap·가운데 정렬). 컨트롤 20×20px, `flex: 0 0 20px`, `appearance: auto`, `accent-color: var(--match-accent-deep)`. 줄 `min-height: 44px`, 글자 16px. 선택 시 `--match-accent` 테두리와 `--match-soft` 배경. 포커스는 `--match-focus` 3px. fieldset `min-inline-size: 0`, 글자 `min-width: 0`으로 360px에서 줄바꿈. 열린 모달은 `max-height: calc(100dvh - 24px)`로 스크롤. `ReportModal.tsx`의 제출·차단·초기화는 그대로. 색은 기존 `--match-*`(라이트·cupcake·disney·system 라이트는 피치, dark·cyberpunk·system 다크는 피치 다크)
- [미실행] 브라우저에서 신고 모달 radio·checkbox 정렬, 선택·포커스, 360px, 6테마, 신고 저장·차단·내 신고 내역. 데이트·소모임 신고, 설정 체크·테마, 온보딩 거리 입력의 화면 확인. typecheck·build. 이 세션은 파일 읽기·검색·수정만

## 2026-11-03 데이트·소모임 모달 우상단 X 닫기 버튼 — 오하율 피드백 (김민기 작업)
- [요청] `/activities`(데이트 코스·소모임) 모달 오른쪽 위 「닫기」 글자 버튼을 X 아이콘으로 바꾸라는 오하율 피드백. 머리 닫기만 44×44px 터치, `aria-label`·`title` 「닫기」, 포커스 링, 6테마 토큰, 360px에서 제목과 겹치지 않게. 아래쪽 행동 버튼의 닫기는 문맥상 유지. Esc·바깥 클릭·포커스 복귀·닫을 때 상태 초기화는 그대로. 매칭·채팅·청첩장 등 `/activities` 밖은 바꾸지 않음. 서버·Supabase·`package.json`·`FILE_INDEX.csv`·`MANIFEST.sha256`·`supabase/`는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 `DemoDialog.tsx`(머리 74행), `ActivityReportDialog.tsx`(117행), `ActivitiesDemo.tsx`(907·932·949·960행), `GatheringManage.tsx`(186행), `GatheringReviews.tsx`(167행), `activities.css`, 앱의 기존 X(`aria-label="닫기"`, 매칭 `IconX`·신고 모달 SVG)를 읽음. 모달 `role="dialog"` 머리는 `DemoDialog`의 `act-modal-head` 한 곳뿐. 나머지 「닫기」는 `act-actions` 아래 행동 버튼이거나 토스트. 매칭 `IconX`는 `/activities` 밖이라 재사용하지 않고, 활동용 인라인 SVG X를 `ModalCloseButton`으로 묶음
- [변경] src/components/activities/ModalCloseButton.tsx | 직접 그린 두 선 SVG X(`currentColor`, 20px). 버튼 44×44px, `aria-label="닫기"`, `title="닫기"`
- [변경] src/components/activities/DemoDialog.tsx | 머리 「닫기」 글자를 `ModalCloseButton`으로 교체. Esc·바깥 클릭·포커스 트랩·복귀는 그대로. 이 머리가 신고·수정·삭제·데모 기록 지우기·강퇴 확인·후기 삭제 모달에 공통
- [변경] src/app/activities/activities.css | `.act-modal-close`는 `--paper`·`--ink`·`--line`·`--soft`·`--brand-soft`·`--brand-dark`·`--focus`. 포커스 링 3px. 제목 `min-width: 0`·줄바꿈, 360px에서 두 줄 말줄임. `.act-icon-btn`은 토스트용으로 유지
- [유지] 아래쪽 닫기 글자: `ActivityReportDialog` 「데모로 보내기」 옆, `ActivitiesDemo` 수정 모달 유일한 행동 「닫기」·삭제 「이 브라우저에서 지우기」 옆·데모 기록 지우기 옆, `GatheringManage` 「데모로 강퇴」 옆, `GatheringReviews` 「데모로 삭제」 옆. 토스트 닫기(모달 머리 아님). 매칭·채팅·청첩장
- [미실행] 브라우저에서 머리 X, 360px 제목 겹침, 6테마, 포커스 링, Esc·바깥 클릭·포커스 복귀, 아래쪽 「닫기」 글자 유지. typecheck·build. 이 세션은 파일 읽기·검색·수정만

## 2026-11-03 3차 작업지시서 작성 — 모바일 청첩장 목업 (김민기 작업)
- [요청] 3차(모바일 청첩장) 작업지시서를 만든다. 메인 담당 오하율, 김민기는 총괄 모니터링. 문서·지시문만. 앱 코드·package.json·FILE_INDEX.csv·MANIFEST.sha256·supabase/는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 `요구사항_마스터.md` INV-001~004, `plan_v3.md`, `단계_범위고정_인수조건.md` 3차, `단계별_로드맵_수익화.md`, `안전_개인정보_연령정책.md`, `팀_작업지시서_WBS.md`, `팀원별_인수_계획_정리.md`, `실행_결정대기_로그.md` DEC-10·11, ADR-004, DB 논리모델 INVITATION/RSVP, `API_계약_초안.md`, 기존 `AGENT_*.md`·`RULES.md`, `src/app/invitations/`, `ThemePreviewSection`, `src/lib/demo/demo-themes.ts`, 2차 `src/lib/activities/`(types·demo-data·demo-storage·href), `globals.css` 6테마, `next.config.mjs` 정적 export를 읽고 문서만 씀
- [신규] 1. 프로젝트 계획서/3차_작업지시서.md | 목표·목업 범위, 3차 P0를 화면 기준으로 다시 씀, 화면 경로(문서 근거 / 제안 구분), `src/lib/invitations/` 타입·데모 데이터 첫 PR은 오하율, 사람별 체크박스, 일정은 1·2·3단계만, 이슈 초안 4개
- [신규] 1. 프로젝트 계획서/AI_협업_지시문/AGENT_오하율_INV_EDITOR.md, AGENT_주한태_INV_POLICY.md, AGENT_손준혁_INV_RSVP.md | 기존 AGENT 형식 + 붙여넣기 프롬프트(읽을 파일, 만들 것, 하지 말 것, 목업, PR)
- [변경] 1. 프로젝트 계획서/plan_v3.md | 진행 단계 3차 줄: 작업지시서 작성 — 목업. 최종 제출은 6번으로 옮김. 다른 진행 단계 줄은 유지
- [변경] 1. 프로젝트 계획서/실행_결정대기_로그.md | DEC-12. 2026-11-03 결정: 3차 메인 오하율, 목업, 김민기 총괄 모니터링
- [미실행] 앱 코드 수정, 이슈 생성, typecheck·build·브라우저. 이 세션은 파일 읽기·검색·수정만

## 2026-11-03 전체 디자인·사용성 검토 3차 착수 전 (김민기 작업)
- [요청] 3차 착수 전에 사이트 전체 디자인·사용성·일관성 검토 보고서만 작성. 코드는 고치지 않음. 화면별 좋은 점·개선점(근거 파일:줄, 이유, 고치는 방법, P0/P1/P2, S/M/L, 담당), 공통 패턴 표, 3차 디자인 원칙 5~10줄, 맨 끝 P0·P1 이슈 초안 1~3개. 브라우저를 열 수 없으니 코드·CSS 근거만. DEC-11: 3차까지 목업, 서버·Supabase·새 마이그레이션·Edge Function·외부 API는 범위 밖. 앱 코드(`src/**`)·`package.json`·`FILE_INDEX.csv`·`MANIFEST.sha256`·`supabase/`는 수정하지 않음
- [AI] 로컬 Grok이 브랜드 가이드, `globals.css` 6테마, `layout.tsx`·헤더·내비, 홈, `/match/**`, `/activities/**`, `/invitations/**`, `/settings`, `/auth/**`, `/privacy`, 공통 버튼·모달·뱃지·더보기·X 닫기, `captions.csv`, 접근성·44px·aria 검색 결과를 읽고 보고서만 작성. 브라우저·명령은 실행하지 않음
- [변경] `4. 프로젝트 결과 보고서/전체_디자인_검토_3차전.md` | 화면별 검토, 공통 패턴 표, 청첩장 테마와 6테마를 나누는 3차 원칙, P0·P1 이슈 초안 3개
- [변경] `0. 소스코드/eottae-web/docs/AI_REPORT_LOG.md` | 이 절만 추가. 기존 줄은 유지
- [미실행] 브라우저 실측, 대비 수치 계산, typecheck·build. 앱 코드는 수정하지 않음. `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음
- [변경] PR #83 Grok 리뷰(3346a76) 반영: 추천 신고 대화상자는 데모(이 기기·미전송·이 기기 차단)와 live(안전센터 접수·차단)로 나누고 「관리자가 검토합니다」는 넣지 않음. 권장 반영: `DEMO` 라벨은 `RULES.md:13`을 고치기 전에는 빼지 않고 부가 설명만 한글. captions.csv 준비중은 6·7행(5행은 `/match`). 컵케이크 `#c2578e`는 `layout.tsx:67`과 `theme-toggle.tsx:21`. 원칙 5에 시트 제목 `ThemePreviewSection.tsx:171`과 영수증 `232`행의 PayApp 이름 삭제. 812행의 「FILE_INDEX.csv·MANIFEST.sha256는 수정하지 않았고 해시는 다시 계산하지 않음」은 이 커밋과 다름. 두 파일에 검토 문서 행과 이 로그 해시가 들어 있음. 해시 바이트가 파일과 맞는지는 다시 계산하지 않음. 이 반영에서는 그 두 파일과 기존 로그 줄을 고치지 않음. typecheck·build·sha256sum은 실행하지 않음. PR 본문은 이 작업 트리에 없어 「typecheck·build 통과, sha256sum -c 통과」는 빼지 못함.

## 2026-11-03 INV-001 모바일 청첩장 타입·데이터·스토리지 첫 PR (오하율 작업)
- [요청] 3차(모바일 청첩장) INV-001 메인 담당. 주한태(#85)·손준혁(#86) 작업의 선행 조건인 `src/lib/invitations/`의 타입(`types.ts`), 예시 데이터(`demo-data.ts`), 브라우저 데모 스토리지(`demo-storage.ts`), URL 헬퍼(`href.ts`)를 작성하고 `clear-demo-device.ts`에 청첩장 데모 키를 등록하는 첫 PR.
- [AI] Antigravity가 지시서(`3차_작업지시서.md`, `AGENT_오하율_INV_EDITOR.md`), DB 논리모델(INVITATION, GUEST, RSVP), 2차 활동 데모 패턴(`src/lib/activities/`), `clear-demo-device.ts`, `demo-themes.ts`를 분석. `WeddingPlatform`의 청첩장 데이터 구조(신랑신부, 장소, 일시, 인사말 등)를 참고하여 목업 스토리지/타입을 설계.
- [신규] src/lib/invitations/types.ts | `Invitation`, `Guest`, `Rsvp`, `InvitationStatus`, `InvitationVisibility`, `RsvpResponse`, `InvitationThemeId` 및 타입 가드 정의. 전화번호 없는 개인정보 최소화 준수.
- [신규] src/lib/invitations/demo-data.ts | 예시 청첩장 3건(내 청첩장 2건, 타인 열람용 1건 — DEMO_THEMES 연동), 예시 하객 4건, 예시 RSVP 3건. 실존 인물·실주소 배제(가상 지역 노을구·달동네·한들시 재사용).
- [신규] src/lib/invitations/demo-storage.ts | localStorage 키 `eottae.invitations.demo.v1` 기반 CRUD 및 이벤트 구독. `loadInvitationsDemo`, `saveInvitationsDemo`, `resetInvitationsDemo`, `regenerateSharingToken`(INV-002 연동), `submitRsvp`(INV-003 연동) 헬퍼 제공.
- [신규] src/lib/invitations/href.ts | Next.js 정적 export(`output: 'export'`)를 위한 쿼리 파라미터 기반 라우팅 헬퍼 (`invitationsHref`, `invitationGuestHref`). `view === 'new'`일 때 제안 경로 `/invitations/new/` 반환.
- [변경] src/lib/demo/clear-demo-device.ts | `DEMO_DEVICE_STORAGE_KEYS`에 `INVITATIONS_DEMO_STORAGE_KEY` 추가 및 탈퇴 초기화 이벤트(`DEMO_INVITATIONS_EVENT`) 연동.
- [변경] src/components/settings/DeleteAccountDemo.tsx | 탈퇴 안내 목록에 청첩장·하객·RSVP 삭제 항목 추가.
- [변경] PR #88 AI 코드 리뷰 지적 반영:
  1. `deleteInvitation` 시 해당 청첩장(`invitationId`)의 하객(guests)과 RSVP(rsvps)도 함께 필터링 삭제.
  2. `saveInvitation` 및 `submitRsvp`에서 `isStored*` 유효성 검사 수행 후 실패 시 false 반환. `submitRsvp`는 청첩장 존재·`published`·만료일·게스트 토큰 일치 여부 확인.
  3. `getInvitationByToken`은 `published` 및 만료일(`expiry > now`) 유효한 청첩장만 반환.
  4. `sanitizeGuest`, `sanitizeRsvp` 추가로 허용 필드만 저장 및 길이 한도 적용.
  5. `href.ts` 신규 생성(`/invitations/new/` 라우트 반영).
  6. PR #88 2차 AI 리뷰(db52519) 반영: 실존 인물 배제(팀원 실명 대신 '이서윤과 박하람', '한결과 은우', '김구름과 최별' 가상 이름 및 닉네임 하객 사용, 불규칙 토큰 적용), `INVITATION_STATUSES`에 `'revoked'` 추가 및 만료/폐기 시드 추가, `loadInvitationsDemo` 싱글턴 오염 방지(깊은 복사), `themeId` 타입 좁히기(`InvitationThemeId`).
- [검증] `npm run typecheck` (`tsc --noEmit`) PASS
- [검증] `npm run build` (`next build`, 23개 정적 페이지 export) PASS
- [미구현/보류] UI 화면(목록·에디터·미리보기·공개 뼈대)은 타입 PR 머지 후 후속 작업으로 진행. 서버·Supabase 연동 없음(목업 단계 원칙 준수).

## 2026-11-03 푸터·비활성 버튼·개인정보 표시·3차 문구 정리 — 디자인 검토 #90 (김민기 작업)
- [요청] 이슈 #90 김민기 몫과 `전체_디자인_검토_3차전.md`의 홈·설정 한 줄만. 푸터 수집 단정을 개인정보 안내로 잇는 짧은 문장으로(목업, 시연 입력은 이 브라우저만, 로그인 계정 저장은 단정하지 않음). 전역 `.btn:disabled`의 `opacity: 0.55`를 설정 카드처럼 색·커서로. `/privacy` 카드의 `CORE-004`를 사용자 말로. 홈 카드·설정 앱 정보의 3차 「준비 중」을 「3차 · 데모 미리보기」로 하고, 에디터·공유 링크·RSVP 준비 중 경고는 남김. 청첩장·매칭 추천 신고·로그인 화면·서버·Supabase·`package.json`·`FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 검토 문서 259-267·319-334행, `site-footer.tsx`, `globals.css`의 `.btn:disabled`·`.settings-card .btn:disabled`·6테마 `--muted`/`--line`/`--ink`, `privacy/page.tsx`, `page.tsx` 홈 카드, `settings/page.tsx` 앱 정보를 읽음. `.btn`과 `disabled`를 같이 쓰는 화면을 검색함. 설정 계정 카드의 비활성(성인 확인 초기화, 탈퇴 확인 전 삭제)은 이미 `.settings-card` 안이라 전역과 같은 색·커서. 활동 `.act-page button:disabled`는 `opacity: 0.6`이라 전역보다 구체적이어서 활동 비활성 `.btn` 모습은 그대로. 로그인·가입·완료의 `.auth-submit:disabled`도 `auth.css`에서 `opacity: 0.6`이라 제출 버튼 투명도는 그대로(로그인 파일은 수정하지 않음). 가입 메일 재발송 `.btn.outline`만 전역 규칙을 그대로 탐. 채팅·문답·추천 비활성은 `.btn`이 아니라 각 모듈 클래스. `aria-disabled`를 붙인 화면은 없음
- [변경] src/components/shared/site-footer.tsx, globals.css `.footer-bottom a` | 「실제 회원 데이터는 수집하지 않습니다」를 「시연용 예시 데이터로 동작해요. 시연 입력은 이 브라우저에만 남아요 · 개인정보 안내」로. 링크는 `/privacy/`. 글자색은 `--ink`, 밑줄, 호버 `--brand`. 로그인 계정의 서버 저장은 적지 않음. `/privacy` 본문의 서버 문장은 그대로
- [변경] src/app/globals.css `.btn:disabled`·`.btn[aria-disabled='true']` | `opacity: 0.55`를 `opacity: 1`로. 비활성은 `color: var(--muted)`, `border-color: var(--line)`, 점선 테두리, `cursor: not-allowed`, `background: transparent`. 설정 카드 예외 주석을 전역 규칙으로 올리고, 설정 쪽은 같은 토큰을 반복
- [변경] src/app/privacy/page.tsx | 개인정보 카드 칩 `CORE-004`를 「회원 탈퇴·데이터 삭제」
- [변경] src/app/page.tsx, src/app/settings/page.tsx | 홈 카드 태그를 「3차 · 데모 미리보기」. 설명에 테마 미리보기와 「에디터·공유 링크·RSVP는 아직 준비 중이에요」. 설정 앱 정보 3차 값을 「3차 · 데모 미리보기. 청첩장 에디터·공유 링크·RSVP는 아직 준비 중이에요.」 카드 버튼 「서비스 소개 보기」와 청첩장 히어로 「3차 MVP · 준비 중」은 그대로
- [미실행] 브라우저에서 푸터 링크·6테마 비활성 버튼 대비·360px, typecheck·build. 이 세션은 파일 읽기·검색·수정만. `auth.css`·`activities.css`의 별도 opacity, 청첩장·추천 신고·로그인 화면, 서버·Supabase, `package.json`, `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음
- [변경] PR #91 Grok 리뷰(542e9b8) 반영: 푸터를 「시연에서 입력한 내용은 이 브라우저에 남아요. 계정 저장 범위는 개인정보 안내를 봐 주세요.」로 바꿈. 두 번째 문장만 `/privacy/` 링크(`site-footer.tsx`). 권장 반영: `.footer-bottom a`에 `min-height: 44px`·`inline-flex`·세로 가운데(`globals.css`). 보류: `auth.css` `.auth-submit:disabled`와 `activities.css` `.act-page button:disabled`의 opacity(로그인·활동 파일은 이 작업에서 열지 않음. 전역 `.btn:disabled`는 유지). 824·830행은 그대로 둠. `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음. typecheck·build·sha256sum·브라우저 확인은 실행하지 않음. PR 본문은 이 작업 트리에 없어 고치지 않음.

## 2026-11-04 3차 청첩장 미리보기 블록·샘플 페이지(목업) — 오하율 #84 지원 (김민기 작업)
- [요청] 오하율 #84 모바일 청첩장에 붙일 미리보기 블록과 샘플 페이지를 목업으로 만든다. 참고 서비스의 위→아래 구조와 좁은 세로 톤만 보고, 디자인·문구·이미지는 복제하지 않는다. 파일은 `src/components/invitations/preview/`와 샘플 라우트·자체 SVG만 새로 두고, `Invitation` 타입은 #88 것을 그대로 쓴다. 타입에 없는 이야기·Q&A·예식 순서·안내 탭·가상 계좌·방명록은 `sample-content.ts`에만 둔다. `/invitations/`에는 샘플로 가는 링크 한 줄만 추가한다. 오하율이 다시 만드는 에디터·카드 렌더러·미리보기 모달·허브·`p/`·`new/`·`invitations.css`, `src/lib/invitations/*`, 서버·Supabase·외부 API·지도 SDK·폰트 CDN, `package.json`, `FILE_INDEX.csv`, `MANIFEST.sha256`, `supabase/`는 수정하지 않는다. 명령 실행 없음
- [AI] 로컬 Grok이 `src/lib/invitations/`(types·demo-data·href), `src/app/invitations/page.tsx`, `ThemePreviewSection.tsx`, `src/lib/demo/demo-themes.ts`, `globals.css` 토큰, `3차_작업지시서.md`, `전체_디자인_검토_3차전.md`의 `--invite-*` 원칙, `public/activities/covers/`·`ActivityCover`의 자체 SVG 방식을 읽고, 예시 청첩장 `demo-inv-1`(이서윤·박하람, 노을구 달빛웨딩홀)로 틀만 새로 그렸다. 페이지시스터즈 샘플은 구조·톤만 참고했고, 디자인·문구·이미지는 쓰지 않았다. 상표·실사·실은행·실계좌·지도 API·카카오 SDK·`.ics` 다운로드는 넣지 않았다
- [신규] `public/invitations/*.svg` | 표지·장면 9·가상 지도. 글자 없는 일러스트. 실존 인물 사진 없음
- [신규] `src/components/invitations/preview/` | `InvitePhoneFrame`(최대 430px), `InvitePreview`(Invitation + 프리셋), `invite-preview.css`(`--invite-*`, themeId 4종: 봄꽃 카드=블러시, 달빛 정원=세이지, 한지 결=크림, 별밤 식탁=잉크). 섹션은 표지·인사말(`InviteCover`), 갤러리(`InviteGallery`), 달력(`InviteCalendar`), 이야기·Q&A·예식 순서(`InviteNarrative`), 장소·안내 탭(`InvitePlace`), 참석·마음 전하기·방명록·공유(`InviteClosing`). 프리셋은 풀세트 / 심플(표지·인사말·달력·장소·참석·마음 전하기) / 사진 많이(갤러리 3곳). 혼주 표기는 예시 콘텐츠의 선택 필드. 갤러리는 가로 스냅·좌우 화살표·크게 보기(Esc·X). 달력은 `role="grid"`, 예식일 원+시간, D-day, 저장은 안내만. 안내 탭은 `role="tablist"`와 화살표 키. Q&A는 `<details>`. RSVP 버튼은 「RSVP는 준비 중(데모)」만. 계좌는 예시은행 `123-****-5678` 형식의 가상 번호와 복사. 공유 링크는 `invitationGuestHref`에 `NEXT_PUBLIC_BASE_PATH`를 붙임. 카카오톡·지도 앱·캘린더 파일은 안내만. 스크롤 페이드는 기존 `[data-reveal]`을 틀 안에서는 투명도만 쓰고, `prefers-reduced-motion`이면 끈다. 틀 안 본문 16px, 버튼 44px, 포커스 링은 `--invite-focus` 3px
- [신규] `src/app/invitations/sample/page.tsx`, `InviteSampleStudio.tsx` | 데모 청첩장 1장. 위에 「데모 · 예시 데이터」, 구성 프리셋 3개·청첩장 테마 4개 라디오. 틀 밖만 앱 테마
- [변경] `src/app/invitations/page.tsx` | `ThemePreviewSection` 아래에 샘플 미리보기 링크 한 줄. 모의 결제·나머지 문구는 그대로
- [미실행] 브라우저에서 프리셋·테마·360px 넘침·갤러리·탭·Q&A 키보드·복사·토스트 확인. typecheck·build. 이 세션은 파일 읽기·검색·수정만. 방명록은 이 화면 메모리만이라 `clear-demo-device` 키에 없음. `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음
- [변경] PR #93 화면 확인 반영: 전역 data-reveal 숨김으로 미리보기가 비어 보이던 문제 — 전용 속성·기본 표시·1.5초 안전장치
- [변경] PR #93 화면 확인 반영 2: 이미지 width/height 속성 때문에 세로로 늘어나던 커버·갤러리·이야기 사진 비율 고정

## 2026-11-04 테마 모의 결제 시트 X 닫기·문구 (김민기 작업)
- [요청] 이슈 #87(INV-004) 테마 모의 결제. 결제 시트 머리에 2차와 같은 X 닫기(44×44px, `aria-label="닫기"`, Esc·바깥 클릭·포커스 복귀). 시트 제목·영수증에서 결제 대행사 이름을 빼고 「모의 결제(데모)」. 테스트 결제→승인→즉시 취소, 카드번호 없음, 실제 청구 없음, 영수증 localStorage, 예시 금액은 유지. 저장 키 `eottae_demo_theme_purchases_v1`이 `eottae.invitations.demo.v1`와 섞이지 않는지 확인. 6테마·360px·44px·포커스 링. 목업(DEC-11). 서버·Supabase·외부 결제·`package.json`·`FILE_INDEX.csv`·`MANIFEST.sha256`·`supabase/` 금지. `src/app/invitations/page.tsx`, `src/app/invitations/**`, `src/components/invitations/preview/**`, 에디터·카드 렌더러·미리보기 모달·허브, `src/lib/invitations/**`는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 `ThemePreviewSection.tsx`, `demo-flow.css`, `DemoSheet.tsx`, `demo-themes.ts`, `clear-demo-device.ts`, `src/lib/invitations/demo-storage.ts`, `전체_디자인_검토_3차전.md` 218-223·296·320행, 활동 `ModalCloseButton.tsx`·`DemoDialog.tsx`·`activities.css` 649-674행을 읽음. 공통 X는 `ModalCloseButton`(두 줄 SVG, `aria-label="닫기"`). 그 클래스 스타일은 `activities.css`에만 있고 `/activities`에서만 불러 청첩장 시트에 같은 규칙을 `demo-flow.css`에 다시 둠. 성인 확인 시트(`MatchDemoEntry`)는 아래 글자 「닫기」를 유지
- [변경] `src/components/invitations/ThemePreviewSection.tsx` | 시트 제목 「모의 결제(데모) · 실제 청구 없음」. 영수증 「모의 결제(데모)이며 실제 청구는 없습니다」. 머리에 `ModalCloseButton`. 카드 버튼 「테스트 결제」, 단계 결제→승인→즉시 취소, 카드번호 없음, 예시 금액(3,900·5,900·7,900·9,900원), 이 브라우저 영수증은 그대로
- [변경] `src/components/demo/DemoSheet.tsx` | 결제 시트만 `headClose`. 네이티브 `dialog`의 Esc(`cancel`)·`showModal` 유지. 시트 밖 클릭으로 닫음. 열릴 때 연 버튼에 포커스를 되돌림. 성인 확인 시트의 아래 글자 닫기는 유지하고 클래스 이름만 `demo-flow-text-close`(icon 제거)
- [변경] `src/components/demo/demo-flow.css` | X는 44×44px, 모서리 12px, 포커스 링 3px `var(--focus)` offset 2px. 색은 `--paper`·`--ink`·`--line`·`--soft`·`--brand-soft`·`--brand-dark`만. 결제 카드 너비는 `min(32rem, calc(100% - 24px))`라 360px에서 화면 안쪽. 제목은 `min-width: 0`과 줄바꿈
- [확인함] 저장 키는 서로 다른 문자열이고 읽고 쓰는 파일도 다름. `src/lib/demo/demo-themes.ts:4` `eottae_demo_theme_purchases_v1`(같은 파일 82·102행). `src/lib/invitations/demo-storage.ts:9` `eottae.invitations.demo.v1`. `src/lib/demo/clear-demo-device.ts:18`과 `:26`에 두 키가 따로 있고 지운 뒤 이벤트도 `DEMO_THEME_EVENT`·`DEMO_INVITATIONS_EVENT`로 갈림. 코드는 바꾸지 않음
- [미실행] 브라우저에서 X·Esc·바깥 클릭·포커스 복귀·6테마·360px, typecheck·build. 이 세션은 파일 읽기·검색·수정만. 서버·Supabase·외부 결제 호출 없음. `package.json`·`FILE_INDEX.csv`·`MANIFEST.sha256`·`supabase/`는 수정하지 않았고 해시는 다시 계산하지 않음. 이슈의 PR 리뷰·머지·카톡 공유·환불/정산 법무는 이번 범위가 아님
- [변경] PR #94 Grok 리뷰(2a1cc70) 반영: 결제 시트 `.demo-flow-sheet.demo-flow-sheet-light`의 `display: flex`는 `[open]`에만 둔다. 닫힌 `<dialog>`는 사용자 에이전트 `display: none`을 유지한다. `ThemePreviewSection` 효과는 `dialog`가 이미 `open`일 때만 `.act-modal-close`로 포커스를 옮긴다. `phase === 'review'`는 그 효과가 빠진다. 같은 파일의 다른 `display: flex`는 버튼·행이라 그대로 둠. 성인 시트(`MatchDemoEntry`)는 `demo-flow-sheet-light`가 아니라 고치지 않음. 867행 「열릴 때 연 버튼에 포커스를 되돌림」은 기존 줄이라 그대로 둠. 연 버튼 복귀는 `DemoSheet` effect cleanup의 `previous.focus()`이고, 열릴 때 `DemoSheet`는 `.act-modal-close`로 포커스를 옮긴다. 870행도 그대로. 이 반영에서도 `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음. typecheck·build·sha256sum·브라우저는 실행하지 않음.

## 2026-11-04 이슈 #90 추천 신고·로그인 설명·개인정보 문장 (김민기 작업)
- [요청] 이슈 #90 남은 세 항목(원래 오하율·주한태, 3차로 김민기가 맡음). 추천 신고 대화상자만 모드별 문구(데모: 이 기기 내역·서버 미전송·이 기기 차단 / live: 안전센터 접수·차단. 「관리자가 검토합니다」 없음. 동작은 유지). 로그인 카드 설명을 Google 「준비 중」과 이메일 가입·데모 로그인 실제 동작에 맞춤. 개인정보 페이지의 로그인 계정 서버 저장 문장은 배포 빌드에 Supabase 공개 키가 들어가 실제 가입·로그인이 될 때만 계정(Supabase)과 시연 데이터(이 브라우저)를 구분해 고치고, 확인이 안 되면 단정하지 않고 「(확인 필요)」. 목업(DEC-11). 서버·Supabase 호출 추가, 외부 결제·API, `package.json`, `FILE_INDEX.csv`, `MANIFEST.sha256`, `supabase/`, 청첩장 화면·`src/lib/invitations/**`는 수정하지 않음. 명령 실행 없음
- [AI] 로컬 Grok이 `전체_디자인_검토_3차전.md` 114-127·239-244·255-264·325-334행, `RecommendList.tsx` 신고 대화상자·`confirmReport`, `match-service.ts` `resolveAccessContext`·`reportUser`, `auth/login/page.tsx`, `SocialLoginButtons.tsx`, `LoginForm.tsx`, `SignupForm.tsx`, `lib/auth/config.ts`(`OAUTH_PROVIDERS_ENABLED.google === false`), `lib/auth/auth-service.ts`의 `signUpWithEmail`·`signInWithEmail`·`signInWithOAuth`, `lib/supabase/client.ts`의 `isSupabaseConfigured`, `.github/workflows/deploy-pages.yml` 44-51행, `clear-demo-device.ts`의 데모 키, ADR-005, `실제진행현황_기록부.md`의 db push 문장을 읽음
- [변경] `src/components/match/RecommendList.tsx` | 신고 대화상자 본문만. `isDemoMode`이면 「이 기기의 내 신고 내역에 남고, 서버로는 보내지 않아요. 상대는 이 기기에서 차단해요.」 아니면 「안전센터에 접수되고, 상대는 차단됩니다.」 `reportUser`·`alsoBlock: true`·토스트·Esc·탭 가두기는 그대로. 「관리자가 검토합니다」는 없음
- [변경] `src/app/auth/login/page.tsx`, `src/components/auth/SocialLoginButtons.tsx` | 카드 설명은 빌드 시점 `isSupabaseConfigured`와 `OAUTH_PROVIDERS_ENABLED.google`을 따른다. 지금 소스는 Google이 꺼져 있어 「Google 로그인은 준비 중이에요.」 이메일 가입·로그인은 키가 있을 때만 「이메일로 로그인해 주세요. 계정이 없으면 이메일 인증으로 가입할 수 있어요.」 키가 없으면 「인증 설정 전에는 쓸 수 없어요.」 데모는 「서버에 접속하지 않고, 이 브라우저에만 남아요.」 버튼의 「준비 중」 배지·비활성은 유지. 같은 안내 문단은 가입 화면의 소셜 버튼에도 쓰인다
- [변경] `src/app/privacy/page.tsx` | 히어로·수집 카드·메타의 「성인 확인이 끝난 계정의 프로필·취향·매칭·대화는 서버에 저장」을 빼었다. 시연용 매칭·채팅·데이트·청첩장 데이터는 이 브라우저에만 저장된다고 적고, 로그인 계정(이메일 등)의 서버(Supabase) 저장은 「(확인 필요)」. 탈퇴 버튼이 서버 탈퇴를 요청하지 않는다는 문장과 신고 보존 안내는 그대로
- [근거] 워크플로 `.github/workflows/deploy-pages.yml` 46-49행은 빌드 env에 `secrets.NEXT_PUBLIC_SUPABASE_URL`·`secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY`를 넣는다. 주석은 시크릿이 비면 빈 문자열이고 화면은 데모 모드라고 한다. `src/lib/supabase/client.ts`는 URL이 http(s)로 유효하고 anon 키가 비어 있지 않으며 `REPLACE_ME`가 아닐 때만 `isSupabaseConfigured`. 그때 `auth-service.ts`의 `signUpWithEmail`·`signInWithEmail`이 `supabase.auth`를 호출하고, 아니면 `NOT_CONFIGURED`로 막는다. 시연 데이터 키는 `src/lib/demo/clear-demo-device.ts`의 `eottae_demo_match_likes_v1`·`eottae_demo_matches_v1`·온보딩·문답 초안, `eottae.chat.demo.v1`, `eottae.activities.demo.v1`, `eottae.invitations.demo.v1`·`eottae_demo_theme_purchases_v1`(이 브라우저). 키 값 자체는 저장소에 없다. 2026-10-27 로그의 `gh secret list` 2건·`/auth/v1/settings` 200은 그 날짜 기록이고, 같은 절이 배포 번들 반영 확인을 뒤로 미뤘다. `4. 프로젝트 결과 보고서/실제진행현황_기록부.md`는 클라우드 db push 기록이 아직이라고 한다. `signInWithEmail`은 `public.users`를 읽는다. 이 세션은 명령을 실행하지 않아 지금 Pages 번들에 공개 키가 들어갔는지, 가입·로그인이 되는지는 확인하지 못했다. 그래서 서버 저장을 단정하지 않고 「(확인 필요)」로 두었다
- [미실행] 브라우저에서 신고 대화상자·로그인 카드·개인정보 문장, typecheck·build. 이 세션은 파일 읽기·검색·수정만. 서버·Supabase 호출을 추가하지 않음. `package.json`·`FILE_INDEX.csv`·`MANIFEST.sha256`·`supabase/`·청첩장 경로는 수정하지 않았고 해시는 다시 계산하지 않음
- [변경] PR #96 Grok 리뷰(e63ec68) 반영: `src/app/privacy/page.tsx` 메타·히어로·수집 카드 제목·본문에서 「(확인 필요)」를 빼고 빌드 시점 `isSupabaseConfigured`로 나눔. 키가 있으면 이메일 가입 계정(이메일·이름·출생 연도)과 성인 확인이 끝난 계정의 프로필·취향·관심·신고·차단만 서버(Supabase) 저장으로 적음. 생년월일 원본·대화 본문은 서버 저장으로 적지 않음. 키가 없으면 이메일 가입·로그인을 하지 않아 서버 계정을 만들지 않는다고 적음. 시연용 매칭·채팅·데이트·청첩장은 이 브라우저 문장을 유지. 권장 반영: `login/page.tsx`의 Google 가능 문장은 `OAUTH_PROVIDERS_ENABLED.google`과 `isSupabaseConfigured`가 함께 참일 때만 둠(지금 Google은 꺼져 있어 「준비 중」 문장은 그대로). `signup/page.tsx` 메타·카드는 키가 없으면 이메일 가입 불가, Google은 준비 중(플래그가 켜지고 키가 있을 때만 가입 가능 문장). 만 19세 문장은 유지. 보류: 876·882행은 기존 줄이라 고치지 않음. 해시가 파일 바이트와 같은지는 이 세션에서 다시 계산하지 않아 통과 문장을 넣지 않음. `RecommendList.tsx` 문구는 그대로. 이 반영에서도 `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음. typecheck·build·sha256sum·브라우저는 실행하지 않음.
- [변경] PR #96 Grok 리뷰(9b8b8e2) 반영: `src/app/privacy/page.tsx`에서 키가 있을 때의 계정 문장·수집 카드 제목을 저장 단정에서 되돌림. 이메일·이름·생년월일을 인증 서버로 보낸다고만 적고, 서버가 출생 연도만 남기는지와 성인 확인 뒤 프로필·취향·관심·신고·차단이 저장되는지는 이 안내에서 확인하지 못한다고 적음. 「(확인 필요)」. 수집 카드 제목은 「데모는 이 기기, 서버 저장은 확인 필요」. 메타·히어로·수집 카드 본문은 같은 `accountSentence`. 키가 없을 때의 「계정을 서버에 만들지 않아요」와 시연용 매칭·채팅·데이트·청첩장의 이 브라우저 문장·탈퇴가 서버 탈퇴를 요청하지 않는다는 문장은 유지. 대화 본문·`matches`·`conversations`는 서버 저장으로 다시 적지 않음. 권장 반영: `signup/page.tsx`에서 Google 플래그가 꺼진 카드 문구만 「Google 가입은 준비 중이에요.」 로그인 카드·`SocialLoginButtons`의 「Google 로그인」과 키가 없을 때의 이메일 가입 불가·만 19세 문장은 그대로. 보류: PR 본문은 이 작업 트리에 없어 고치지 않음. 883행은 기존 줄이라 고치지 않음. `FILE_INDEX.csv`·`MANIFEST.sha256`는 수정하지 않았고 해시는 다시 계산하지 않음. typecheck·build·sha256sum·브라우저는 실행하지 않음.
