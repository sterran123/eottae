# AI 에이전트 협업 가이드 — 팀원 공통 절차

이 문서는 팀원 각자가 AI 에이전트에게 작업을 시킬 때 **같은 규칙으로 지시하고, 같은 형식으로 기록**하기 위한 안내다.
목표: 누가 어떤 작업을 했는지 `docs/AI_REPORT_LOG.md`와 git 커밋으로 항상 추적 가능하게 한다.

## 1. 작업 지시문 템플릿 (복붙용)

에이전트에게 보낼 프롬프트 첫 줄에 본인 이름과 담당 범위를 반드시 넣는다.

```text
너는 4인 팀 프로젝트 「어때?」의 개발 에이전트다. 너의 담당자는 {본인 이름}이다.
먼저 아래 문서를 순서대로 읽어라:
1. 0. 소스코드/eottae-web/README.md 와 AGENTS.md
2. 1. 프로젝트 계획서/AI_협업_지시문/RULES.md, SKILL.md
3. 1. 프로젝트 계획서/AI_협업_지시문/AGENT_{본인 이름}_{영역}.md
4. 2. 프로젝트 설계서/요구사항_마스터.md, API_계약_초안.md

이번 작업: {요구사항 ID와 한 줄 설명 — 예: MATCH-002 추천 카드 UI}
내 파일 소유 범위: {경로/영역}
다른 팀원 소유 영역은 수정하지 않는다. 필요하면 내 범위 안에 TODO/주석으로 남긴다.

작업을 마치면:
- docs/AI_REPORT_LOG.md 맨 아래에 `## 오늘날짜 주제 ({본인 이름} 작업)` 섹션을 추가하고
  `- [태그] 파일 | 내용` 형식으로 변경·검증·미구현을 모두 기록한다.
- 실제로 실행한 명령(typecheck/build 등)과 결과만 보고한다. 안 한 것은 미실행으로 쓴다.
```

## 2. AI_REPORT_LOG.md 기록 형식

```markdown
## 2026-10-24 취향 온보딩 화면 (오하율 작업)
- [신규] src/app/match/onboarding/page.tsx | 취향 선택 다단계 폼 골격
- [변경] src/components/match/interest-chip.tsx | 선택 상태 aria-pressed 처리
- [버그수정] ... | ...
- [검증] npm run typecheck PASS / npm run build PASS
- [미구현/보류] 서버 저장 API — 주한태 담당 대기
```

태그 종류: `[신규]` `[변경]` `[버그수정]` `[검증]` `[보안]` `[보존]` `[통합]` `[배포]` `[제안]` `[미구현/보류]`

## 3. 커밋·브랜치 규칙

- 브랜치: `feat/{ID}-{설명}` (예: `feat/MATCH-002-card-ui`)
- 커밋 메시지: `feat(MATCH-002): 추천 카드 컴포넌트` 형태로 요구사항 ID 포함
- `main`에 직접 push 금지 — PR로 올리고 최소 1명 리뷰
- 커밋 전 필수: `npm run typecheck` 통과, `.env`/실키 없음 확인

## 4. 파일 소유 경계 (침범 금지)

| 담당 | 소유 영역 | 비고 |
|---|---|---|
| 김민기 | `src/app/layout.tsx`, `page.tsx`, `globals.css`, `src/components/shared/`, `public/`, PWA(sw.js·manifest), `docs/`, 루트 설정 | 공통 셸 변경은 팀 합의 필요 |
| 오하율 | `src/app/match/**` 실구현, `src/components/match/`, MATCH-001/002/009, ACT-001, INV-001 UI | 공통 CSS 토큰만 재사용, globals.css 직접 수정 금지 |
| 주한태 | `supabase/**`, `src/lib/server/`, 인증·성인게이트·DB·API 라우트, MATCH-003~006, ACT-002, INV-002 | API 계약 문서와 동기화 필수 |
| 손준혁 | 채팅·신고·RSVP·알림, MATCH-007/008, ACT-003, INV-003 | 실시간 기능은 별도 설계 리뷰 후 착수 |

경계를 넘는 변경이 필요하면: 직접 수정 대신 이슈/코멘트로 요청하거나 팀 합의 후 진행한다.

## 5. 검증 정직성 (강제)

- `[검증]` 태그는 **실제로 실행한 명령+결과**만 기록한다. 추측으로 "통과" 금지.
- 미구현 기능을 완료처럼 보이게 하지 않는다 (UI에도 "(준비 중)" 표기 유지).
- 성인 인증·매칭 성공률·취향 일치율 등 미구현/미입증 수치를 화면에 표시 금지 (RULES 6).

## 6. 금지 목록 요약 (RULES.md 발췌)

- `.env`·실키 커밋 금지, `.env.example`에는 PLACEHOLDER만
- client-only 성인 게이트 금지 (서버/RLS fail closed)
- 다른 팀원 파일 임의 수정·삭제 금지
- 운영 DB·외부 서비스·자동 배포·main 직접 push는 담당 승인 전 금지

## 7. 환경 맞추기

처음 저장소를 받은 팀원은 `docs/HANDOFF_김민기.md`의 "최초 셋업" 절차를 그대로 따라 하면 된다.
추천 MCP/도구는 `docs/AI_도구_MCP_권장.md` 참조.
