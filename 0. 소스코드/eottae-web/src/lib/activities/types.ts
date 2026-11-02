// 2차 데이트·소모임 데모 타입.
// DB 논리 모델의 ACTIVITY · ACTIVITY_MEMBER.request_state · ACTIVITY_POLL 를 화면용으로만 옮긴다.
// 네트워크·DB 호출은 하지 않는다.

export const ACTIVITY_REGIONS = ['노을구', '달동네', '한들시', '별포구', '온기동', '파도읍'] as const;
export type ActivityRegion = (typeof ACTIVITY_REGIONS)[number];

export const COURSE_MOODS = ['잔잔한', '활기찬', '감성', '야외', '실내', '야경'] as const;
export type CourseMood = (typeof COURSE_MOODS)[number];

export const GATHERING_CATEGORIES = ['취미', '밥', '운동', '스터디', '문화'] as const;
export type GatheringCategory = (typeof GATHERING_CATEGORIES)[number];

export type CourseStep = {
  title: string;
  /** 실존 상호가 아닌 예시 장소 이름 */
  placeLabel: string;
  minutes: number;
  /** 두 사람 기준 예시 금액. 0이면 비용 없음 */
  costWon: number;
  note: string;
};

export type DateCourse = {
  id: string;
  title: string;
  region: ActivityRegion;
  mood: CourseMood;
  summary: string;
  steps: readonly CourseStep[];
  /** 사이트 경로(`/activities/covers/...`) 또는 이 브라우저 data URL. 없으면 분위기 기본 커버 */
  coverImage?: string;
};

export type PollOption = {
  id: string;
  label: string;
  /** 다른 사람이 찍은 것처럼 보이는 예시 표. 내 표는 여기 더하지 않는다. */
  demoVotes: number;
};

export type Gathering = {
  id: string;
  title: string;
  category: GatheringCategory;
  region: ActivityRegion;
  /** 화면 표시용. 빌드 시간대와 무관하게 고정 문구 */
  startsAtLabel: string;
  /** 정렬용 `YYYY-MM-DDTHH:mm` */
  startsAtIso: string;
  /** 모집 마감 시각. 없으면 시작 시각이 지나면 마감으로 본다. */
  recruitmentEndsAt?: string;
  /** 모집을 끝낸 예시. 빈자리가 있어도 마감 */
  recruitmentClosed?: boolean;
  capacity: number;
  /** 예시 참가 인원. 내 참가 요청은 화면에서만 더한다. */
  currentCount: number;
  hostNickname: string;
  intro: string;
  placeLabel: string;
  safetyFlags: readonly string[];
  poll: readonly PollOption[];
  /** 이 브라우저에서 만든 데모 모임 */
  mine?: boolean;
  /** 사이트 경로(`/activities/covers/...`) 또는 이 브라우저 data URL. 없으면 카테고리 기본 커버 */
  coverImage?: string;
};

export function isActivityRegion(value: string): value is ActivityRegion {
  return (ACTIVITY_REGIONS as readonly string[]).includes(value);
}

export function isCourseMood(value: string): value is CourseMood {
  return (COURSE_MOODS as readonly string[]).includes(value);
}

export function isGatheringCategory(value: string): value is GatheringCategory {
  return (GATHERING_CATEGORIES as readonly string[]).includes(value);
}
