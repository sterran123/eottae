// ============================================================
//  저장 경로: src/lib/match/types.ts
//  담당: 오하율 · MATCH-001/002/009 (취향 온보딩 · 추천 · 프로필 문답/공통 질문)
//  역할: 매칭 UI <-> Supabase 백엔드(주한태, ADR-005) 사이의 타입 계약(DTO) 및 매퍼.
//
//  [경계] 성별/나이/성인인증 상태는 하율이 입력받지 않는다.
//         로그인·성인인증(MATCH-003/004, 주한태)에서 '검증된 값'으로
//         내려오며, 온보딩은 이를 읽기 전용으로 표시만 한다.
//         DB 행 구조(snake_case)와 화면 렌더링 모델(camelCase)을 분리하고
//         순수 매퍼 함수(`toRecommendProfile`, `toOnboardingDraft`, `toQnaAnswer`)로 변환한다.
// ============================================================

// ---- 인증 세션 (주한태가 제공 · 온보딩은 읽기 전용) ----
export type Gender = 'male' | 'female';

export interface VerifiedIdentity {
  /** 성인 인증 통과 여부. false면 실데이터 매칭/온보딩 저장 차단(fail-closed, ADR-002). */
  verified: boolean;
  /** 검증된 만 나이(출생연도 기준). 출생연도가 없으면 null. 사용자가 수정 불가. */
  age: number | null;
  /** 검증된 성별. 계정에 성별 컬럼이 생기기 전에는 두지 않는다. */
  gender?: Gender;
  /** 계정 표시 닉네임 (로그인 세션 연동 시 선택 표시) */
  nickname?: string | null;
}

// ---- MBTI ----
export type MbtiType =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

/** 내 MBTI 값. 'unknown' = '잘 몰라요 / 공개 안 함'. */
export type MyMbti = MbtiType | 'unknown';

// ---- 만날 상대 선호 (성별) ----
export type MatchTargetPreference = 'opposite' | 'same' | 'any';

// ---- 찾는 관계 목적 ----
//  성별 선호와 별개 축. 이 값이 프로필 문답 추천 카테고리를 결정한다.
export type RelationGoal =
  | 'neighbor_friend' // 부담 없는 동네 친구
  | 'casual' // 두근두근 썸부터
  | 'serious' // 진지한 연애
  | 'open'; // 정해두지 않고 느낌 가는 대로

// ---- 선호 거리 구간 (온보딩 게이지바 설정값) ----
export type DistancePreference =
  | 'within_5km'
  | 'within_10km'
  | 'within_25km'
  | 'anywhere';

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

// ---- 유효성 규칙 (UI와 서버가 공유 · TC-005) ----
export const INTEREST_RULES = {
  min: 3,
  max: 7,
} as const;

// ============================================================
//  MATCH-001 · 사진 공개범위 및 온보딩 DTO
// ============================================================

/**
 * 사진 공개 상태.
 *  hidden   : 실루엣(기본). 서로 관심 전에는 비공개.
 *  preview  : 상대가 '사진 먼저 공개 허용'을 켬. 도토리로 미리보기 가능.
 *  revealed : 쌍방 관심으로 공개됨(무료).
 * [안전] 공개는 상대 동의가 전제다. 보는 사람이 상태를 바꿀 수 없다.
 */
export type PhotoVisibility = 'hidden' | 'preview' | 'revealed';

/** 본인이 고르는 사진 공개 설정 (`profiles.photo_visibility`). 'revealed'는 서버가 쌍방 관심으로만 계산한다. */
export type PhotoVisibilitySetting = Exclude<PhotoVisibility, 'revealed'>; // 'hidden' | 'preview'

// ---- 온보딩 입력값 (화면 상태 · 저장 초안) ----
export interface OnboardingDraft {
  myMbti: MyMbti | null;
  /** 피하고 싶은 MBTI. 선택사항. 기본 빈 배열. */
  avoidMbti: MbtiType[];
  targetPreference: MatchTargetPreference | null;
  /** 찾는 관계 목적. */
  relationGoal: RelationGoal | null;
  /** 선택한 관심사 id 목록. 최소/최대는 INTEREST_RULES 참조. */
  interestIds: string[];
  /** 선호하는 거리 구간 */
  preferredDistance?: DistancePreference | null;
  /** 프로필/사진 공개범위 설정 (MATCH-001) - 미지정 시 서버는 'hidden'으로 처리(fail-closed) */
  photoVisibility?: PhotoVisibilitySetting;
}

