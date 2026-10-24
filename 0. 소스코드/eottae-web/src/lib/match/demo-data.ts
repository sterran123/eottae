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

// ---- 관심사 카테고리 5종 + 항목 25개 ----
export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'place',
    label: '장소',
    interestIds: ['cafe', 'exhibition', 'park', 'restaurant', 'bar'],
  },
  {
    id: 'music',
    label: '음악',
    interestIds: ['indie', 'kpop', 'hiphop', 'festival', 'classic'],
  },
  {
    id: 'food',
    label: '음식',
    interestIds: ['dessert', 'wine', 'spicy', 'homecook', 'vegan'],
  },
  {
    id: 'travel',
    label: '여행 스타일',
    interestIds: ['spontaneous', 'planned', 'camping', 'longstay', 'hotel'],
  },
  {
    id: 'style',
    label: '스타일 · 취미',
    interestIds: ['minimal', 'street', 'fitness', 'pet', 'gaming'],
  },
];

// ---- 관심사 id -> 표시 라벨 ----
export const INTEREST_LABELS: Record<string, string> = {
  cafe: '카페 투어',
  exhibition: '전시 · 미술관',
  park: '한강 · 공원',
  restaurant: '맛집 탐방',
  bar: '바 · 포차',
  indie: '인디 · 밴드',
  kpop: 'K-POP',
  hiphop: '힙합 · R&B',
  festival: '페스티벌',
  classic: '클래식 · 재즈',
  dessert: '디저트 · 베이킹',
  wine: '맥주 · 와인',
  spicy: '매운맛 러버',
  homecook: '홈쿡 · 요리',
  vegan: '비건 · 건강식',
  spontaneous: '즉흥 여행',
  planned: '계획형 투어',
  camping: '캠핑 · 자연',
  longstay: '해외 한달살기',
  hotel: '호캉스',
  minimal: '미니멀룩',
  street: '스트릿',
  fitness: '러닝 · 헬스',
  pet: '반려동물',
  gaming: '게임 · 애니',
};

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
