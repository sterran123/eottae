<div align="center">

# 어때? (EOTTAE)

**취향으로 시작되는 인연 — 하나의 앱, 세 가지 순간**

첫 매칭부터 데이트·소모임, 모바일 청첩장까지 관계의 여정을 하나로 잇는 PWA 웹앱 · 4인 팀 프로젝트

[![ci](https://github.com/sterran123/eottae/actions/workflows/ci.yml/badge.svg)](https://github.com/sterran123/eottae/actions/workflows/ci.yml)
[![deploy-pages](https://github.com/sterran123/eottae/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/sterran123/eottae/actions/workflows/deploy-pages.yml)

### [▶ 데모 사이트 열기 — sterran123.github.io/eottae](https://sterran123.github.io/eottae/)

<img src="3.%20구현%20이미지(5장이상)/01_공통_홈_데스크톱.png" alt="어때? 통합 홈 화면 (라이트 테마)" width="820">
<br>
<sub>통합 홈 · 데스크톱 라이트</sub>

</div>

> **현재 단계: 3차 최종 제출 (목업)** — DEC-11(2026-11-03)에 따라 1·2·3차 서비스 모두 **예시 데이터로 동작하는 데모**로 완성했습니다.
> 실결제·실제 본인 확인 연동은 이번 범위가 아닙니다. 데모 경로(데모 로그인·매칭·소모임·청첩장)의 입력은 **이 브라우저(localStorage)에만** 저장됩니다. 이메일 회원가입·로그인은 인증 서버(Supabase)를 쓰며, 보내는 항목과 저장 위치는 [개인정보 안내](https://sterran123.github.io/eottae/privacy/)에 적어 두었습니다.

---

## 무엇을 만드나요

**웹사이트/PWA 1개** 위에 공통 브랜딩·회원·설정·안전·디자인 시스템을 두고, 사용자 여정으로 이어지는 **서비스 3개**를 단계적으로 열었습니다.

| 단계 | 서비스 | 경로 | 상태 |
|---|---|---|---|
| 1차 MVP | 💗 **매칭** — 취향 온보딩, 카드 추천, 프로필 문답·공통 질문, 쌍방 동의 후 1:1 채팅, 신고·차단, 시연용 성인 확인 | `/match` | 🟢 데모 체험 가능 |
| 2차 | ✦ **데이트·소모임** — 코스 탐색, 소모임 만들기·참가 요청, 일정 투표, 모임장 관리·후기 | `/activities` | 🟢 데모 체험 가능 |
| 3차 | ✉ **모바일 청첩장** — 테마 16종, 에디터·미리보기, 공개 링크, 참석 회신(RSVP), 소유자 전용 정책(토큰 재발급·삭제), 테마 모의 결제 | `/invitations` | 🟢 데모 체험 가능 |

### 데모 체험 방법

1. [데모 사이트](https://sterran123.github.io/eottae/)를 엽니다. 홈·데이트·소모임·청첩장은 바로 둘러볼 수 있습니다.
2. **매칭**은 로그인이 필요합니다. 상단 「로그인」 → **「데모로 로그인」** 을 누르면 이 브라우저에만 데모 세션이 생깁니다 (실제 서버에 접속하지 않음).
3. 추천·문답·공통 질문·채팅에 처음 들어가면 **시연용 성인 확인**(생일 기준 만 19세 판정)이 나옵니다. 실제 본인 확인이 아니며, 생년월일 원본은 저장하지 않습니다.
4. 청첩장 하객 화면은 공개 링크로 엽니다 — 예: [샘플 하객 화면](https://sterran123.github.io/eottae/invitations/p/?t=k7Qm2pL9xRt4vNw8aB3cYd6e). 토큰이 없거나 틀린 링크는 행사 정보를 보여 주지 않습니다. 참석 회신(RSVP) 폼은 공유 토큰 `t`와 하객 토큰 `g`가 **모두 유효할 때만** 열립니다 (`t`만 있는 위 링크는 행사 화면까지).
5. 데모 기록은 **설정 → 계정 → 회원 탈퇴·데이터 삭제**에서 이 브라우저 기준으로 지울 수 있습니다.

### 둘러볼 수 있는 화면

| 화면 | 경로 | 내용 |
|---|---|---|
| 통합 홈 | [`/`](https://sterran123.github.io/eottae/) | 3개 서비스 입구, 이용 흐름, 안전 원칙, FAQ, 로드맵 |
| 매칭 | [`/match`](https://sterran123.github.io/eottae/match/) | 온보딩·추천·문답(40문항)·공통 질문·1:1 채팅·신고/차단 |
| 데이트·소모임 | [`/activities`](https://sterran123.github.io/eottae/activities/) · [`/activities/new`](https://sterran123.github.io/eottae/activities/new/) | 코스·소모임 탐색, 참가 요청(중복 방지), 일정 투표, 모임 만들기 |
| 모바일 청첩장 | [`/invitations`](https://sterran123.github.io/eottae/invitations/) · [`/invitations/new`](https://sterran123.github.io/eottae/invitations/new/) · [`/invitations/sample`](https://sterran123.github.io/eottae/invitations/sample/) | 테마 컬렉션, 만들기·편집·미리보기, 샘플 미리보기, 테마 모의 결제 |
| 청첩장 하객·회신 | `/invitations/p/?t=…` · `/invitations/rsvp/?t=…&g=…` | 공개 하객 화면(명단 비공개·검색엔진 미노출), 공유 토큰 `t`와 하객 토큰 `g`가 모두 유효할 때만 하객 RSVP 폼 |
| 청첩장 소유자 회신 목록 | [`/invitations/rsvp/?host=demo-inv-1`](https://sterran123.github.io/eottae/invitations/rsvp/?host=demo-inv-1) | 소유자 시연용 회신 목록(읽기 전용) — 하객 토큰 없이 소유자 예시 청첩장의 회신만 표시 |
| 설정 | [`/settings`](https://sterran123.github.io/eottae/settings/) | 6테마 선택, 데모 데이터 삭제, 안전·앱 정보 |
| 로그인 | [`/auth/login`](https://sterran123.github.io/eottae/auth/login/) | 데모 로그인 · 이메일 가입/로그인(인증 서버) |
| 오프라인 | [`/offline`](https://sterran123.github.io/eottae/offline/) | 네트워크 끊김 안내 (서비스워커 폴백) |
| 안전센터 · 개인정보 | [`/safety`](https://sterran123.github.io/eottae/safety/) · [`/privacy`](https://sterran123.github.io/eottae/privacy/) | 안전 정책, 저장 위치·계정·데이터 삭제 안내 |

## 스크린샷

모든 캡처는 실제 빌드 산출물을 띄워 찍은 화면입니다. 전체 목록과 촬영 환경은 [`3. 구현 이미지(5장이상)/captions.csv`](3.%20구현%20이미지(5장이상)/captions.csv)에 있습니다.

### ✉ 3차 · 모바일 청첩장

<table>
  <tr>
    <td align="center" valign="top" width="33%"><img src="3.%20구현%20이미지(5장이상)/20_청첩장_테마목록_모바일.png" alt="청첩장 허브 테마 컬렉션" width="240"><br><sub>청첩장 허브 · 테마 컬렉션</sub></td>
    <td align="center" valign="top" width="33%"><img src="3.%20구현%20이미지(5장이상)/21_청첩장_샘플미리보기_모바일.png" alt="청첩장 샘플 미리보기" width="240"><br><sub>샘플 미리보기</sub></td>
    <td align="center" valign="top" width="33%"><img src="3.%20구현%20이미지(5장이상)/22_청첩장_하객공개_명단없음_모바일.png" alt="샘플 미리보기 명단 비공개" width="240"><br><sub>샘플 미리보기 · 명단 비공개</sub></td>
  </tr>
  <tr>
    <td align="center" valign="top"><img src="3.%20구현%20이미지(5장이상)/23_청첩장_RSVP_회신폼_모바일.png" alt="RSVP 회신 폼" width="240"><br><sub>참석 회신(RSVP)</sub></td>
    <td align="center" valign="top"><img src="3.%20구현%20이미지(5장이상)/24_청첩장_RSVP_토큰거절_모바일.png" alt="RSVP 토큰 거절" width="240"><br><sub>하객 토큰 누락 · 회신 거절</sub></td>
    <td align="center" valign="top"><img src="3.%20구현%20이미지(5장이상)/25_청첩장_비소유자_편집거절_모바일.png" alt="비소유자 편집 거절" width="240"><br><sub>비소유자 · 편집 거절</sub></td>
  </tr>
</table>

### ✦ 2차 · 데이트·소모임 / 💗 1차 · 매칭 — 권한·안전 흐름

<table>
  <tr>
    <td align="center" valign="top" width="33%"><img src="3.%20구현%20이미지(5장이상)/26_소모임_참가신청_중복방지_모바일.png" alt="소모임 참가 신청 중복 방지" width="240"><br><sub>참가 신청 · 중복 방지</sub></td>
    <td align="center" valign="top" width="33%"><img src="3.%20구현%20이미지(5장이상)/27_소모임_타인모임_수정삭제불가_모바일.png" alt="타인 모임 수정 삭제 불가" width="240"><br><sub>타인 모임 · 수정·삭제 불가</sub></td>
    <td align="center" valign="top" width="33%"><img src="3.%20구현%20이미지(5장이상)/28_매칭_비로그인_접근차단_모바일.png" alt="비로그인 접근 차단" width="240"><br><sub>비로그인 · 매칭 접근 차단</sub></td>
  </tr>
  <tr>
    <td align="center" valign="top"><img src="3.%20구현%20이미지(5장이상)/29_매칭_미성년_성인확인거절_모바일.png" alt="미성년 성인 확인 거절" width="240"><br><sub>만 19세 미만 · 성인 확인 거절</sub></td>
    <td align="center" valign="top"><img src="3.%20구현%20이미지(5장이상)/30_매칭_추천_차단휴면제외_모바일.png" alt="추천 차단 휴면 제외" width="240"><br><sub>추천 · 차단·휴면 계정 제외</sub></td>
    <td align="center" valign="top"><img src="3.%20구현%20이미지(5장이상)/19_매칭_차단_신고_모달.png" alt="신고 차단 모달" width="240"><br><sub>신고 · 차단</sub></td>
  </tr>
</table>

### 💗 1차 · 매칭 데모

<table>
  <tr>
    <td align="center" valign="top" width="25%"><img src="3.%20구현%20이미지(5장이상)/08_매칭_온보딩_모바일.png" alt="취향 온보딩" width="200"><br><sub>취향 온보딩</sub></td>
    <td align="center" valign="top" width="25%"><img src="3.%20구현%20이미지(5장이상)/10_매칭_추천_모바일.png" alt="오늘의 추천" width="200"><br><sub>오늘의 추천</sub></td>
    <td align="center" valign="top" width="25%"><img src="3.%20구현%20이미지(5장이상)/12_매칭_문답_모바일_라이트.png" alt="프로필 문답" width="200"><br><sub>프로필 문답</sub></td>
    <td align="center" valign="top" width="25%"><img src="3.%20구현%20이미지(5장이상)/14_매칭_공통질문_모바일_라이트.png" alt="공통 질문" width="200"><br><sub>공통 질문</sub></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center"><img src="3.%20구현%20이미지(5장이상)/18_매칭_채팅_목록_및_패널.png" alt="1:1 채팅" width="820"><br><sub>1:1 채팅 · 목록과 대화 (데스크톱)</sub></td>
  </tr>
</table>

### 공통 · 6가지 테마와 PWA

**6가지 테마** — 라이트(기본) · 컵케잌 · 사이버펑크 · 디즈니 · 다크 · 시스템(OS 설정 추적). 헤더의 스와치 피커로 바꾸며, 세 서비스 모두 같은 테마를 따라갑니다.

<table>
  <tr>
    <td align="center"><img src="3.%20구현%20이미지(5장이상)/16_공통_홈_6테마_비교.png" alt="6가지 테마 비교" width="820"><br><sub>6테마 비교</sub></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center" valign="top" width="33%"><img src="3.%20구현%20이미지(5장이상)/02_공통_홈_모바일.png" alt="통합 홈 모바일" width="240"><br><sub>통합 홈 · 모바일</sub></td>
    <td align="center" valign="top" width="33%"><img src="3.%20구현%20이미지(5장이상)/13_매칭_문답_모바일_다크.png" alt="문답 다크" width="240"><br><sub>프로필 문답 · 다크</sub></td>
    <td align="center" valign="top" width="33%"><img src="3.%20구현%20이미지(5장이상)/07_오프라인_폴백_모바일.png" alt="오프라인" width="240"><br><sub>오프라인 폴백</sub></td>
  </tr>
</table>
## 기술 스택

- **Next.js 15 (App Router) + React 19 + TypeScript** — `output: 'export'` 정적 내보내기, `basePath: /eottae`
- **순수 CSS 디자인 토큰** — UI 라이브러리 없음, `data-theme` 속성으로 6테마 전환, `prefers-reduced-motion` 대응
- **PWA** — manifest(192/512/maskable 아이콘), 오프라인 셸 서비스워커, iOS 홈 화면 추가 메타
- **Pretendard Variable** 자체 호스팅
- **데모 데이터 계층** — 서비스별 `types.ts`·`demo-data.ts`·`demo-storage.ts`(localStorage), 정적 export에 맞춘 쿼리 기반 라우팅(`?t=`·`?g=`·`?edit=`)
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
4. 프로젝트 결과 보고서/     결과 보고서·진행 기록·디자인 검토
5. 발표자료(PDF)/           발표 자료(PDF)
tools/                     미리보기 서버·캡처·PR 리뷰 봇·매니페스트 갱신 스크립트
```

## 팀

| 이름 | GitHub | 1차 · 매칭 | 2차 · 데이트·소모임 | 3차 · 모바일 청첩장 | 공통·최종 |
|---|---|---|---|---|---|
| 김민기 (팀장) | [@sterran123](https://github.com/sterran123) | 전체 기본 틀 · 통합 홈/내비 · 테마·브랜드 · PWA (CORE-001~004) | 2차 데모 화면 구현 · 관계 퀘스트 (ACT-004) | 총괄 모니터링 · 테마 모의 결제 · DEC-13 포지셔닝 (INV-004) | PR 리뷰·머지, CI·리뷰 봇, 문서 통합 |
| 오하율 | [@HaYul0611](https://github.com/HaYul0611) | 취향 온보딩·추천 카드·문답·공통 질문 UI (MATCH-001·002·009) | 데이트·소모임 검색/필터 (ACT-001) | **메인** — 청첩장 에디터·미리보기·테마·공개 하객 뼈대 (INV-001) | 화면 설계 · 반응형 · 접근성 |
| 주한태 | [@gksxogksxo1001-sketch](https://github.com/gksxogksxo1001-sketch) | 인증·성인 확인·매칭 API·DB·RLS (MATCH-003~006) | 모임 생성·참가·권한 · TC-013 증빙 (ACT-002) | 행사·하객·공개 정책 — 소유자 전용 편집·토큰 재발급·삭제 (INV-002) | ERD·API · 보안 점검(TC-017) |
| 손준혁 | [@sonjunhyek2](https://github.com/sonjunhyek2) | 1:1 채팅 · 신고·차단 (MATCH-007·008) | 일정 투표·알림·신고 (ACT-003) | RSVP 응답·접근 제어 · QA 캡처 (INV-003) | 테스트 케이스 · 시연 증빙 |
## 협업 방법

1. 최신 `main`에서 브랜치를 만듭니다 — `feat/{요구사항ID}-설명` (예: `feat/MATCH-007-chat`)
2. 작업 후 PR을 엽니다. `main` 직접 push는 막혀 있습니다. 이슈를 다 끝냈으면 PR 본문에 `Closes #이슈번호`, 일부만 했으면 `Refs #번호`를 쓰세요. 안 써도 머지 후 봇이 관련 이슈를 찾아, AI가 끝낸 체크 항목을 근거와 대조해 자동으로 체크하고 전부 체크되면 이슈를 닫습니다.
3. PR을 열거나 push하면 자동 검사가 돌고, 모두 통과하면 리뷰 봇이 승인·머지합니다.

   | 검사 | 내용 | 통과 못 하면 |
   |---|---|---|
   | 빌드 CI | `npm ci` → `typecheck` → `build` | 실패 로그·재현 명령 안내 → 고쳐서 push |
   | 보안 스캔 | 추가된 줄의 키·토큰 하드코딩, 브라우저 코드의 `service_role`, 비밀값 기본값, `eval` 등 | 위치·고치는 법 안내 → 고쳐서 push |
   | AI 코드 리뷰 | 로컬 Grok이 diff를 읽고 정확성·보안(ADR-002·003·005)·저장소 규칙을 판정 (`ai-review` 상태). 리뷰는 하나씩 순서대로, 보통 4~17분. 김민기 PC가 꺼져 있으면 다음 확인까지 기다림 | 「반드시 고칠 것」 안내 → 고쳐서 push (재실행은 `/ai-review` 댓글) |
   | 충돌 | main과 머지 가능한지 | 충돌 파일·해결 명령 안내 → 해결 후 push |
   | 보호 영역 | `.github/`·`package.json`·`.env*`·인증/DB/RLS 코드(`supabase/`, `src/lib/{server,auth,supabase}/`, `src/app/api/`) | 나머지 검사 통과 후 **담당자 Approve**하면 머지 |

   Draft PR도 판정 결과를 알려 주고, 「Ready for review」로 바꾸면 머지됩니다.
4. 이슈나 PR의 **일반 댓글**에 `@grok 질문`을 쓰면 로컬 Grok이 코드를 읽고 답만 답니다(수정하지 않음). 줄 단위 리뷰 코멘트는 안 됩니다. **저장소 write 권한 팀원만** 호출할 수 있습니다. 👀 반응은 처리 중, 답은 김민기 계정 이름으로 달리며 요청자를 멘션합니다. 김민기 PC 작업자가 5분마다 확인하므로 PC가 꺼져 있으면 늦어집니다. (2026-10-28부터 Devin은 쓰지 않습니다.)
5. 작업을 마치면 `0. 소스코드/eottae-web/docs/AI_REPORT_LOG.md`에 **실행한 검증과 실행하지 못한 항목을 구분해** 기록합니다.

규칙 원문: [`AGENTS.md`](0.%20소스코드/eottae-web/AGENTS.md) · [`AI 협업 가이드`](0.%20소스코드/eottae-web/docs/AI_에이전트_협업_가이드.md) · [`요구사항 마스터`](2.%20프로젝트%20설계서/요구사항_마스터.md) · [`처음 읽기`](README_처음읽기.md)

## 안전 원칙

- 로맨스 매칭과 1:1 채팅은 **만 19세 이상 성인 확인 사용자 전용**으로 설계합니다. 성인 확인 전에는 데이터를 열지 않습니다.
- 쌍방 동의 전에는 사진·연락처를 공개하지 않으며, 차단·신고를 기본 기능으로 둡니다.
- 신분 원본·정밀 위치·연락처는 수집하지 않는 것을 기본으로 합니다.
- 운영 키와 사용자 데이터는 Git에 올리지 않습니다 (`.env`는 커밋 대상이 아님).

---

<sub>교육 과정 팀 프로젝트 · 3차 최종 제출(목업) · 실제 서비스가 아닙니다.</sub>
