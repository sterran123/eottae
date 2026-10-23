# AI Report Log

## 2026-05-26 (김민기 작업)
- [신규] public/index.html 대시보드 Mock UI 구현
- [신규] public/page/fridge.html, recipes.html, shopping.html, expenses.html 기본 화면 생성
- [신규] public/css 하위 공통/화면별 스타일 분리
- [신규] public/js 하위 core/ui/data 모듈 구조 생성
- [변경] public/js/firebase-config.js를 브라우저 ES Module에서 재사용 가능한 설정 export 파일로 정리

## 2026-05-26 추가 작업 (김민기 작업)
- [변경] public/index.html을 서비스 소개 랜딩 페이지로 전환
- [신규] public/page/dashboard.html 앱 대시보드 생성
- [신규] Firebase Auth 기반 로그인, 이메일 회원가입, 이메일 인증, Google 로그인, 비밀번호 재설정 구현
- [신규] Google 로그인 후 필수 회원정보 입력 플로우 구현
- [신규] 약관 열람 후 동의 완료 방식의 회원가입 UI 구현
- [변경] 냉장고/식비/레시피 화면을 Mock 데이터가 아닌 사용자별 Firestore 데이터 기반으로 전환
- [신규] 식재료 구매 금액 입력 시 식비 기록 자동 생성
- [신규] 달력 기반 가계부, 전월 대비 증감, 식재료 비용, 외식 대비 절감액 표시 구현
- [신규] 냉장고 재료 클릭 시 해당 재료 기반 레시피 검색 진입 구현
- [신규] 만개의레시피 검색용 Cloud Functions 프록시 searchRecipe 추가
- [변경] Firestore 보안 규칙을 users/{uid} 사용자별 접근 구조로 변경
- [검증] JS 문법 검사 및 Functions lint 통과
- [배포제약] Cloud Functions 배포는 Firebase Blaze 요금제 필요로 중단됨

## 2026-05-26 디자인 개선 (김민기 작업)
- [변경] public/index.html 메인 랜딩 페이지를 제품 소개형 히어로/기능/사용 흐름 구조로 재디자인
- [변경] public/page/auth.html 로그인 전용 페이지로 재구성
- [신규] public/page/signup.html 회원가입 전용 페이지 추가
- [신규] public/css/marketing.css 메인/인증 전용 스타일 추가
- [변경] public/js/ui/auth.js를 로그인/회원가입 분리 페이지에서 모두 안전하게 동작하도록 수정
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app

## 2026-05-26 회원가입 UX 보강 (김민기 작업)
- [변경] 회원가입 비밀번호/비밀번호 확인 필드 및 영문 소문자+숫자 포함 8자 이상 검증 추가
- [신규] 휴대전화번호 010-0000-0000 자동 포맷 및 검증 추가
- [신규] Daum/Kakao 우편번호 주소찾기와 상세주소 입력 구조 추가
- [변경] 약관 체크박스를 누르면 약관 팝업이 열리고 동의 시 체크 완료되도록 개선
- [변경] 필수 약관 내용을 서비스 목적, 수집 항목, 이용 목적, 보관/파기, 이용자 책임 중심으로 확장
- [배포] Firebase Hosting 배포 완료

## 2026-05-26 메인 내비게이션/섹션 개선 (김민기 작업)
- [변경] 메인 상단 중앙 로그인 링크 제거
- [변경] 우측 상단 CTA 문구를 무료로 시작에서 시작하기로 수정
- [변경] 기능/사용 흐름을 화면 단위 섹션처럼 보이도록 분리형 레이아웃 적용
- [신규] 로그인 페이지 메인으로 돌아가기 버튼 추가
- [배포] Firebase Hosting 배포 완료

## 2026-05-26 회원가입 계정정보 레이아웃/토스트 개선 (김민기 작업)
- [변경] 회원가입 계정 정보에서 이메일을 전체 폭 1줄로 배치
- [변경] 비밀번호와 비밀번호 확인을 이메일과 동일한 전체 폭 안의 2열 2번째 줄로 배치
- [신규] 가입 성공 안내를 자동으로 사라지는 토스트 팝업으로 표시
- [배포] Firebase Hosting 배포 완료

## 2026-05-26 레시피 검색 목록화/배포 검증 (김민기 작업)
- [수정] searchRecipe Cloud Function을 공개 호출 가능하도록 배포하여 Hosting rewrite 403 문제 해결
- [변경] 만개의레시피 모바일 단일 랜덤 상세 파싱에서 www.10000recipe.com 검색 목록 파싱으로 전환
- [신규] 검색 결과에 총 개수, 관련 키워드, 레시피 목록, 썸네일 이미지, 작성자, 평점/후기, 조회수 표시 데이터 추가
- [신규] 만개의레시피에 없는 난이도는 제목 기반 초급/중급 예상 난이도로 우선 분류
- [변경] public/page/recipes.html 및 public/js/ui/recipes.js에서 레시피 카드형 목록과 관련 키워드 재검색 UI 적용
- [검증] https://honbab-ai.web.app/api/searchRecipe?keyword=대파 응답 200 및 1,056개 검색 결과/이미지 URL 반환 확인
- [제안] Gemini Vision 기반 영수증 업로드, 식재료 자동 추출, 예상 유통기한 보조 입력, 사용자 수정 확인 플로우를 다음 AI 기능 후보로 정리
- [배포] Firebase Functions 및 Hosting 배포 완료

## 2026-05-26 레시피 요리 시작 플로우 (김민기 작업)
- [변경] 레시피 카드의 요리 완료 버튼을 요리 시작 버튼으로 변경
- [신규] 요리 시작 시 만개의레시피 상세 페이지에서 제목, 소개, 인분, 시간, 난이도, 재료, 조리 단계, 단계 이미지를 가져와 혼밥비서 내부 조리 패널로 표시
- [신규] 조리 패널 하단에 Gemini 연동 예정 AI 조리 도우미 질문 영역 추가
- [변경] 요리 완료 기록은 조리 패널 안의 완료 기록 버튼에서 실행되도록 흐름 분리
- [검증] JS 문법 검사, Functions lint 통과 및 배포 완료
- [검증] https://honbab-ai.web.app/api/searchRecipe?recipeUrl=https://www.10000recipe.com/recipe/6899457 응답에서 재료 10개, 조리 단계 7개 반환 확인

## 2026-05-27 Firebase 계정 전환 및 냉장고 점수 시스템 (주한태 작업)
- [신규] public/js/core/nutrition-api.js 식약처 식품영양성분DB 오픈 API 연동 추가
- [신규] public/js/core/utils.js 냉장고 점수 계산 로직 추가 (기본80 + 영양소가점 + 유통기한가점 - 유통기한감점)
- [변경] public/js/core/store.js addIngredient에 nutritionCategories 필드 추가
- [변경] public/js/ui/fridge.js 재료 등록 시 오픈 API로 5대 영양소 자동 조회 및 저장
- [변경] public/page/fridge.html 점수 위젯(data-fridge-score) DOM 추가
- [변경] public/css/fridge.css 콤팩트 미니 점수 위젯 스타일 추가

## 2026-05-27 냉장고 캐릭터 및 레벨업 시스템 (주한태 작업)
- [신규] public/js/core/utils.js 냉장고 레벨/EXP 계산, 표정 랜덤 선택, 스프라이트 좌표, 가입일수 계산 함수 추가
- [신규] public/js/core/store.js getUserProfile, setFridgeNickname, countCookedMeals 함수 추가
- [변경] public/page/fridge.html 냉장고 캐릭터 히어로 영역, 닉네임, 레벨/EXP 바, 액션 버튼 UI 추가
- [변경] public/js/ui/fridge.js 닉네임 관리, 레벨/EXP 렌더링, 16개 표정 스프라이트(점수 기준), 기본 닉네임 알림, 스크롤 이동 구현
- [변경] public/css/fridge.css 냉장고 히어로, 캐릭터, 레벨 바, 콤팩트 점수, 액션 버튼 스타일 추가

## 2026-05-27 냉장고 UI/UX 개선 (주한태 작업)
- [변경] public/page/fridge.html 기존 인라인 재료 등록 폼 제거, 모달 팝업 및 드롭다운 DOM 구조 추가
- [변경] public/js/ui/fridge.js 재료 추가 버튼 -> 모달 오픈, 냉장고 열기 버튼 -> 드롭다운 토글, 모달/드롭다운 close 로직 추가
- [변경] public/js/ui/fridge.js 검색/보관 필터 변경 시 드롭다운 동시 갱신
- [변경] public/js/ui/fridge.js form submit 후 모달 자동 닫힘 처리
- [변경] public/css/fridge.css 냉장고 캐릭터 크기 확대 (200x168 -> 300x252)
- [변경] public/js/core/utils.js 스프라이트 셀 크기 확대 (200x168 -> 300x252)
- [변경] public/js/ui/fridge.js 캐릭터 배경 크기 800x672 -> 1200x1008px로 확대
- [신규] public/css/fridge.css 모달 오버레이/컨텐츠, 드롭다운 헤더/바디/아이템 스타일 추가

## 2026-05-28 냉장고 쪽 통합 작업 (김민기)
- [통합] 압축물/냉장고 쪽 수정(주한태) 작업물을 메인 프로젝트 public 폴더에 병합
- [변경] public/page/fridge.html -> 팀원 신규 냉장고 히어로/모달 UI로 교체
- [변경] public/css/fridge.css -> 팀원 신규 스타일(1017줄)로 교체
- [변경] public/js/ui/fridge.js -> 팀원 신규 기능(점수, 레벨, 캐릭터, 모달, 닉네임)으로 교체
- [변경] public/css/global.css -> badge--today 클래스 추가
- [변경] public/js/core/store.js -> getUserProfile, setFridgeNickname, countCookedMeals, nutritionCategories 저장 로직 추가
- [변경] public/js/core/utils.js -> 냉장고 점수/레벨/스프라이트/가입일수 계산 함수 추가
- [신규] public/js/core/nutrition-api.js -> 식약처 영양성분 API 모듈 추가
- [보존] 메인 프로젝트의 firebase-config.js, .firebaserc, searchRecipe Cloud Function은 기존 설정 그대로 유지

## 2026-05-28 누락 에셋 생성 및 문법 검증 (김민기)
- [신규] public/image/fridge-expressions.png 4x4 냉장고 캐릭터 스프라이트(1360x1144) 생성
- [검증] public/js/ui/fridge.js, public/js/core/store.js, public/js/core/utils.js, public/js/core/nutrition-api.js Node.js 문법 검사 통과
- [검증] http://127.0.0.1:9000/page/fridge.html 응답 200 확인

## 2026-05-28 손준혁 작업 통합 (김민기)
- [통합] 압축물/혼밥비서손준혁 작업물을 메인 프로젝트 public 폴더에 병합
- [변경] public/js/ui/shopping.js -> 찜한 레시피 기능, 아코디언 상세 뷰, 인라인 조리 패널, 드래그 앤 질문(AI Drag Tooltip), 삭제 confirm 로직으로 교체
- [변경] public/js/ui/recipes.js -> '장보기' 버튼을 '찜하기'로 텍스트 변경, 드래그 앤 질문 기능 추가
- [변경] public/js/core/store.js -> onSnapshot import 추가, observeShoppingItems(실시간 구독), updateShoppingItem, deleteShoppingItem 추가 (주한태 countCookedMeals, getUserProfile 등 기존 함수 유지)
- [변경] public/css/shopping.css -> 아코디언 스타일(.shopping-item__detail, .is-expanded, .accordion-icon), 하트 아이콘 스타일 추가
- [변경] public/css/global.css -> .ai-drag-tooltip 플로팅 툴팁 스타일 추가
- [변경] public/page/shopping.html -> '장보기 목록'에서 '찜한 레시피 목록'으로 UI 변경, recipes.css 추가 링크
- [보존] .firebaserc, firebase-config.js는 메인 프로젝트(honbab-ai) 설정 유지
- [보존] firebase.json rewrites 설정은 기존 그대로 유지 (손준혁 버전과 동일)
- [검증] public/js/ui/shopping.js, public/js/ui/recipes.js, public/js/core/store.js Node.js 문법 검사 통과
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app (shopping.html 찜한 레시피 기능 반영)
- [검증] https://honbab-ai.web.app/page/shopping.html 접속 확인

## 2026-05-28 하단 내비게이션 및 페이지명 개선 (김민기)
- [변경] public/js/ui/layout.js -> 하단 내비게이션 탭 '장보기'를 '요리하기'로 변경, 아이콘 shopping-basket -> chef-hat으로 변경
- [변경] public/page/shopping.html -> 페이지 제목 '찜 목록'에서 '요리하기'로 변경, 페이지 헤더 '찜한 레시피 목록'에서 '찜한 레시피'로 변경
- [변경] public/js/ui/shopping.js -> 빈 상태 메시지 '목록이 비어 있습니다'에서 '찜한 레시피가 없습니다. 레시피 화면에서 마음에 드는 요리를 찜해 보세요!'로 변경
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app (요리하기 탭명 변경 반영)
- [검증] https://honbab-ai.web.app/page/shopping.html 접속 확인

## 2026-05-28 AI 드래그 앤 질문 모바일 대응 및 UX 개선 (김민기)
- [버그수정] public/js/ui/shopping.js -> 모바일에서 툴팁이 표시되지 않던 문제를 mouseup 단일 이벤트에서 selectionchange + touchend 복합 이벤트로 변경하여 해결
- [변경] public/js/ui/shopping.js -> AI에게 질문하기 클릭 시 페이지 스크롤 이동 대신 중앙 팝업 모달(ai-question-modal)을 띄워 직접 질문 입력 및 답변 확인 가능하도록 개선
- [변경] public/css/global.css -> html, body에 overflow-x: hidden 추가하여 PC/모바일 전환 시 가로 스크롤 발생 방지
- [신규] public/css/global.css -> .ai-question-modal 팝업 오버레이/콘텐츠/선택문장/답변영역 스타일 추가
- [검증] public/js/ui/shopping.js Node.js 문법 검사 통과

