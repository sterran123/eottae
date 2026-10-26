// ============================================================
//  저장 경로: src/lib/match/demo-data.ts
//  담당: 오하율 · MATCH-001 (취향/가치관 입력)
//  역할: 온보딩 화면용 DEMO 데이터. 실제 API 연동 전 목업.
//
//  [DEMO 경고] 아래 DEMO_IDENTITY 는 주한태의 성인인증(MATCH-004)이
//  내려줄 '검증된 값'을 흉내낸 가짜 객체다. 실제 배포 시에는 세션에서
//  받은 VerifiedIdentity 로 교체한다. 이 파일의 값으로 실제 매칭/저장을
//  수행하지 않는다 (RULES 6/7: fake data 는 DEMO 라벨·격리 필수).
// ============================================================

import type {
  InterestCategory,
  InterestOption,
  MbtiType,
  RelationGoal,
  VerifiedIdentity,
} from './types';

// ---- 찾는 관계 목적 옵션 (성별 선택 후 노출) ----
export const RELATION_OPTIONS: ReadonlyArray<{
  value: RelationGoal;
  label: string;
  emoji: string;
}> = [
  { value: 'neighbor_friend', label: '부담 없는 동네 친구', emoji: '🏡' },
  { value: 'casual', label: '두근두근 썸부터', emoji: '💓' },
  { value: 'serious', label: '진지한 연애를 시작하고 싶어요', emoji: '💍' },
  { value: 'open', label: '정해두지 않고 느낌 가는 대로', emoji: '⭐' },
];

// ---- DEMO: 검증된 인증 정보 (실제로는 주한태가 세션으로 제공) ----
export const DEMO_IDENTITY: VerifiedIdentity = {
  verified: true,
  age: 25,
  gender: 'female',
};

// ---- MBTI 16종 ----
export const ALL_MBTI: MbtiType[] = [
  'ENFP', 'INFJ', 'ISTP', 'ESFJ',
  'INTJ', 'ENFJ', 'ISFP', 'ESTP',
  'ISTJ', 'ISFJ', 'INTP', 'ENTP',
  'ESTJ', 'ENTJ', 'ESFP', 'INFP',
];

/** 온보딩에서 접힌 상태로 먼저 보여줄 대표 8개. 나머지는 '더보기'. */
export const MBTI_PREVIEW_COUNT = 8;

// ---- 관심사 카테고리 5종 + 항목 50개 (각 10개) ----
export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'place',
    label: '장소',
    interestIds: [
      'cafe',
      'exhibition',
      'park',
      'restaurant',
      'bar',
      'library',
      'popstore',
      'drive',
      'walk',
      'shopping',
    ],
  },
  {
    id: 'music',
    label: '음악',
    interestIds: [
      'indie',
      'kpop',
      'hiphop',
      'festival',
      'classic',
      'band',
      'ballad',
      'pop',
      'acoustic',
      'edm',
    ],
  },
  {
    id: 'food',
    label: '음식',
    interestIds: [
      'dessert',
      'wine',
      'spicy',
      'homecook',
      'vegan',
      'coffee',
      'streetfood',
      'meat',
      'asian',
      'brunch',
    ],
  },
  {
    id: 'travel',
    label: '여행 스타일',
    interestIds: [
      'spontaneous',
      'planned',
      'camping',
      'longstay',
      'hotel',
      'backpack',
      'resort',
      'photospot',
      'glamping',
      'local',
    ],
  },
  {
    id: 'style',
    label: '스타일 · 취미',
    interestIds: [
      'minimal',
      'street',
      'fitness',
      'pet',
      'gaming',
      'photo',
      'vintage',
      'reading',
      'craft',
      'boardgame',
    ],
  },
];

// ---- 관심사 id -> 표시 라벨 (총 50개) ----
export const INTEREST_LABELS: Record<string, string> = {
  // 장소 (10)
  cafe: '카페 투어',
  exhibition: '전시 · 미술관',
  park: '한강 · 공원',
  restaurant: '맛집 탐방',
  bar: '바 · 포차',
  library: '도서관 · 북카페',
  popstore: '팝업스토어',
  drive: '드라이브 코스',
  walk: '골목 산책',
  shopping: '쇼핑몰 · 편집샵',

  // 음악 (10)
  indie: '인디 · 밴드',
  kpop: 'K-POP',
  hiphop: '힙합 · R&B',
  festival: '페스티벌',
  classic: '클래식 · 재즈',
  band: '록 · 메탈',
  ballad: '감성 발라드',
  pop: '해외 팝송',
  acoustic: '어쿠스틱 · 포크',
  edm: 'EDM · 일렉',

  // 음식 (10)
  dessert: '디저트 · 베이킹',
  wine: '맥주 · 와인',
  spicy: '매운맛 러버',
  homecook: '홈쿡 · 요리',
  vegan: '비건 · 건강식',
  coffee: '핸드드립 · 커피',
  streetfood: '길거리 분식',
  meat: '고기 · 바베큐',
  asian: '일식 · 아시안푸드',
  brunch: '브런치',

  // 여행 (10)
  spontaneous: '즉흥 여행',
  planned: '계획형 투어',
  camping: '캠핑 · 자연',
  longstay: '해외 한달살기',
  hotel: '호캉스',
  backpack: '배낭여행 · 뚜벅이',
  resort: '휴양지 리조트',
  photospot: '인생샷 스팟 투어',
  glamping: '글램핑 · 불멍',
  local: '소도시 · 로컬 여행',

  // 스타일 · 취미 (10)
  minimal: '미니멀룩',
  street: '스트릿',
  fitness: '러닝 · 헬스',
  pet: '반려동물',
  gaming: '게임 · 애니',
  photo: '필름 · 사진 촬영',
  vintage: '빈티지 · 구제',
  reading: '독서 · 글쓰기',
  craft: 'DIY · 공방 체험',
  boardgame: '보드게임 · 방탈출',
};

// ---- 선호 거리 유형 ----
export type DistancePreference = 'within_5km' | 'within_10km' | 'within_25km' | 'anywhere';

export const DISTANCE_PREFERENCE_OPTIONS: ReadonlyArray<{
  value: DistancePreference;
  label: string;
  desc: string;
}> = [
  { value: 'within_5km', label: '5km 이내', desc: '가까운 동네 이웃' },
  { value: 'within_10km', label: '10km 이내', desc: '자주 가는 생활권' },
  { value: 'within_25km', label: '25km 이내', desc: '동일 지역권' },
  { value: 'anywhere', label: '거리 무관', desc: '거리보다 취향 우선' },
];

/** 전체 관심사 옵션 평탄화 (유효성 검사·역참조용). */
export const ALL_INTERESTS: InterestOption[] = INTEREST_CATEGORIES.flatMap(
  (cat) =>
    cat.interestIds.map((id) => ({
      id,
      label: INTEREST_LABELS[id] ?? id,
      category: cat.id,
    })),
);

/** 유효한 관심사 id 집합. UI·서버 공통 검증에 사용. */
export const VALID_INTEREST_IDS = new Set(ALL_INTERESTS.map((i) => i.id));
