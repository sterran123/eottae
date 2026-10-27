# eottae PR 주기 점검 — Devin 자동화 프롬프트

> 이 파일은 Devin Automation(`schedule:recurring` → `start_session`)에 넣는 프롬프트의 원본이다.
> 등록 방법은 `tools/devin_pr_watch.mjs`(API) 또는 HANDOFF_김민기.md §11(UI 수동 등록) 참조.
> 프롬프트를 바꾸면 자동화에 반영되도록 재등록한다.

---

@sterran123/eottae 저장소의 열린 PR을 주기 점검한다. 판정 기준은 `tools/pr_review_bot.mjs` 상단 주석의 규칙을 따르고, 그 위에 사람 수준의 코드 리뷰를 얹는다.

이 자동화는 2시간 주기 스케줄 외에 `github:pull_request` 이벤트(opened·synchronize·reopened·ready_for_review)로도 깨어난다. 이벤트로 깨어난 실행은 프롬프트 끝에 이벤트 페이로드가 붙어 있다 — 그 경우 **페이로드의 PR 하나만** 아래 절차로 처리하고 다른 PR은 건드리지 않는다. 스케줄 실행(페이로드 없음)이면 열린 PR 전부를 순회한다.

도구: `gh` CLI 또는 GitHub REST API. 쓰기(코멘트·승인·머지)는 `GH_TOKEN`/`GITHUB_TOKEN` 환경변수 또는 `gh` 인증이 있을 때만 수행한다 — 없으면 읽기 전용으로 점검하고 결과만 보고한다 (공개 저장소라 읽기는 비인증 가능).

열린 PR마다 다음 순서로 판정한다:

1. draft이거나 작성자가 `[bot]`으로 끝나면 스킵.
2. base가 `main`이 아니면 "이 점검은 main 대상 PR만 자동 처리한다"는 안내 코멘트를 남기고 스킵. 같은 head sha에 이미 같은 내용의 코멘트가 있으면 반복하지 않는다.
3. PR 파일 목록을 전 페이지 조회해 민감 영역 포함 여부를 확인한다. 이름이 바뀐 파일은 옛 경로(`previous_filename`)도 함께 검사한다 — `.github/workflows/x.yml`을 무해한 이름으로 rename하면 새 경로만 봐서는 우회된다. 아래 중 하나라도 포함되면 자동 승인하지 않고 수동 리뷰 요청 코멘트를 남긴다:
   - `.github/` 전체, 임의 위치의 `CODEOWNERS`
   - 스케줄 잡이 실행하는 자동화 스크립트: `tools/pr_review_bot.mjs`, `tools/team_activity_report.mjs`, `tools/update_package_manifest.py`, `tools/devin_pr_watch.mjs`
   - 패키지/빌드 설정: `package.json`, 각종 lock 파일, `.npmrc`/`.yarnrc`, `next.config.*`, `tsconfig*`/`jsconfig*`, babel/postcss/tailwind 설정
   - 인증·DB·RLS 보안 코드(ADR-005): `0. 소스코드/eottae-web/supabase/`, `src/lib/server/`, `src/lib/auth/`, `src/lib/supabase/`, `src/app/api/` — CI 통과만으로는 안전성을 판정할 수 없다
   - `.env*`, `secret`/`credential`이 포함된 경로, `id_rsa`류 키, `*.pem`/`*.key`/`*.p8`/`*.keystore`/`*.tfvars` 등
4. diff를 직접 읽고 코드 리뷰한다 — 명백한 버그, 보안 문제, 저장소 컨벤션(한국어 주석·docs 로그·요구사항 ID) 위반이 있으면 파일/라인을 지적하는 코멘트를 남긴다. 이 리뷰가 규칙 봇(`pr-review.yml`)과 다른 이 자동화의 핵심 역할이다.
5. head 커밋의 `check` check-run을 확인한다 — 실패면 재현 절차(`npm ci` → `npm run typecheck` → `npm run build`) 코멘트, 진행 중이면 이번 주기 스킵, 오래됐는데도 없으면 CI 미실행 안내 코멘트.
6. 전부 통과(협력자 작성·민감 파일 없음·리뷰 문제 없음·CI 통과·충돌 없음)하면 승인하고 squash 머지를 시도한다. 머지는 판정한 head sha를 `sha` 조건으로 걸어 중간에 새 push가 오면 거부되게 한다. 보호 규칙(CODEOWNERS 등)에 막히면 "승인 완료·사람 머지 필요" 코멘트로 넘긴다.

코멘트 작성 원칙 — 한 줄짜리 안내는 금지한다. 모든 코멘트에 다음을 포함해 작성자가 다음 행동을 바로 알 수 있게 한다:
- **검사 결과 표**: 작성자 권한·민감 파일·머지 가능성·CI(`check`) 중 실제로 검사한 항목의 ✅/❌/⚠️ 표
- **구체적 사유**: 걸린 파일 경로와 어느 규칙에 걸렸는지, CI 실패면 실패한 check-run 로그 링크, 충돌이면 충돌 파일 목록(`git merge-tree --write-tree`로 얻은 실제 목록을 우선하고, 불가하면 머지베이스 이후 양쪽이 건드린 파일 교집합으로 근사치를 제시한다)
- **실행 가능한 해결 명령**: 복붙해서 쓸 수 있는 git/npm 명령(충돌이면 `git merge origin/main` 또는 `git rebase origin/main` 절차, CI 실패면 `npm ci`/`typecheck`/`build` 재현 절차)
- **후속 동작 안내**: "push하면 다음 점검에서 자동 재판정" 같은 다음 흐름

코드 리뷰 코멘트도 마찬가지 — 문제 파일/라인, 왜 문제인지, 어떻게 고치는지(가능하면 수정 코드 예시)를 적는다.

규칙 봇(`.github/workflows/pr-review.yml`, 2시간 주기)이 먼저 승인·머지한 PR은 재판정하지 않는다 — 이미 닫힌 PR은 건너뛴다. 이 자동화의 역할은 봇이 못 보는 코드 품질 검토와 봇이 보류한 PR의 사유 확인이다.

마지막에 PR별 처리 결과(스킵/코멘트/승인/머지/보류)를 한 줄씩 요약 보고한다.
