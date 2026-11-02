// ============================================================
//  저장 경로: src/lib/match/demo-recommendations.ts
//  담당: 오하율 · MATCH-002 (추천 카드·질문 UI)
//  역할: 추천 리스트용 DEMO 데이터 + 표시 라벨 매핑.
//
//  [DEMO 경고] 아래 프로필은 전부 가짜 샘플이다. 실제 추천은
//  주한태 GET /match/recommendations (차단/휴면/미성년/본인 제외,
//  RLS 적용)로 대체한다. 이 데이터로 실제 매칭을 수행하지 않는다.
//  [안전] 거리/접속은 대략 구간만. 정밀 좌표·정확한 시각 없음.
//  [MATCH-006] 본인·차단·탈퇴·휴면·미성년 예시는 exclude 플래그로만 둔다.
//             차단 예시는 매칭 데모 데이터 표시이며 safety 저장소를 쓰지 않는다.
// ============================================================

import { MIN_SIGNUP_AGE } from '@/lib/auth/config';
import { DEMO_SELF_ID } from '@/lib/demo/demo-session';
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

// ---- MATCH-006 데모 제외 사유. 추천 카드에는 이 사유가 없는 프로필만 남긴다. ----
export const DEMO_EXCLUSION_LABELS = {
  self: '본인',
  blocked: '차단',
  withdrawn: '탈퇴',
  dormant: '휴면',
  minor: '미성년',
} as const;

export type DemoExclusionReason = keyof typeof DEMO_EXCLUSION_LABELS;

const EXCLUSION_ORDER: DemoExclusionReason[] = [
  'self',
  'blocked',
  'withdrawn',
  'dormant',
  'minor',
];

type DemoCandidate = {
  profile: RecommendProfile;
  /** 추천에서 뺄 예시. null이면 카드로 보여 준다. 차단은 이 플래그가 곧 「차단한 상대」 표시다. */
  exclude: DemoExclusionReason | null;
  /** 내가 관심을 보내면 데모 상대가 관심을 돌려준다. */
  returnsInterest?: boolean;
};

const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    exclude: null,
    returnsInterest: true,
    profile: {
      id: 'rec_bada',
      nickname: '바다',
      age: 27,
      mbti: 'ENFJ',
      intro: '카페에서 책 읽는 주말을 좋아해요',
      sharedInterestIds: ['cafe', 'indie', 'running'],
      photo: 'hidden',
      distance: 'within_3km',
      recency: 'now',
      relation: 'none',
      qnaSharedCount: 7,
    },
  },
  {
    exclude: null,
    profile: {
      id: 'rec_haneul',
      nickname: '하늘',
      age: 29,
      mbti: 'INFP',
      intro: '전시 보러 다니는 거 좋아해요. 느긋한 대화 환영',
      sharedInterestIds: ['exhibition', 'citypop'],
      photo: 'preview',
      distance: 'same_town',
      recency: 'today',
      relation: 'none',
      qnaSharedCount: 11,
    },
  },
  {
    exclude: null,
    profile: {
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
      qnaSharedCount: 4,
    },
  },
  {
    exclude: null,
    profile: {
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
      // 아직 문답 답이 적어 궁합 미집계(undefined) — 표시 안 함
    },
  },
  {
    exclude: 'self',
    profile: {
      id: DEMO_SELF_ID,
      nickname: '시연 회원',
      age: 25,
      mbti: 'ENFP',
      intro: '데모로 로그인한 본인 프로필',
      sharedInterestIds: ['cafe'],
      photo: 'hidden',
      relation: 'none',
    },
  },
  {
    exclude: 'blocked',
    profile: {
      id: 'rec_blocked_demo',
      nickname: '가림',
      age: 30,
      mbti: 'ISTJ',
      intro: '차단한 상대 예시',
      sharedInterestIds: ['park'],
      photo: 'hidden',
      relation: 'none',
    },
  },
  {
    exclude: 'withdrawn',
    profile: {
      id: 'rec_withdrawn_demo',
      nickname: '떠난',
      age: 32,
      mbti: 'INTJ',
      intro: '탈퇴 계정 예시',
      sharedInterestIds: ['bookcafe'],
      photo: 'hidden',
      relation: 'none',
    },
  },
  {
    exclude: 'dormant',
    profile: {
      id: 'rec_dormant_demo',
      nickname: '잠잠',
      age: 34,
      mbti: 'ISFP',
      intro: '휴면 계정 예시',
      sharedInterestIds: ['indie'],
      photo: 'hidden',
      relation: 'none',
    },
  },
  {
    exclude: 'minor',
    profile: {
      id: 'rec_minor_demo',
      nickname: '새싹',
      age: 17,
      mbti: 'ENFP',
      intro: '만 19세 미만 예시',
      sharedInterestIds: ['kpop'],
      photo: 'hidden',
      relation: 'none',
    },
  },
];

function exclusionReason(candidate: DemoCandidate): DemoExclusionReason | null {
  if (candidate.profile.id === DEMO_SELF_ID || candidate.exclude === 'self') return 'self';
  if (candidate.profile.age < MIN_SIGNUP_AGE || candidate.exclude === 'minor') return 'minor';
  if (
    candidate.exclude === 'blocked' ||
    candidate.exclude === 'withdrawn' ||
    candidate.exclude === 'dormant'
  ) {
    return candidate.exclude;
  }
  return null;
}

export type DemoExcludedRow = {
  reason: DemoExclusionReason;
  nickname: string;
  age: number;
};

export function demoRecommendationView(): {
  items: RecommendProfile[];
  excludedCount: number;
  excluded: DemoExcludedRow[];
} {
  const items: RecommendProfile[] = [];
  const excluded: DemoExcludedRow[] = [];
  for (const candidate of DEMO_CANDIDATES) {
    const reason = exclusionReason(candidate);
    if (reason) {
      excluded.push({
        reason,
        nickname: candidate.profile.nickname,
        age: candidate.profile.age,
      });
      continue;
    }
    items.push({
      ...candidate.profile,
      sharedInterestIds: [...candidate.profile.sharedInterestIds],
    });
  }
  excluded.sort(
    (a, b) => EXCLUSION_ORDER.indexOf(a.reason) - EXCLUSION_ORDER.indexOf(b.reason),
  );
  return { items, excludedCount: excluded.length, excluded };
}

/** 관심을 보내면 되돌려 주는 데모 상대. 제외된 프로필은 해당하지 않는다. */
export function demoPartnerReturnsInterest(targetId: string): boolean {
  return DEMO_CANDIDATES.some(
    (candidate) =>
      candidate.profile.id === targetId &&
      candidate.returnsInterest === true &&
      exclusionReason(candidate) === null,
  );
}

// ---- DEMO: 추천에 남는 프로필만. 제외 예시는 demoRecommendationView().excluded ----
export const DEMO_RECOMMENDATIONS: RecommendProfile[] = demoRecommendationView().items;