## 2026-05-28 Gemini AI 조리 도우미 연동 (김민기)
- [신규] Firebase Functions에 askGemini Cloud Function 추가 (functions/index.js)
- [신규] Gemini API(gemini-2.0-flash) 연동, 레시피 제목/재료/조리순서/선택문장 컨텍스트를 프롬프트에 포함
- [변경] firebase.json -> /api/askGemini rewrite 추가
- [변경] public/js/ui/shopping.js -> AI 팝업 모달에서 실제 Gemini API 호출하도록 구현, DOM에서 재료/조리단계 파싱하여 컨텍스트 전송
- [변경] public/js/ui/recipes.js -> AI 조리 도우미 폼에서 실제 Gemini API 호출하도록 구현, activeCookingRecipe 데이터를 컨텍스트로 전송
- [보안] GEMINI_API_KEY를 Firebase Secrets Manager에 등록, Functions 환경변수로 주입 (코드에 노출하지 않음)
- [검증] public/js/ui/recipes.js, public/js/ui/shopping.js, functions/index.js Node.js 문법 검사 통과

## 2026-05-28 Gemini 모델 변경 및 배포 (김민기)
- [변경] functions/index.js -> Gemini 모델을 gemini-2.0-flash에서 gemini-2.5-flash-lite로 변경
- [변경] ESLint arrow-parens, indent, comma-dangle 스타일 오류 자동 수정 (--fix)
- [배포] Firebase Functions 및 Hosting 배포 완료: https://honbab-ai.web.app
- [검증] askGemini Cloud Function 정상 생성 확인 (asia-northeast3)

## 2026-05-28 AI 모달 닫기 버튼 및 API 키 주입 방식 개선 (김민기)
- [신규] public/js/ui/shopping.js -> AI 질문 팝업 모달 상단에 X(닫기) 아이콘 버튼 추가, 취소/배경/X 버튼 모두 닫기 동작
- [신규] public/css/global.css -> .ai-question-modal__header flex 레이아웃, .icon-button 원형 hover 스타일 추가
- [버그수정] functions/index.js -> 2nd Gen Functions에서 process.env 방식이 작동하지 않던 문제를 defineSecret + secrets 옵션 방식으로 수정
- [변경] functions/index.js -> geminiApiKey = defineSecret('GEMINI_API_KEY')로 정의, onRequest 옵션에 secrets: [geminiApiKey] 추가
- [변경] functions/index.js -> 함수 내부에서 geminiApiKey.value()로 API 키 런타임 주입받도록 변경
- [검증] ESLint --fix 자동 통과, Firebase Functions 배포 완료
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app

## 2026-05-28 혼밥비서 각종 디자인 변경 및 팀원 환경에서 연동하여 테스트 (손준혁)
- [변경] .firebaserc, public/js/firebase-config.js | 통합된 혼밥비서 메인 프로젝트의 기본 Firebase 설정을 팀(honbab-ai) 환경에서 본인(honbabson) 환경으로 변경하여 연동 완료
- [버그수정] functions/, firebase.json | functions 폴더 내 누락된 node_modules 의존성 패키지를 설치하고, Windows11 환경의 PowerShell 스크립트 실행 차단(ExecutionPolicy) 에러를 방지하기 위해 firebase.json의 predeploy 명령어를 npm.cmd로 보완하여 배포 에러 해결
- [변경] public/page/expenses.html | 수동 지출 추가 폼에서 냉장고 구매 기록과의 중복 방지를 위해 카테고리 선택(select) 옵션 중 '식재료' 항목 제거 완료
- [신규] public/css/expenses.css, public/js/ui/expenses.js, public/page/expenses.html | 식비 달력 디자인 고도화(요일 헤더 추가, 호버 효과 및 오늘 날짜 하이라이트) 및 날짜 클릭 시 해당 날짜의 지출/요리 내역을 보여주는 팝업 모달 추가
- [변경] public/css/expenses.css, public/js/ui/expenses.js | 카테고리별 지출 바 차트에 부드러운 애니메이션(transition)을 적용하고, 카테고리별 고유 그라데이션 색상을 매핑하여 디자인 퀄리티 상향
- [변경] public/page/expenses.html, public/js/ui/expenses.js | 가로 바(Bar) 차트를 직관적인 고급 원형 도넛 차트(Chart.js 라이브러리)로 변경, 마우스 호버 시 툴팁 표시되도록 시각화 고도화
- [기능추가] public/js/ui/expenses.js | Chart.js Custom Plugin(centerTextPlugin)을 자체 구현하여, 원형 도넛 차트 정중앙 빈 공간에 이번 달 '총 지출액'이 깔끔하게 표시되도록 모던 대시보드 UI 완성
- [버그수정] public/js/ui/expenses.js | Chart.js 도넛 차트 중앙 텍스트가 위쪽으로 치우치고 차트 크기가 작아지던 문제 해결 (Dataset Meta API를 통해 정확한 원형 중심 픽셀을 추출하고 범례(legend)를 하단으로 배치하여 공간 및 정렬 최적화)
- [UX개선] public/page/expenses.html, public/js/ui/expenses.js | 사용자가 범례(식재료 등)를 클릭했을 때 취소선이 그어지며 차트에서 데이터가 사라지는 동작(Toggle) 방지 (onClick: null 적용) 및 차트 컨테이너 크기 확장으로 도넛 크기 상향
- [변경] public/page/expenses.html, public/js/ui/expenses.js | 사용자의 요청에 따라 냉장고 구매 기록과의 혼선 방지를 위해 '식재료 비용' 관련 통계 카드와 연산 로직을 전면 삭제하고, 지출 추가 폼의 '메모' 플레이스홀더를 '음식 이름'으로 변경
- [UX개선] public/css/expenses.css, public/js/ui/expenses.js, public/page/expenses.html | 달력 가시성 극대화를 위해 주말(토요일 파란색, 일요일 빨간색) 색상을 요일 헤더와 숫자 텍스트에 적용하고, 카테고리 원형 차트 카드의 세로 길이를 100% 꽉 채워(Flexbox) 중앙 정렬 및 시각적 안정감 극대화
- [기능추가] public/page/expenses.html, public/css/expenses.css, public/js/ui/expenses.js | 화면 스크롤 피로도를 줄이기 위해 '월간 달력', '카테고리별 지출', '지출 내역' 각각을 독립적으로 접고 펼칠 수 있는 3개의 개별 아코디언(Accordion) UI 모듈로 분리 적용 완료

## 2026-05-28 대시보드/냉장고 UI 개선 (주한태 작업)
- [변경] public/page/dashboard.html 대시보드 전면 재디자인: 둥근 배너 + 캐릭터, 2단 그리드 레이아웃, 예산 막대 그래프
- [변경] public/css/dashboard.css 완전 재작성: 둥근 카드(20px), 그림자, 그리드 기반 2단 레이아웃, 예산 바 차트
- [변경] public/js/ui/dashboard.js 예산 사용률/남은 금액/막대 그래프 DOM 렌더링 추가
- [변경] public/page/fridge.html 재료 추가 모달 둥근 디자인, 수량+단위 한 줄 배치
- [변경] public/css/fridge.css 재료 추가 모달 스타일 추가(.modal__content--add, .add-modal__form)
- [변경] public/page/fridge.html 닉네임 변경 커스텀 모달 추가
- [변경] public/js/ui/fridge.js window.prompt() 제거, 커스텀 모달 로직 구현
- [변경] public/css/fridge.css 닉네임 모달 스타일(.nickname-modal__body) 및 버튼 추가
- [변경] public/css/fridge.css 연필 아이콘 버튼 크기 축소(22px → 18px)
- [변경] public/js/ui/fridge.js 삭제/전체삭제 확인창을 window.confirm → 커스텀 확인 모달로 교체
- [변경] public/page/fridge.html 커스텀 확인 모달 HTML 추가
- [변경] public/css/fridge.css 확인 모달 스타일(.modal--confirm z-index:200) 추가

## 2026-05-29 추가 작업 (손준혁)
- [버그수정] public/js/ui/shopping.js | '찜한 레시피' 화면에서 '요리 완료' 버튼 클릭 시 이벤트가 동작하지 않던 문제 해결 (Firestore의 `addCookedMeal` 및 `listIngredients` 코어 로직을 Import하고, `recipes.js`와 동일한 재료 차감 및 예상 절감액 기록 프로세스를 `shopping.js` 내에 완전 이식)
- [UI/UX개선] public/js/ui/recipes.js, public/js/ui/shopping.js, public/css/global.css | 요리 완료 시 뜨는 브라우저 기본 팝업(confirm, prompt)을 제거하고, 혼밥비서 테마에 맞는 아름다운 '커스텀 모달(Modal)' UI로 전면 교체. 내 냉장고의 재료들이 뱃지(Badge) 형태로 렌더링되며, 클릭 시 색상이 변하는(Toggle) 직관적인 방식으로 재료 차감을 선택할 수 있도록 고도화
- [UI/UX개선] public/js/core/utils.js, public/js/ui/auth.js, public/js/ui/fridge.js, public/js/ui/shopping.js | 프로젝트 전역(Global)에 남아있던 모든 브라우저 기본 팝업(`window.confirm`, `window.prompt`)을 적발하여, 혼밥비서 전용 테마가 적용된 비동기(Promise 기반) 커스텀 모달(`customConfirm`, `customPrompt`)로 100% 전면 교체 완료 (비밀번호 찾기, 냉장고 이름 짓기, 찜 삭제 등)
- [구조변경] public/js/ui/recipes.js | '레시피 검색' 화면과 '찜한 레시피(장보기)' 화면 양쪽 모두에 요리 시작/완료 기능이 중복 구현되어 있던 난잡한 아키텍처를 전면 개선(Separation of Concerns). `recipes.js`는 오직 '검색 및 찜하기' 목적에만 집중하도록 수백 줄의 중복 요리 로직을 삭제하고, 찜하기 완료 시 직관적인 '요리하러 가기' 버튼을 통해 `shopping.html`로 유도하도록 플로우 최적화
- [기능추가 및 UX개선] public/js/ui/recipes.js, public/css/global.css | `recipes.js` 리팩토링 과정에서 삭제되었던 원문 조회 기능을 '미리보기' 모달 팝업으로 부활. 검색 목록에서 썸네일 아래 '미리보기' 버튼 클릭 시 빠르고 가벼운 모달창으로 필요 재료와 조리 순서를 즉시 확인할 수 있도록 구현. 또한 모든 공용 커스텀 모달창 등장 시 부드러운 스케일(Scale) 바운스 트랜지션 애니메이션을 추가하여 UI 완성도 극대화
- [버그수정] public/js/ui/auth.js | 구글 소셜 로그인 완료 후 `profileComplete` 여부와 무관하게 무조건 `profile.html`로 리디렉션하던 문제 수정. 로그인 완료 직후 Firestore에서 해당 유저 프로필을 즉시 조회하여 `isProfileComplete` 검증 후, 완성 시 `dashboard.html`로, 미완성 시 `profile.html`로 분기 리디렉션하도록 로직 개선
- [버그수정] public/js/core/auth.js | 유저의 Firestore 데이터에 `profileComplete: true` 값이 명시적으로 저장되어 있음에도 불구하고 일부 필수 필드(birthDate 등)가 누락되어 있을 경우, `isProfileComplete` 함수가 매번 필드를 순회 검사하여 `false`를 반환하고 지속적으로 `profile.html`로 강제 리디렉션하던 버그 수정. DB에 명시적인 `profileComplete === true` 플래그가 존재하면 필드 순회 검사를 생략하고 즉시 통과하도록 유효성 검사 로직 보완
- [버그수정] public/js/ui/auth.js, public/js/core/auth.js | 브라우저의 강력한 모듈 캐싱으로 인해 과거 버전의 `isProfileComplete` 로직이 실행되면서 무한 리디렉션(auth -> dashboard -> profile)이 발생하는 문제를 원천 차단하기 위해, 로그인 성공 시 및 대시보드 진입 시 `isProfileComplete` 함수 의존성을 제거하고 `profile.profileComplete === true` 여부를 직접 검증하도록 로직을 하드코딩. 또한 모든 HTML과 JS import 문에 캐시 무효화 파라미터(`?v=3`)를 주입하여 최신 로직 강제 반영
- [구조개선] 전체 UI 자바스크립트 파일 | `core/auth.js`를 임포트할 때 파일마다 서로 다른 캐시 버스터(예: `?v=4`)가 적용되거나 적용되지 않는 불일치로 인해 브라우저 메모리에 동일 모듈이 여러 개 로드되는 'ES Module Split-Brain' 이슈 해결. 모든 JS 내부의 임포트 쿼리 파라미터를 일괄 삭제하여 단일 인스턴스(Single Instance)를 공유하도록 아키텍처를 정립하고, `requireCompleteProfile`에 더욱 강력한 Fail-safe 방어 코드를 적용
- [디자인개선] public/css/marketing.css | 메인 랜딩 페이지의 전반적인 디자인 시스템을 보다 세련되고 현대적인 자연(Nature Soft Green) 콘셉트로 개편. 구글 웹폰트 'Outfit'을 연동하여 영문/숫자 타이포그래피를 한층 고급스럽게 세팅했으며, 기존의 칙칙한 베이지/브라운 배경을 화사하고 싱그러운 연두빛 그라데이션 및 부드러운 라디알 글로우(Radial Glow) 효과로 전면 교체. 또한 내비게이션, 히어로 배너, 컴포넌트 목업(Product Showcase), 기능 카드 및 사용 흐름 목록 등 모든 영역에 글래스모피즘(Glassmorphism) 스타일의 얇은 그린톤 보더와 부드러운 호버 스케일/리프트 효과를 조화롭게 가미함
- [디자인개선] public/css/marketing.css | 피드백에 따라 메인 페이지 내의 피처 카드, 사용 흐름 단계 카드, 데시보드 미니 패널, 로그인/회원가입 비주얼 패널들의 기본 및 호버 그림자 농도(box-shadow)를 기존 대비 약 2배 수준으로 강화하고 숲의 짙은 연두색(`rgba(20, 65, 42, 0.16)`) 조도를 부여하여 카드 요소의 경계 구분감 및 입체감을 대폭 향상
- [디자인개선] public/css/marketing.css | 상단 내비게이션 바 메뉴(`marketing-nav__links`)의 각 앵커 링크 클릭 시 브라우저 뷰포트가 뚝뚝 끊기며 즉시 이동하던 현상을 부드러운 스크롤 이동(`scroll-behavior: smooth`) 방식으로 변경하여 페이지 탐색 경험을 개선

