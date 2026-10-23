# 혼밥비서 AI 에이전트 전달용

## 1. 프로젝트 한 줄 정의
**혼밥비서**는 자취생이 냉장고 재료, 유통기한, 레시피 추천, 장보기 목록, 식비 기록을 한 번에 관리하도록 돕는 반응형 웹서비스다.

## 2. 핵심 문제
자취생은 식재료를 사두고도 유통기한을 놓쳐 버리거나, 냉장고에 있는 재료를 활용하지 못해 외식/배달비가 늘어나는 문제가 있다. 본 서비스는 보유 재료를 기준으로 만들 수 있는 메뉴를 추천하고, 부족한 재료를 장보기 목록으로 연결하며, 월별 식비를 시각화해 식재료 낭비와 지출을 줄이는 것을 목표로 한다.

## 3. MVP 범위
### 반드시 구현
1. 대시보드
   - 유통기한 임박 재료
   - 이번 달 식비 요약
   - 오늘 추천 레시피
2. 냉장고 재료 관리
   - 재료 등록/수정/삭제
   - 수량, 단위, 보관 위치, 유통기한
   - 유통기한 상태 배지
3. 레시피 추천
   - 보유 재료와 레시피 필요 재료 비교
   - 만들 수 있는 레시피/부족 재료 표시
   - 즐겨찾기
4. 장보기 목록
   - 부족 재료 자동 추가
   - 직접 입력
   - 구매 완료 체크
5. 식비 기록/통계
   - 식재료/외식/배달/카페 등 카테고리별 지출 입력
   - 월별 합계, 예산 대비 사용률, 카테고리 차트

### 선택 구현
1. AI 절약 팁/식단 추천
2. Firebase Auth 로그인
3. 사용자별 데이터 분리
4. 레시피 이미지 업로드

## 4. 권장 기술 스택
- HTML5, CSS3, JavaScript ES Module
- Tailwind CSS 또는 순수 CSS + CSS Variables
- Chart.js: 식비 통계 차트
- Firebase Firestore 또는 Supabase: 데이터 저장
- Firebase Hosting: 배포
- Firebase Cloud Functions: Gemini API 등 AI Key 보호용 서버리스 프록시
- DOMPurify: AI 응답/사용자 입력 렌더링 전 XSS 방어

## 5. rules(html.md) 반영 개발 규칙
1. 단일 `index.html` 몰아넣기 금지. 화면별 HTML/CSS/JS를 분리한다.
2. 모든 웹 에셋은 `public/` 아래에 둔다.
3. 공통 Header/Footer/Bottom Navigation은 JS 컴포넌트 주입 방식으로 관리한다.
4. 모바일은 하단 탭 바 중심, PC는 카드형 대시보드와 멀티 컬럼 레이아웃을 사용한다.
5. API Key는 클라이언트 코드에 절대 하드코딩하지 않는다.
6. AI 기능은 Cloud Functions 또는 서버 프록시를 통해 호출한다.
7. 기능 변경, 버그 수정, 리팩토링이 발생하면 `docs/AI_REPORT_LOG.md`에 기록한다.
8. 미완성 기능은 Mock 데이터와 안전한 fallback으로 처리해 하얀 화면이 뜨지 않게 한다.
9. 코드 주석에는 이모지를 쓰지 않고 Purpose, Param, Return 중심으로 전문적으로 작성한다.
10. 화면은 Live Server 또는 Firebase Hosting에서 즉시 렌더링 가능한 상태를 유지한다.

