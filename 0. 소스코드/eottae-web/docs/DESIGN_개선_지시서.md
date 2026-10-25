# 디자인 개선 작업 지시서 — Claude Code (김민기 발행)

> 대상 저장소: `sterran123/eottae` · 워크트리 루트: `0. 소스코드/eottae-web/`
> 스택: Next.js 15 App Router + 정적 export(`output:'export'`, `basePath:'/eottae'`) + 순수 CSS 토큰(라이브러리 없음)
> 검증: `npm ci` → `npm run typecheck` → `npm run build` (빌드 산출물 `out/`은 커밋 대상 아님)

## 1. 확정된 디자인 방향 — 바꾸지 말 것

이전 라운드에서 사용자가 확정한 방향. 이 지시의 모든 개선은 이 언어를 **강화**하는 방향이어야 한다:

- **아기자기(귀여운) 파스텔 톤**: 스티커 감성 — 점선 프레임, 마스킹 테이프, 스캘럽 물결선, 배경 도트 패턴, ♡·✦ 장식 모티프, 물결(wavy) 밑줄
- **스프링 이징**: `--spring`(cubic-bezier 0.34,1.56,0.64,1) — 버튼·카드 호버가 통통 튀는 감각
- **완전 pill 버튼**(radius 99px) + 호버 리프트·미세 회전
- **6+1 테마 시스템**: 라이트(기본)·컵케잌·사이버펑크·디즈니·다크·시스템 — `data-theme` + `globals.css` 내 토큰 블록으로 구동. 모든 색상은 토큰 참조, 하드코딩 hex 금지
- **prefers-reduced-motion 존중**: 신규 모션 추가 시 반드시 정지 목록에 포함
- **한국어 UI**, 폰트는 자체호스팅 Pretendard Variable

## 2. 권한 범위 — 김민기 소유 영역

| 자유 변경 가능 | 스타일만 조심스럽게 | 변경 금지 |
|---|---|---|
| `src/app/globals.css` | `src/app/match/*`(시각 토큰·여백만, 로직 불변) | `src/components/match/*.tsx`의 로직·props |
| `src/components/shared/*` | `src/lib/match/*`는 건드리지 않되 참조 가능 | `src/app/api/**`, 인증·서버 코드 |
| `src/app/page.tsx`, `layout.tsx` | | `src/lib/**` 비즈니스 로직 |
| 서브페이지 라우트(privacy·safety·offline·invitations·activities) | | 워크플로·tools·민감 파일(건드리면 PR 리뷰 보류됨) |
| `public/` 에셋(아이콘·폰트·manifest) | | |

match 모듈(`오하율` 담당)은 기능 코드를 바꾸지 않는다 — 시각 토큰 매핑·간격·레디우스 같은 **스타일 레이어만** 다듬는다.

## 3. 현재 상태 (2026-10-25 기준)

- 홈(`/`) + 공통 셸(header·footer·nav): 아기자기 패스 완료, 6테마 전수 브라우저 실검증 완료
- match 4개 라우트(`/match/onboarding|recommend|qna|common`): **별도 피치 톤 토큰(`match-tokens.css`)으로 구동** — 팀 합의 톤이라 색은 유지하되, 6테마 추적 여부 미검증 상태. 컵케잌/사이버펑크/디즈니 테마에서 의도하지 않은 대비·색상이 나올 가능성 있음
- 서브페이지(privacy·safety·offline·invitations·activities): 기능은 있으나 아기자기 패스의 장식 언어가 홈 대비 약함
- 미실행 잔여: 구현 스크린샷 문서 갱신, 신규 테마 실사이트 반영 확인

## 4. 작업 목록 (우선순위)

### A. 테마 시스템 완결
1. match 페이지 4개를 6테마+시스템 테마 전부에서 실전환 확인. 어색한 곳은 `match-tokens.css`에 `[data-theme='...']` 매핑 블록 추가 (토큰명 유지 — 컴포넌트 불변)
2. 테마 피커(`theme-toggle.tsx`)의 `<select>` UX 개선 검토 — 팔레트 미리보기 스와치 등 (기존 동작·저장 키 `theme`/`data-theme` 계약 유지)

### B. 서브페이지 디자인 통일
3. privacy·safety·offline·invitations·activities에 홈과 같은 장식 언어 적용 — eyebrow 반짝이, ♡ 꼬리, 스캘럽, 카드 테이프 등 globals.css 기존 클래스 재사용 우선
4. `error.tsx`·`not-found.tsx`·`loading.tsx` 도 같은 언어로

### C. 접근성
5. `:focus-visible` 스타일 전수 점검 — 키보드 탐색 시 포커스 링이 모든 인터랙티브 요소에 보이는지
6. 파스텔 테마(특히 cupcake·disney 라이트 계열)의 텍스트 대비 WCAG AA(4.5:1) 측정·부족분 보정
7. 신규 모션 전부 `prefers-reduced-motion` 정지 목록에 추가 확인

### D. 반응형·모바일
8. 320px~1440px 전 구간 점검 — 특히 match 폼(아코디언·태그 칩)의 좁은 화면 줄바꿈, 터치 타겟 44px
9. 모바일 nav 동작 확인 — 햄버거/내비 겹침·스크롤 락

### E. 상태 디자인
10. 로딩 스켈레톤·빈 상태·에러 상태의 시각 완성도 — RecommendList에 이미 상태 처리 있으니 같은 수준으로 공통화

### F. PWA 완성도
11. manifest 아이콘·maskable 변형·스플래시 대응 확인, `offline/` 페이지를 아기자기 언어로
12. `theme-color` 메타가 테마별로 맞게 추적하는지 재검증(FOUC 스크립트·syncChrome 로직 참고)

### G. 성능·품질
13. Pretendard woff2 프리로드·font-display로 CLS 점검, hero-particles의 모바일 비용 확인(필요 시 개수 감축)
14. 사용 안 하는 CSS 규칙·토큰 정리(남길 것만)

### H. 문서·검증
15. `3. 구현 이미지/` 스크린샷 최신화 — 6테마 주요 화면 + match 4라우트
16. `AI_REPORT_LOG.md`에 작업 기록 — **실행한 검증과 미실행 항목을 반드시 구분**(AGENTS.md 규칙 7)

## 5. 작업 방식 규칙

- 브랜치: `feat/design-*` 브랜치에서 작업 → PR 생성. PR 열면 자동 리뷰 봇이 판정하고 Devin이 코드 리뷰함 — 통과하면 자동 승인·머지
- 커밋 메시지: 기존 규칙(`feat(BRAND-004): …` 형태, 관련 요구사항 ID 표기)
- 색상 변경은 토큰으로만 — tsx에 hex 직접 삽입 금지
- 확신 없는 팀 합의 사항(예: match 피치 톤을 브랜드 보라로 바꿀지)은 **바꾸지 말고 지시서에 회신**
- 검증 표기: 실행한 것만 PASS로 기록, 브라우저 실검증 못 한 항목은 `[미실행]` 표기

## 6. 산출물

- 변경된 CSS/컴포넌트 + 6테마 전수 확인 결과
- AI_REPORT_LOG 기록 엔트리
- 갱신된 스크린샷
- (선택) 발견했지만 권한 밖이라 못 고친 항목 목록 — match 로직, API 등
