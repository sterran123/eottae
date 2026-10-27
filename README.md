<div align="center">

# 어때? (EOTTAE)

**취향으로 시작되는 인연 — 하나의 앱, 세 가지 순간**

첫 매칭부터 데이트·소모임, 모바일 청첩장까지 관계의 여정을 하나로 잇는 PWA 웹앱 · 4인 팀 프로젝트

[![ci](https://github.com/sterran123/eottae/actions/workflows/ci.yml/badge.svg)](https://github.com/sterran123/eottae/actions/workflows/ci.yml)
[![deploy-pages](https://github.com/sterran123/eottae/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/sterran123/eottae/actions/workflows/deploy-pages.yml)

### [▶ 데모 사이트 열기 — sterran123.github.io/eottae](https://sterran123.github.io/eottae/)

<img src="3.%20구현%20이미지(5장이상)/01_공통_홈_데스크톱.png" alt="어때? 통합 홈 화면 (라이트 테마)" width="820">

</div>

> **현재 단계: 1차 MVP 개발 중 (데모)**
> 매칭 화면(온보딩·추천·문답·채팅)은 **데모 데이터로 체험**할 수 있습니다.
> 로그인·만 19세 이상 성인 인증·서버 API는 아직 연결되지 않았으며, 실제 회원 데이터는 수집하지 않습니다.

---

## 무엇을 만드나요

**웹사이트/PWA 1개** 위에 공통 브랜딩·회원·설정·안전·디자인 시스템을 두고, 사용자 여정으로 이어지는 **서비스 3개**를 단계적으로 엽니다.

| 단계 | 서비스 | 경로 | 상태 |
|---|---|---|---|
| 1차 MVP | 💗 **매칭** — 취향 온보딩, 카드 추천, 프로필 문답·공통 질문, 쌍방 동의 후 1:1 채팅, 신고·차단 | `/match` | 🟢 데모 체험 가능 |
| 2차 | ✦ **데이트·소모임** — 코스 탐색, 모임 참가, 일정 투표 | `/activities` | ⚪ 준비 중 안내 페이지 |
| 3차 | ✉ **모바일 청첩장** — 에디터, 공유 링크, 참석 회신(RSVP) | `/invitations` | ⚪ 준비 중 안내 페이지 |

### 지금 둘러볼 수 있는 화면

| 화면 | 경로 | 내용 |
|---|---|---|
| 통합 홈 | [`/`](https://sterran123.github.io/eottae/) | 3개 서비스 입구, 이용 흐름, 안전 원칙, FAQ, 로드맵 |
| 매칭 소개 | [`/match`](https://sterran123.github.io/eottae/match/) | 4가지 데모 진입점 |
| 취향 온보딩 | [`/match/onboarding`](https://sterran123.github.io/eottae/match/onboarding/) | MBTI·관심사·관계 목적 선택 |
| 오늘의 추천 | [`/match/recommend`](https://sterran123.github.io/eottae/match/recommend/) | 추천 카드, 사진 블라인드, 문답 궁합 |
| 프로필 문답 | [`/match/qna`](https://sterran123.github.io/eottae/match/qna/) | 40문항 문답 |
| 공통 질문 | [`/match/common`](https://sterran123.github.io/eottae/match/common/) | 둘 다 답하면 공개되는 블라인드 비교 |
| 1:1 채팅 | [`/match/chat`](https://sterran123.github.io/eottae/match/chat/) | 대화 목업·미디어 첨부·신고/차단 메뉴 |
| 안전센터 · 개인정보 | [`/safety`](https://sterran123.github.io/eottae/safety/) · [`/privacy`](https://sterran123.github.io/eottae/privacy/) | 안전 정책 초안, 계정·데이터 삭제 경로 |

## 스크린샷

<table>
  <tr>
    <td align="center"><img src="3.%20구현%20이미지(5장이상)/02_공통_홈_모바일.png" alt="통합 홈 모바일" width="220"><br><sub>통합 홈 · 모바일</sub></td>
    <td align="center"><img src="3.%20구현%20이미지(5장이상)/10_매칭_추천_모바일.png" alt="매칭 추천 카드" width="220"><br><sub>오늘의 추천</sub></td>
    <td align="center"><img src="3.%20구현%20이미지(5장이상)/12_매칭_문답_모바일_라이트.png" alt="프로필 문답" width="220"><br><sub>프로필 문답</sub></td>
  </tr>
</table>

**6가지 테마** — 라이트(기본) · 컵케잌 · 사이버펑크 · 디즈니 · 다크 · 시스템(OS 설정 추적). 헤더의 스와치 피커로 바꾸며, 매칭 화면까지 같은 테마를 따라갑니다.

<img src="3.%20구현%20이미지(5장이상)/16_공통_홈_6테마_비교.png" alt="6가지 테마 비교" width="820">

전체 캡처와 설명은 [`3. 구현 이미지(5장이상)/captions.csv`](3.%20구현%20이미지(5장이상)/captions.csv)에 있습니다.

## 기술 스택

- **Next.js 15 (App Router) + React 19 + TypeScript** — `output: 'export'` 정적 내보내기, `basePath: /eottae`
- **순수 CSS 디자인 토큰** — UI 라이브러리 없음, `data-theme` 속성으로 6테마 전환, `prefers-reduced-motion` 대응
- **PWA** — manifest(192/512/maskable 아이콘), 오프라인 셸 서비스워커, iOS 홈 화면 추가 메타
- **Pretendard Variable** 자체 호스팅
- **GitHub Actions** — CI(타입체크+빌드), Pages 자동 배포, PR 자동 리뷰 봇, 사이트 헬스체크, 팀 활동 리포트

## 빠른 시작

Node.js 20 이상이 필요합니다.

```bash
git clone https://github.com/sterran123/eottae.git
cd "eottae/0. 소스코드/eottae-web"
npm ci
npm run dev          # http://localhost:3000/eottae/
```

배포와 같은 환경(정적 산출물 + `/eottae/` 경로)으로 확인하려면:

```bash
npm run typecheck
npm run build        # out/ 생성
npm run start        # http://localhost:3000/eottae/ — tools/serve_pages_preview.mjs
```

## 폴더 구조

```
0. 소스코드/eottae-web/     Next.js 앱 (src/app 라우트, src/components, public 에셋, docs 협업 문서)
1. 프로젝트 계획서/         기획·브랜딩·팀 작업지시서(WBS)·AI 협업 규칙
2. 프로젝트 설계서/         요구사항 마스터·API 계약·데이터 모델·테스트 케이스
3. 구현 이미지(5장이상)/     실제 실행 화면 캡처와 captions.csv
4. 프로젝트 결과 보고서/     결과 보고서 작성 가이드
5. 발표자료(PDF)/           기획 발표 자료
tools/                     미리보기 서버·캡처·PR 리뷰 봇·매니페스트 갱신 스크립트
```

## 팀

| 이름 | 1차 담당 | 요구사항 ID |
|---|---|---|
| 김민기 | 전체 기본 틀 · 통합 홈/내비게이션 · 테마·브랜드 · PWA shell · 문서 통합 | CORE-001~004 |
| 오하율 | 매칭 프로필·취향·추천 UI/UX 및 접근성 | MATCH-001·002·009 |
| 주한태 | 인증 · 성인 확인 · 매칭 API · DB · RLS 보안 | MATCH-003~006 |
| 손준혁 | 1:1 채팅 · 신고·차단 · 통합 품질 검증/시연 증빙 | MATCH-007·008 |

## 협업 방법

1. 최신 `main`에서 브랜치를 만듭니다 — `feat/{요구사항ID}-설명` (예: `feat/MATCH-007-chat`)
2. 작업 후 PR을 엽니다. `main` 직접 push는 막혀 있습니다. 이슈를 다 끝냈으면 PR 본문에 `Closes #이슈번호`, 일부만 했으면 `Refs #번호`를 쓰세요. 안 써도 머지 후 봇이 관련 이슈를 찾아, AI가 끝낸 체크 항목을 근거와 대조해 자동으로 체크하고 전부 체크되면 이슈를 닫습니다.
3. PR을 열거나 push하면 자동 검사가 돌고, 모두 통과하면 리뷰 봇이 승인·머지합니다.

   | 검사 | 내용 | 통과 못 하면 |
   |---|---|---|
   | 빌드 CI | `npm ci` → `typecheck` → `build` | 실패 로그·재현 명령 안내 → 고쳐서 push |
   | 보안 스캔 | 추가된 줄의 키·토큰 하드코딩, 브라우저 코드의 `service_role`, 비밀값 기본값, `eval` 등 | 위치·고치는 법 안내 → 고쳐서 push |
   | AI 코드 리뷰 | Devin이 diff를 읽고 정확성·보안(ADR-002·003·005)·저장소 규칙을 판정 | 「반드시 고칠 것」 안내 → 고쳐서 push (재실행은 `/ai-review` 댓글) |
   | 충돌 | main과 머지 가능한지 | 충돌 파일·해결 명령 안내 → 해결 후 push |
   | 보호 영역 | `.github/`·`package.json`·`.env*`·인증/DB/RLS 코드(`supabase/`, `src/lib/{server,auth,supabase}/`, `src/app/api/`) | 나머지 검사 통과 후 **담당자 Approve**하면 머지 |

   Draft PR도 판정 결과를 알려 주고, 「Ready for review」로 바꾸면 머지됩니다.
4. 이슈나 PR 댓글에 `@devin 질문`을 쓰면 AI가 답글을 남깁니다 (collaborator 전용).
5. 작업을 마치면 `0. 소스코드/eottae-web/docs/AI_REPORT_LOG.md`에 **실행한 검증과 실행하지 못한 항목을 구분해** 기록합니다.

규칙 원문: [`AGENTS.md`](0.%20소스코드/eottae-web/AGENTS.md) · [`AI 협업 가이드`](0.%20소스코드/eottae-web/docs/AI_에이전트_협업_가이드.md) · [`요구사항 마스터`](2.%20프로젝트%20설계서/요구사항_마스터.md) · [`처음 읽기`](README_처음읽기.md)

## 안전 원칙

- 로맨스 매칭과 1:1 채팅은 **만 19세 이상 성인 확인 사용자 전용**으로 설계합니다. 성인 확인 전에는 데이터를 열지 않습니다.
- 쌍방 동의 전에는 사진·연락처를 공개하지 않으며, 차단·신고를 기본 기능으로 둡니다.
- 신분 원본·정밀 위치·연락처는 수집하지 않는 것을 기본으로 합니다.
- 운영 키와 사용자 데이터는 Git에 올리지 않습니다 (`.env`는 커밋 대상이 아님).

---

<sub>교육 과정 팀 프로젝트 · 계획/시연용 · 실제 서비스가 아닙니다.</sub>