// ---- 저장 API / Supabase 요청 DTO ----
//  논리 계약: POST /api/v1/users/me/interests
//  ADR-005 구현: public.profiles upsert + public.profile_interests insert/delete (RLS: 본인 + 검증 성인)
export interface SaveOnboardingRequest {
  myMbti: MyMbti;
  avoidMbti: MbtiType[];
  targetPreference: MatchTargetPreference;
  relationGoal: RelationGoal;
  interestIds: string[];
  preferredDistance: DistancePreference;
  /** 미지정 시 'hidden'으로 처리(fail-closed) */
  photoVisibility: PhotoVisibilitySetting;
}

/** Supabase `public.profiles` 테이블 상태 (`DB_논리모델_전체3단계.md`) */
export type ProfileStatus = 'DRAFT' | 'ACTIVE' | 'HIDDEN';

/**
 * Supabase `public.profiles` 테이블 행 타입 (ADR-005, MATCH-001).
 * `user_id`는 `public.users.id`(= `auth.users.id`)와 1:1 대응한다.
 */
export interface ProfileRow {
  user_id: string;
  nickname: string | null;
  bio: string | null;
  mbti: MyMbti | null;
  avoid_mbti: MbtiType[] | null;
  target_preference: MatchTargetPreference | null;
  relation_goal: RelationGoal | null;
  preferred_distance: DistancePreference | null;
  /** MATCH-001 공개범위 컬럼 (`profiles.photo_visibility`). 미지정 시 'hidden'(fail-closed). */
  photo_visibility: PhotoVisibilitySetting | null;
  profile_status: ProfileStatus;
  updated_at: string;
}

/**
 * Supabase `public.profile_interests` 테이블 행 타입 (ADR-005, MATCH-001).
 * `(user_id, interest_id)` 복합 UNIQUE 제약을 가진다.
 */
export interface ProfileInterestRow {
  user_id: string;
  interest_id: string;
  created_at?: string;
}

// ---- 표준 에러 형식 (API_계약_초안.md 준수) ----
export type MatchErrorCode =
  | 'AGE_VERIFICATION_REQUIRED'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'DUPLICATE_LIKE'
  | 'FORBIDDEN'
  | 'NETWORK_ERROR';

export interface ApiError {
  error: {
    code: MatchErrorCode;
    message: string;
    requestId?: string;
  };
}

// ============================================================
//  MATCH-002 · MATCH-005 · MATCH-006 추천 카드 · 좋아요 DTO
// ============================================================

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
  /** 없으면 거리 문구를 그리지 않는다. */
  distance?: DistanceBand;
  /** 없으면 접속 문구를 그리지 않는다. */
  recency?: ActivityRecency;
  relation: RecommendRelation;
  /**
   * 프로필 문답에서 겹친 답 개수(사실). 둘 다 문답에 답한 경우에만 존재.
   * [블라인드] 추천 단계에서는 개수만 노출, 상대 답 내용은 공개하지 않는다.
   * 점수·% 금지(브랜드 가이드). 실제 값은 주한태가 집계해 내려준다.
   */
  qnaSharedCount?: number;
}

/**
 * Supabase RPC `get_recommendations(p_cursor)` 또는 RLS view 반환 행 타입 (ADR-005, MATCH-002/006).
 * 본인·차단·탈퇴·휴면·미성년 계정은 서버(RLS/RPC)에서 제외된 상태로 반환된다 (TC-007).
 */
export interface RecommendationRow {
  user_id: string;
  nickname: string;
  age: number;
  mbti: MyMbti | null;
  bio: string | null;
  shared_interest_ids: string[] | null;
  photo_visibility: PhotoVisibility | null;
  distance_band: DistanceBand | null;
  activity_recency: ActivityRecency | null;
  relation: RecommendRelation | null;
  qna_shared_count: number | null;
}

/** 추천 리스트 로딩 단계. UI 상태 분기용. */
export type RecommendStatus = 'loading' | 'ready' | 'empty' | 'error';

// ---- 추천 조회 응답 DTO ----
//  논리 계약: GET /api/v1/match/recommendations?cursor=...
//  ADR-005 구현: supabase.rpc('get_recommendations', { p_cursor })
export interface RecommendResponse {
  items: RecommendProfile[];
  nextCursor: string | null;
}

/** 좋아요/패스 의사결정 값 (`DB_논리모델_전체3단계.md`: `decision(yes/no)`) */
export type LikeDecision = 'yes' | 'no';

