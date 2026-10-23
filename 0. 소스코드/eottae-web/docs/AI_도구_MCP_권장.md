# AI 도구 · MCP · 플러그인 권장 목록

리서치 기준일: 2026-10-23 (출처: MCP 공식 Registry, modelcontextprotocol/servers, microsoft/playwright-mcp 등)

> 전제: `RULES.md`의 **최소 의존성·최소권한·팀 합의** 원칙. 아래는 "권장 후보"이며 실제 도입은 팀 합의 후 진행한다.
> 외부 서비스(운영 DB, 실제 GitHub 계정 등)에 에이전트를 임의로 연결하지 않는다 — 로컬/dev 환경 대상만.

## 1. MCP 서버 권장 (우선순위 순)

| MCP 서버 | 용도 | 설치 예시 | 비고 |
|---|---|---|---|
| **filesystem** | 프로젝트 파일 읽기/쓰기 범위 제한 | `npx -y @modelcontextprotocol/server-filesystem <경로>` | 이미 `1. 프로젝트 계획서/AI_협업_지시문/mcp.example.json`에 예시 있음. 허용 디렉터리를 프로젝트 루트로 제한 |
| **github** (공식) | 이슈/PR/리뷰/Actions을 에이전트에서 처리 | GitHub 공식 `github-mcp-server` | PAT 필요. repo 생성·PR 초안·코드리뷰에 유용. 쓰기 권한은 최소 scope로 |
| **playwright** | 브라우저 자동화 — 360px/다크모드 캡처, E2E 시나리오 | `npx @playwright/mcp@latest` | **실기기 시각 검증 미실행** 보완에 가장 적합. localhost 전용으로 지시할 것 |
| **chrome-devtools** | 성능 trace, 네트워크 요청 분석 | `npx chrome-devtools-mcp@latest` | LCP·렌더링 성능 조사용 |
| **supabase** | 백엔드 스키마·마이그레이션·쿼리 지원 | Supabase 공식 MCP | **주한태 담당 시기에만**, 개발 프로젝트+읽기 전용 권장. 운영 DB 연결 금지 |
| **context7** | 라이브러리 최신 문서를 프롬프트에 주입 | `npx @upstash/context7-mcp` | Next 15/React 19 API 변화로 인한 hallucination 방지에 유용 |

설정 위치: 에디터/에이전트별 MCP 설정 파일(예: `mcp.json`, `.cursor/mcp.json`, Devin의 `.devin/`). 저장소에는 `mcp.example.json` 수준의 예시만 커밋하고 실제 계정 토큰은 커밋 금지.

## 2. 에이전트 지침 파일 구성 (현재 상태 + 권장)

| 파일 | 상태 | 용도 |
|---|---|---|
| `AGENTS.md` (eottae-web) | 있음 | 에이전트 진입점 — 읽기 순서·담당·금지 사항. 대부분의 AI 툴이 인식 |
| `docs/AI_에이전트_협업_가이드.md` | 있음 | 팀원이 에이전트에게 보낼 지시문 템플릿·로그 규칙 |
| `.github/pull_request_template.md` | 있음 | PR 시 검증 항목 체크리스트 |
| `.github/workflows/ci.yml` | **후보** | typecheck/build를 PR마다 자동 검증하는 GitHub Actions — 도입 시 팀 합의 |
| `.devin/` `.cursor/rules` 등 툴별 설정 | 선택 | 각자 쓰는 에이전트 툴의 프로젝트 규칙. 내용은 AGENTS.md/RULES.md를 참조하도록 최소화 |

## 3. UI/UX 라이브러리 후보 — 현 스택과의 관계

현재 스택은 **Next.js 15 + React 19 + 순수 CSS 토큰**(의도적 최소 의존성). 아래 도입은 스택 변경이므로 팀 토론 후 결정.

| 후보 | 용도 | 판단 |
|---|---|---|
| Pretendard Variable | 한글 웹폰트 | **적용 완료** (CDN, 시스템 폴백 유지) |
| lucide-react | 아이콘 세트 | 서비스 카드 motif(♡✦✉)·로그인 아이콘 교체 후보. 경량·MIT |
| motion (구 framer-motion) | 페이지/카드 전환 애니메이션 | 도입하면 품질 ↑, 단 번들 증가 → 합의 필요 |
| Tailwind CSS / shadcn | 유틸리티 CSS + 컴포넌트 | **스택 변경** — 1차에서는 도입하지 않는 것을 권장 |
| TanStack Query | 서버 상태 관리 | API 도입(주한태) 후 검토 |

## 4. 품질·검증 도구 후보

- **Lighthouse CI**: PWA·접근성·성능 점수를 PR에서 자동 측정 — SEC-002 "캡처 5장 이상" 증빙에 활용 가능
- **axe / jest-axe**: 컴포넌트 단위 접근성 위반 자동 탐지
- **Playwright Test**: E2E 시나리오 코드화 (MCP로 초안 생성 → 팀 리뷰)

## 5. 하지 말 것

- 프로덕션 DB·실제 사용자 데이터를 MCP/에이전트에 연결
- GitHub PAT·Supabase 키를 저장소나 프롬프트에 직접 기입
- 위 목록에 없는 임의 플러그인 대량 설치 — 최소 권한 원칙
