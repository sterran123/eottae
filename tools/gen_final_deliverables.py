# -*- coding: utf-8 -*-
# #119 최종 제출 산출물 생성기 — 결과보고서 xlsx+md·발표 HTML·PDF를 만든다.
# 사용: python tools/gen_final_deliverables.py  (openpyxl 필요, PDF는 headless Chrome)
# -*- coding: utf-8 -*-
# #119 — 결과보고서 작성본(xlsx+md) + 최종 발표 PDF 생성기. 저장소 기록만 근거로 쓴다(가짜 PASS 금지).
import subprocess, openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

R = r"C:\Users\defaultuser0\Documents\어때_TEAM_PROJECT_FINAL_v1"
DEMO = "https://sterran123.github.io/eottae/"

# ── 결과보고서 내용 (양식 항목 + README_결과보고서_작성예정.md 추가 항목) ──
FIELDS = [
    ("프로젝트 제목", "「어때?」 — 취향으로 시작되는 인연\n(19+ 로맨스 매칭 · 데이트 소모임 · 모바일 청첩장, 한 사이트 한 브랜드 통합 플랫폼)"),
    ("과정명", "미확정 — 학원 양식 확정 후 기입 (실행_결정대기_로그 DEC-02)"),
    ("이름", "어때? 팀 — 김민기(총괄) · 오하율 · 주한태 · 손준혁"),
    ("발표일", "2026-11-06"),
    ("컨셉",
     "취향·가치관 입력으로 시작하는 1:1 로맨스 매칭을 중심으로, 만남 이후 데이트 코스·소모임, "
     "커플이 된 뒤 모바일 청첩장까지 이어지는 「관계 여정」 플랫폼.\n"
     "실서비스 연동 없는 단계는 예시 데이터(목업)로 전체 화면·흐름을 먼저 완성해 검증하는 전략 "
     "(강사 안내 DEC-10, 목업 결정 DEC-11) — 데모는 데모로 표기하고 실연동은 최종 제출 후 과제로 남긴다."),
    ("기능 (구현 여부)",
     "[예]\n"
     "- CORE-001 통합 홈·3모듈 메뉴 (정적 27 라우트 빌드)\n"
     "- CORE-002 반응형·접근성·6테마 라이트/다크\n"
     "- CORE-003 PWA shell·오프라인 폴백 (TC-012 실기기 PASS 2026-10-28)\n"
     "- MATCH-001 취향 온보딩·MATCH-002 추천 카드·MATCH-009 공통 질문 (데모 데이터)\n"
     "- ACT-001~003 데이트 코스 8·소모임 13 데모 — 목록·상세·참가 요청·일정 투표·모임 만들기·신고·후기\n"
     "- INV-001~004 모바일 청첩장 목업 — 에디터·미리보기(테마 20종)·공개 하객 토큰 화면·RSVP 폼·모의 결제\n"
     "[부분]\n"
     "- CORE-004 계정 삭제 — 안내·저장 위치 문구 완료, 삭제 Edge Function 미구현\n"
     "- MATCH-003~006 로그인·성인 게이트·매칭·추천 필터 — UI·RLS SQL(0001~0003) 있음, 실연동 미구현. "
     "공개 데모는 시연용 성인 확인 후 열림(NEXT_PUBLIC_DEMO_ADULT_BYPASS)\n"
     "- MATCH-007·008 채팅·신고·차단 — 클라이언트 데모·DTO·RLS SQL 있음, 서버 실시간 효력 미구현\n"
     "[아니오]\n"
     "- ACT-004 커플 퀘스트(후속 범위) · 실결제·정산 · 실시간 Realtime · 정식 성인확인(BBaton)·PayApp 실키"),
    ("특장점",
     "- 한 사이트·한 브랜드로 3개 모듈 — 6테마 디자인 시스템, 360px 모바일 퍼스트\n"
     "- 목업 우선 전략: 실연동 전에 전체 사용자 흐름을 데모로 완성해 검증, DEC 로그로 모든 범위 결정 추적\n"
     "- RLS 권한 설계 SQL(profiles·likes·matches·messages·blocks·reports, get_recommendations·record_like_decision RPC)\n"
     "- CODEOWNERS 자동 리뷰·로컬 AI 코드 리뷰 게이트·FILE_INDEX.csv+MANIFEST.sha256 패키지 무결성 검증\n"
     "- Fail-closed 설계 — 검증된 성인만 매칭(공개 배포는 시연 확인 뒤에만 데모 개방)"),
    ("사용기술 및 개발환경",
     "- 개발환경: Windows 11, VS Code, Git, GitHub(이슈·PR·CODEOWNERS·Actions)\n"
     "- 프론트: Next.js 15 (App Router) · React · TypeScript · 정적 export\n"
     "- 배포: GitHub Pages + PWA(서비스워커·manifest·오프라인 페이지)\n"
     "- DB(설계 반영): Supabase Postgres — migrations 0001~0003_match_core.sql, RLS 정책·RPC 함수\n"
     "- 도구: Node 22+, Python(매니페스트), 로컬 Grok·AI 코드 리뷰·@grok 작업자, 헤드리스 Chrome CDP 캡처"),
    ("최종 DB/ERD",
     "- 논리모델: 2. 프로젝트 설계서/DB_논리모델_전체3단계.md\n"
     "- 물리 DDL: 0. 소스코드/eottae-web/supabase/migrations/ 0001·0002·0003_match_core.sql\n"
     "  (profiles·likes·matches·conversations·messages·blocks·reports + RLS, get_recommendations·record_like_decision RPC)\n"
     "- Supabase 프로젝트는 생성됨(ADR-005, 김민기 소유). 클라우드 db push·실데이터는 최종 제출 후 과제 — 목업 제출이라 미적용"),
    ("테스트 결과·스크린샷",
     "- 기준: 2. 프로젝트 설계서/테스트_케이스_마스터.md (데모는 「데모 판정」으로만 표기)\n"
     "- PASS(데모 판정): TC-003 비로그인 접근 차단, TC-004 미성년 성인확인 거절, TC-005 온보딩 유효성, "
     "TC-007 추천 차단·휴면 제외, TC-013 소모임 참가·타인 모임 보호, TC-016 RSVP 토큰 접근 제어\n"
     "- PASS: TC-001 화면 순회, TC-002 반응형·테마 실측, TC-012 PWA·오프라인(실기기), TC-017 공개 저장소 비밀키·개인정보 스캔\n"
     "- 서버 단계 없음(DEC-11): TC-006 동시 매칭 경쟁, TC-008~010 채팅·차단·신고 서버 효력\n"
     "- 증빙: 3. 구현 이미지(5장이상)/ 실화면 캡처 30장 + captions.csv 촬영 조건 기록\n"
     "- 패키지 무결성: FILE_INDEX.csv + MANIFEST.sha256 해시 검증"),
    ("팀원별 기여",
     "- 김민기(@sterran123, 총괄): CORE-001~004(홈·브랜드·반응형·PWA·설정), 2차 소모임 데모(#69), "
     "INV-004 테마 미리보기·모의 결제, DEC-13 청첩장 포지셔닝, Pages 배포·AI 리뷰·@grok 작업자·매니페스트 인프라, 문서 총괄\n"
     "- 오하율(@HaYul0611): MATCH-001·002·009(온보딩·추천 카드·공통 질문, #65), ACT-001 소모임 검색·필터, "
     "INV-001 청첩장 에디터·미리보기·공개 화면(#93·#97)\n"
     "- 주한태(@gksxogksxo1001-sketch): MATCH-003~006(가입·로그인 UI #57, 인증·성인 게이트·매칭 SQL 검증), "
     "ACT-002 모임 생성·참가·권한, INV-002 행사·게스트·공개 정책(#103), TC-003·004·007·013·017 데모 검증(#107~#110)\n"
     "- 손준혁(@sonjunhyek2): MATCH-007·008(채팅·신고 DTO·차단 가드 #47·#104), ACT-003 일정 투표·신고, "
     "INV-003 RSVP·접근 제어(#101), TC-016·008~010 기록·QA·캡처 장부(#60·62·63)"),
    ("미구현 사유",
     "- 실서버 연동(Supabase 실데이터·Realtime 채팅·계정 삭제 Edge Function·BBaton 성인인증·PayApp 실결제)은 "
     "담당 강사 안내로 3차까지 목업 범위(DEC-10·DEC-11) — 개인·비사업자 팀의 실업체 계약·실계정 E2E가 제출 범위 밖\n"
     "- ACT-004 커플 퀘스트는 2차 P1 우선순위 밖이라 착수하지 않음\n"
     "- 데모에서 확인된 것만 PASS로 기록하고 서버 효력은 「서버 단계 없음」으로 표기 — 허위 완료 방지"),
    ("개선 사항",
     "- Supabase db push + 두 계정 실데이터 E2E(매칭·채팅·차단 서버 효력)\n"
     "- BBaton 정식 성인확인·PayApp 실결제 연동과 데모 바이패스 제거로 fail-closed 복귀\n"
     "- 신고 처리 운영 인력·정산 법무 검토(DEC-03, INV-004), 2차 위치·장소 공급자(DEC-05)\n"
     "- 청첩장 실사 사진 저작권 검증 체계(#118 CREDITS)와 캡처 재촬영 자동화"),
    ("시연 URL", DEMO + "\n(정적 데모 — 매칭·채팅·청첩장은 예시 데이터 목업, 실계정·실결제 없음)"),
]

