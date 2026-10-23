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
