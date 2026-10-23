# 「어때?」 프로젝트 패키지 검증 보고서
검증 기준: 2026-10-23 / 검증 대상: 제출패키지 **기획·설계·기본 소스** (실제 동작하는 매칭 MVP 완성품 아님)

## 자동 체크 결과
- PASS: 60 / 전체 60개
- FAIL: 0개

- PASS — 제출 폴더: 0. 소스코드
- PASS — 제출 폴더: 1. 프로젝트 계획서
- PASS — 제출 폴더: 2. 프로젝트 설계서
- PASS — 제출 폴더: 3. 구현 이미지(5장이상)
- PASS — 제출 폴더: 4. 프로젝트 결과 보고서
- PASS — 제출 폴더: 5. 발표자료(PDF)
- PASS — 필수 파일: README_처음읽기.md
- PASS — 필수 파일: 1. 프로젝트 계획서/단계_범위고정_인수조건.md
- PASS — 필수 파일: 1. 프로젝트 계획서/브랜드_가이드.md
- PASS — 필수 파일: 1. 프로젝트 계획서/팀_작업지시서_WBS.md
- PASS — 필수 파일: 1. 프로젝트 계획서/AI_협업_지시문/RULES.md
- PASS — 필수 파일: 1. 프로젝트 계획서/AI_협업_지시문/SKILL.md
- PASS — 필수 파일: 1. 프로젝트 계획서/AI_협업_지시문/MCP_SETUP_검증.md
- PASS — 필수 파일: 2. 프로젝트 설계서/요구사항_마스터.md
- PASS — 필수 파일: 2. 프로젝트 설계서/DB_논리모델_전체3단계.md
- PASS — 필수 파일: 2. 프로젝트 설계서/API_계약_초안.md
- PASS — 필수 파일: 2. 프로젝트 설계서/테스트_케이스_마스터.md
- PASS — 필수 파일: 0. 소스코드/eottae-web/src/app/page.tsx
- PASS — 필수 파일: 0. 소스코드/eottae-web/public/eottae-logo-light.png
- PASS — 필수 파일: 0. 소스코드/eottae-web/public/eottae-logo-dark.png
- PASS — 브랜드 원본 동일성 어때_로고_라이트_원본.png
- PASS — 로고 PNG 식별 가능 어때_로고_라이트_원본.png
- PASS — 브랜드 원본 동일성 어때_로고_다크_원본.png
- PASS — 로고 PNG 식별 가능 어때_로고_다크_원본.png
- PASS — 통합 메뉴 ① 매칭
- PASS — 통합 메뉴 ② 데이트·소모임
- PASS — 통합 메뉴 ③ 모바일 청첩장
- PASS — 마스터 추적 MATCH-004
- PASS — 마스터 추적 ACT-003
- PASS — 마스터 추적 INV-003
- PASS — 마스터 추적 SEC-001
- PASS — 마스터 추적 김민기
- PASS — 마스터 추적 오하율
- PASS — 마스터 추적 주한태
- PASS — 마스터 추적 손준혁
- PASS — Excel ZIP/OXML: 어때_팀_WBS_요구사항_테스트_제출체크_통합관리.xlsx
- PASS — PDF 페이지 및 추출 어때_팀프로젝트_기획발표_초안.pdf
- PASS — Excel ZIP/OXML: 어때_팀프로젝트_계획서_양식작성본.xlsx
- PASS — Excel ZIP/OXML: 프로젝트 계획서 결과보고서_동일본_첨부.xlsx
- PASS — Excel ZIP/OXML: 제출물 예시_샘플.xlsx
- PASS — Excel ZIP/OXML: 프로젝트 계획서 결과보고서.xlsx
- PASS — Excel ZIP/OXML: 00_제출물_통합본_타프로젝트_샘플.xlsx
- PASS — Excel ZIP/OXML: 개인 프로젝트 결과 보고서.xlsx
- PASS — Excel ZIP/OXML: 어때_유스케이스_양식작성본.xlsx
- PASS — Excel ZIP/OXML: 어때_요구사항일람_양식작성본.xlsx
- PASS — Excel ZIP/OXML: 어때_요구사항정의서_양식작성본.xlsx
- PASS — Excel ZIP/OXML: 어때_시스템구성도_양식작성본.xlsx
- PASS — Excel ZIP/OXML: 어때_ER다이어그램_양식작성본.xlsx
- PASS — Excel ZIP/OXML: 어때_테이블정의서_양식작성본.xlsx
- PASS — Excel ZIP/OXML: 테이블정의서.xlsx
- PASS — Excel ZIP/OXML: ER다이어그램.xlsx
- PASS — Excel ZIP/OXML: 요구사항정의서.xlsx
- PASS — Excel ZIP/OXML: 시스템구성도.xlsx
- PASS — Excel ZIP/OXML: 유스케이스.xlsx
- PASS — Excel ZIP/OXML: 요구사항일람.xlsx
- PASS — 구 서비스 표현 없음 MOMENTLINK
- PASS — 구 서비스 표현 없음 모먼트링크
- PASS — 구 서비스 표현 없음 ③ 기억
- PASS — 구 서비스 표현 없음 ② 함께
- PASS — TypeScript/TSX 파서 문법 오류 없음

