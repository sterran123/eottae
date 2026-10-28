# HANDOFF — 김민기(CORE/공통) → 팀원

**이 문서는 「어때?」 저장소 전용 인수인계서다.** 위에서 아래로 순서대로 따라 하면 다른 PC에서도 동일 환경이 된다.
규칙의 최종 근거는 `1. 프로젝트 계획서/AI_협업_지시문/RULES.md`와 본 문서다. 문서에 없는 임의 판단(스택 변경, 타인 파일 수정)은 하지 않는다.

## 0. 저장소 접근 권한 (선행 조건 — 여기서 막히면 뒤는 전부 안 됨)

- 저장소는 **public** (2026-10-23 포트폴리오 목적으로 공개 전환): `https://github.com/sterran123/eottae`
- **clone/열람은 누구나 가능**. 단 **push·PR에는 Collaborator 권한이 필요**하므로 팀원은 아래 절차를 거친다. (초대 전이라도 `git clone`과 로컬 실행은 바로 된다)
- GitHub 계정이 없는 팀원: github.com에서 **가입 → 이메일 인증** 후 본인의 **영문 사용자명(username)**을 김민기에게 전달한다. (가입 이메일 주소가 아니라 프로필에 표시되는 영문 ID)
- 김민기는 받은 ID로 `Settings → Collaborators → Add people`에 추가하거나, 아래 명령을 대신 실행한다:

  ```bash
  gh api -X PUT repos/sterran123/eottae/collaborators/{팀원ID} -f permission=push
  ```

- 초대를 받은 팀원은 GitHub 알림/이메일에서 **Accept invitation**을 누른 뒤 아래 절차를 진행한다.
- 초대를 기다리는 동안 `1. 프로젝트 계획서/`의 RULES·요구사항 문서를 먼저 읽어둔다.

### main 브랜치 보호 (2026-10-23 적용)

- `main`은 보호 브랜치: **팀원의 직접 push 불가** — 반드시 `feat/이슈ID-설명` 브랜치 → PR
- PR 머지 조건: **CI `check` 통과 + 리뷰 승인 1건** (CODEOWNERS가 담당 영역 리뷰어 자동 지정)
- force push·브랜치 삭제 차단. 소유자(김민기, admin)만 긴급 시 우회 가능

### 현재 초대 상태 (2026-10-23 갱신)

| 팀원 | GitHub ID | 상태 |
|---|---|---|
| 오하율 | @HaYul0611 | **수락 완료** — push 가능 |
| 주한태 | @gksxogksxo1001-sketch | **수락 완료** — push 가능 |
| 손준혁 | @sonjunhyek2 | **수락 완료** — push 가능 |

## 1. 환경 기준값

| 항목 | 기준값 | 허용 범위 |
|---|---|---|
| Node.js | 24.19.0 | **>= 20** (`package.json` engines로 강제) |
| npm | 11.17.0 | Node 설치 시 딸려오는 버전 |
| git | 2.55 | 최신 Git for Windows / macOS git |
| GitHub CLI | 2.103 (`gh`) | 선택 — push 인증은 Git Credential Manager가 대신 처리해도 됨 |
| Python + Pillow | 3.14 | `tools/make_dark_logo.py` 재실행할 때만 필요 |

## 2. 최초 셋업 — 이 명령 그대로

```bash
git clone https://github.com/sterran123/eottae.git
cd "eottae/0. 소스코드/eottae-web"   # 주의: 저장소 루트가 'eottae', 앱은 그 안의 이 경로
npm install                        # package-lock.json 그대로 설치
npm run dev                        # http://localhost:3000 확인
npm run typecheck                  # 반드시 PASS
npm run build                      # 반드시 PASS
```

### git 작성자·인증 설정 (최초 1회, 본인 것)

```bash
git config --global user.name "본인 이름"
git config --global user.email "본인 GitHub 이메일 또는 noreply"
```

인증 방법 둘 중 하나만 하면 된다:

