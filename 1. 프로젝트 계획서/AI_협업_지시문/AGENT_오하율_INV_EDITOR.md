# 오하율 — 3차 청첩장 에디터/미리보기 (INV-001)

**현재 맡은 일: 3차 메인.** 모바일 청첩장 목업의 타입·예시 데이터 첫 PR, 목록·만들기·편집·미리보기·테마 적용·공개 하객 뼈대, 화면 흐름. 김민기는 총괄 모니터링만 한다.

### 우선 이슈
INV-001 P0 (에디터/미리보기/반응형). 타입 첫 PR이 INV-002·INV-003의 선행.

### 파일 소유
`src/lib/invitations/` (`types.ts`, `demo-data.ts`, `demo-storage.ts`, 권장 `href.ts`)  
`src/app/invitations/` (허브·만들기·공개 뼈대)  
`src/components/invitations/` 중 에디터·미리보기·목록  
전용 CSS는 `src/app/invitations/invitations.css` (제안). `globals.css` 직접 수정 금지.

이미 있음 — 건드되 유지: `src/app/invitations/page.tsx`의 `ThemePreviewSection`, `src/components/invitations/ThemePreviewSection.tsx`, `src/lib/demo/demo-themes.ts`.

### 인수
예시 청첩장 2~3개로 목록→만들기→편집→미리보기→공개 링크가 이 브라우저에서 이어진다. 360px·44px·6테마. 하객 화면에 명단 없음. 테마 모의 결제가 허브 하단에 남는다.

---

## 붙여넣기 프롬프트 (이 아래를 자기 AI에게 그대로 복사)

```
너는 「어때?」 4인 팀의 개발 에이전트다. 담당자는 오하율이다. 3차 메인이다. 요구 ID는 INV-001.

먼저 읽어라:
1. 0. 소스코드/eottae-web/README.md, AGENTS.md
2. 1. 프로젝트 계획서/AI_협업_지시문/RULES.md, SKILL.md
3. 1. 프로젝트 계획서/3차_작업지시서.md
4. 1. 프로젝트 계획서/AI_협업_지시문/AGENT_오하율_INV_EDITOR.md
5. 2. 프로젝트 설계서/요구사항_마스터.md INV-001, API_계약_초안.md 3단계 행, DB_논리모델_전체3단계.md INVITATION/RSVP/INVITATION_MEDIA, 아키텍처_결정기록_ADR.md ADR-004
6. 1. 프로젝트 계획서/단계_범위고정_인수조건.md 3차, 실행_결정대기_로그.md DEC-11·DEC-12
7. 코드: src/lib/activities/types.ts, demo-data.ts, demo-storage.ts, href.ts
   src/app/invitations/page.tsx, src/components/invitations/ThemePreviewSection.tsx
   src/lib/demo/demo-themes.ts, src/lib/demo/clear-demo-device.ts
   src/app/globals.css (토큰만 읽고 수정하지 않음)
   next.config.mjs (output: 'export', trailingSlash: true, basePath: '/eottae')

이번 작업:
- 첫 PR에서 src/lib/invitations/types.ts, demo-data.ts, demo-storage.ts를 만든다. href.ts를 같이 두는 것을 권한다.
- localStorage 키는 정확히 eottae.invitations.demo.v1. 테마 결제 키 eottae_demo_theme_purchases_v1과 섞지 않는다.
- DEMO_DEVICE_STORAGE_KEYS에 eottae.invitations.demo.v1를 넣는다.
- 예시 청첩장 2~3개. 가상 이름·가상 장소만. 실존 인물·실주소·실전화 금지. 2차 가상 지역(노을구·달동네 등)을 재사용해도 된다.
- 필드: Invitation(id, ownerId, title, hostNames, weddingDate, venueLabel, greeting, sharingToken, visibility, expiry, themeId, status, viewerIsOwner), Guest(id, invitationId, displayName, guestToken — 전화 없음), Rsvp(invitationId, guestToken, response yes|no|maybe, partySize, note, respondedAt). DB 논리모델 camelCase.
- themeId는 DEMO_THEMES id(spring-card, moon-garden, hanji, star-table)와 맞춘다.
- 그 다음 화면: /invitations/ 목록+데모 뱃지(「데모 데이터로 동작하는 3차 미리보기」). ThemePreviewSection은 하단 유지.
- 만들기 /invitations/new/ (제안 경로). 편집 /invitations/?edit= 는 viewerIsOwner만 (제안). 미리보기 /invitations/?preview= (제안).
- 공개 하객 뼈대 /invitations/p/?t= (제안). 정적 export라 [token] 동적 세그먼트를 generateStaticParams 없이 만들지 마라. 2차처럼 쿼리로 연다.
- 공개 화면은 행사 정보만. 게스트 명단·RSVP 목록·전화 없음. 매칭 DemoEntryGuard를 붙이지 마라.
- 색은 globals.css 테마 토큰만. hex 하드코딩 금지. 360px, 터치 44px, 포커스 링, prefers-reduced-motion, 6테마(light·cupcake·cyberpunk·disney·dark·system).
- 전용 CSS는 src/app/invitations/invitations.css. globals.css는 수정하지 마라.

하지 말 것:
- 서버·Supabase·새 마이그레이션·Edge Function·외부 API
- RSVP 폼 본문(손준혁), 토큰 재발급·보존 패널 본문(주한태)
- ThemePreviewSection 모의 결제 로직 삭제·교체
- package.json, FILE_INDEX.csv, MANIFEST.sha256, supabase/, src/app/match/**, src/app/activities/**
- 실결제, 가짜 성공률, 근거 없는 완료 주장
- 주한태·손준혁보다 먼저 쓰는 별도 types 파일

목업 규칙:
- 화면마다 데모 표시. 상태는 이 브라우저 localStorage만.
- 공개 링크는 불규칙 토큰. 검색엔진 미노출은 robots noindex + 안내.
- 3차 P1 방명록·축하 메시지·커플 연대기는 넣지 마라. 넣으면 「제안·P1」이라고 화면에 적어라.

PR 규칙:
- 브랜치 feat/INV-001-*. main 직접 push 금지.
- 타입·데이터 첫 PR을 화면보다 먼저 머지되게 올려라. 다른 사람은 그 위에서만 작업한다.
- PR 본문 Refs #이슈. AI 코드 리뷰 지적 반영 후 머지.
- 막히면 이슈 일반 댓글에 @grok 질문.
- docs/AI_REPORT_LOG.md 맨 아래에 ## 날짜 주제 (오하율 작업) — [요청][AI][변경][미실행]. 실행한 명령만 검증으로 적는다.
- 시작 전에 변경 파일·테스트 방법을 제시하고, 끝나면 실행/미실행을 나눠 보고하라.
```
