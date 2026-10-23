# HANDOFF — 김민기(CORE/공통) → 팀원

**이 문서는 「어때?」 저장소 전용 인수인계서다.** 위에서 아래로 순서대로 따라 하면 다른 PC에서도 동일 환경이 된다.
규칙의 최종 근거는 `1. 프로젝트 계획서/AI_협업_지시문/RULES.md`와 본 문서다. 문서에 없는 임의 판단(스택 변경, 타인 파일 수정)은 하지 않는다.

## 0. 저장소 접근 권한 (선행 조건 — 여기서 막히면 뒤는 전부 안 됨)

- 저장소는 **private**: `https://github.com/sterran123/eottae`
- GitHub 계정이 없는 팀원: github.com에서 **가입 → 이메일 인증** 후 본인의 **영문 사용자명(username)**을 김민기에게 전달한다. (가입 이메일 주소가 아니라 프로필에 표시되는 영문 ID)
- 김민기는 받은 ID로 `Settings → Collaborators → Add people`에 추가하거나, 아래 명령을 대신 실행한다:

  ```bash
  gh api -X PUT repos/sterran123/eottae/collaborators/{팀원ID} -f permission=push
  ```

- 초대를 받은 팀원은 GitHub 알림/이메일에서 **Accept invitation**을 누른 뒤 아래 절차를 진행한다.
- 초대를 기다리는 동안 `1. 프로젝트 계획서/`의 RULES·요구사항 문서를 먼저 읽어둔다 (공유 폴더로도 열람 가능).

### 현재 초대 상태 (2026-10-23 갱신)

| 팀원 | GitHub ID | 상태 |
|---|---|---|
| 오하율 | @HaYul0611 | **수락 완료** — clone 가능 |
| 주한태 | @gksxogksxo1001-sketch | 초대 발송됨 — 수락 대기 |
| 손준혁 | @sonjunhyek2 | **수락 완료** — clone 가능 |

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
| 라이트/다크 테마 | 구현 (시스템 연동, 수동 토글은 후속 과제) | 김민기 |
| 다크 로고 투명 변형 | 구현 (BRAND-004) | 김민기 |
| PWA manifest·아이콘·sw.js 오프라인 셸 | 구현 (실기기 검증 미실시) | 김민기 |
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
- `LF→CRLF` 경고는 무시해도 됨 (`autocrlf=true`)
- 서비스워커는 dev에서 등록 안 됨 — `npm run build && npm run start`로 확인
- Pretendard 폰트는 jsDelivr CDN — 오프라인 개발 시 시스템 폰트로 폴백됨(정상)

## 7. 남은 과제 (다음 작업자용)

- 실기기 360/390/768/1440px 캡처 5장 이상 → `3. 구현 이미지` 폴더 (SEC-002)
- 테마 수동 토글(사용자 설정 저장) — 브랜드 가이드상 별도 후속 과제
- PWA 실기기 설치·Lighthouse 검증 (HTTPS 배포 후)
- CODEOWNERS의 팀원 GitHub ID 교체 — ID 확정 후 김민기가 입력
- 팀원 Collaborator 초대 완료 확인 (각자 계정 생성·ID 전달 필요)
- 정식 PWA 아이콘 디자인 검수·제작 (현재는 로고 배치 임시 아이콘)