md_lines = ["# 어때_팀프로젝트_결과보고서_작성본", "",
            "작성: 2026-11-06 (김민기 대행 — Refs #119). 양식: `양식원본/개인 프로젝트 결과 보고서.xlsx` 항목.",
            "규칙: 저장소 기록만 근거 — 데모는 데모로, 미실행은 미실행으로 표기.", ""]
for k, v in FIELDS:
    md_lines += [f"## {k}", "", v, ""]
open(f"{R}/4. 프로젝트 결과 보고서/어때_팀프로젝트_결과보고서_작성본.md", "w", encoding="utf-8").write("\n".join(md_lines))

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "팀 프로젝트 결과보고서"
head = Font(bold=True, size=14); lab = Font(bold=True, size=11)
fill = PatternFill("solid", fgColor="F3EFE8")
thin = Border(*[Side(style="thin", color="999999")]*4)
ws.column_dimensions["A"].width = 22
ws.column_dimensions["B"].width = 110
ws["A1"] = "팀 프로젝트 결과보고서"; ws["A1"].font = Font(bold=True, size=16)
r = 3
for k, v in FIELDS:
    ws.cell(r, 1, k).font = lab
    c = ws.cell(r, 2, v)
    c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.cell(r, 1).alignment = Alignment(vertical="top", wrap_text=True)
    ws.cell(r, 1).fill = fill
    for col in (1, 2): ws.cell(r, col).border = thin
    r += 1