/**
 * Supabase `public.likes` 테이블 행 타입 (ADR-005, MATCH-005).
 * `(actor_id, target_id)` UNIQUE 제약 및 `actor_id <> target_id` CHECK 제약을 가진다 (TC-006).
 */
export interface LikeActionRow {
  actor_id: string;
  target_id: string;
  decision: LikeDecision;
  created_at: string;
}

/** 관심/패스 전송 결과 DTO (쌍방 관심 시 서버 트리거/RPC가 match·conversation 1건 생성) */
export interface LikeResultDto {
  targetId: string;
  decision: LikeDecision;
  matched: boolean;
  matchId: string | null;
  conversationId: string | null;
}

/**
 * 재화(도토리) 잔액.
 * [범위] 1차에서는 잔액 표시·흐름만. 실제 충전/결제는 미구현(준비중).
 *        영문 식별자 acorn, 화면 표기 '도토리'.
 */
export interface AcornBalance {
  /** null이면 잔액을 모른다. 화면은 숫자를 숨긴다. */
  acorn: number | null;
}

// ============================================================
//  MATCH-009 프로필 문답 · 공통 질문 · 궁합 DTO
// ============================================================

/** 문답 카테고리. '전체'는 UI 필터 탭이며 문항 자체는 아래 4종에 속한다. */
export type QnaCategory = 'lifestyle' | 'love' | 'date' | 'marriage';

/** 문항 유형. choice=4지선다(+자유입력), animal=동물상 그리드(다지선택). */
export type QnaQuestionType = 'choice' | 'animal';

export interface QnaOption {
  id: string;
  label: string;
  /** 동물상 등 이모지가 필요한 보기에만. */
  emoji?: string;
}

export interface QnaQuestion {
  id: string;
  category: QnaCategory;
  type: QnaQuestionType;
  question: string;
  options: QnaOption[];
  /** 5번째 자유입력('직접 입력') 허용 여부. animal 유형은 보통 false. */
  allowCustom: boolean;
}

/** 내 문답 답변. optionId 선택 또는 customText 자유입력 중 하나. */
export interface QnaAnswer {
  questionId: string;
  optionId: string | null;
  customText?: string;
}

/**
 * Supabase `public.profile_qna_answers` 테이블 행 타입 (ADR-005, MATCH-009).
 */
export interface ProfileQnaAnswerRow {
  user_id: string;
  question_id: string;
  option_id: string | null;
  custom_text: string | null;
  updated_at: string;
}

/**
 * 궁합 요약. 겹친 답 '개수'만(사실). 알고리즘 점수·일치율 % 금지(브랜드 가이드).
 * [경계] 추천 단계에서는 개수만 노출하고 상대 답 내용은 공개하지 않는다(블라인드).
 *        실제 집계는 주한태가 상대 답 비노출로 내려준다.
 */
export interface CompatibilitySummary {
  sharedCount: number;
  bothAnswered: number;
}

/**
 * 공통 질문(블라인드) 상태.
 *  unanswered : 내가 아직 안 답함.
 *  waiting    : 나만 답함, 상대 대기(상대 답 가림).
 *  revealed   : 둘 다 답함, 공개.
 */
export type CommonQuestionState = 'unanswered' | 'waiting' | 'revealed';

/**
 * Supabase 공통 질문 조회/저장 행 타입 (ADR-005, MATCH-009).
 * [블라인드 원칙] `state === 'revealed'`일 때만 서버가 `partner_option_id`/`partner_custom_text`를 내려준다.
 */
export interface CommonQuestionRow {
  question_id: string;
  my_option_id: string | null;
  my_custom_text: string | null;
  partner_option_id: string | null;
  partner_custom_text: string | null;
  declined: boolean;
  state: CommonQuestionState;
}

// ============================================================
//  순수 검증 · 매퍼 함수 (UI <-> Supabase DB Row 변환)
// ============================================================

/**
 * 온보딩 입력값 유효성 검증 (TC-005).
 * 필수 항목 누락 및 관심사 최소(3개)·최대(7개) 규칙을 검사한다.
 */
