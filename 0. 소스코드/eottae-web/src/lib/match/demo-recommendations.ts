// ============================================================
//  저장 경로: src/lib/match/demo-recommendations.ts
//  담당: 오하율 · MATCH-002 (추천 카드·질문 UI)
//  역할: 추천 리스트용 DEMO 데이터 + 표시 라벨 매핑.
//
//  [DEMO 경고] 아래 프로필은 전부 가짜 샘플이다. 실제 추천은
//  주한태 GET /match/recommendations (차단/휴면/미성년/본인 제외,
//  RLS 적용)로 대체한다. 이 데이터로 실제 매칭을 수행하지 않는다.
//  [안전] 거리/접속은 대략 구간만. 정밀 좌표·정확한 시각 없음.
// ============================================================

import type {
  AcornBalance,
  ActivityRecency,
  DistanceBand,
  RecommendProfile,
} from './types';

// ---- 거리 구간 -> 표시 라벨 ----
export const DISTANCE_LABELS: Record<DistanceBand, string> = {
  same_town: '같은 동네',
  within_3km: '3km 이내',
  within_5km: '5km 이내',
  within_10km: '10km 이내',
};

// ---- 접속 활동 -> 표시 라벨 ----
export const RECENCY_LABELS: Record<ActivityRecency, string> = {
  now: '방금 전',
  today: '오늘 활동',
  days_2: '2일 전 활동',
  days_3plus: '최근 활동',
};

// ---- 공통 질문(맛보기) ----
//  MATCH-009 에서 더 확장. 여기선 대화 물꼬용 간단 질문만.
export const STARTER_QUESTIONS: string[] = [
  '주말엔 주로 뭐 해요?',
  '인생 디저트는?',
  '요즘 꽂힌 노래 있어요?',
  '가보고 싶은 여행지는?',
];

// ---- DEMO: 도토리 잔액 (실제로는 서버/지갑에서 조회) ----
export const DEMO_ACORN: AcornBalance = { acorn: 12 };

// ---- DEMO: 추천 프로필 목록 ----
export const DEMO_RECOMMENDATIONS: RecommendProfile[] = [
  {
    id: 'rec_bada',
    nickname: '바다',
    age: 27,
    mbti: 'ENFJ',
    intro: '카페에서 책 읽는 주말을 좋아해요',
    sharedInterestIds: ['cafe', 'indie', 'fitness'],
    photo: 'hidden',
    distance: 'within_3km',
    recency: 'now',
    relation: 'none',
  },
  {
    id: 'rec_haneul',
    nickname: '하늘',
    age: 29,
    mbti: 'INFP',
    intro: '전시 보러 다니는 거 좋아해요. 느긋한 대화 환영',
    sharedInterestIds: ['exhibition', 'classic'],
    photo: 'preview',
    distance: 'same_town',
    recency: 'today',
    relation: 'none',
  },
  {
    id: 'rec_gaeul',
    nickname: '가을',
    age: 26,
    mbti: 'ISFJ',
    intro: '베이킹이 취미예요. 가끔 호캉스로 리프레시',
    sharedInterestIds: ['dessert', 'hotel'],
    photo: 'revealed',
    distance: 'within_5km',
    recency: 'days_2',
    relation: 'mutual',
  },
  {
    id: 'rec_doyun',
    nickname: '도윤',
    age: 28,
    mbti: 'ENTP',
    intro: '즉흥 여행 메이트 구해요. 매운 거 잘 먹어요',
    sharedInterestIds: ['spontaneous', 'spicy'],
    photo: 'hidden',
    distance: 'within_10km',
    recency: 'days_3plus',
    relation: 'liked_by_me',
  },
];