## 6. 권장 디렉토리 구조
```text
honbab-biseo/
├─ public/
│  ├─ index.html
│  ├─ pages/
│  │  ├─ fridge.html
│  │  ├─ recipes.html
│  │  ├─ shopping.html
│  │  ├─ expenses.html
│  │  └─ profile.html
│  ├─ css/
│  │  ├─ global.css
│  │  ├─ dashboard.css
│  │  ├─ fridge.css
│  │  ├─ recipes.css
│  │  └─ expenses.css
│  ├─ js/
│  │  ├─ core/
│  │  │  ├─ firebase-init.js
│  │  │  ├─ store.js
│  │  │  ├─ constants.js
│  │  │  └─ utils.js
│  │  ├─ ui/
│  │  │  ├─ layout.js
│  │  │  ├─ dashboard.js
│  │  │  ├─ fridge.js
│  │  │  ├─ recipes.js
│  │  │  ├─ shopping.js
│  │  │  └─ expenses.js
│  │  └─ data/
│  │     ├─ mock-ingredients.js
│  │     ├─ mock-recipes.js
│  │     └─ mock-expenses.js
│  └─ assets/
│     ├─ images/
│     └─ icons/
├─ functions/
│  └─ index.js
├─ docs/
│  ├─ AI_REPORT_LOG.md
│  ├─ SRS.md
│  ├─ HLD.md
│  └─ DB_SCHEMA.md
└─ README.md
```

## 7. 주요 화면 설계
### 7.1 대시보드
- 상단: 이번 달 식비 사용률, 유통기한 임박 개수, 추천 레시피 개수
- 중단: 유통기한 임박 재료 카드
- 하단: 오늘의 추천 레시피, 최근 지출 내역, 카테고리 차트

### 7.2 냉장고 화면
- 재료 등록 모달/폼
- 재료 리스트, 검색, 보관 위치 필터
- 유통기한 임박 순 정렬
- 상태 배지: 정상, 임박, 만료

### 7.3 레시피 추천 화면
- 보유 재료 기반 추천 점수
- 만들 수 있음/부족 재료 있음 구분
- 부족 재료를 장보기 목록에 추가
- 즐겨찾기

### 7.4 장보기 화면
- 체크리스트
- 예상 금액
- 구매 완료 시 식비 기록으로 전환 가능

### 7.5 식비 통계 화면
- 지출 입력
- 카테고리별 차트
- 월별 예산 대비 사용률
- 외식/배달비 비중 경고 카드

## 8. 데이터 모델 초안
### users
- user_id, email, nickname, monthly_budget, created_at

### ingredients
- ingredient_id, user_id, name, quantity, unit, storage_type, expire_date, status, created_at

### recipes
- recipe_id, title, description, cook_time_min, difficulty, category, image_url

### recipe_ingredients
- recipe_ingredient_id, recipe_id, ingredient_name, required_quantity, unit

### expenses
- expense_id, user_id, expense_date, category, amount, memo, created_at

### shopping_items
- shopping_item_id, user_id, name, quantity, unit, expected_price, is_purchased, source_recipe_id

### favorites
- favorite_id, user_id, recipe_id, created_at

## 9. 추천 로직 MVP
1. 사용자의 보유 재료 이름을 Set으로 변환한다.
2. 각 레시피의 필요 재료 목록과 비교한다.
3. 보유 재료 개수 / 필요 재료 총개수로 추천 점수를 계산한다.
4. 점수 1.0이면 “바로 만들 수 있음”으로 표시한다.
5. 점수가 0.5 이상이면 “부족 재료 N개”로 표시한다.
6. 부족 재료는 장보기 목록에 추가할 수 있게 한다.

## 10. 에이전트 첫 작업 지시문
아래 순서로 작업한다.

1. 위 디렉토리 구조를 생성한다.
2. Mock 데이터 기반으로 `public/index.html` 대시보드를 먼저 완성한다.
3. 공통 레이아웃 주입 스크립트 `public/js/ui/layout.js`를 만든다.
4. 재료/레시피/지출 Mock 데이터를 분리한다.
5. 모든 페이지가 Live Server에서 하얀 화면 없이 열리게 한다.
6. `docs/AI_REPORT_LOG.md`를 생성하고 최초 작업 로그를 기록한다.
7. 이후 Firebase 연동은 Mock UI가 안정적으로 동작한 뒤 단계적으로 진행한다.

## 11. 최초 작업 로그 예시
```markdown
# AI Report Log

## 2026-05-26
- [신규] 프로젝트 초기 구조 생성
- [신규] public/index.html 대시보드 Mock UI 구현
- [신규] 공통 레이아웃 주입 스크립트 추가
- [신규] Mock 데이터 파일 분리
```