- **방법 A (권장, 추가 설치 없음)**: 처음 `git push`할 때 Git Credential Manager가 브라우저 로그인 창을 띄운다 → 본인 GitHub 계정으로 승인하면 이후 자동 인증.
- **방법 B**: `winget install GitHub.cli` 설치 후 `gh auth login` 한 번 (브라우저 열려 GitHub 로그인). 저장소 관리(이슈/PR)에도 쓸 수 있어 편리.

## 3. 현재 구현 상태 (2026-10-23 기준)

| 영역 | 상태 | 담당 |
|---|---|---|
| 통합 홈 `/`, 헤더/푸터/내비 | 구현 | 김민기 |
| `/match` `/activities` `/invitations` | 진입·준비중 화면만 | 실기능은 아래 담당자 |
| `/safety` `/privacy` `/offline` | 구현 | 김민기 |
| 라이트/다크 테마 | 구현 (시스템 연동 + 수동 3단 토글·localStorage 유지) | 김민기 |
| 다크 로고 투명 변형 | 구현 (BRAND-004) | 김민기 |
| PWA manifest·아이콘·sw.js 오프라인 셸 | 구현 (프로덕션 실검증 완료, 실기기 검증 미실시) | 김민기 |
| Pretendard Variable 웹폰트 | 구현 (public/fonts 자체 호스팅, CDN 의존 없음) | 김민기 |
| 로그인·성인 인증·매칭·채팅·DB·결제 | **미구현 — 건드리지 말 것** | 오하율·주한태·손준혁 |

## 4. 작업 절차 — 강제 항목

1. **읽기**: `RULES.md` → `요구사항_마스터.md` → 본인 `AGENT_*.md` → `docs/AI_에이전트_협업_가이드.md`
2. **브랜치**: `feat/{요구ID}-{설명}` (예: `feat/MATCH-002-card-ui`). `main` 직접 push 금지.
3. **커밋 메시지**: `feat(MATCH-002): ...` 처럼 요구사항 ID 포함.
4. **PR 생성 시**: 루트 `.github/pull_request_template.md` 양식이 자동 적용되고, `.github/CODEOWNERS`가 담당자에게 리뷰를 자동 요청한다. (팀원 ID 확정되면 CODEOWNERS 교체 필요 — 파일 안 TODO 참조)
5. **CI**: `.github/workflows/ci.yml`이 모든 push/PR에서 `npm ci → typecheck → build`를 자동 검증한다. **CI 실패 PR은 머지하지 않는다.**
6. **기록**: 작업 완료 시 `docs/AI_REPORT_LOG.md`에 본인 이름 섹션으로 변경/검증/미구현을 기록한다(의무).
7. **스크린샷**: UI 변경 시 `3. 구현 이미지(5장이상)` 폴더에 캡처 추가 — SEC-002 제출 요건.

## 5. 파일 소유 경계

| 담당 | 소유 영역 |
|---|---|
| 김민기 | `layout.tsx`, `page.tsx`, `globals.css`, `src/components/shared/`, `public/`, PWA, `docs/`, `.github/` |
| 오하율 | `src/app/match/**` 실구현, `src/components/match/` (신설) |
| 주한태 | `supabase/**`, `src/lib/server/` (신설), 인증·성인게이트·API |
| 손준혁 | 채팅·신고·RSVP·알림 관련 신설 영역 |

경계 밖 변경이 필요하면 직접 고치지 말고 이슈/코멘트로 담당자에게 요청한다.

## 6. 환경 차이 주의점 (Windows)

- `npm.ps1` 실행 차단 → Git Bash 사용 또는 `npm.cmd`로 실행
- 경로에 한글+공백(`0. 소스코드`) — 항상 따옴표로 감싼다
- `LF→CRLF` 경고는 무시해도 됨 (`autocrlf=true`) — 단 `.gitattributes`가 `eol=lf`라 체크아웃은 항상 LF, MANIFEST.sha256 검증이 OS 무관하게 통한다
- 서비스워커는 dev에서 등록 안 됨 — `npm run build && npm run start`로 확인. 단 `output:'export'`라 `next start`는 동작하지 않는다 — start는 out/을 `/eottae/` 경로로 서빙하는 로컬 정적 서버(`tools/serve_pages_preview.mjs`)다
- Pretendard 폰트는 `public/fonts/PretendardVariable.woff2` 자체 호스팅 — CDN 장애·오프라인과 무관하게 동작