## 2026-05-29 요리 완료 모달 및 UX 개선 (주한태 작업)
- [변경] public/js/core/utils.js showAlertModal() 추가: window.alert를 커스텀 모달로 대체
- [변경] public/js/ui/shopping.js, public/js/ui/recipes.js alert 호출을 showAlertModal로 교체
- [변경] public/css/shopping.css .shopping-page max-width 오버라이드 제거, global .main 1160px 기준으로 다른 페이지와 위치 통일
- [변경] public/js/ui/recipes.js startCooking() 함수: 페이지 내 드롭다운 렌더링 제거, 장보기 목록에 추가 후 /page/shopping.html?recipeUrl=URL로 리다이렉트
- [변경] public/js/ui/shopping.js URL recipeUrl 파라미터 처리: 해당 레시피 자동 아코디언 펼침 + 조리 시작
- [변경] public/page/shopping.html 요리 완료 모달 구조 확장: 이미지 업로드 영역, 자동 계산 비용 요약, AI 확인 영역 추가
- [변경] public/js/ui/shopping.js openFinishModal(): 냉장고 재료 기반 자동 비용 계산(calculateIngredientCost, parseRecipeAmount) 추가
- [변경] public/js/ui/shopping.js 이미지 업로드/미리보기/제거 이벤트 핸들러 추가
- [변경] public/js/ui/shopping.js AI 판단 버튼 핸들러: /api/askGemini 호출, 확인 완료 시 기록 저장 버튼 활성화
- [변경] public/css/shopping.css finish modal 전용 스타일 추가: 이미지 업로드, 비용 요약, AI 로딩 애니메이션

## 2026-05-29 요리 완료 모달 UX 세부 개선 (주한태 작업)
- [변경] public/page/shopping.html finish modal 헤더 X 버튼 제거, AI 확인 영역을 이미지 업로드 아래로 이동
- [변경] public/page/shopping.html 사용한 재료 영역에 수정 버튼 + 드롭다운 입력 폼 추가
- [변경] public/js/ui/shopping.js renderIngredientRows() 추가: 체크박스 + 수정버튼 + 드롭다운 HTML 생성
- [변경] public/js/ui/shopping.js calculateIngredientCost() overrides 파라미터 추가: 사용자 수정값 반영
- [변경] public/js/ui/shopping.js recalculateCostFromUI() 추가: 체크박스 상태 변경 시 선택된 재료만 비용 재계산
- [변경] public/js/ui/shopping.js 이벤트 delegation: 체크박스 change, 수정버튼 토글, 드롭다운 입력값 change 핸들링
- [변경] public/css/shopping.css .finish-ingredient-row, .finish-ingredient-main, .finish-ingredient-edit, .finish-ingredient-dropdown 스타일 추가

## 2026-05-29 요리 완료 모달 재료 수정 UX 개선 (주한태 작업)
- [변경] public/js/ui/shopping.js replaceAmountNumber() 추가: 원본 단위 보존하며 수량 숫자만 교체 (예: "6개" -> "3개")
- [변경] public/js/ui/shopping.js renderIngredientRows()에 저장 버튼 추가 및 data-ingredient-label, data-original-qty 데이터 속성 추가
- [변경] public/js/ui/shopping.js 저장 버튼 클릭 핸들러: overrides 적용, 체크박스 data-recipe-qty 업데이트, 라벨 텍스트 실시간 변경, 드롭다운 닫힘
- [변경] public/css/shopping.css .finish-ingredient-dropdown-actions, .finish-ingredient-save 스타일 추가
- [변경] public/css/shopping.css .modal__content 커스텀 스크롤바 스타일 추가 (6px 얇은 썸, 둥근 모서리)

## 2026-05-29 요리 완료 모달 다중 이미지 업로드 (주한태 작업)
- [변경] public/page/shopping.html finish-image-area를 다중 이미지 그리드로 변경: finish-image-grid, finish-image-add, finish-image-thumb, 개별 제거 버튼
- [변경] public/js/ui/shopping.js activeFinishImages 배열 상태로 변경: [{ id, base64 }] 구조
- [신규] public/js/ui/shopping.js renderImageGrid() 추가: 썸네일 + 추가 버튼 동적 렌더링, FileReader 다중 처리
- [신규] public/js/ui/shopping.js handleImageFiles() 추가: multiple file input 대응, 완료 후 renderImageGrid 호출
- [변경] public/js/ui/shopping.js finishImageGrid 이벤트 delegation: data-remove-image 클릭 시 해당 인덱스 splice 후 재렌더
- [변경] public/js/ui/shopping.js AI verify 시 activeFinishImages[0]만 전송하여 토큰 절약
- [변경] public/js/ui/shopping.js 저장 payload: cookImage(single) -> cookImages(array)로 변경
- [변경] public/css/shopping.css finish-image-grid(3열), finish-image-add(정사각형 dashed), finish-image-thumb(개별 제거 버튼) 스타일 추가

## 2026-05-29 요리 완료 모달 저장 버튼 피드백 개선 (주한태 작업)
- [변경] public/page/shopping.html 기록 저장 버튼 아래에 .finish-submit-hint 추가
- [변경] public/js/ui/shopping.js openFinishModal: 힌트 문구 표시 (AI 확인 필요 안내)
- [변경] public/js/ui/shopping.js AI 확인 완료 시: 힌트 숨김 + 저장 버튼 활성화
- [변경] public/css/shopping.css .finish-submit-hint 스타일 추가: 빨간색(--color-accent), 중앙 정렬, 13px

## 2026-05-29 모바일 AI 조리 도우미 FAB/슬라이드 개선 (주한태 작업)
- [변경] public/page/shopping.html 우측 하단 AI FAB 버튼(.ai-fab) 추가
- [변경] public/css/shopping.css 모바일 AI 패널: 하단 50vh 고정 -> 우측 슬라이드 인/아웃(transform: translateX)으로 변경
- [변경] public/css/shopping.css .ai-fab 스타일 추가: position fixed, 우측 하단, bottom-nav 위로 배치, z-index 150
- [변경] public/css/shopping.css .ai-chat__close(닫기 버튼) 스타일 추가: 모바일에서만 표시
- [변경] public/js/ui/shopping.js initAiSidePanel: desktop일 때만 is-open, 모바일은 기본 닫힘
- [변경] public/js/ui/shopping.js 요리 시작 시: desktop일 때만 AI 패널 자동 열림
- [신규] public/js/ui/shopping.js FAB 클릭 이벤트: AI 패널 classList.toggle("is-open")
- [신규] public/js/ui/shopping.js AI 패널 닫기 버튼 이벤트: classList.remove("is-open")

## 2026-05-29 모바일 AI 패널 스와이프 핸들 개선 (주한태 작업)
- [변경] public/page/shopping.html FAB 제거, 우측 중앙 고정 드래그 핸들(.ai-drag-handle) 추가
- [변경] public/css/shopping.css .ai-drag-handle 스타일 추가: 우측 중앙, 14x72px, primary 배경, 3개 바 표시
- [변경] public/css/shopping.css 모바일에서 .ai-fab 숨김, .ai-drag-handle 표시
- [신규] public/js/ui/shopping.js initSwipeHandle() 추가: touchstart/touchmove/touchend 이벤트
- [신규] public/js/ui/shopping.js 스와이프 실시간 translateX 계산: 드래그 중 패널이 손가락을 따라움직임
- [신규] public/js/ui/shopping.js 임계값 기반 snap 열림: 60px 이상 이동 또는 velocity > 0.4
- [신규] public/js/ui/shopping.js 가로/세로 방향 필터링: Math.abs(deltaX) > Math.abs(deltaY) 조건으로 스크롤과 충돌 방지
- [변경] public/css/shopping.css .ai-drag-handle touch-action: pan-y 적용: 세로 스크롤은 브라우저가, 가로는 JS가 제어

## 2026-05-29 냉장고 AI 영수증 인식 재료 일괄 추가 (주한태 작업)
- [신규] public/page/fridge.html data-modal에 탭 UI 추가: 직접 입력 / 영수증 인식
- [신규] public/page/fridge.html 영수증 인식 탭 HTML: 업로드 영역, 로딩, 결과 테이블, 전체 선택, 추가 버튼
- [신규] public/css/fridge.css .add-modal__tabs, .add-modal__tab, .add-modal__panel 스타일
- [신규] public/css/fridge.css .receipt-upload-area 점선 테두리 업로드 영역, hover primary 효과
- [신규] public/css/fridge.css .receipt-loading 스피너 및 애니메이션
- [신규] public/css/fridge.css .receipt-result-table 컴팩트 테이블, 인라인 input/select 수정 가능
- [신규] public/js/core/receipt-api.js parseReceipt(imageBase64) API wrapper + Mock 응답
- [신규] public/js/ui/fridge.js 탭 전환 switchAddTab, resetReceiptTab
- [신규] public/js/ui/fridge.js 영수증 파일 업로드 → base64 → parseReceipt 호출 → 결과 렌더링
- [신규] public/js/ui/fridge.js receiptItems 상태 관리, 체크박스 전체 선택/해제, 인라인 필드 수정
- [신규] public/js/ui/fridge.js receiptAddBtn 일괄 저장: 선택된 재료를 addIngredient 순차 호출

