// ============================================================
//  저장 경로: src/lib/match/types.ts
//  담당: 오하율 · MATCH-001 (취향/가치관 입력)
//  역할: 온보딩 UI <-> 서버(주한태) 사이의 타입 계약(DTO).
//        이 파일에는 UI 로직 없음. 타입 정의만 둔다.
//
//  [경계] 성별/나이/성인인증 상태는 하율이 입력받지 않는다.
//         로그인·성인인증(MATCH-003/004, 주한태)에서 '검증된 값'으로
//         내려오며, 온보딩은 이를 읽기 전용으로 표시만 한다.
//         DTO 변경 시 주한태와 사전 합의 (RULES 9).
// ============================================================

// ---- 인증 세션 (주한태가 제공 · 온보딩은 읽기 전용) ----
export type Gender = 'male' | 'female';

export interface VerifiedIdentity {
  /** 성인 인증 통과 여부. false면 온보딩 진입 불가(상위에서 차단). */
  verified: boolean;
  /** 검증된 나이. 사용자가 수정 불가. */
  age: number;
  /** 검증된 성별. 사용자가 수정 불가. */
  gender: Gender;
}

// ---- MBTI ----
export type MbtiType =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

/** 내 MBTI 값. 'unknown' = '잘 몰라요 / 공개 안 함'. */
export type MyMbti = MbtiType | 'unknown';

// ---- 만날 상대 선호 ----
export type MatchTargetPreference = 'opposite' | 'same' | 'any';

// ---- 관심사 ----
export type InterestCategoryId =
  | 'place' | 'music' | 'food' | 'travel' | 'style';

export interface InterestCategory {
  id: InterestCategoryId;
  label: string;
  interestIds: string[];
}

export interface InterestOption {
  id: string;
  label: string;
  category: InterestCategoryId;
}

// ---- 온보딩 입력값 (저장 대상) ----
export interface OnboardingDraft {
  myMbti: MyMbti | null;
  /** 피하고 싶은 MBTI. 선택사항. 기본 빈 배열. */
  avoidMbti: MbtiType[];
  targetPreference: MatchTargetPreference | null;
  /** 선택한 관심사 id 목록. 최소/최대는 INTEREST_RULES 참조. */
  interestIds: string[];
}

// ---- 유효성 규칙 (UI와 서버가 공유) ----
export const INTEREST_RULES = {
  min: 3,
  max: 7,
} as const;

// ---- 저장 API 요청 DTO ----
//  POST /api/v1/users/me/interests  (인증: 성인 확인 후 · 주한태 구현)
export interface SaveOnboardingRequest {
  myMbti: MyMbti;
  avoidMbti: MbtiType[];
  targetPreference: MatchTargetPreference;
  interestIds: string[];
}

// ---- 표준 에러 형식 (API_계약_초안.md 준수) ----
export interface ApiError {
  error: {
    code:
      | 'AGE_VERIFICATION_REQUIRED'
      | 'VALIDATION_ERROR'
      | 'UNAUTHORIZED';
    message: string;
    requestId?: string;
  };
}

// ============================================================
//  MATCH-002 추천 카드 · 질문 UI  (오하율)
// ============================================================

/**
 * 사진 공개 상태.
 *  hidden   : 실루엣(기본). 서로 관심 전에는 비공개.
 *  preview  : 상대가 '사진 먼저 공개 허용'을 켬. 도토리로 미리보기 가능.
 *  revealed : 쌍방 관심으로 공개됨(무료).
 * [안전] 공개는 상대 동의가 전제다. 보는 사람이 상태를 바꿀 수 없다.
 */
export type PhotoVisibility = 'hidden' | 'preview' | 'revealed';

/** 대략 거리 구간. 정밀 좌표/주소는 쓰지 않는다(안전정책). */
export type DistanceBand = 'same_town' | 'within_3km' | 'within_5km' | 'within_10km';

/** 대략 접속 활동. 정확한 시각은 노출하지 않는다(안전정책). */
export type ActivityRecency = 'now' | 'today' | 'days_2' | 'days_3plus';

/** 추천 상대가 내게 걸린 관계 상태. */
export type RecommendRelation = 'none' | 'liked_by_me' | 'mutual';

export interface RecommendProfile {
  id: string;
  nickname: string;
  age: number;
  mbti: MbtiType | 'unknown';
  intro: string;
  /** 나와 겹치는 관심사 id 목록(근거). 수치가 아닌 실제 항목으로 표시. */
  sharedInterestIds: string[];
  photo: PhotoVisibility;
  distance: DistanceBand;
  recency: ActivityRecency;
  relation: RecommendRelation;
}

/** 추천 리스트 로딩 단계. UI 상태 분기용. */
export type RecommendStatus = 'loading' | 'ready' | 'empty' | 'error';

// ---- 추천 조회 응답 DTO ----
//  GET /api/v1/match/recommendations?cursor=...  (검증 성인 · 주한태 구현)
export interface RecommendResponse {
  items: RecommendProfile[];
  nextCursor: string | null;
}

/**
 * 재화(도토리) 잔액.
 * [범위] 1차에서는 잔액 표시·흐름만. 실제 충전/결제는 미구현(준비중).
 *        영문 식별자 acorn, 화면 표기 '도토리'.
 */
export interface AcornBalance {
  acorn: number;
}