## 7. 남은 과제 (다음 작업자용)

- 실기기(에뮬레이션 아닌 실단말) 캡처 보강 → `3. 구현 이미지` 폴더 (현재 7장은 Chrome 에뮬레이션, SEC-002 충족 상태)
- PWA 실기기 설치·Lighthouse 검증 (GitHub Pages 배포 완료 후 `https://sterran123.github.io/eottae/`에서 수행)
- 정식 PWA 아이콘 디자인 검수·제작 (현재는 로고 배치 임시 아이콘)

## 8. GitHub Pages 배포

- **URL**: https://sterran123.github.io/eottae/ (basePath `/eottae` — `next.config.mjs` 참조)
- **자동 배포**: `.github/workflows/deploy-pages.yml` — main push 또는 Actions 탭 수동 실행 시 정적 export(out/)를 Pages에 배포.
- **상태**: 배포 완료·실사이트 응답 확인됨 (Pages source = GitHub Actions 설정). main push 때마다 자동 재배포.
- **주의**: 정적 호스팅이라 서버 기능 불가 — `/api/health`는 `force-static`으로 정적 파일로만 존재. 자산 경로는 모두 `/eottae/` 접두사 필수(next.config.mjs 주석 참조).

## 9. 주기적 자동 점검 (team-sync 스케줄러)

- `.github/workflows/team-sync.yml`이 **매주 월요일 09:00 KST** 자동 실행된다 (매일로 바꾸려면 cron을 `0 0 * * *`로).
- Actions 탭 → `team-sync` → **Run workflow**로 수동 실행 가능 (`days` 입력으로 집계 기간 조절). **제출 직전에 한 번 실행**해 `FILE_INDEX.csv`/`MANIFEST.sha256`을 최신으로 만든다.
- 머지마다 돌지 않는다(2026-10-29부터) — 머지마다 봇 PR이 생겨 승인할 일만 늘었다(4일에 10건). 시각(제목 날짜·집계 기간·열린 PR 최근 갱신 등)과 main CI 상태 줄만 바뀐 리포트는 다시 쓰지 않으므로 바뀐 게 없으면 PR도 생기지 않고, 열려 있던 봇 PR은 낡았으므로 닫는다. 열린 PR의 CI 열·팀원 집계·머지 목록·다음 액션이 바뀌면 다시 쓴다.
- 하는 일: main 건강검사(npm ci→typecheck→build) → `docs/TEAM_ACTIVITY.md` 갱신(팀원별 커밋·PR·요구사항 ID·CI 상태·비활동 팀원) → `FILE_INDEX.csv`/`MANIFEST.sha256` 재생성 → `auto/team-sync` 브랜치로 **PR 자동 생성**.
- 봇이 올린 PR도 **리뷰 승인 후 사람이 머지**한다 (main 보호 규칙 그대로).
- 로컬에서 같은 리포트를 만들려면: `node tools/team_activity_report.mjs` (gh 로그인 또는 `GH_TOKEN` 필요 — 없으면 public 비인증 조회).

## 10. PR 자동 리뷰 봇 (pr-review 스케줄러)