export function validateOnboardingDraft(draft: OnboardingDraft): string[] {
  const errors: string[] = [];
  if (draft.myMbti === null) {
    errors.push('MBTI를 선택해 주세요.');
  }
  if (draft.targetPreference === null) {
    errors.push('만나고 싶은 상대를 선택해 주세요.');
  }
  if (draft.relationGoal === null) {
    errors.push('찾는 관계를 선택해 주세요.');
  }
  const uniqueInterests = Array.from(new Set(draft.interestIds));
  if (uniqueInterests.length < INTEREST_RULES.min) {
    errors.push(`관심사를 ${INTEREST_RULES.min}개 이상 골라 주세요.`);
  }
  if (uniqueInterests.length > INTEREST_RULES.max) {
    errors.push(`관심사는 최대 ${INTEREST_RULES.max}개까지 선택할 수 있어요.`);
  }
  return errors;
}

/**
 * 화면 `OnboardingDraft`를 저장 요청 DTO(`SaveOnboardingRequest`)로 정규화한다.
 * 유효하지 않으면 `null`을 반환하며, `photoVisibility` 미지정 시 `'hidden'`(fail-closed)을 기본 적용한다.
 */
export function toSaveOnboardingRequest(
  draft: OnboardingDraft,
): SaveOnboardingRequest | null {
  if (
    draft.myMbti === null ||
    draft.targetPreference === null ||
    draft.relationGoal === null
  ) {
    return null;
  }
  const uniqueInterests = Array.from(new Set(draft.interestIds));
  if (
    uniqueInterests.length < INTEREST_RULES.min ||
    uniqueInterests.length > INTEREST_RULES.max
  ) {
    return null;
  }
  const avoidMbti = draft.myMbti === 'unknown'
    ? Array.from(new Set(draft.avoidMbti))
    : Array.from(new Set(draft.avoidMbti)).filter((m) => m !== draft.myMbti);

  return {
    myMbti: draft.myMbti,
    avoidMbti,
    targetPreference: draft.targetPreference,
    relationGoal: draft.relationGoal,
    interestIds: uniqueInterests,
    preferredDistance: draft.preferredDistance ?? 'within_10km',
    photoVisibility: draft.photoVisibility === 'preview' ? 'preview' : 'hidden',
  };
}

/**
 * DB `public.profiles` 행과 `public.profile_interests` 행 목록을 화면 `OnboardingDraft`로 변환한다.
 */
export function toOnboardingDraft(
  profile: Partial<ProfileRow> | null | undefined,
  interests: ReadonlyArray<ProfileInterestRow | string>,
): OnboardingDraft {
  const interestIds = Array.from(
    new Set(
      interests.map((item) =>
        typeof item === 'string' ? item : item.interest_id,
      ),
    ),
  ).slice(0, INTEREST_RULES.max);

  return {
    myMbti: profile?.mbti ?? null,
    avoidMbti: Array.isArray(profile?.avoid_mbti) ? profile.avoid_mbti : [],
    targetPreference: profile?.target_preference ?? null,
    relationGoal: profile?.relation_goal ?? null,
    interestIds,
    preferredDistance: profile?.preferred_distance ?? 'within_10km',
    photoVisibility:
      profile?.photo_visibility === 'preview' ? 'preview' : 'hidden',
  };
}

/**
 * DB `get_recommendations` RPC 반환 행(`RecommendationRow`)을 화면 `RecommendProfile`로 변환한다.
 * 불확실한 공개범위는 `'hidden'`(fail-closed)으로 처리한다.
 */
export function toRecommendProfile(row: RecommendationRow): RecommendProfile {
  const photo: PhotoVisibility =
    row.photo_visibility === 'revealed' || row.photo_visibility === 'preview'
      ? row.photo_visibility
      : 'hidden';

  const profile: RecommendProfile = {
    id: row.user_id,
    nickname: row.nickname,
    age: row.age,
    mbti: row.mbti ?? 'unknown',
    intro: row.bio ?? '',
    sharedInterestIds: Array.isArray(row.shared_interest_ids)
      ? row.shared_interest_ids
      : [],
    photo,
    relation: row.relation ?? 'none',
  };
  if (row.distance_band) profile.distance = row.distance_band;
  if (row.activity_recency) profile.recency = row.activity_recency;

  if (typeof row.qna_shared_count === 'number' && row.qna_shared_count > 0) {
    profile.qnaSharedCount = row.qna_shared_count;
  }

  return profile;
}

/**
 * DB `public.profile_qna_answers` 행을 화면 `QnaAnswer`로 변환한다.
 */
export function toQnaAnswer(row: ProfileQnaAnswerRow): QnaAnswer {
  return {
    questionId: row.question_id,
    optionId: row.option_id,
    ...(row.custom_text ? { customText: row.custom_text } : {}),
  };
}
