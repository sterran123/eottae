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

// ---- 관심사 카테고리 5종 + 항목 50개 (2030 트렌드 반영) ----
export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'place',
    label: '장소',
    interestIds: [
      'cafe',
      'hotplace',
      'exhibition',
      'park',
      'pub',
      'popstore',
      'bookcafe',
      'drive',
      'selectshop',
      'lounge',
    ],
  },
  {
    id: 'music',
    label: '음악',
    interestIds: [
      'kpop',
      'indie',
      'hiphop',
      'jpop',
      'trot',
      'festival',
      'pop',
      'citypop',
      'ballad',
      'ost',
    ],
  },
  {
    id: 'food',
    label: '음식',
    interestIds: [
      'dessert',
      'omakase',
      'wine',
      'spicy',
      'brunch',
      'streetfood',
      'homecook',
      'vegan',
      'delivery',
      'coffee',
    ],
  },
  {
    id: 'travel',
    label: '여행 스타일',
    interestIds: [
      'spontaneous',
      'planned',
      'hotel',
      'camping',
      'longstay',
      'walk',
      'photospot',
      'resort',
      'daytrip',
      'seaside',
    ],
  },
  {
    id: 'style',
    label: '스타일 · 취미',
    interestIds: [
      'casual',
      'street',
      'running',
      'crossfit',
      'pet',
      'filmcamera',
      'boardgame',
      'perfume',
      'onedayclass',
      'gaming',
    ],
  },
];

// ---- 관심사 id -> 표시 라벨 (총 50개) ----
export const INTEREST_LABELS: Record<string, string> = {
  // 장소 (10)
  cafe: '감성 카페 투어',
  hotplace: '성수·연남 핫플',
  exhibition: '전시 · 미술관',
  park: '한강 · 피크닉',
  pub: '와인바 · 이자카야',
  popstore: '팝업스토어',
  bookcafe: '조용한 북카페',
  drive: '드라이브 코스',
  selectshop: '소품샵 · 편집샵',
  lounge: 'LP바 · 뮤직펍',

  // 음악 (10)
  kpop: 'K-POP 아이돌',
  indie: '인디 · 밴드',
  hiphop: '힙합 · R&B',
  jpop: 'J-POP',
  trot: '트로트',
  festival: '페스티벌 · 콘서트',
  pop: '팝 · 빌보드',
  citypop: '시티팝 · 재즈',
  ballad: '감성 발라드',
  ost: 'OST · 영화음악',

  // 음식 (10)
  dessert: '디저트 · 베이킹',
  omakase: '오마카세 · 맛집',
  wine: '내추럴와인 · 하이볼',
  spicy: '마라 · 매운맛 러버',
  brunch: '브런치 · 베이글',
  streetfood: '야장 · 노포 맛집',
  homecook: '홈쿡 · 요리',
  vegan: '샐러드 · 포케',
  delivery: '야식 · 배달음식',
  coffee: '커피 · 에스프레소바',

  // 여행 (10)
  spontaneous: '즉흥 무계획 여행',
  planned: '계획형 투어',
  hotel: '감성숙소 · 호캉스',
  camping: '캠핑 · 글램핑',
  longstay: '해외 한달살기',
  walk: '뚜벅이 골목투어',
  photospot: '인생샷 스팟 투어',
  resort: '휴양지 힐링',
  daytrip: '드라이브 당일치기',
  seaside: '제주 · 바다 여행',

  // 스타일 · 취미 (10)
  casual: '캐주얼 · 데일리룩',
  street: '고프코어 · 스트릿',
  running: '러닝 크루 · 오운완',
  crossfit: '크로스핏 · 필라테스',
  pet: '반려동물 집사',
  filmcamera: '필름카메라 · 사진',
  boardgame: '보드게임 · 방탈출',
  perfume: '향수 · 디퓨저',
  onedayclass: '원데이 클래스 · 공방',
  gaming: '게임 · 애니메이션',
};

// ---- 선호 거리 게이지바 스텝 옵션 ----
export type DistancePreference = 'within_5km' | 'within_10km' | 'within_25km' | 'anywhere';
export type DistanceIconType = 'pin' | 'coffee' | 'subway' | 'sparkle';

export const DISTANCE_PREFERENCE_OPTIONS: ReadonlyArray<{
  value: DistancePreference;
  label: string;
  badge: string;
  desc: string;
  speech: string;
  iconType: DistanceIconType;
}> = [
  {
    value: 'within_5km',
    label: '5km 이내',
    badge: '가까운 동네',
    desc: '걸어서 가볍게 만날 수 있는 가까운 거리예요',
    speech: '가까운 곳이 제일 편해요',
    iconType: 'pin',
  },
  {
    value: 'within_10km',
    label: '10km 이내',
    badge: '같은 생활권',
    desc: '자주 오가는 일상 활동 반경 주변에서 만나요',
    speech: '같은 생활권이면 편해요',
    iconType: 'coffee',
  },
  {
    value: 'within_25km',
    label: '25km 이내',
    badge: '동일 지역권',
    desc: '서로 이동하기 부담 없는 같은 지역권이에요',
    speech: '같은 지역이면 어디든 괜찮아요',
    iconType: 'subway',
  },
  {
    value: 'anywhere',
    label: '거리 무관',
    badge: '전국 어디든',
    desc: '거리보다 마음과 취향이 통하는 것이 제일 중요해요',
    speech: '취향만 통하면 거리는 상관없어요',
    iconType: 'sparkle',
  },
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