## 실행·검증의 한계(매우 중요)
- **실제 매칭/성인 인증/로그인/채팅/신고/결제/서버 권한 테스트: 미구현·미실행**. 완료/통과로 표기하지 않음.
- **Next.js 의존성 설치 및 실빌드: 미실행**. `tsc --noEmit`은 현재 node_modules가 없어 Next·React 타입 선언 미탐지로 실패. 이 실패는 소스 문법 검증의 실패를 뜻하지 않으며 빌드 성공도 아님.
- **전역 TypeScript 파서 기반 TS/TSX 구문 검사: PASS**; 의존성/런타임/앱 작동을 확인한 것은 아님.
- **정식 PWA 앱 아이콘/서비스워커/푸시: 미구현**(manifest 계획 및 원본 로고만 포함).
- **구현 이미지 5장: 현재 0장(정상)**. 실제 개발 후 제출해야 하며 콘셉트/AI 이미지를 실행 스크린샷이라 주장하지 않는다.
- **PDF는 '기획 발표 초안' 9페이지**. 실제 서비스 결과 발표 자료가 아님.
- **다크 로고 원본은 불투명 검정 배경**으로 확인. 더 어두운 파스텔 조정은 BRAND-004 미완료.
- **검증된 성인 19+ 제한**을 1차 필수 기준으로 설정. 인증 공급자·운영/법률 검토 전 실사용 공개 금지.
- **업로드 원본 제출 양식** 일부에는 이전 쇼핑몰/포트폴리오/타 프로젝트 샘플이 들어 있으며 `양식원본`에만 보존. `양식작성본`을 기준으로 사용.
- **12주 일정/가격은 가설**. 실제 발표일·과정명·강사·배포 환경·운영비 미확정.

## 패키지 승인 판정
기획·설계·AI 코딩 지시서·팀분담·사용자 제공 로고·서식 작성본 묶음으로 사용 가능: **PASS**.
실제 서비스 공개/최종 과제 제출 완료 판정: **아님**. 이후 기능 구현, 실행 증빙, 보안 점검 및 5장 이상의 진짜 구현 화면이 필요.

## 후속 갱신 (2026-10-23, 김민기 CORE 스프린트 완료 후)
위 "실행·검증의 한계"는 개발 착수 전 시점 기준이며, 아래 항목은 이후 실제 검증으로 갱신되었다.
- **의존성 설치·실빌드: 실행 완료** — `npm ci`·`npm run typecheck`·`npm run build` 전부 통과 (CI에서 매 push/PR마다 재검증, 실행 로그는 GitHub Actions 참조).
- **구현 이미지: 7장 확보** — `0. 소스코드/eottae-web/docs/screenshots/` 에 390px 모바일(5장)·1440px 데스크톱 라이트(1장)·다크(1장) 실제 실행 화면. `tools/capture_screenshots.mjs`로 재생성 가능.
- **PWA 아이콘·서비스워커·오프라인: 구현 완료** — manifest·아이콘·`public/sw.js`·`/offline` 반영(프로덕션 등록). 푸시 알림은 여전히 미구현.
- **다크 로고: BRAND-004 완료** — 불투명 검정 배경을 투명 알파+파스텔로 변환(`tools/make_dark_logo.py`), 헤더 적용.
- 여전히 해당되는 한계: **매칭/성인 인증/로그인/채팅/신고/결제 미구현**, 실기기 수동 검증 미실시(에뮬레이션 기준), 실서비스 공개 판정은 여전히 "아님".

### 후속 갱신 2차 (2026-10-23 디자인 폴리시·PWA 실검증 후, 김민기)
- **PWA 오프라인: 실동작 검증 완료** — `next start` 프로덕션 서버를 실제로 종료한 상태에서 CDP 네비게이션 테스트: 캐시된 `/`·`/match` 정상 렌더, 미방문 경로는 `/offline` 폴백("지금은 오프라인이에요") 표출. SW 상태 `activated`/`controlled` 확인. 실기기 설치 테스트는 여전히 미실시.
- **수동 테마 토글: 구현 완료** — 시스템/라이트/다크 3단, localStorage 유지, FOUC 방지 인라인 스크립트. 헤더 로고 라이트/다크 자동 스왑.
- **브랜드 에셋 보강** — Pretendard 폰트 자체 호스팅(CDN 의존 제거), ima2-gen 생성 히어로 일러스트(WebP 27KB) 적용, 파티클·스크롤 리빌 애니메이션 추가(reduced-motion 대응).
- **스크린샷: 프로덕션 빌드 재캡처** — dev 오버레이 없는 7장, 전부 고유 해시.
- 여전히 해당되는 한계: **실기기 설치/Lighthouse PWA 감사 미실시**, 매칭·인증·채팅 등 기능은 여전히 미구현.

### 후속 갱신 3차 (2026-10-23 코드 리뷰 후속 수정, 김민기)
- **구현 이미지 제출 폴더 반영** — `3. 구현 이미지(5장이상)/`에 실제 실행 캡처 7장 + `captions.csv` 배치(기존 docs/screenshots 사본). 기능 화면 3~7번 항목은 실구현 후 추가.
- **스크롤 리빌 내비게이션 결함 수정** — 클라이언트 라우팅으로 `/` 진입 시 섹션이 보이지 않던 버그(`useEffect` 1회 관찰) → `usePathname` 재관찰로 수정, 실브라우저 재현·해소 확인. JS 비활성 시 숨김 방지 `<noscript>` 폴백 추가.
- **typecheck·build 재실행 PASS.**