- `.github/workflows/pr-review.yml`이 **2시간마다** 자동 실행된다 (`tools/pr_review_bot.mjs`). Actions 탭 → `pr-review` → Run workflow로 수동 실행 가능.
- 스케줄 워크플로는 **저장소 활동이 60일 없으면 GitHub이 자동으로 끈다** — 봇이 안 돌면 Actions 탭에서 워크플로 재활성화.
- 자동 판정 범위는 **main 대상 PR**이다 — 다른 base 대상 PR에는 "사람이 직접 리뷰" 안내 코멘트를 sha당 1회 달고 넘어간다.
- 하는 일(열린 PR마다):
  - 팀 협력자(OWNER/MEMBER/COLLABORATOR)가 아니면 사람 확인 요청 코멘트
  - `.github/` 전체·임의 위치 CODEOWNERS·스케줄 잡이 실행하는 자동화 스크립트(`tools/pr_review_bot.mjs`·`team_activity_report.mjs`·`update_package_manifest.py`·`devin_pr_watch.mjs`)·**패키지/빌드 설정**(`package.json`·lock 파일·`.npmrc`·`next.config.*`·`tsconfig*`·babel/postcss/tailwind 설정 — `npm ci`/`npm run`/`next build`가 이 파일들이 정의한 코드를 실행한다)·**인증·DB·RLS 보안 코드**(`supabase/`·`src/lib/server|auth|supabase/`·`src/app/api/` — ADR-005, #24 사례)·`.env`/`secret`/`credential` 포함 경로·`id_rsa`류·`*.pem/key/p8/keystore/tfvars` 등 키 파일이 섞이면 자동 승인 금지 + 수동 리뷰 요청 코멘트
  - GitHub이 머지 가능 상태를 아직 계산 중이면 다음 주기로 보류, 머지 충돌이면 해결 요청 코멘트
  - **behind(main보다 뒤처짐)여도 그대로 머지를 시도**한다 — head 커밋의 CI는 작성자 push 때 이미 검증됐다. `update-branch`(main을 PR에 머지)는 쓰지 않는다 — GITHUB_TOKEN으로 한 갱신 push는 pull_request 워크플로를 다시 트리거하지 못해 새 sha에 `check`가 영원히 안 생기고, check가 필수 상태면 사람 머지까지 막힌다. "브랜치 최신화 요구" 보호 규칙이 켜져 있으면 GitHub이 머지를 거부해 자연히 사람에게 넘어간다.
  - CI(`check` 잡) 진행 중이면 조용히 다음 주기, push 후 30분이 지나도 check-run이 없으면 "CI 없음" 안내 코멘트, 실패면 재현 절차 코멘트
  - **CI 통과+충돌 없음이면 자동 승인 후 squash 머지 시도** — 승인은 `commit_id`로 판정 sha에 고정하고, 머지는 `sha` 조건을 걸어 중간에 새 push가 오면 API가 거부한다 (승인의 commit_id는 거부가 아니라 stale 리뷰로 기록되므로 실제 차단 게이트는 머지의 sha 조건). 거부되면 다음 점검이 새 커밋을 재판정
  - CODEOWNERS 등 보호 규칙에 막히면 "승인 완료·사람 머지 필요" 코멘트로 넘긴다
- 파일·코멘트·리뷰·check-run 목록은 전 페이지를 조회한다 (첫 페이지만 보면 100개 이후에 민감 파일을 숨겨 우회 가능). 이름이 바뀐 파일은 옛 경로(`previous_filename`)도 함께 검사한다 — `.github/` 파일을 무해한 이름으로 rename해 스캔을 우회하는 경로를 막기 위해서다.
- 같은 커밋에는 같은 코멘트를 반복하지 않는다(마커 태그 dedupe — Actions에선 `github-actions[bot]`, 로컬 실행에선 토큰 사용자 자신의 코멘트까지 인정). 새 push가 올라오면 다시 판정.
- 머지가 한 건이라도 되면 `deploy-pages`를 자동 dispatch해 사이트를 갱신한다 (GITHUB_TOKEN 머지는 push 이벤트를 못 일으키므로). 리포트·매니페스트(`team-sync`)는 주 1회·수동 실행만.
- 로컬 점검: `DRY_RUN=1 node tools/pr_review_bot.mjs` (조회·판정만), 실제 동작은 `GH_TOKEN` 필요.

- **2026-10-27 판정 강화 (요청: 김민기)** — 모든 판정 코멘트는 같은 검사 표(작성자·보호 영역·보안 스캔·머지 가능성·빌드 CI·AI 코드 리뷰·연결 이슈)와 다시 시도하는 방법을 담는다.
  - **AI 코드 리뷰**: `.github/workflows/ai-review.yml` → `tools/ai_code_review.mjs`가 PR head마다(Draft 포함) Devin 세션에 diff+저장소 규칙을 보내 정확성·보안을 판정 → PR 코멘트 + 커밋 상태 `ai-review`. 봇은 `ai-review` 성공이어야 머지. 재실행은 협력자의 `/ai-review` 댓글. 같은 head는 다시 리뷰하지 않는다(ACU 절약). 스크립트는 항상 main 기준으로 실행돼 PR이 판정 로직을 바꿀 수 없다.
  - **보안 스캔**: 추가된 줄에서 키·토큰·JWT 하드코딩, 브라우저 코드의 `service_role`, 비밀값 기본값(fail-open)·하드코딩, `NEXT_PUBLIC_*` 비밀값, `eval` → 차단 / `dangerouslySetInnerHTML`·토큰 브라우저 저장·tsx 색 하드코딩 → 경고. PR #24 실데이터로 차단 2건 검출, #18·#27 오탐 0 확인.
  - **보호 영역**: 즉시 멈추지 않고 나머지 검사를 끝까지 한 뒤, 작성자 외 사람이 head sha에 Approve하면 머지.
  - **Draft PR**: 판정만 하고 「Ready for review」 전환 시 머지. **team-sync 봇 PR**: 자동 생성 파일만 허용, team-sync가 남긴 커밋 상태 `check`를 빌드 결과로 인정, 충돌이면 다음 team-sync 덮어쓰기 대기. 봇은 자기 PR을 승인할 수 없어 브랜치 보호의 bypass 허용이 없으면 사람 승인 1번 필요.
  - **연결 이슈**: PR 본문에 `Closes #번호`가 없으면 표에 안내(머지는 막지 않음). PR 템플릿 첫 칸이 `Closes #`.

## 11. Devin 자동화 — PR 점검(주기+실시간)과 멘션 응답

> **2026-10-28부터 Devin은 쓰지 않는다 — §11-1 로컬 Grok 작업자로 넘어감.** `eottae-pr-watch`·`eottae-pr-mentions`는 Devin 쪽에서 꺼 두었고(API `enabled=false`), 아래 내용은 되돌릴 때를 위한 기록이다.

- GitHub Actions 봇(§10)과 별개로 **Devin 측 자동화 2개**를 둔다:
  - `eottae-pr-watch` — Devin 세션이 열린 PR을 직접 열어 diff 코드 리뷰까지 수행한다 (Actions 봇은 규칙 판정만 — 이쪽이 실제 품질 검토). 트리거 2개: **2시간 주기 스케줄**(RRULE `FREQ=HOURLY;INTERVAL=2`) + **`github:pull_request` 이벤트**(opened·synchronize·reopened·ready_for_review) — PR이 올라오거나 새 push가 되면 즉시 세션이 뜬다. 이벤트 실행은 페이로드의 그 PR만 처리한다.
  - `eottae-pr-mentions` — PR·이슈 댓글(리뷰 댓글 포함)에서 **@devin 멘션**(`mentioned=true` — 모든 댓글이 아니라 호출할 때만 반응, 봇 간 무한 답글 방지)이 달리면 세션이 댓글 내용을 읽고 `post_response`로 그 스레드에 자동 답글한다. 응답 전용 — 승인·머지·커밋은 안 한다.
- 프롬프트 원본: `.devin/automations/eottae-pr-watch.md`, `eottae-pr-mentions.md` — 프롬프트를 바꾸면 `UPDATE=1`로 재등록해야 반영된다.
- 등록: 루트 `.env` 또는 `.devin/.env`에 `DEVIN_API_KEY=`(Settings > Devin API > Service users 탭에서 발급, ManageOrgAutomations 권한 — `cog_` 접두사)·`DEVIN_ORG_ID=`(같은 페이지 상단, `org-*`)를 적고 `node tools/devin_pr_watch.mjs` 실행. 스크립트가 두 자동화를 이름 기준으로 생성/갱신한다(UPDATE=1이면 갱신, DRY_RUN=1이면 페이로드만 출력). 셸 환경변수로 줘도 된다 — 환경변수가 .env보다 우선.
- 참고: GitHub 트리거가 발화하려면 Devin GitHub 연동이 이 저장소에 설치돼 있어야 한다(본 저장소는 이미 devin-ai-integration[bot]이 PR을 만들 수 있는 상태라 연동됨). 댓글 트리거가 전혀 안 먹으면 Settings > Integrations에서 GitHub 연동의 저장소 범위를 확인.
- 세션에 GitHub 쓰기 권한(연동된 계정 또는 `GH_TOKEN` 시크릿)이 없으면 읽기 전용 점검+요약 보고만 한다 — 코멘트·승인·머지는 토큰이 있는 경우에만.

## 11-1. 로컬 Grok 작업자 — AI 리뷰·이슈 진행·@grok (Devin 대체, 2026-10-28~)

- **무엇:** Devin 크레딧 대신 김민기의 Grok 구독(X Subscription Ultra)으로 AI 작업을 처리한다. 저장소 변수 `AI_REVIEW_ENGINE=grok-local`(Settings → Secrets and variables → Actions → Variables)이면 Actions는 Devin을 부르지 않고 대기 표시만 남기고, 김민기 PC의 작업자(`tools/grok_review_worker.mjs`)가 처리한다.
  - **AI 리뷰** — `ai-review` 상태 "로컬 Grok 리뷰 대기" → PR head를 홈 밖 worktree(`C:\eottae-grok-review\`)에 체크아웃해 리뷰 → 상태·코멘트(작성자 sterran123). 머지는 지금처럼 규칙 봇(§10)
  - **이슈 진행** — 머지된 PR의 "로컬 Grok 이슈 진행 판정 대기" 코멘트 → 머지 커밋으로 판정 → 이슈 체크·닫기
  - **@grok** — 소유자가 이슈·PR 댓글에 `@grok 요청`을 쓰면 읽기 전용으로 답 댓글(👀 반응 후). 다른 사람의 `@grok`은 무시
- **상시 실행:** 전용 클론 `C:\eottae-grok-review\repo`(main)에서 `tools\grok_worker_loop.cmd`가 작업자를 띄우고 끝나면 다시 띄운다. 주기마다 origin/main으로 빨리감기하고, 작업자 코드가 바뀌면 스스로 다시 시작한다. 로그 `C:\eottae-grok-review\worker.log`, 실행 기록 `runs.jsonl`(소요·토큰·API 환산 비용).
  - **처음 한 번 — 순서대로(김민기가 직접):**
    1. 전용 클론: `git clone https://github.com/sterran123/eottae.git C:\eottae-grok-review\repo` (비밀 파일 `.env`를 이 클론에 두지 않는다). `%USERPROFILE%\.grok\bin\grok.exe`가 있는지(Grok CLI 설치·`grok login`)도 확인
    2. 로그인 때 자동 시작: `Win+R` → `shell:startup` → 그 폴더에 `eottae-grok-worker.vbs`를 만들고 아래 세 줄을 넣는다(창 없이 실행)
       ```vb
       Set sh = CreateObject("WScript.Shell")
       sh.Environment("Process")("GROK_BIN") = sh.ExpandEnvironmentStrings("%USERPROFILE%") & "\.grok\bin\grok.exe"
       sh.Run """C:\eottae-grok-review\repo\tools\grok_worker_loop.cmd""", 0, False
       ```
    3. vbs를 더블클릭해 한 번 실행하고 `C:\eottae-grok-review\worker.log`에 `start`가 찍히는지 확인
  - **끄기:** 시작프로그램의 `eottae-grok-worker.vbs`를 지우고, 작업 관리자 → 세부 정보에서 명령줄에 `grok_worker_loop.cmd`가 있는 `cmd.exe`를 **프로세스 트리 끝내기**. `node.exe`만 끝내면 래퍼가 30초 뒤(종료 코드 3은 1시간, 4는 10분) 작업자를 다시 띄운다.
- **PC가 꺼져 있으면** PR은 AI 리뷰를 기다린다(게이트가 열리지 않음 — 45분 뒤 규칙 봇이 "로컬 Grok 작업자 대기" 안내). 급하면 작성자 외 팀원이 코드를 읽고 Approve하면 머지된다.
- **멈췄을 때:** `worker.log`에서 종료 코드 확인 — 3은 Grok 로그인·사용량(`grok login` 후 1시간 안에 자동 재시도), 4는 잠금·클론 상태(전용 클론에서 `git status`). 수동 1회는 **클론 밖에서** node 절대 경로로(클론 안에서는 팀원이 머지한 `node.cmd` 등이 먼저 실행될 수 있다): `cd /d C:\eottae-grok-review` → `"%ProgramFiles%\nodejs\node.exe" repo\tools\grok_review_worker.mjs --once`, 특정 PR은 `--pr 번호 --force`.
- **안전장치:** 읽기 도구(read_file·grep)만·웹 없음·`--trust` 없음, 자식 환경변수 허용 목록(API 키가 없어 토큰당 과금으로 넘어가지 않음), 사용자 프로필(`C:\Users`)·메인 클론 읽기 금지, PR 트리의 링크·에이전트 설정 삭제, 인증 정보로 보이는 응답은 게시 거부. Grok 로그인 파일(`~/.grok/auth.json`)은 **절대 GitHub Secret에 넣지 않는다** — 팀원이 브랜치에서 워크플로를 고쳐 꺼낼 수 있다.
- **Devin으로 되돌리기:** 저장소 변수 `AI_REVIEW_ENGINE`을 지우면 즉시 Devin 리뷰·이슈 진행·`@devin`이 다시 돈다(Devin 시크릿은 남겨 둠). Devin 쪽 자동화는 `UPDATE=1 node tools/devin_pr_watch.mjs` 또는 Devin Automations 화면에서 켠다.
- 비용 참고(2026-10-28 실측): 리뷰 1건 9~18분, API 환산 $1~3 — 구독 사용량에서 차감, 추가 결제 0(대시보드 확인).

## 12. 로컬 저장소 자동 동기화

자동화가 main을 직접 바꾸므로(봇 머지·Devin 세션) 로컬은 주기적으로 당겨줘야 한다. `tools/sync_repo.mjs`가 fetch→뒤처짐·깨끗 여부 판정→`--ff-only` pull을 수행한다(미커밋 변경·분기·다른 브랜치면 안전하게 건너뜀). 두 경로로 자동 실행된다:
- **Devin CLI 세션 시작** — `.devin/hooks.v1.json`의 SessionStart 훅이 이 스크립트를 실행하고 결과를 세션 컨텍스트에 주입한다.
- **Windows 작업 스케줄러** — 작업 `eottae-repo-sync`(매시간)가 `tools/sync_repo.cmd`를 실행해 `.repo-sync.log`에 누적한다. 재등록: `schtasks /create /tn "eottae-repo-sync" /tr "<repo>\tools\sync_repo.cmd" /sc hourly /f`.

## 13. 실사이트 헬스체크 + PR 리마인드

- `.github/workflows/site-health.yml` + `tools/site_health_check.mjs` — deploy-pages 완료 직후와 매일(18:33 KST) 실사이트 8개 핵심 경로(홈·match·offline·manifest·sw·api/health·아이콘·폰트)의 200+content-type을 검사한다. 실패하면 이슈를 열고(마커 dedupe — 열린 이슈가 있으면 갱신), 전부 복구되면 그 이슈에 복구 코멘트를 달고 자동으로 닫는다.
- `tools/pr_review_bot.mjs` — 판정 코멘트를 단 PR이 3일 이상 변동 없이 열려 있으면 작성자 핑 코멘트를 단다(sha당 1회, `remind` 마커).

## 14. Supabase 프로젝트 — 김민기 소유 (ADR-005)

프로젝트는 김민기가 만들고 Owner로 갖는다(2026-10-27 생성, ref `zbwdzdwomiokjmaibglt`). 팀원 3명(오하율·주한태·손준혁)은 모두 Developer로 초대받아 작업한다. DB 변경은 대시보드가 아니라 마이그레이션 PR로만 한다. **Developer도 대시보드에서 service_role 키·JWT Secret을 볼 수 있고 SQL Editor로 RLS를 우회할 수 있다** — 키를 복사하지 않고 운영 DB를 대시보드에서 고치지 않는 건 팀 규칙이며, 팀원이 나가거나 키 노출이 의심되면 secret key를 새로 만든다(ADR-005 회수 절차). 값별 보관 위치는 ADR-005 「프로젝트 소유·키 관리」 표를 따른다.

**처음 한 번 (대시보드)**
1. [supabase.com](https://supabase.com) → **Continue with GitHub**(sterran123) 로그인. Owner가 한 명뿐이라 **GitHub 계정과 Supabase 계정(Account → Security) 모두 2단계 인증(2FA)을 켠다**
2. 조직 만들기: 이름 `eottae`, 플랜 **Free**
3. **New project**: 이름 `eottae` · Database Password는 **Generate a password** → 비밀번호 관리자에 저장(Git·카톡·이슈에 올리지 않기) · Region **Northeast Asia (Seoul)** → Create
4. **Authentication → URL Configuration**: Site URL `https://sterran123.github.io/eottae/`, Redirect URLs에 `https://sterran123.github.io/eottae/**`, `http://localhost:3000/**` 추가 (개발용 — 실사용 공개 전(DEC-01 해결 후)에는 `localhost`를 지우고 `**` 대신 실제 콜백 경로로 좁힌다)
5. **Organization → Team → Invite**: 오하율·주한태·손준혁 이메일, 역할 모두 **Developer**. 초대 링크는 24시간만 유효하니 팀원에게 바로 수락하라고 알리고, 지나면 **Resend**
6. **Project Settings → API Keys**에서 두 값을 확인: Project URL(`https://<ref>.supabase.co`)과 공개 키 **Publishable key**(`sb_publishable_…`) — 팀은 이 키 하나로 통일한다(ADR-005). **secret / service_role 키는 복사하지 않는다** (Owner·Developer 모두 같은 규칙)
7. GitHub 저장소 **Settings → Secrets and variables → Actions → New repository secret**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 다음 main push부터 배포 빌드에 들어간다 (#26)

**그 뒤 반복 작업**
- 주한태 마이그레이션 PR이 머지되면 클라우드에 적용: `cd "0. 소스코드/eottae-web"` → `npx supabase login` → `npx supabase link --project-ref <ref>`(DB 비밀번호 입력) → **`npx supabase db push --dry-run`으로 적용될 마이그레이션 목록 확인** → `npx supabase db push`
- **service_role은 복사·등록하지 않는다** — 클라우드 Edge Function 안에서 `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`로 자동 제공된다(`SUPABASE_` 접두어 이름은 CLI로 등록할 수도 없다)
- 외부 키(성인 인증 업체 API 키 등)만 `npx supabase secrets set 이름=값`으로 Edge Function 시크릿에 넣는다 — 파일·GitHub Actions Secrets에 두지 않는다
- 김민기가 자리를 비울 때 `db push`가 급하면: Owner가 Developer 중 한 명(보통 주한태)을 임시로 **Administrator**로 올림(위임받은 사람은 Database Password를 새로 만들어 사용) → 끝나면(`db push`를 하지 않고 끝났어도) **Developer로 되돌리고 Owner가 Database Password를 다시 만들어** 비밀번호 관리자에 저장. 위임·회수 시각은 #26 이슈에 남긴다
- 무료 플랜은 1주일 비활성 시 일시 정지 — 발표·시연 전날 대시보드에서 상태 확인(정지면 Restore)
- 팀원이 조직에서 나가거나 키 노출이 의심되면: API Keys에서 secret key를 새로 만들고 기존 키 삭제, Edge Function 시크릿(외부 업체 키)도 재발급 → `secrets set`. 기록은 #26
- CLI 로그인을 끝낼 때는 `npx supabase logout` 후 **Account → Access Tokens**에서 그때 발급된 CLI 토큰이 Revoke됐는지 확인(남아 있으면 직접 Revoke)

