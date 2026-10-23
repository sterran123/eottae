# HANDOFF — 김민기(CORE/공통) → 팀원

이 문서는 **작업 환경을 최대한 동일하게 맞추기 위한 인수인계 문서**다. 새로 받는 팀원은 위에서 아래로 따라 하면 된다.

## 1. 내 개발 환경 (기준값)

| 항목 | 내 환경 | 팀원 권장 |
|---|---|---|
| OS | Windows 11 + Git Bash | 동일하거나 WSL — PowerShell 실행정책 이슈 주의 |
| Node.js | v24.19.0 | **20 이상**이면 OK (LTS 권장) |
| npm | 11.17.0 | Node와 함께 설치되는 버전 그대로 사용 |
| git | 2.55.0.windows.3 | 최신 Git for Windows |
| GitHub CLI | 2.103.0 (`gh`) | 저장소 push/PR에 사용, `gh auth login` 1회 필요 |
| Python | 3.14.8 + Pillow | `tools/make_dark_logo.py` 재실행할 때만 필요 |
| 에디터 | Windsurf (AI 에이전트 내장) | 어떤 에디터든 OK — AGENTS.md를 읽는 에이전트 권장 |

## 2. 최초 셋업 (그대로 복붙)

```bash
git clone https://github.com/sterran123/eottae.git
cd eottae-web            # 저장소 루트의 0. 소스코드/eottae-web 폴더
npm install              # package-lock.json 기준 설치
npm run dev              # http://localhost:3000
npm run typecheck        # PASS 확인
npm run build            # PASS 확인
```

## 3. 현재 구현 상태 한눈에

| 영역 | 상태 | 비고 |
|---|---|---|
| 통합 홈 `/` | 구현 | 히어로·3서비스 카드·흐름·안전·FAQ |
| `/match` | 진입 화면만 | 실제 매칭 기능은 미구현(오하율·주한태·손준혁 영역) |
| `/activities` `/invitations` | 준비중 화면 | 2·3차 MVP 소개만 |
| `/safety` `/privacy` `/offline` | 구현 | 정책 초안/삭제 안내/오프라인 안내 |
| 라이트·다크 | 구현 | `prefers-color-scheme` 자동. 수동 토글은 후속 과제 |
| 브랜드 로고 | 구현 | 라이트 원본 + 다크 투명 변형(BRAND-004) 적용 |
| PWA | 셸 수준 구현 | manifest+아이콘+sw.js+오프라인. 실기기 설치·푸시 미검증 |
| 로그인·성인인증·DB·채팅 | 미구현 | 다른 팀원 담당 — 임의 구현 금지 |
| Supabase | 계획만 | `supabase/migrations/0000_planning_only.sql`은 주석 메모 |

## 4. 검증 명령과 마지막 기록

```bash
npm run typecheck   # PASS (2026-10-23)
npm run build       # PASS — 정적 8페이지 + /offline + /api/health
npm audit           # 0건 (postcss 8.5.31 overrides 고정)
```

미실행 항목: 실기기 360/390/768/1440px 시각 검증, SW 설치·오프라인 시나리오, Lighthouse. 시연 전 캡처 필요.

## 5. 팀원별 다음 진입점

- **오하율**: `src/app/match/` 아래 실제 온보딩·추천 카드 UI (MATCH-001/002). 공통 토큰(`globals.css`의 `--*` 변수) 재사용, `globals.css` 자체는 수정하지 말 것.
- **주한태**: Supabase 프로젝트 생성 → `supabase/migrations/` 계획 주석을 실제 migration으로 (MATCH-003~006). `.env.example`의 키 이름에 맞춰 로컬 `.env` 작성. 성인 게이트는 서버/RLS에서 fail closed.
- **손준혁**: 채팅·신고·RSVP 설계는 MATCH-007/008, ACT-003, INV-003 문서 우선. 실시간은 Supabase Realtime 후보.
- 공통: 작업 전 `docs/AI_에이전트_협업_가이드.md`의 지시문 템플릿으로 에이전트에게 시키고, 끝나면 `docs/AI_REPORT_LOG.md`에 본인 이름으로 기록.

## 6. 환경 차이로 자주 생기는 문제

- **PowerShell 스크립트 차단**: `npm.ps1`이 막히면 Git Bash 쓰거나 `npm.cmd`로 실행.
- **경로에 한글·공백**: cd 할 때 항상 `cd "0. 소스코드/eottae-web"` 처럼 따옴표.
- **줄바꿈**: `autocrlf=true` 상태 — 경고 메시지는 무시해도 됨.
- **브랜치 이름**: 기본 브랜치는 `main`. `master`가 아님.
- **`gh auth login`**: 첫 push 전에 한 번만 실행. 브라우저가 열리면 GitHub 로그인 승인.
- **서비스워커**: dev 서버에서는 등록 안 됨(의도적). `npm run build && npm run start`로 확인.

## 7. 연락·합의가 필요한 변경

- `globals.css` 토큰 변경, `layout.tsx` 공통 셸 변경, 패키지 추가 — **팀 합의 후** 진행 (RULES: minimal dependencies).
- 매칭/성인 인증 관련 화면 문구 변경 — 안전 정책(SEC-001)과 함께 검토.