wb.save(f"{R}/4. 프로젝트 결과 보고서/어때_팀프로젝트_결과보고서_작성본.xlsx")
print("xlsx+md written")

# ── 발표 PDF용 HTML (README_발표자료_작성예정.md 목차 7개) ──
IMG = "../3. 구현 이미지(5장이상)"
def shot(f, cap, h=430):
    return f'<div class="shot"><img src="{IMG}/{f}" style="max-height:{h}px"><p>{cap}</p></div>'

html = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
@page {{ size: 297mm 167mm; margin: 0; }}
* {{ margin:0; box-sizing:border-box; font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif; }}
.slide {{ width:297mm; height:167mm; padding:12mm 16mm; page-break-after:always; background:#fdfcf9; color:#2c2523; display:flex; flex-direction:column; }}
h1 {{ font-size:30pt; color:#7c3aed; }} h2 {{ font-size:20pt; color:#7c3aed; margin-bottom:6mm; }}
h3 {{ font-size:12pt; margin:4mm 0 2mm; }} p,li {{ font-size:10.5pt; line-height:1.55; }}
ul {{ padding-left:6mm; }} .cols {{ display:flex; gap:8mm; }} .col {{ flex:1; }}
.card {{ background:#f4efe8; border:1px solid #e2d9cc; border-radius:4mm; padding:4mm 5mm; margin-bottom:3mm; }}
.shot {{ text-align:center; }} .shot img {{ max-width:100%; border:1px solid #e2d9cc; border-radius:2mm; }}
.shot p {{ font-size:8.5pt; color:#6b5f55; margin-top:1.5mm; }}
.grid {{ display:flex; gap:5mm; flex-wrap:wrap; justify-content:center; }}
.badge {{ display:inline-block; background:#7c3aed; color:#fff; border-radius:99px; padding:1mm 4mm; font-size:9pt; margin-right:2mm; }}
.dim {{ color:#6b5f55; font-size:9pt; }} table {{ border-collapse:collapse; width:100%; font-size:9.5pt; }}
td,th {{ border:1px solid #d8cec0; padding:1.5mm 2.5mm; text-align:left; vertical-align:top; }}
th {{ background:#f4efe8; }} .foot {{ margin-top:auto; font-size:8.5pt; color:#a09586; }}
</style></head><body>

<div class="slide" style="justify-content:center;align-items:center;text-align:center">
  <div class="badge">최종 발표 · 2026-11-06</div>
  <h1 style="font-size:54pt;margin:8mm 0 4mm">어때?</h1>
  <p style="font-size:16pt">취향으로 시작되는 인연 — 로맨스 매칭 · 데이트 소모임 · 모바일 청첩장</p>
  <p class="dim" style="margin-top:10mm">김민기(총괄) · 오하율 · 주한태 · 손준혁 ｜ 시연: {DEMO}</p>
</div>

<div class="slide"><h2>1. 문제·타깃과 연령 안전 정책</h2><div class="cols">
<div class="col">
  <div class="card"><h3>문제·타깃</h3><p>조건 나열형 소개팅이 아니라 취향·가치관으로 시작하는 만남을 원하는 19세 이상 사용자. 만남 이후 데이트·관계 유지까지 한 서비스에서 이어지는 흐름이 없다.</p></div>
  <div class="card"><h3>연령 안전 (SEC-001)</h3><ul>
    <li>로맨스 매칭은 검증된 만 19세 이상만 — 미인증 접근은 fail-closed로 차단(ADR-002)</li>
    <li>생년월일 기준 성인 판정, 신분증·OCR 원본은 수집하지 않음(DEC-01)</li>
    <li>이번 제출은 목업: 공개 데모는 시연용 성인 확인 후에만 매칭 데모 개방, 실데이터 단계에서 바이패스 제거(DEC-11)</li></ul></div>
</div>
<div class="col" style="flex:0 0 74mm">{shot("29_매칭_미성년_성인확인거절_모바일.png","만 19세 미만 입력 거절 — TC-004 데모 판정",430)}</div>
</div><p class="foot">어때? 최종 발표 · 1/7</p></div>

<div class="slide"><h2>2. 3개 모듈 플랫폼 개요와 1차 MVP 범위</h2><div class="cols">
<div class="col"><div class="card"><h3>① 매칭 (1차 MVP)</h3><p>온보딩 → 오늘의 추천 → 관심·문답 → 매칭 → 1:1 채팅·신고/차단. 데모 데이터로 전 흐름 동작, 실연동은 최종 후 과제.</p></div></div>
<div class="col"><div class="card"><h3>② 데이트·소모임 (2차)</h3><p>코스 8개·소모임 13개 데모 — 필터·상세·참가 요청·일정 투표·모임 만들기·후기.</p></div></div>
<div class="col"><div class="card"><h3>③ 모바일 청첩장 (3차, DEC-13)</h3><p>매칭으로 탄생한 커플이 무료로 쓰는 연계 별개 플랫폼. 에디터·테마 20종·공개 하객 링크·RSVP·모의 결제 목업.</p></div></div>
</div>
<div class="card"><h3>범위 원칙</h3><p>3차 제출까지 전부 예시 데이터 목업(DEC-11). 데모는 데모로, 서버 효력은 「서버 단계 없음」으로 표기 — 가짜 PASS 금지 규칙.</p></div>
<p class="foot">어때? 최종 발표 · 2/7</p></div>

<div class="slide"><h2>3. 메인페이지 UX와 매칭 사용자 흐름</h2><div class="cols">
<div class="col" style="flex:0 0 118mm">
  <div class="grid">
  {shot("02_공통_홈_모바일.png","통합 홈 — 3모듈 진입·6테마",330)}
  {shot("08_매칭_온보딩_모바일.png","취향 온보딩 — 관심사·거리 게이지",330)}
  </div></div>
<div class="col">
  <div class="card"><h3>흐름</h3><p>홈 → 매칭 진입(로그인·성인 확인 게이트) → 취향 온보딩 → 오늘의 추천 카드 → 관심 보내기 → 상호 관심 시 매칭 → 공통 질문 → 1:1 채팅</p></div>
  <div class="card"><h3>UX 포인트</h3><ul><li>모바일 퍼스트 360px, 터치 대상 44px, 6테마 라이트/다크</li>
  <li>PWA 설치·오프라인 폴백 페이지</li>
  <li>비로그인 접근 시 매칭 본문 대신 안내 화면(TC-003)</li>
  <li>차단·휴면·탈퇴 후보는 추천에서 제외 표시(TC-007)</li></ul></div>
</div></div><p class="foot">어때? 최종 발표 · 3/7</p></div>

<div class="slide"><h2>4. 시스템 구성도·ERD·핵심 요구사항</h2><div class="cols">
<div class="col"><div class="card"><h3>구성도</h3>
<pre style="font-size:10pt;line-height:1.7">브라우저(PWA) ── 정적 export ──▶ GitHub Pages
     │ 데모: localStorage 예시 데이터
     │ 실데이터(최종 후): ──▶ Supabase Postgres · Auth · Realtime
     └ 0001~0003_match_core.sql — RLS 정책 + RPC</pre></div>
<div class="card"><h3>핵심 요구사항(P0)</h3><ul>
<li>성인 게이트 fail-closed · 세션 만료 차단</li>
<li>상호 동의 매칭 1건 · 차단 즉시 채팅 정지</li>
<li>공개 모임만 조회 · 참가 중복 방지 · 소유자만 편집</li>
<li>RSVP 토큰별 개인정보 비노출</li></ul></div></div>
<div class="col"><div class="card"><h3>ERD 요약</h3><ul>
<li>profiles · onboarding_answers</li>
<li>recommendations · likes → matches</li>
<li>conversations · messages</li>
<li>blocks · reports (운영 큐 권한 분리)</li>
<li>invitations · guests · rsvp_responses</li>
<li>RPC: get_recommendations · record_like_decision</li></ul>
<p class="dim">전체: 2. 프로젝트 설계서/DB_논리모델_전체3단계.md</p></div></div>
</div><p class="foot">어때? 최종 발표 · 4/7</p></div>

<div class="slide"><h2>5. 팀 역할 분담·기술 스택·개발 일정</h2><div class="cols">
<div class="col">
<table><tr><th>팀원</th><th>담당</th></tr>
<tr><td>김민기(총괄)</td><td>홈·브랜드·반응형·PWA·설정, 소모임 데모, INV-004 모의결제, 배포·AI리뷰·매니페스트 인프라, 문서 총괄</td></tr>
<tr><td>오하율</td><td>매칭 온보딩·추천·공통질문, 소모임 검색·필터, 청첩장 에디터·미리보기</td></tr>
<tr><td>주한태</td><td>가입·로그인·성인 게이트·매칭 SQL, 모임 권한, 청첩장 공개 정책, TC 데모 검증</td></tr>
<tr><td>손준혁</td><td>채팅·신고·차단 DTO·가드, 일정 투표·신고, RSVP 접근 제어, TC 기록·QA·캡처</td></tr></table></div>
<div class="col">
<div class="card"><h3>기술 스택</h3><p>Next.js 15 · React · TypeScript · 정적 export · GitHub Pages · PWA · Supabase(Postgres·RLS) 설계</p></div>
<div class="card"><h3>일정</h3><p>1차 공통 셸·매칭 UI (10월) → 2차 소모임 데모 (11/02) → 3차 청첩장 목업·문서 마무리 (11/06 최종 제출)</p></div>
<div class="card"><h3>협업 방식</h3><p>이슈→브랜치→PR, CODEOWNERS 자동 리뷰·로컬 AI 코드 리뷰 게이트, FILE_INDEX+MANIFEST.sha256 무결성, @grok 로컬 작업자</p></div>
</div></div><p class="foot">어때? 최종 발표 · 5/7</p></div>

<div class="slide"><h2>6. 실제 구현 데모 — 실화면 캡처 30장 중 6장</h2>
<div class="grid">
{shot("10_매칭_추천_모바일.png","오늘의 추천",300)}
{shot("18_매칭_채팅_목록_및_패널.png","채팅 목록·패널",300)}
{shot("26_소모임_참가신청_중복방지_모바일.png","소모임 참가 신청(TC-013)",300)}
{shot("20_청첩장_테마목록_모바일.png","청첩장 테마 목록",300)}
{shot("22_청첩장_하객공개_명단없음_모바일.png","하객 공개 화면 — 명단 비노출",300)}
{shot("28_매칭_비로그인_접근차단_모바일.png","비로그인 접근 차단(TC-003)",300)}
</div>
<p class="foot">전체 캡처 30장·조건: 3. 구현 이미지(5장이상)/captions.csv · 어때? 최종 발표 · 6/7</p></div>

<div class="slide"><h2>7. 테스트·보안 결과 / 수익 모델 / 로드맵</h2><div class="cols">
<div class="col">
<div class="card"><h3>테스트·보안</h3><ul>
<li>데모 판정 PASS: TC-003·004·005·007·013·016 (접근 차단·성인 거절·유효성·추천 제외·참가 보호·RSVP 제어)</li>
<li>PASS: TC-001·002·012·017 (순회·반응형·PWA·비밀키 스캔)</li>
<li>서버 단계 없음(DEC-11): TC-006·008·009·010</li>
<li>공개 저장소 실키·개인정보 없음(TC-017), CODEOWNERS·AI 리뷰 게이트</li></ul></div>
<div class="card"><h3>수익 모델 (DEC-13)</h3><p>청첩장 = 매칭 연계 별개 플랫폼·프리미엄. 커플은 무료 연계, 단독 이용은 테스트 무료 후 사진 업로드 임계 초과 시 유료 전환. 실결제·정산은 미적용.</p></div>
</div>
<div class="col">
<div class="card"><h3>2~3차 로드맵</h3><ul>
<li>Supabase 실데이터 적용·두 계정 E2E, Realtime 채팅·차단 서버 효력</li>
<li>BBaton 정식 성인확인·PayApp 실결제, fail-closed 복귀</li>
<li>신고 운영 인력(DEC-03)·정산 법무 검토, 위치 공급자(DEC-05)</li>
<li>ACT-004 커플 퀘스트, 청첩장 실사진 라이선스 체계</li></ul></div>
<div class="card"><h3>시연</h3><p>{DEMO}<br><span class="dim">정적 데모 — 예시 데이터 목업, 실계정·실결제 없음</span></p></div>
</div></div><p class="foot">어때? 최종 발표 · 7/7</p></div>
</body></html>"""

open(f"{R}/5. 발표자료(PDF)/어때_팀프로젝트_최종발표.html", "w", encoding="utf-8").write(html)
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
subprocess.run([chrome, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                f"--print-to-pdf={R}/5. 발표자료(PDF)/어때_팀프로젝트_최종발표.pdf",
                f"file:///{R}/5. 발표자료(PDF)/어때_팀프로젝트_최종발표.html"], check=True, timeout=120)
print("pdf written")