## 2026-05-30 손준혁 팀원 5.29 작업물 팀 프로젝트 환경에 통합 병합 (김민기)
- [통합] public/css/marketing.css | 손준혁 Nature Soft Green 디자인 시스템 통합 (Outfit 폰트, 글래스모피즘 네비, 라디얼 글로우)
- [통합] public/css/expenses.css | Chart.js 도넛 차트, 달력 팝업 모달, 아코디언 UI 디자인 통합
- [통합] public/css/global.css | 손준혁 버전으로 대체 후 AI 모달 스타일(.ai-drag-tooltip, .ai-question-modal) append 유지
- [통합] public/page/expenses.html | 식재료 카테고리 제거, 도넛 차트, 달력 모달, 아코디언 HTML 구조 통합
- [통합] public/page/auth.html, dashboard.html | 손준혁 개선 버전으로 대체
- [통합] public/js/ui/auth.js | 커스텀 모달(customConfirm/customPrompt) 전면 교체, 로그인 후 리디렉션 버그 수정
- [통합] public/js/ui/fridge.js | 브라우저 기본 팝업 제거, 커스텀 모달 적용
- [통합] public/js/ui/expenses.js | Chart.js 도넛 차트(centerTextPlugin), 달력 팝업, 아코디언, 애니메이션 통합
- [통합] public/js/ui/shopping.js | 손준혁 요리 완료 기능 이식(재료 차감 커스텀 모달), AI Gemini 모달 유지
- [통합] public/js/ui/recipes.js | 손준혁 리팩토링(검색/찜하기 집중), 미리보기 모달 추가, 요리하러 가기 플로우
- [통합] public/js/core/auth.js | profileComplete 플래그 하드코딩 검증, 캐시 이슈 방지
- [통합] public/js/core/utils.js | customConfirm, customPrompt 등 커스텀 모달 유틸리티 통합
- [통합] public/image/ | 캐릭터 이미지(01~14번) 등 손준혁 추가 이미지 복사
- [보존] functions/index.js, firebase.json | Gemini askGemini Cloud Function 및 rewrite 규칙 유지
- [보존] public/js/firebase-config.js | 팀 프로젝트(honbab-ai) 설정 유지 (손준혁 본인 프로젝트 설정 분리)
- [검증] public/js/ui/*.js, core/*.js Node.js 문법 검사 통과

## 2026-05-30 주한태 팀원 5.28-29 작업물 통합 병합 (김민기)
- [신규] public/js/core/receipt-api.js | 영수증 OCR API wrapper + Mock 응답 추가
- [병합] public/page/fridge.html | 재료 추가 모달에 '직접 입력 / 영수증 인식' 탭 UI 추가
- [병합] public/css/fridge.css | 탭 스타일, 영수증 업로드 영역, 로딩 스피너, 결과 테이블, 커스텀 드롭다운/데이트피커 스타일 추가
- [병합] public/js/ui/fridge.js | 탭 전환(switchAddTab), 영수증 파일 업로드→base64→parseReceipt→결과 렌더링, 체크박스 선택/전체선택, 인라인 필드 수정, 선택 재료 일괄 등록 로직 추가. 손준혁 커스텀 모달(customPrompt) 유지
- [보존] public/js/core/nutrition-api.js, utils.js 점수/레벨, store.js 영양소 필드, fridge 캐릭터 등 5/27 주한태 작업은 이미 메인에 통합되어 있음
- [보존] shopping.js, recipes.js, auth.js, expenses.js, marketing.css, global.css 등 손준혁 5.29 작업 유지
- [검증] public/js/ui/fridge.js, public/js/core/receipt-api.js Node.js 문법 검사 통과
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app

## 2026-05-30 요리하러 가기 UX 버그 수정 (김민기)
- [버그수정] public/js/ui/recipes.js | "요리하러 가기" 버튼이 `<a href="/page/shopping.html">`로 되어 있어 recipeUrl 파라미터를 전달하지 않아 shopping 페이지에서 빈 화면으로 표시되던 문제 해결. `<button data-go-cooking>`으로 변경하고 클릭 시 addShoppingItem 등록 후 `/page/shopping.html?recipeUrl=...`로 이동하도록 수정
- [버그수정] public/js/ui/shopping.js | URLSearchParams로 recipeUrl 파라미터를 읽어, 렌더링 완료 후 해당 아이템 카드를 자동으로 is-expanded 상태로 만들고 data-start-cooking 버튼을 자동 클릭하여 조리 패널(재료, 단계, AI 도우미)이 즉시 표시되도록 handleShoppingItemsUpdate wrapper 함수 추가
- [검증] public/js/ui/recipes.js, public/js/ui/shopping.js Node.js 문법 검사 통과
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app

## 2026-05-30 영수증 OCR Mock → Gemini Vision API 실제 연동 (김민기)
- [신규] functions/index.js | `parseReceipt` Cloud Function 추가. base64 이미지를 받아 Gemini-1.5-flash Vision API로 영수증 분석 요청. 프롬프트에서 재료명(name), 수량(quantity), 단위(unit), 보관법(storageType), 유통기한(expireDate), 가격(price)을 JSON 형식으로 추출하도록 지시. responseMimeType: application/json 설정으로 구조화된 응답 확보
- [변경] firebase.json | `/api/parseReceipt` → `parseReceipt` Cloud Function rewrite 규칙 추가
- [변경] public/js/core/receipt-api.js | 기존 Mock 응답(계란/우유/김치 등 고정 데이터, 2초 지연) 제거. `/api/parseReceipt` POST 호출로 교체. 오류 발생 시 서버 응답의 error 메시지를 throw
- [검증] functions/index.js ESLint 통과 (npm run lint)
- [배포] Firebase Cloud Functions 배포 완료: parseReceipt(asia-northeast3) 생성
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app

## 2026-05-30 영수증 OCR 모델 교체 및 base64 처리 개선 (김민기)
- [버그수정] functions/index.js | Gemini 모델을 `gemini-1.5-flash` → `gemini-2.5-flash-lite`로 교체. `responseMimeType: application/json` 설정 제거(2.5 호환성 확보)
- [버그수정] functions/index.js | `imageBase64`가 `data:image/jpeg;base64,xxxxx` 형식의 데이터 URL일 경우, Cloud Function 내부에서 comma 기준으로 순수 base64만 추출하도록 처리 추가 (FileReader.readAsDataURL() 반환값 대응)
- [검증] functions/index.js ESLint 통과 (npm run lint)
- [배포] Firebase Cloud Functions 배포 완료: parseReceipt(asia-northeast3) 업데이트

## 2026-05-30 영수증 OCR Gemini 응답 JSON 파싱 안정화 (김민기)
- [버그수정] functions/index.js | Gemini 2.5 flash lite 모델이 JSON 응답을 마크다운 코드 블록(```json ... ```)으로 감싸거나 앞뒤 설명 텍스트를 붙여 반환하여 JSON.parse() 실패 → 500 에러가 발생하던 문제 해결
- [버그수정] functions/index.js | generationConfig에 `responseMimeType: "application/json"` 다시 추가하여 모델이 순수 JSON을 반환하도록 유도
- [버그수정] functions/index.js | 백엔드 응답 처리 로직에 정제 코드 추가: `replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()`로 마크다운 태그 제거, `match(/\{[\s\S]*\}/)`로 중괄호 JSON 객체 부분만 추출 후 파싱. 인트로/아웃트로 텍스트가 섞여도 안정적으로 파싱 가능
- [검증] functions/index.js ESLint 통과 (npm run lint)
- [배포] Firebase Cloud Functions 배포 완료: parseReceipt(asia-northeast3) 업데이트

## 2026-05-30 영수증 아닌 이미지 처리 및 사용자 피드백 (김민기)
- [기능추가] functions/index.js | 영수증 분석 프롬프트에 "이 이미지가 영수증인지 먼저 판단하세요" 지시 추가. 영수증이 아닐 경우(음식 사진, 풍경, 인물 등) `{"isReceipt": false, "message": "영수증 이미지가 아닙니다. 사진을 다시 확인해 주세요."}` 반환하도록 지시
- [기능추가] functions/index.js | Cloud Function 응답 로직에 `parsed.isReceipt === false` 체크 추가. `false`일 경우 HTTP 400 상태로 `{isReceipt: false, message: ...}` 반환
- [버그수정] public/js/core/receipt-api.js | 400 응답 시 `err.message` 필드도 에러 메시지로 포함하도록 수정
- [버그수정] public/js/ui/fridge.js | catch 블록에서 `alert("영수증 분석에 실패했습니다...")` 하드코딩을 `alert(err?.message || ...)`로 변경하여 서버 메시지를 사용자에게 표시
- [검증] functions/index.js, receipt-api.js, fridge.js ESLint/문법 검사 통과
- [배포] Firebase Cloud Functions + Hosting 배포 완료: https://honbab-ai.web.app

## 2026-05-30 영수증 분석 실패 시 커스텀 모달 적용 (김민기)
- [버그수정] public/js/core/utils.js | 손준혁/주한태 커스텀 모달 시스템의 `showAlertModal(message)` 함수 추가. `window.alert` 대신 혼밥비서 테마의 중앙 정렬 모달(오버레이 클릭/확인 버튼으로 닫기, Promise 반환)로 통일
- [버그수정] public/js/ui/fridge.js | `import { ..., showAlertModal } from "../core/utils.js"` 추가. 영수증 분석 catch 블록에서 `alert(...)`를 `await showAlertModal(...)`로 교체. 영수증이 아닌 이미지 업로드 시에도 기본 브라우저 alert 대신 서비스 테마 모달로 "영수증 이미지가 아닙니다..." 메시지 표시
- [검증] public/js/core/utils.js, public/js/ui/fridge.js Node.js 문법 검사 통과
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app

## 2026-05-30 영수증 OCR에 Google Search Grounding 실시간 검색 추가 (김민기)
- [기능추가] functions/index.js | `parseReceipt` Cloud Function의 Gemini API 호출 body에 `tools: [{google_search: {}}]` 추가. Gemini 2.5 flash lite 모델이 영수증 이미지를 분석하면서 동시에 구글 검색을 통해 실시간 웹 정보(최신 식재료 유통기한 기준, 계절별 보관법 등)를 참조하여 더 정확한 유통기한과 보관법 추정 가능
- [검증] functions/index.js ESLint 통과 (npm run lint)
- [배포] Firebase Cloud Functions 배포 완료: parseReceipt(asia-northeast3) 업데이트

## 2026-05-30 영수증 OCR Cloud Function @google/genai SDK 마이그레이션 (김민기)
- [변경] functions/package.json | `@google/genai` 패키지 설치 (npm install @google/genai)
- [변경] functions/index.js | 상단에 `const {GoogleGenAI} = require("@google/genai")` 추가
- [변경] functions/index.js | `parseReceipt` 함수 내부 Gemini API 호출을 `fetch()` REST API 방식에서 공식 SDK `ai.models.generateContent()` 방식으로 리팩토링. 이미지는 `{inlineData: {mimeType, data}}` 형식으로 전달, config에 `responseMimeType`, `tools: [{googleSearch: {}}]`, `maxOutputTokens`, `temperature` 설정
- [변경] functions/index.js | `!geminiRes.ok` HTTP 상태 체크 로직 제거. SDK는 내부적으로 에러를 throw하므로 기존 try-catch 블록에서 자동 처리
- [검증] functions/index.js ESLint 통과 (npm run lint)
- [배포] Firebase Cloud Functions 배포 완료: parseReceipt(asia-northeast3) 업데이트

## 2026-05-30 영수증 OCR Google Search + JSON 응답 충돌 해결 (김민기)
- [버그수정] functions/index.js | `parseReceipt` 배포 후 테스트에서 `parseReceipt failed ApiError: Tool use with a response mime type: 'application/json' is unsupported` 500 에러 발생. 원인: Gemini API에서 `googleSearch` 툴과 `responseMimeType: "application/json"`을 동시에 사용할 수 없음
- [버그수정] functions/index.js | `config`에서 `responseMimeType: "application/json"` 제거. 대신 `result.text`로 일반 텍스트 응답을 받고, 기존 정제 로직(`replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()`, `match(/\{[\s\S]*\}/)`)으로 순수 JSON만 추출하여 파싱. Google Search Grounding 기능은 그대로 유지
- [검증] functions/index.js ESLint 통과 (npm run lint)
- [배포] Firebase Cloud Functions 배포 완료: parseReceipt(asia-northeast3) 업데이트

## 2026-05-30 영수증 OCR unit 파싱 규칙 개선 (김민기)
- [버그수정] functions/index.js | 영수증 분석 프롬프트에 `unit` 필드 규칙 강화. "unit에는 숫자가 절대 들어가면 안 됨"을 명시하고, "코카콜라 1.5L", "농심사우면 90g" 같은 제품 규격(용량)은 `name`에 포함하도록 지시. quantity는 실제 구매 개수만 기록하도록 예시 추가
- [버그수정] functions/index.js | `unit`이 "1.5L", "90g", "501 500ml"처럼 숫자+단위 조합으로 반환되어, 사용자가 드롭다운에서 "ml"로 바꾸면 "코카콜라 1ml"처럼 의미 없는 데이터가 되던 문제 해결
- [검증] functions/index.js ESLint 통과 (npm run lint)
- [배포] Firebase Cloud Functions 배포 완료: parseReceipt(asia-northeast3) 업데이트

## 2026-05-30 shopping 페이지 AI 조리 도우미 실제 API 연동 (김민기)
- [버그수정] public/js/ui/shopping.js | `listContainer` submit 이벤트 핸들러에서 `answerAiPlaceholder` 호출을 실제 `/api/askGemini` fetch 호출로 교체. 인라인 AI 질문 폼에서도 레시피 제목, 재료, 조리 단계 정보를 함께 전송하여 Gemini 답변을 실시간으로 받아 표시
- [리팩토링] public/js/ui/shopping.js | 사용되지 않는 `answerAiPlaceholder` 함수 제거
- [UI수정] public/js/ui/shopping.js | "Gemini 연결 전에는 질문 흐름만 준비되어 있습니다..." 문구를 "현재 레시피 제목, 재료, 조리 단계 정보를 Gemini에 함께 전송하여 정확한 답변을 받습니다."로 변경
- [UI수정] public/js/ui/shopping.js | 기본 답변 영역 문구를 "질문하면 현재 레시피..."에서 "AI에게 질문해 보세요..."로 변경
- [검증] public/js/ui/shopping.js Node.js 구문 검사 통과 (node --check)
- [배포] Firebase Hosting 배포 완료

## 2026-05-30 customPrompt 모달 디자인 개선 및 드래그 안내 추가 (김민기)
- [UI수정] public/js/core/utils.js | `customPrompt`를 `ai-question-modal` 클래스에서 `.modal` 스타일로 리디자인. 제목, 메시지, 입력 필드, 취소/확인 버튼 구조를 `showAlertModal`과 동일한 디자인 시스템으로 통일. 제목을 `title` 매개변수로 동적 설정 가능하도록 개선
- [UI수정] public/js/ui/fridge.js | 냉장고 이름 입력 `customPrompt` 호출에 `title: "냉장고 이름 입력"` 매개변수 추가하여 모달 제목이 "입력 확인" 대신 "냉장고 이름 입력"으로 표시되도록 변경
- [UI수정] public/js/ui/shopping.js | 요리 완료 기록 버튼 우측에 "조리 과정 중 궁금한 부분을 드래그하면 AI에게 질문할 수 있어요" 안내 문구 추가 (`item-meta` 스타일, `mouse-pointer-click` 아이콘)
- [검증] public/js/ui/fridge.js, public/js/ui/shopping.js Node.js 구문 검사 통과
- [배포] Firebase Hosting 배포 완료

## 2026-05-30 utils.js escapeHtml 누락 버그 수정 (김민기)
- [버그수정] public/js/core/utils.js | `customPrompt` 리디자인 과정에서 `escapeHtml`를 사용하도록 변경했으나, `utils.js`에 해당 함수가 정의되어 있지 않아 `fridge.js`에서 `customPrompt` 호출 시 `ReferenceError: escapeHtml is not defined` 발생. `utils.js` 상단에 `escapeHtml` 함수 추가하여 `recipes.js`, `shopping.js`와 동일한 구현으로 통일
- [검증] public/js/core/utils.js Node.js 구문 검사 통과
- [배포] Firebase Hosting 배포 완료

## 2026-06-01 요리 완료 후 찜 항목 자동 삭제
- [기능추가] public/js/ui/shopping.js | 요리 완료(addCookedMeal) 성공 시 해당 찜 카드의 data-card-id를 읽어 deleteShoppingItem 호출. 요리를 마치면 찜한 레시피 목록에서 자동 제거되도록 처리

## 2026-06-01 shopping.js 브라우저 alert 커스텀 모달 전환
- [버그수정] public/js/ui/shopping.js | showAlertModal import 추가. 요리 기록 저장 성공 alert, 저장 실패 alert, 삭제 실패 alert 세 곳을 모두 await showAlertModal()로 교체. 브라우저 기본 팝업 완전 제거

## 2026-06-01 디자인/기능 전반 개선 (AI 리뷰 반영)
- [버그수정] public/css/global.css | 5.29~5.30 통합 병합 과정에서 .ai-drag-tooltip, html+body overflow-x, .ai-question-modal 블록이 파일 내 중복 정의되어 두 번째 블록이 첫 번째(스케일 바운스 애니메이션 포함)를 덮어쓰던 문제 해결. 중복 블록(두 번째 html,body { overflow-x:hidden } 이하 전체) 제거
- [기능추가] public/js/ui/auth.js | [data-find-email] 버튼에 핸들러 누락 문제 해결. showAlertModal을 import 후 클릭 시 "가입 시 이메일/Google 로그인 안내" 모달을 표시하도록 구현
- [디자인] public/css/fridge.css | .ingredient-grid의 grid-template-columns을 repeat(3, 1fr) 고정에서 repeat(auto-fill, minmax(200px, 1fr))로 변경하여 모바일/소형 화면에서 카드 1~2열 자동 조정
- [리팩토링] public/css/expenses.css | .accordion-container, .accordion-toggle, .accordion-icon, .accordion-inner-wrap, .category-chart-card, .category-chart-container, #categoryEmptyState, .budget-bar-section, .budget-bar-pct 스타일 추가
- [리팩토링] public/page/expenses.html | 아코디언 컨테이너/토글/내부랩/카테고리 카드에 인라인 style 속성 전면 제거 후 CSS 클래스로 대체. 유지보수성 및 테마 변경 용이성 향상
- [기능추가] public/page/expenses.html | 통계 카드 하단에 #budget-bar-section 예산 사용률 바 섹션 추가 (monthlyBudget 미설정 시 hidden)
- [기능추가] public/js/ui/expenses.js | requireCompleteProfile 반환값을 profile로 받아 monthlyBudget 읽기. render() 내부에서 예산 대비 사용률(%) 계산, 진행바 색상(초과 시 accent), 남은/초과 금액 안내 문구 동적 업데이트
- [기능추가] public/page/recipes.html | 검색 카드 내에 [data-recent-searches-wrap] / [data-recent-searches] 최근 검색어 컨테이너 추가 (초기 hidden)
- [기능추가] public/js/ui/recipes.js | LocalStorage 기반 최근 검색어 저장(saveRecentSearch), 불러오기(loadRecentSearches), 렌더링(renderRecentSearches) 구현. 검색 성공 시 자동 저장, 배지 클릭 시 재검색, '기록 삭제' 버튼으로 전체 삭제. showAlertModal import 추가
- [버그수정] public/js/ui/recipes.js | 찜하기 성공 시 native alert() 호출을 await showAlertModal()로 교체
- [기능추가] public/page/dashboard.html | 통계 섹션과 2단 그리드 사이에 AI 추천 레시피 카드(.recommend-card) 추가. [data-recommend-btn] 버튼, [data-recommend-result] 결과 영역 포함
- [기능추가] public/page/dashboard.html | 대시보드 하단에 #cook-gallery-section 요리 사진 갤러리 섹션 추가 (사진 없는 경우 hidden)
- [기능추가] public/js/ui/dashboard.js | [data-recommend-btn] 클릭 시 /api/askGemini 호출, 현재 냉장고 재료 기반 오늘 먹을 요리 3가지 AI 추천 표시. 로딩 스피너 및 에러 처리 포함
- [기능추가] public/js/ui/dashboard.js | cookedMeals 중 cookImages 배열이 있는 항목의 사진을 갤러리 그리드로 렌더링
- [신규] public/css/dashboard.css | .recommend-card__head, .recommend-answer, .spin 애니메이션, .cook-gallery, .cook-gallery__item, .cook-gallery__label 스타일 추가

## 2026-06-02 백엔드 Express 통합 및 영양성분 CORS 프록시 (손준혁)
- [변경] functions/index.js | 기존 개별 export(searchRecipe, parseReceipt, askGemini) 구조를 Express + cors 미들웨어 기반 단일 `exports.api` 함수로 통합. `express.json({ limit: '10mb' })` 적용
- [신규] functions/index.js | `/api/getNutrition` 엔드포인트 추가: 식약처 식품영양성분DB API CORS 우회 서버 프록시. getFoodNtrCpntDbInfo02 → getFoodNtrCpntDbInfo 순서로 시도, 모두 실패 시 빈 배열 200 OK 반환 (클라이언트 콘솔 404 방지)
- [변경] public/js/core/nutrition-api.js | 식약처 API 직접 호출에서 /api/getNutrition 서버 프록시 호출로 변경하여 브라우저 CORS 오류 해결
- [변경] functions/package.json | express ^4.18.2, cors ^2.8.5 의존성 추가

## 2026-06-12 커뮤니티 게시판 시스템 구현 (주한태)
- [신규] public/page/board.html | 혼밥 수다방 메인 페이지. 전체/혼밥등록/레시피공유/재료교환/자유게시판 카테고리 탭, 최신순/인기순/조회순 정렬, 제목+내용/제목/작성자 검색, 무한 스크롤 더보기
- [신규] public/page/board-form.html | 게시글 작성 페이지. 게시판 타입별 동적 필드(레시피=재료/난이도/시간, 교환=위치/유통기한), 현재위치 자동 불러오기, 이미지 최대 5장 첨부, 5000자 실시간 글자 수 바
- [신규] public/page/board-detail.html | 게시글 상세 페이지. 댓글 작성/목록, 좋아요, 신고 모달(스팸/욕설/음란물/개인정보/기타)
- [신규] public/page/admin-board.html | 관리자 패널. 게시글 관리 탭, 신고 관리 탭
- [신규] public/css/board.css | 게시판 전용 스타일. board-toolbar, board-card(카테고리별 색상 배지), 호버 translateY(-2px), 반응형
- [신규] public/css/profile.css | 사용자 프로필 페이지 스타일. profile-hero, 아바타 편집, profile-info-grid
- [신규] public/js/core/board-api.js | Firestore 게시판 API 모듈. createBoardPost, getBoardPost, listBoardPosts(페이지네이션), updateBoardPost, softDeleteBoardPost, addComment, listComments, toggleLike, hasLiked, createReport, createNotification, listNotifications, markNotificationRead, checkAdmin 등 전체 CRUD + 트랜잭션
- [신규] public/js/ui/board.js | 게시판 리스트 로직. 카테고리/정렬/검색 필터링, startAfter 기반 무한 스크롤, 게시글 카드 렌더링
- [신규] public/js/ui/board-form.js | 게시글 작성 폼 로직. 타입별 동적 필드, 이미지 업로드/미리보기(Drag&Drop), Firebase Storage 저장, 글자 수 카운트
- [신규] public/js/ui/board-detail.js | 게시글 상세 로직. 댓글 작성/삭제, 좋아요 토글, 신고 처리, 조회수 증가
- [신규] public/js/ui/admin-board.js | 관리자 패널 로직. 게시글/신고 목록 조회, 게시글 삭제, 신고 처리

## 2026-06-15 게시판 권한 및 Storage CORS 오류 수정 (김민기)
- [버그수정] firestore.rules | boardPosts, boardPosts/{postId}/comments, boardPosts/{postId}/likes, boardReports, admins 컬렉션 누락된 규칙 추가. boardPosts 읽기는 전체 공개, 쓰기는 로그인 사용자만, 수정/삭제는 작성자만 허용. 신고 조회는 관리자만 가능
- [버그수정] public/js/ui/board.js | 게시글 카드 썸네일 img 태그에 crossorigin="anonymous" 추가
- [버그수정] public/js/ui/board-detail.js | 게시글 상세 이미지 img 태그에 crossorigin="anonymous" 추가
- [버그수정] public/js/ui/board-form.js | 이미지 미리보기 img 태그에 crossorigin="anonymous" 추가
- [신규] storage.rules | Firebase Storage 게시판 이미지(board/images) 읽기 전체 공개, 쓰기는 인증된 사용자만, 5MB 제한
- [신규] cors.json | Firebase Storage CORS 설정 파일 생성. origin [*], method [GET, HEAD], maxAgeSeconds 3600
- [변경] firebase.json | storage.rules 설정 추가
- [변경] public/js/ui/board-form.js | 게시글 작성 시 authorName을 `profile?.nickname`에서 `profile?.realName || profile?.displayName`로 수정. users/{uid} 문서에는 nickname 필드가 없어 구글 계정 displayName으로만 저장되던 문제 해결
- [변경] firestore.indexes.json | boardPosts 복합 인덱스 6개 추가: (isDeleted, isPinned DESC, createdAt DESC), (isDeleted, boardType, isPinned DESC, createdAt DESC), (isDeleted, likeCount DESC, commentCount DESC, createdAt DESC), (isDeleted, boardType, likeCount DESC, commentCount DESC, createdAt DESC), (isDeleted, viewCount DESC, createdAt DESC), (isDeleted, boardType, viewCount DESC, createdAt DESC)
- [환경설정] gsutil cors set cors.json gs://honbab-ai.firebasestorage.app | Firebase Storage CORS 설정 적용. google-cloud-cli snap 설치, gcloud auth login, gcloud config set project honbab-ai 후 CORS 적용 완료

## 2026-06-15 프로필 이미지 업로드 기능 구현
- [기능추가] public/page/profile.html | 프로필 폼 상단에 아바타 이미지 표시 영역, 카메라 아이콘 편집 버튼, 파일 선택 input, hidden photoURL input 추가
- [기능추가] public/js/ui/profile.js | Firebase Storage를 이용한 프로필 이미지 업로드 로직 추가. 파일 선택 시 자동 업로드, 2MB 제한, 이미지 타입 검증, 업로드 상태 메시지 표시. 기존 photoURL이 있으면 로드하여 표시
- [변경] public/js/ui/profile.js | form submit 시 photoURL을 payload에 포함하여 Firestore에 저장
- [변경] storage.rules | profiles/{userId} 경로 명시적 규칙 추가. 읽기는 전체 공개, 쓰기는 본인 인증 사용자만, 2MB 제한

## 2026-06-14 요리 완료 모달 배달/외식 절감 비용 AI 자동 추정 (김민기)
- [기능추가] public/js/ui/shopping.js | `window.openCookModal(myIngredients)` 시그니처에 `recipeTitle` 파라미터 추가. 모달 오픈 직후 `#cookModalDiningCost` 입력 필드를 `disabled + placeholder "AI 추정 중..."` 상태로 설정하고, `/api/askGemini`에 요리명을 기준으로 "배달/외식 시 한국 평균 가격을 숫자만 답해줘" 프롬프트를 비동기 호출
- [기능추가] public/js/ui/shopping.js | AI 응답에서 첫 번째 숫자를 파싱(콤마 제거 후 정규식 매칭)하여 입력 필드에 자동 입력. 응답 실패 또는 recipeTitle 미전달 시 기존 기본값(12000) 폴백 처리
- [변경] public/js/ui/shopping.js | finish cooking 핸들러에서 `window.openCookModal(myIngredients)` → `window.openCookModal(myIngredients, title)`로 변경하여 현재 요리 제목을 AI 추정에 활용

## 2026-06-14 찜 항목 자동 삭제 버그 수정 및 대시보드 AI 추천 재료 연동 수정 (김민기)
- [버그수정] public/js/ui/shopping.js | 요리 완료 후 찜 항목 자동 삭제가 동작하지 않던 문제 수정. "요리 완료" 클릭 시점에 `finishBtn.closest("[data-card-id]")`로 ID를 탐색하면 조리 패널 교체 후 DOM 구조가 달라져 null을 반환하는 경우 발생. 모듈 수준 변수 `activeCookingShoppingItemId`, `activeCookingRecipeUrl`을 추가하여 "요리 시작" 클릭 시점에 미리 저장하도록 변경
- [버그수정] public/js/ui/dashboard.js | 대시보드 AI 냉장고 추천이 실제 재료를 반영하지 않고 일반적인 추천만 반환하던 문제 수정. `askGemini` Cloud Function은 `context.ingredients` 형식을 사용하는데 최상위 `ingredients`로 전송하고 있어 서버가 무시했음. `context: { title, ingredients: [{ groupName, items }], steps }` 구조로 수정하여 실제 냉장고 재료가 Gemini 프롬프트에 포함되도록 수정
- [정리] public/js/ui/shopping.js | AI 비용 추정 fetch 요청에서 불필요한 `recipeTitle`, `ingredients`, `steps` 필드 제거 (askGemini는 `question`과 `context`만 사용)

## 2026-06-15 손준혁·주한태 작업물 통합 병합 및 전반 개선 (김민기)
- [통합] functions/index.js | 손준혁 Express 기반 단일 api 함수 구조 적용. 기존 개별 exports 제거
- [통합] functions/package.json | express, cors 의존성 추가
- [통합] firebase.json | rewrites를 `/api/**` → `api` 단일 함수로 통합 (기존 3개 개별 rewrite 제거)
- [통합] public/js/core/nutrition-api.js | 손준혁 프록시 방식 적용
- [통합] public/page/board.html, board-form.html, board-detail.html, admin-board.html | 주한태 게시판 페이지 4개 통합. dashboard.css 중복 참조 제거, 캐시버스터 파라미터 정리
- [통합] public/css/board.css, profile.css | 주한태 게시판/프로필 스타일 추가
- [통합] public/js/core/board-api.js | 주한태 게시판 API 모듈 추가
- [통합] public/js/ui/board.js, board-form.js, board-detail.js, admin-board.js | 주한태 게시판 UI 로직 4개 추가
- [기능추가] public/js/ui/layout.js | 하단 내비게이션에 '수다방' 탭 추가 (messages-square 아이콘, match: "board")
- [기능추가] public/js/ui/dashboard.js | AI 냉장고 추천 자동 로드: 재료가 있으면 페이지 첫 진입 시 자동으로 추천 API 호출 (기존: 버튼 클릭 필요)
- [기능추가] public/js/ui/dashboard.js | AI 추천 결과 마크다운 렌더링: `**굵게**` → `<strong>`, `*기울임*` → `<em>` 변환. 기존에 날것으로 표시되던 `**볶음밥**` 문제 해결
- [디자인] public/css/global.css | 버튼 micro-interaction: `.button:active { transform: scale(0.97); }` 및 `transition: background 0.15s, transform 0.1s` 추가로 누르는 느낌 구현
- [디자인] public/js/ui/dashboard.js, shopping.js | 빈 상태(empty state) 이모지 추가: 유통기한 🥦, 지출 💸, 요리기록 🍳, 찜목록 🍽️

## 2026-06-19 손준혁 팀원 작업물 확인 및 통합 대상 정리
- [확인] 압축물/혼밥비서 손준혁 작업물과 메인 public 폴더 비교
- [확인] 손준혁 작업물은 대부분 메인에 이미 반영되어 있었고, board/global/utils/layout 일부 차이만 존재함을 확인
- [보존] public/js/firebase-config.js의 메인 Firebase 프로젝트(honbab-ai) 설정 유지
- [보존] functions/index.js의 Express 단일 api 함수 및 Secrets Manager 기반 Gemini 설정 유지

## 2026-06-22 주한태 팀원 후속 기능 통합
- [통합] public/page/feed.html, chat.html, admin.html 신규 페이지 추가
- [통합] public/css/feed.css, chat.css, admin.css 및 기존 화면 스타일 최신본 반영
- [통합] public/js/core/follow-api.js, chat-api.js, badge-engine.js, footer-injector.js 신규 코어 모듈 추가
- [통합] public/js/ui/feed.js, chat.js, admin.js 신규 UI 로직 추가
- [변경] public/js/ui/layout.js 알림 실시간 구독, 알림 삭제/모두 읽음, 팔로우 요청 수락/거절, 채팅 안 읽음 배지, 피드/메시지 네비게이션 반영
- [변경] public/js/ui/board-detail.js 댓글/대댓글 프로필 이미지 표시, 작성자/관리자 배지, 1:1 대화 이동, 댓글 수 카운트, 댓글 기본 펼침 상태 반영
- [변경] public/js/ui/profile.js 타 유저 프로필 조회, displayName 폴백, 프로필 이미지 동기화 대응 로직 반영
- [변경] public/js/ui/dashboard.js 내 게시글 기반 요리 갤러리 필터링, 예산 게이지 잔여 비율 방식, 배지/식단 플래너 관련 후속 로직 반영
- [변경] public/js/ui/recipes.js 레시피 카드 제목/메타 줄바꿈 안정화 및 유저 등록 레시피 연동 로직 반영
- [신규] public/favicon.svg, public/og-image-v2.png 정적 에셋 추가

## 2026-06-23 손준혁·주한태 작업물 메인 통합 정리 (김민기)
- [통합] 압축물 내 손준혁 6-19본과 주한태 6-22본을 기준으로 메인 프로젝트 public 로직/화면/스타일 병합
- [보존] public/js/firebase-config.js는 honbab-ai 메인 Firebase 설정 유지, 팀원 개인 프로젝트(hhhhhhhh-68c0b) 설정 미반영
- [보존] functions/index.js 및 firebase.json은 메인의 Express 단일 api rewrite 구조 유지, 주한태본의 개별 함수 rewrite 구조로 되돌리지 않음
- [수정] HTML 메타 태그에 남아 있던 팀원 개인 배포 도메인을 https://honbab-ai.web.app/ 기준으로 정리
- [수정] public/js/ui/board-detail.js 내 압축 해제 과정에서 깨진 한글 UI 문자열을 정상 문구로 복구
- [검증] public/js/core/*.js, public/js/ui/*.js, public/js/firebase-config.js Node.js 구문 검사 통과
- [검증] functions/index.js Node.js 구문 검사 통과
- [주의] Firestore 보안 규칙은 팔로우/채팅/알림 컬렉션 규칙 추가가 필요하나, 보안 규칙 덮어쓰기 승인이 차단되어 별도 승인 후 반영 필요

## 2026-06-23 채팅 페이지 콘솔 오류 대응 (김민기)
- [문제] /page/chat.html 접속 시 브라우저가 기본 /favicon.ico를 요청하면서 404 콘솔 오류 발생
- [문제] 채팅 목록 실시간 구독(observeChatRooms, observeTotalUnreadChats)이 Firestore chats 컬렉션을 읽으려 했지만 현재 firestore.rules에 chats 경로 권한이 없어 FirebaseError permission-denied가 uncaught로 표시됨
- [해결] public/page/chat.html head에 /favicon.svg 링크를 추가하여 favicon.ico 기본 요청 404를 방지
- [해결] public/js/core/chat-api.js의 onSnapshot 구독 3곳(observeChatRooms, observeTotalUnreadChats, observeMessages)에 에러 콜백을 추가하여 권한 오류가 uncaught 예외로 터지지 않고 빈 상태/0개 상태로 안전하게 렌더링되도록 처리
- [주의] 실제 채팅 기능 정상 동작에는 firestore.rules에 chats/{chatId}, chats/{chatId}/messages 권한 추가 후 Firestore rules 배포가 필요함. 보안 규칙 변경은 별도 명시 승인 후 반영 필요
- [해결] public/favicon.svg를 기반으로 public/favicon.ico 실제 아이콘 파일을 생성하여 브라우저 기본 /favicon.ico 요청도 404가 나지 않도록 보강

## 2026-06-23 채팅 Firestore 권한 규칙 반영 (김민기)
- [문제] 채팅 클라이언트가 chats 컬렉션을 구독하지만 firestore.rules에 chats 경로가 없어 실제 메시지 기능은 permission-denied 상태였음
- [수정] firestore.rules에 chats/{chatId} 규칙 추가: 채팅방 members 배열에 포함된 로그인 사용자만 get/list/update 가능, 생성은 request.resource.data.members에 본인 UID가 포함된 경우만 허용, 삭제는 차단
- [수정] firestore.rules에 chats/{chatId}/messages 규칙 추가: 채팅방 참여자만 메시지 읽기 가능, 메시지 생성은 참여자이면서 senderId가 본인 UID인 경우만 허용
- [검증] firebase deploy --only firestore:rules --dry-run 실행 결과 firestore.rules 컴파일 성공 확인

## 2026-06-23 AI 식단 플래너 끼니 선택 드롭다운 표시 오류 수정 (김민기)
- [문제] 대시보드 AI 식단 플래너의 끼니 선택 드롭다운에서 아침/점심만 보이고 저녁 옵션이 아래 카드 영역에 가려져 보이지 않는 현상 확인
- [원인] public/css/dashboard.css의 공통 .dashboard-card overflow:hidden 스타일이 네이티브 select 드롭다운까지 카드 경계에서 잘라내고 있었음
- [해결] .dashboard-card--planner에 position:relative, z-index, overflow:visible을 적용하고 플래너 내부 selector/meals 영역도 overflow:visible로 보강하여 세 옵션이 모두 표시되도록 수정

## 2026-06-23 관리자 페이지 Firestore 권한 오류 수정 (김민기)
- [문제] /page/admin.html 접속 시 관리자 권한 문서는 존재하지만 users 컬렉션 전체 카운트/목록 조회 권한이 없어 콘솔에 Firestore permission-denied 오류가 발생할 수 있었음
- [원인] firestore.rules의 users/{userId} 규칙이 본인 문서 읽기/수정만 허용하고 있어 관리자 페이지의 회원 목록 조회, 계정 정지/해제 같은 운영 기능과 권한 모델이 맞지 않았음
- [해결] firestore.rules에 isAdmin() 헬퍼를 추가하고 admins/{uid} 문서가 있는 사용자에게 users 읽기/수정 권한을 부여함. 사용자 본인 create 권한과 delete 차단 정책은 유지
- [해결] 관리자 화면의 게시글/신고 관리 동작을 위해 boardPosts update/delete 및 boardReports read/update/delete도 isAdmin() 기준으로 정리
- [검증] firebase deploy --only firestore:rules --dry-run 실행 결과 firestore.rules 컴파일 성공 확인

## 2026-06-23 관리자 게시판 신고 목록 렌더링 오류 수정 (주한태 작업 김민기 수정)
- [문제] /page/admin-board.html 신고 관리 탭에서 Firestore 요청은 성공했지만 화면에 "reports.map is not a function" 오류가 표시됨
- [원인] public/js/core/board-api.js의 listAllReports()는 { reports, lastDoc } 객체를 반환하는데 public/js/ui/admin-board.js가 반환값 전체를 배열로 보고 reports.map()을 호출했음
- [해결] admin-board.js의 loadReports()에서 const { reports } = await listAllReports()로 구조분해하여 실제 신고 배열에 map()을 호출하도록 수정
- [검증] node --check public/js/ui/admin-board.js 문법 검사 통과

## 2026-06-23 냉장고 재료 등록 영양정보 CORS 오류 수정 (손준혁 작업 김민기 수정)
- [문제] /page/fridge.html에서 재료 등록 시 등록은 성공하지만 public/js/core/nutrition-api.js가 식약처 공공데이터 API(apis.data.go.kr)를 브라우저에서 직접 호출해 CORS 차단 및 404 콘솔 오류가 발생함
- [원인] functions/index.js에는 /api/getNutrition 서버 프록시가 이미 구현되어 있었지만 프론트 영양정보 모듈은 이전 직접 호출 방식(BASE_URL + serviceKey)을 그대로 사용하고 있었음
- [해결] nutrition-api.js의 fetchNutrition()을 같은 도메인의 /api/getNutrition?foodName=... 호출로 변경하여 Firebase Functions 프록시를 거치도록 수정. 외부 API 실패 시에도 빈 배열로 폴백하여 재료 등록 흐름은 유지
- [검증] node --check public/js/core/nutrition-api.js 문법 검사 통과
- [검증] curl -I https://honbab-ai.web.app/api/getNutrition?foodName=%EB%AC%B4 결과 HTTP 200 응답 확인

## 2026-06-23 AI 조리 도우미 반응형 패널 및 스와이프 개선 (주한태 작업 김민기 수정)
- [문제] /page/shopping.html에서 개발자도구를 켜 화면 폭이 줄어들면 AI 조리 도우미가 모바일 풀스크린 패널처럼 바뀌고, 접힌 탭/스와이프가 제대로 반응하지 않는 현상 발생
- [문제] 실제 모바일 또는 작은 화면에서는 AI 조리 도우미가 화면을 덮은 뒤 닫기 버튼 접근성이 떨어지고 스와이프로 닫기 어려운 문제가 있었음
- [원인] public/css/shopping.css가 1439px 이하를 모두 모바일 패널로 처리해 데스크톱 축소 화면과 모바일 화면을 구분하지 못했고, public/js/ui/shopping.js의 스와이프 로직이 touch 이벤트 중심이라 마우스 드래그/개발자도구 환경 대응이 부족했음
- [해결] 861px~1439px 구간은 데스크톱 보조 패널로 유지되도록 CSS 보정. 실제 모바일 구간(max-width:860px)에서만 전체 화면 슬라이드 패널을 사용하도록 분리
- [해결] AI 패널 열기/닫기를 setAiPanelOpen()으로 통합하고, 모바일 스와이프를 Pointer Events 기반으로 재구현하여 터치와 마우스 드래그를 함께 지원
- [해결] 모바일 패널 헤더를 sticky로 고정하고 닫기 버튼 크기/위치를 보강, 패널 오픈 시 본문 스크롤 잠금 처리 추가
- [검증] node --check public/js/ui/shopping.js 문법 검사 통과

## 2026-06-23 AI 조리 도우미 모바일 닫기 스와이프 보강 (주한태 작업의 문제 김민기 수정)
- [문제] 모바일 화면에서 오른쪽 가장자리 핸들을 왼쪽으로 스와이프하면 AI 조리 도우미가 열리지만, 열린 패널을 왼쪽에서 오른쪽으로 스와이프해 닫는 동작이 반응하지 않는 현상 확인
- [원인] 기존 개선 로직이 Pointer Events 중심이라 일부 모바일/Chrome DevTools 모바일 에뮬레이션에서 브라우저 기본 터치 처리 또는 pointercancel에 의해 닫기 판정까지 도달하지 못할 수 있었음
- [해결] public/js/ui/shopping.js에 touchstart/touchmove/touchend fallback을 추가하여 모바일 패널 열린 상태에서 오른쪽 스와이프를 별도로 감지하고 setAiPanelOpen(false)로 닫히도록 보강
- [해결] public/css/shopping.css에 모바일 패널 touch-action: pan-y, 드래그 중 touch-action: none 및 overscroll-behavior: contain을 추가하여 수평 스와이프가 브라우저 기본 동작에 막히지 않도록 조정
- [정리] PC 환경은 스와이프가 아니라 오른쪽 AI 탭/닫기 버튼 방식으로 유지하고, 스와이프 동작은 max-width:860px 모바일 패널에서만 동작하도록 유지
- [검증] node --check public/js/ui/shopping.js 문법 검사 통과

## 2026-06-23 관리자 진입 흐름 및 공통 약관 모달 UI 수정 (김민기)
- [변경] public/js/ui/auth.js | 이메일/구글 로그인 성공 후 관리자 여부와 관계없이 /page/dashboard.html로 이동하도록 수정. 관리자는 별도 관리자 버튼을 통해 관리 페이지로 진입하는 흐름으로 변경
- [변경] public/js/ui/landing.js | 로그인된 관리자가 랜딩 페이지의 시작하기 버튼을 눌러도 /page/admin.html로 바로 이동하지 않고 /page/dashboard.html로 이동하도록 수정
- [기능추가] public/js/ui/layout.js | 공통 상단 레이아웃에서 admins/{uid} 권한을 확인해 role이 admin 또는 operator인 사용자에게만 관리자 페이지(/page/admin.html) 진입 버튼을 노출하도록 추가
- [문제] index.html에서는 이용약관/개인정보처리방침 모달이 정상이나, dashboard.html 등 footer-injector로 모달이 삽입되는 페이지에서는 닫기 버튼이 제목 아래로 밀려 보이는 UI 깨짐 발생
- [원인] index.html은 marketing.css의 .terms-modal__head/.terms-content 스타일을 사용하지만, 다른 앱 페이지는 global.css만 로드되어 footer-injector가 삽입한 약관 모달 헤더/본문 전용 스타일이 누락되어 있었음
- [해결] public/css/global.css에 .modal__content.terms-modal, .terms-modal__head, .terms-content 공통 스타일을 추가해 index 외 페이지에서도 닫기 버튼이 우측 상단에 정렬되고 본문 스크롤 영역이 안정적으로 표시되도록 수정
- [검증] node --check public/js/ui/auth.js, public/js/ui/landing.js, public/js/ui/layout.js 문법 검사 통과

## 2026-06-23 관리자 페이지 디자인 통합 및 단일 진입점 정리 (김민기)
- [판단] 기존 admin.html은 별도 사이드바/파란색 관리자 테마를 사용해 혼밥비서 공통 디자인과 이질적이었고, admin-board.html은 공통 app-shell/board 스타일을 사용해 서비스 디자인과 더 일관적이었음
- [변경] public/page/admin.html | 공통 global/dashboard/board 스타일 기반의 관리자 센터로 재구성. 요약, 회원 관리, 게시글 관리, 신고 관리 탭을 한 페이지에 통합하고 기존 data hook은 유지하여 admin.js 기능을 그대로 사용
- [변경] public/css/admin.css | Bootstrap 계열 별도 관리자 테마를 제거하고 혼밥비서 카드/탭/테이블 톤에 맞춘 관리자 전용 보정 스타일로 교체
- [변경] public/js/ui/admin.js | 관리자 페이지에서도 mountLayout("admin")을 호출해 공통 상단 네비게이션과 푸터 흐름을 사용하도록 연결
- [정리] public/page/admin-board.html | 게시판 관리 전용 중복 페이지 대신 /page/admin.html로 즉시 이동하는 안내/리다이렉트 페이지로 축소
- [유지] 회원 목록, 계정 정지/해제, 게시글 삭제/복구, 신고 처리 기능은 기존 admin.js 로직을 유지하여 단일 관리자 센터 안에서 계속 사용 가능
- [검증] node --check public/js/ui/admin.js 및 public/js/ui/layout.js 문법 검사 통과

## 2026-06-23 관리자 회원 조회 Firestore rules 실제 배포 (김민기)
- [문제] /page/admin.html 회원 관리 탭에서 users 컬렉션 count/list 요청이 permission-denied로 실패. 로컬 firestore.rules에는 관리자 users 읽기 권한이 반영되어 있었지만 실제 배포 rules가 이전 상태였음
- [해결] firebase deploy --only firestore:rules --dry-run으로 컴파일 성공 확인 후 firebase deploy --only firestore:rules로 honbab-ai 프로젝트에 실제 배포
- [검증] 배포 결과 cloud.firestore release가 새 ruleset(a1625d5b-892a-4f95-9b2f-e27e80ce684f)으로 업데이트되고 Deploy complete 확인

## 2026-06-23 관리자 테이블 중첩 스크롤 UI 수정 (김민기)
- [문제] /page/admin.html 게시글/회원/신고 테이블 카드 내부에 별도 세로 스크롤바가 생겨 페이지 스크롤과 카드 스크롤이 중첩되는 UI 어색함 발생
- [원인] public/css/admin.css의 .table-responsive가 기본 상태에서 overflow-x:auto를 사용하면서 데스크톱 폭에서도 브라우저가 테이블 래퍼를 스크롤 컨테이너로 계산했음
- [해결] 데스크톱 기본 상태에서는 .table-responsive overflow:visible, .admin-table min-width:0으로 설정해 카드 내부 세로 스크롤을 제거
- [해결] 760px 이하 모바일 구간에서만 .table-responsive overflow-x:auto 및 .admin-table min-width:760px를 적용해 작은 화면에서는 필요한 경우 가로 스크롤만 사용하도록 분리

## 2026-06-23 고객센터 문의 접수 저장 및 관리자 문의 관리 추가 (김민기)
- [문제] 하단 고객센터/문의하기 폼은 EmailJS 메일 발송만 시도하고 Firestore에 접수 내역을 저장하지 않아 관리자 페이지에서 문의를 확인할 방법이 없었음
- [변경] public/js/core/footer-injector.js | 문의 제출 시 supportTickets 컬렉션에 name, email, message, status, source, userAgent, createdAt을 저장하도록 추가. EmailJS는 보조 메일 알림 용도로 유지하고 실패해도 Firestore 접수는 유지
- [변경] public/js/ui/landing.js | index.html의 하드코딩 푸터도 footer-injector의 이벤트 바인딩을 사용하도록 injectUniversalFooter() 호출 추가
- [기능추가] public/page/admin.html | 관리자 센터에 문의 관리 탭과 문의 내역 테이블 추가
- [기능추가] public/js/ui/admin.js | supportTickets 최근 50건 조회, 문의 상세 보기, 처리 완료 상태 업데이트, 답장 메일 링크 기능 추가
- [보안] firestore.rules | supportTickets 생성은 제한된 필드/길이/status=pending 조건으로 누구나 가능하게 하고, 읽기/수정/삭제는 isAdmin()만 가능하도록 규칙 추가
- [배포] firebase deploy --only firestore:rules 실행 완료. cloud.firestore release가 ruleset d70b2592-80b4-44e6-999b-dd65ab7021d1로 업데이트됨
- [검증] node --check public/js/core/footer-injector.js, public/js/ui/admin.js, public/js/ui/landing.js 문법 검사 통과

## 2026-06-23 로그인 상태 랜딩 CTA 표시 오류 수정 (김민기)
- [문제] 이미 로그인한 사용자가 서비스 소개를 보기 위해 index.html에 접속해도 히어로 영역에 "로그인하고 시작"과 "회원가입" 버튼이 그대로 표시되어 현재 로그인 상태와 맞지 않는 UX 문제가 있었음
- [원인] public/js/ui/landing.js가 document.querySelector("[data-start]")로 첫 번째 CTA만 갱신하고 있어 상단 네비게이션 버튼만 대시보드 링크로 바뀌고, 히어로 CTA는 초기 HTML 상태로 남아 있었음
- [해결] landing.js에서 모든 [data-start] 버튼을 querySelectorAll로 순회하도록 변경. 로그인 상태에서는 히어로 버튼 문구/아이콘을 "대시보드로 이동"으로 바꾸고 회원가입 CTA는 숨기도록 처리
- [해결] public/index.html의 히어로 회원가입 버튼에 data-signup-cta hook을 추가해 로그인/비로그인 상태에 따라 노출을 제어하도록 수정
- [검증] node --check public/js/ui/landing.js 문법 검사 통과

## 2026-06-23 로그인 상태 회원가입 CTA 잔존 오류 수정 (김민기)
- [문제] 로그인 상태의 index.html에서 히어로 주 CTA는 "대시보드로 이동"으로 바뀌었지만 보조 CTA인 "회원가입" 버튼이 계속 표시되어 이미 가입/로그인한 사용자에게 맞지 않는 화면이 노출됨
- [원인] public/js/ui/landing.js는 회원가입 CTA에 hidden 속성을 부여했지만, public/css/marketing.css의 .button 계열 display 스타일이 브라우저 기본 hidden 표시 규칙보다 우선 적용될 수 있어 버튼이 화면에 남을 수 있었음
- [해결] public/css/marketing.css에 [hidden] { display: none !important; } 규칙을 추가하고, landing.js에서도 로그인 상태일 때 signup CTA에 hidden과 style.display = "none"을 함께 적용하도록 보강
- [검증] node --check public/js/ui/landing.js 문법 검사 통과

## 2026-06-23 랜딩 페이지 기능 안내 reveal 및 만든사람들 섹션 추가 (김민기)
- [변경] public/index.html | 상단 메뉴의 기능/사용 흐름 링크를 기능 안내 하나로 통합하고, 만든사람들 메뉴를 추가함
- [변경] public/index.html | 기존 기능 섹션과 사용 흐름 섹션을 guide 영역으로 묶고, 만든사람들 섹션을 추가해 김민기/손준혁/주한태의 작업 성향과 담당 영역을 AI_REPORT_LOG 기반으로 요약 반영
- [기능추가] public/js/ui/landing.js | PC 첫 휠 스크롤과 모바일 위쪽 스와이프를 감지하면 숨겨진 기능 안내 영역을 노출하고 부드럽게 이동하도록 revealGuide 로직 추가
- [기능추가] public/js/ui/landing.js | 상단 기능 안내/만든사람들 버튼 및 footer 서비스 소개 링크가 같은 reveal 동작을 사용하도록 연결
- [변경] public/css/marketing.css | guide 영역 초기 숨김, 노출 애니메이션, 만든사람들 카드, 모바일 헤더 메뉴 표시 보정 스타일 추가
- [수정] public/js/core/footer-injector.js | 공통 footer의 서비스 소개 링크를 /index.html#guide 기준으로 변경하고, 랜딩 페이지의 data-guide-link 동작과 충돌하지 않도록 이벤트 분리
- [검증] node --check public/js/ui/landing.js, public/js/core/footer-injector.js 문법 검사 통과

## 2026-06-23 만든사람들 소개 문구 사용자 기능 중심 수정 (김민기)
- [문제] 랜딩 페이지 만든사람들 소개가 Firestore 권한, Gemini/Functions 등 내부 구현명 중심으로 작성되어 방문자가 각 팀원이 맡은 사용자 기능을 이해하기 어려웠음
- [수정] public/index.html | 김민기는 서비스 기획/전체 연결/운영 흐름, 손준혁은 요리하기/식비 관리, 주한태는 냉장고/수다방/프로필 담당으로 소개 문구를 사용자-facing 기능 중심으로 재작성
- [검증] 만든사람들 섹션에서 내부 기술명 대신 실제 화면과 기능 담당 영역이 보이도록 문구 확인

## 2026-06-23 수다방 작성자 표시명 불일치 버그 수정 (김민기)
- [문제] 마이페이지/프로필에서는 realName이 "김민기"로 표시되지만 수다방 게시글/댓글/답글 작성자명은 Firebase Auth displayName 또는 기존 nickname 값인 "밍이BJ"로 표시되는 불일치 발생
- [원인] public/js/ui/board-form.js는 게시글 생성 시 profile.nickname 또는 user.displayName을 authorName으로 저장했고, public/js/ui/board-detail.js는 댓글/답글 생성 시 user.displayName을 직접 저장하고 있었음. 기존 작성 데이터도 저장 당시 authorName만 렌더링해 현재 프로필 이름 변경이 반영되지 않았음
- [해결] public/js/core/auth.js에 getPreferredDisplayName(profile, fallbackUser) 공통 표시명 helper를 추가하고 realName > displayName > nickname 순서로 표시명을 결정하도록 정리
- [해결] public/js/ui/board-form.js, public/js/ui/board-detail.js에서 새 게시글/댓글/답글 생성 시 현재 users/{uid}.realName을 우선 저장하도록 수정
- [해결] public/js/ui/board-detail.js와 public/js/ui/board.js에서 게시글/댓글/답글/목록 렌더링 전 작성자 프로필을 조회해 기존 authorName 대신 현재 realName을 우선 표시하도록 보강. 과거 저장된 "밍이BJ" 댓글도 프로필 realName이 있으면 "김민기"로 표시됨
- [해결] public/js/core/board-api.js의 좋아요 알림 actorName도 realName 우선으로 수정
- [검증] node --check public/js/core/auth.js, public/js/core/board-api.js, public/js/ui/board-form.js, public/js/ui/board-detail.js, public/js/ui/board.js 문법 검사 통과

## 2026-06-23 수다방 좋아요 오류 및 일반 사용자 댓글 권한 수정 (김민기)
- [문제] /page/board-detail.html에서 좋아요 클릭 시 Lucide 아이콘 렌더링 후 기존 i 태그를 찾지 못해 Cannot read properties of null (reading 'classList') 콘솔 오류가 발생하고 좋아요 UI 갱신이 중단됨
- [원인] public/js/ui/board-detail.js의 좋아요 핸들러가 lucide.createIcons() 이후 사라질 수 있는 i 태그에 직접 classList를 호출하고 있었음
- [해결] 좋아요 애니메이션 대상을 내부 i 태그가 아닌 data-like-btn 버튼으로 변경하고, toggleLike 실패 시 사용자 안내 모달을 표시하도록 try/catch 처리
- [문제] 일반 사용자가 타인의 게시글에 댓글을 달거나 게시글 조회수/좋아요를 갱신할 때 Firestore permission-denied가 발생함. 관리자는 rules상 author/admin 업데이트 권한이 있어 댓글이 되는 것처럼 보였음
- [원인] firestore.rules가 boardPosts update를 작성자 또는 관리자에게만 허용해, 댓글/좋아요/조회수 트랜잭션에서 부모 게시글의 commentCount, lastCommentAt, likeCount, viewCount 집계 필드 갱신을 일반 사용자가 수행할 수 없었음
- [해결] firestore.rules에 changedOnly 헬퍼와 isViewCountIncrement, isLikeCountChange, isCommentCountChange 조건을 추가해 로그인 사용자가 집계 필드만 제한적으로 증감할 수 있도록 허용
- [배포] firebase deploy --only firestore:rules 실행 완료. cloud.firestore release가 ruleset 51600197-2237-4812-b437-f5e822531016으로 업데이트됨
- [검증] node --check public/js/ui/board-detail.js 통과, firebase deploy --only firestore:rules --dry-run 컴파일 통과

## 2026-06-23 공개 프로필 분리 및 수다방/채팅 프로필 권한 오류 수정 (김민기)
- [문제] 수다방 상세/댓글 렌더링과 1:1 메시지 화면에서 타인의 users/{uid} 문서를 직접 조회하면서 작성자 프로필 조회 실패, chat.js permission-denied, Notification creation failed 경고/오류가 발생함
- [원인] firestore.rules는 개인정보 보호를 위해 users 문서를 본인/관리자만 읽도록 제한하고 있었지만, 수다방/채팅/피드 일부 화면이 표시명과 프로필 사진을 얻기 위해 users 문서를 직접 읽는 구조였음. 또한 타인에게 알림을 생성하는 users/{uid}/notifications create 권한도 닫혀 있었음
- [해결] public/js/core/auth.js에 publicProfiles 공개 프로필 저장/조회 헬퍼를 추가하고, 본인 프로필 저장/로그인 상태 확인 시 realName/displayName/photoURL 등 공개 표시 정보만 publicProfiles/{uid}로 동기화하도록 구현
- [해결] public/js/ui/board.js, board-detail.js, chat.js, feed.js에서 타인 users 문서 직접 조회를 publicProfiles 조회로 변경하고, 공개 프로필이 아직 없는 기존 사용자는 저장된 authorName/authorPhoto 또는 URL fallback으로 조용히 표시하도록 처리
- [해결] board-detail.js의 1:1 대화 링크에 targetName/targetPhoto fallback 파라미터를 추가해 공개 프로필이 아직 동기화되지 않은 사용자와도 채팅 헤더가 비어 보이지 않도록 보강
- [해결] firestore.rules에 publicProfiles 읽기/본인 쓰기 규칙을 추가하고, users/{uid}/notifications는 actorId가 현재 사용자이고 제한된 필드만 포함하는 경우 생성 가능하도록 허용
- [배포] firebase deploy --only firestore:rules 실행 완료. cloud.firestore release가 ruleset 1f08d0fb-4bd7-419d-9563-9b7d307a137f로 업데이트됨
- [배포] firebase deploy --only hosting 실행 완료. publicProfiles 기반 수다방/채팅/피드 JS 변경 반영
- [검증] node --check public/js/core/auth.js, public/js/ui/board-detail.js, public/js/ui/board.js, public/js/ui/chat.js, public/js/ui/feed.js 통과 및 firestore.rules dry-run 컴파일 통과

## 2026-06-23 수다방 작성자 프로필 진입 fallback 보강 (김민기)
- [버그발견] 수다방 게시글/댓글 작성자 이름을 클릭해 feed.html?uid=...로 이동하면, 기존 사용자에게 publicProfiles 문서가 아직 없어 프로필 조회 권한 오류가 발생하고 기본 사용자 정보로 표시되는 현상 확인
- [원인] 개인정보 보호를 위해 users/{uid} 문서는 본인/관리자만 읽도록 제한했지만, 기존 게시글의 작성자 링크는 uid만 전달하여 공개 프로필 문서가 없는 사용자의 표시명/사진 fallback 데이터가 부족했음
- [수정] public/js/ui/board.js 게시글 목록 작성자 프로필 링크에 작성자명과 사진 URL을 함께 전달하도록 변경
- [수정] public/js/ui/board-detail.js 게시글 작성자, 댓글 작성자, 답글 작성자 프로필 링크에 작성자명과 사진 URL을 함께 전달하도록 변경
- [수정] public/js/ui/feed.js 공개 프로필 조회 실패 또는 문서 미생성 시 URL fallback(name/photo)을 사용해 작성자 프로필 화면을 표시하도록 보강
- [수정] public/js/ui/feed.js 프로필 화면의 1:1 대화 버튼도 targetName/targetPhoto를 함께 넘겨 채팅 헤더가 비어 보이지 않도록 개선
- [검증] public/js/ui/board.js, public/js/ui/board-detail.js, public/js/ui/feed.js Node.js 문법 검사 통과
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app

## 2026-06-23 고객센터 문의/답변 흐름 개선 (김민기)
- [변경] public/js/core/footer-injector.js 고객센터 폼에서 이메일 입력을 제거하고 로그인 사용자 기준 문의 접수 구조로 변경
- [신규] public/js/core/footer-injector.js 고객센터 모달에 내 문의 내역 영역을 추가하여 본인이 접수한 문의와 관리자 답변을 확인할 수 있도록 구현
- [변경] public/page/admin.html 문의 관리 테이블에서 이메일 열을 제거하고 답변 상태/답변 미리보기/작업 중심으로 재구성
- [신규] public/js/ui/admin.js 문의 관리 작업에 답변하기와 처리완료를 분리하여 추가, 답변 등록 시 supportTickets.reply/status/repliedAt를 갱신하도록 구현
- [신규] public/js/ui/admin.js 관리자가 문의에 답변하면 해당 사용자 notifications에 support_reply 알림을 생성하도록 구현
- [변경] public/js/ui/layout.js 알림 패널에서 support_reply 알림을 고객센터 답변 알림으로 표시하고 고객센터 모달 진입 링크를 연결
- [변경] firestore.rules supportTickets 권한을 로그인 사용자 생성/본인 문의 읽기/관리자 전체 읽기·답변·처리완료 구조로 보강
- [변경] firestore.rules notifications 생성 허용 필드에 ticketId를 추가하여 고객센터 답변 알림을 저장할 수 있도록 수정
- [변경] public/js/core/footer-injector.js 알림 링크로 고객센터 모달이 바로 열릴 때 Firebase Auth 초기화 완료를 기다리도록 보강
- [검증] public/js/core/footer-injector.js, public/js/ui/admin.js, public/js/ui/layout.js Node.js 문법 검사 통과
- [검증] firebase deploy --only firestore:rules --dry-run 통과
- [배포] Firestore rules 배포 완료: ruleset 195f85ca-7781-4e00-a747-71abc9a1a6fe
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app
- [배포] Auth 초기화 보강 반영 후 Firebase Hosting 재배포 완료

## 2026-06-25 1:1 채팅방 신규 생성 권한 오류 수정 (김민기)
- [버그발견] 수다방/프로필에서 1:1 메시지로 진입한 뒤 메시지를 보내면 FirebaseError: Missing or insufficient permissions가 발생하고 채팅 화면이 빈 상태로 남는 현상 확인
- [원인] public/js/core/chat-api.js createOrGetChatRoom()이 신규 채팅방 생성 전에 getDoc(chats/{chatId})를 먼저 호출했으나, Firestore rules는 기존 채팅방의 members에 포함된 사용자만 읽기를 허용하므로 아직 없는 채팅방 조회 단계에서 권한 오류가 발생할 수 있었음
- [수정] public/js/core/chat-api.js 신규/기존 채팅방 진입 시 사전 getDoc 없이 setDoc(..., { merge: true })로 members와 표시용 memberProfiles를 보강하도록 변경
- [수정] public/js/core/chat-api.js 채팅방 재진입 시 unreadCount가 0으로 초기화되지 않도록 unreadCount 초기 merge를 제거
- [수정] public/js/ui/chat.js 채팅방 열기 실패와 읽음 처리 실패를 catch하여 콘솔 오류가 화면 전체 동작을 막지 않도록 보강
- [수정] public/js/ui/chat.js 상대방 lastActive 정보가 없는 경우 실제 로그아웃처럼 보이는 오프라인 대신 대화 가능으로 표시하도록 변경
- [정책확인] 1:1 채팅은 사용자 UID 기반 개인 대화이므로 비로그인 전송은 허용하지 않으며, 로그인이 필요한 기능으로 유지
- [검증] public/js/core/chat-api.js, public/js/ui/chat.js Node.js 문법 검사 통과
- [배포] Firebase Hosting 배포 완료: https://honbab-ai.web.app

## 2026-06-30 요리 완료 기록 오류 및 식비 탭 보기 개선 (김민기)
- [버그발견] 요리/레시피 화면에서 요리 완료 기록 버튼 클릭 시 shopping.js에서 valueAsDate를 지원하지 않는 입력 요소에 Date 값을 넣어 InvalidStateError가 발생하고 완료 기록 모달 진행이 중단됨
- [원인] 완료 기록 모달 초기화 시 날짜 입력값을 valueAsDate로 직접 지정해 브라우저/DOM 상태에 따라 date input이 아닌 요소로 판단될 경우 예외가 발생할 수 있었음
- [수정] public/js/ui/shopping.js | 완료 기록 날짜 기본값을 toDateInputValue() 문자열로 설정하도록 변경해 input 타입 상태와 무관하게 안전하게 초기화
- [개선] public/page/expenses.html, public/js/ui/expenses.js, public/css/expenses.css | 식비 화면의 월간 달력/카테고리별 지출/지출 내역을 내부 탭 메뉴로 전환해 한 영역씩 볼 수 있도록 정리
- [개선] 월간 달력 셀의 요리 완료/지출 표시를 최대 3건 요약과 +N건 형태로 줄여 작은 셀에서 텍스트가 과도하게 잘리는 현상을 완화


## 2026-06-30 식비 탭 패널 전환 및 모바일 달력 보정 추가 (김민기)
- [문제] 식비 화면에서 월간 달력/카테고리별 지출/지출 내역 탭을 눌러도 accordion-container의 display 스타일이 hidden 속성보다 우선되어 세 패널이 모두 계속 노출됨
- [수정] public/js/ui/expenses.js | 선택된 탭 패널에 is-active-panel 클래스를 함께 부여하고 비활성 패널은 hidden 처리하도록 보강
- [수정] public/css/expenses.css | data-expense-panel 비활성/hidden 패널을 display:none!important로 숨겨 탭별로 하나의 영역만 보이도록 고정
- [개선] 모바일 폭에서는 달력 7열이 과도하게 찌그러지지 않도록 달력 보드에 최소 너비와 가로 스크롤을 적용

## 2026-06-30 식비 그래프 확대, 신고자 표시 개선, 팔로우 수락 권한 수정 (김민기)
- [개선] public/css/expenses.css | 카테고리별 지출 탭의 원형 그래프 영역 높이를 달력 패널에 맞춰 확대하고 모바일에서는 적정 높이로 줄이도록 반응형 보정
- [개선] public/page/admin.html, public/js/ui/admin.js | 신고 관리 테이블의 신고자 ID를 신고자로 변경하고, 신고자/신고 대상자를 UID 대신 이름으로 표시하도록 보강
- [원인] 팔로우 요청 수락 시 수락자가 요청자 문서의 following 하위 문서를 생성해야 하지만 firestore.rules가 요청자 본인만 해당 경로 생성을 허용해 permission-denied가 발생
- [수정] firestore.rules | followRequests 문서가 존재하는 경우 수락자가 요청자 following 문서를 생성할 수 있도록 제한 조건을 추가

## 2026-06-30 정지 해제 문의 접수 실패 수정 (김민기)
- [버그발견] 정지된 사용자가 정지 해제 문의를 제출하면 화면에는 문의 전송 실패만 표시되고 콘솔에는 원인이 남지 않는 현상 확인
- [원인] public/js/core/utils.js의 정지 해제 문의는 banAppeals 컬렉션에 저장하지만 firestore.rules에 banAppeals create 규칙이 없어 기본 거부로 permission-denied가 발생
- [수정] firestore.rules | 로그인 사용자가 본인 uid로 pending 상태의 banAppeals 문서를 생성할 수 있도록 제한 규칙 추가, 읽기/수정/삭제는 관리자만 허용
- [수정] public/js/core/utils.js | 정지 해제 문의 실패 시 콘솔에 실제 오류를 남기도록 보강
- [정리] public/js/ui/admin.js | 신고 관리 더보기 행 colspan을 신고 대상자 컬럼 추가 후의 8칸 구조에 맞게 보정

## 2026-06-30 정지 해제 문의 권한 조건 및 알림 중첩 보정 (김민기)
- [문제] banAppeals 규칙 추가 후에도 정지 해제 문의 제출 시 permission-denied가 발생하고, 실패 알림이 정지 해제 문의 모달 뒤에 가려져 취소 후에야 보이는 현상 확인
- [원인] banAppeals create 규칙이 serverTimestamp 변환값을 request.time과 직접 비교해 클라이언트 transform 쓰기에서 거부될 수 있었고, showAlertModal z-index가 정지 해제 문의 모달보다 낮았음
- [수정] firestore.rules | banAppeals 생성 조건에서 createdAt == request.time 직접 비교를 제거하고 본인 uid, 허용 필드, 문의 길이, pending 상태 중심으로 검증
- [수정] public/js/core/utils.js | 공통 알림 모달 z-index를 정지/문의 서브 모달보다 높여 실패/성공 알림이 즉시 전면에 보이도록 보정

## 2026-06-30 정지 해제 문의 인증 유지 순서 수정 (김민기)
- [문제] banAppeals 규칙을 추가/완화한 뒤에도 정지 해제 문의 제출 시 permission-denied가 계속 발생
- [원인] public/js/core/auth.js의 정지 사용자 처리 흐름이 showBanModal 표시 전에 signOut(auth)를 먼저 실행해, 문의 보내기 클릭 시점에는 이미 비로그인 상태였음
- [수정] 정지 안내 모달이 닫히기 전까지 인증 세션을 유지하고, 사용자가 확인을 눌러 모달 흐름이 끝난 뒤 signOut 및 로그인 화면 이동을 실행하도록 순서 변경
- [검증] public/js/core/auth.js Node.js 문법 검사 통과

## 2026-06-30 정지 해제 문의 관리자 조회/처리 추가 (김민기)
- [문제] 정지 사용자의 문의가 banAppeals 컬렉션에는 저장되지만 관리자 센터에서 조회하거나 처리할 화면이 없어 운영자가 확인할 수 없는 미구현 상태였음
- [수정] public/page/admin.html | 관리자 센터에 정지 문의 탭과 정지 해제 문의 테이블을 추가
- [수정] public/js/ui/admin.js | banAppeals 목록 조회, 문의 내용 확인, 정지 해제 승인, 반려 처리 기능을 추가
- [수정] 승인 시 users/{uid}의 정지 상태를 해제하고 banAppeals 상태를 approved로 갱신, 반려 시 adminMemo와 rejected 상태를 저장하도록 구현
- [검증] public/js/ui/admin.js Node.js 문법 검사 통과

## 2026-06-30 피드 작성 게시글 카드 UI 개선 (김민기)
- [문제] 프로필/피드 화면의 작성 게시글 그리드에서 이미지 없는 글이 큰 정사각형 빈 카드처럼 보여 허전하고 클릭 가능한 게시글로 인식하기 어려웠음
- [수정] public/js/ui/feed.js | 이미지 없는 게시글 카드에 게시판 배지, 제목, 본문 미리보기, 작성 시간, 좋아요/댓글/조회 지표를 표시하도록 렌더링 개선
- [수정] public/css/feed.css | 피드 그리드를 자동 반응형 카드 레이아웃으로 변경하고 텍스트 게시글 카드의 여백, 타이포그래피, hover 상태를 정리
- [검증] public/js/ui/feed.js Node.js 문법 검사 통과
