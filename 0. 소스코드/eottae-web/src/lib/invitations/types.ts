// 3차 모바일 청첩장 목업 타입 (INV-001)
// DB 논리 모델의 INVITATION · GUEST · RSVP 및 DEMO_THEMES를 화면·데모용으로 정의한다.
// 서버·Supabase 호출은 하지 않으며 브라우저 localStorage 전용이다.

export const INVITATION_STATUSES = ['draft', 'published', 'expired', 'revoked'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const INVITATION_VISIBILITIES = ['public', 'unlisted', 'private'] as const;
export type InvitationVisibility = (typeof INVITATION_VISIBILITIES)[number];

export const RSVP_RESPONSES = ['yes', 'no', 'maybe'] as const;
export type RsvpResponse = (typeof RSVP_RESPONSES)[number];

export const INVITATION_THEME_IDS = [
  'spring-card',
  'moon-garden',
  'hanji',
  'star-table',
  'wax-seal',
  'tape-card',
  'typo-frame',
  'photo-only',
  'script-card',
  'center-line',
  'cover-a',
  'quiet',
  'botanical-garden',
  'spring-blossom',
  'moonlight-garden',
  'traditional-hanji',
  'starlight-banquet',
  'minimal-arch',
  'cinematic-movie',
  'hanok-heritage',
] as const;
export type InvitationThemeId = (typeof INVITATION_THEME_IDS)[number] | string;

export const INVITATION_LAYOUT_STYLES = ['classic', 'modern', 'minimal'] as const;
export type InvitationLayoutStyle = (typeof INVITATION_LAYOUT_STYLES)[number];

export const INVITATION_BGM_PRESETS = ['none', 'romantic', 'piano', 'acoustic'] as const;
export type InvitationBgmpreset = (typeof INVITATION_BGM_PRESETS)[number];

export const INVITATION_ANIMATION_EFFECTS = ['petals', 'sparkles', 'snow', 'envelope', 'none'] as const;
export type AnimationEffectType = (typeof INVITATION_ANIMATION_EFFECTS)[number];

export type SectionFontOption = 'serif' | 'sans' | 'script';

export type PhotoFrameStyle = 'arch' | 'life4cut' | 'polaroid' | 'gold_round' | 'square';
export type CalendarStyle = 'classic_table' | 'heart_stamp' | 'box_badge' | 'minimal_text';
export type GalleryViewMode = 'carousel' | 'life4cut_strip' | 'grid3x3';

export interface SectionCustomConfig {
  title?: string;
  body?: string;
  fontFamily?: SectionFontOption;
  textColor?: string;
  accentColor?: string;
  bgColor?: string;
  frameStyle?: PhotoFrameStyle;
  frameColor?: string;
  calendarStyle?: CalendarStyle;
  galleryMode?: GalleryViewMode;
}

export type SectionCustomMap = Partial<Record<InvitationSectionKey, SectionCustomConfig>>;

export interface ThemeCustomStyle {
  bgColor: string;
  primaryColor: string;
  textColor: string;
  accentColor: string;
  pattern?: string;
}

export const INVITATION_SECTION_KEYS = [
  'greeting',
  'schedule',
  'location',
  'gallery',
  'guestbook',
  'guest_snap',
  'account',
  'rsvp_preview',
] as const;
export type InvitationSectionKey = (typeof INVITATION_SECTION_KEYS)[number];

/**
 * 청첩장 엔티티 (DB INVITATION 모델 대응)
 * 실존 인물·실주소·실전화번호 금지, 가상 데이터 사용
 */
export type Invitation = {
  id: string;
  ownerId: string;
  title: string;
  hostNames: string;
  /** 예식 일시 (표시 및 정렬용 문자열, 예: '2026-11-28 14:00' 또는 ISO) */
  weddingDate: string;
  /** 가상 장소 이름 (예: '노을구 달빛웨딩홀 2층 그랜드볼룸') */
  venueLabel: string;
  /** 모시는 글 / 인사말 */
  greeting: string;
  /** 불규칙 공개 공유 토큰 */
  sharingToken: string;
  visibility: InvitationVisibility;
  /** 공개 링크 만료 시각 (ISO 또는 null) */
  expiry: string | null;
  /** DEMO_THEMES 테마 id */
  themeId: InvitationThemeId;
  status: InvitationStatus;
  /** 이 브라우저의 사용자가 청첩장 소유자인지 여부 */
  viewerIsOwner?: boolean;
  /** 생성일시 (ISO) */
  createdAt?: string;
  /** 수정일시 (ISO) */
  updatedAt?: string;

  // 부가 옵션 (에디터/상세 확장용, 가상 정보)
  notice?: string;
  contactNote?: string;
  /** 레이아웃 형태 (classic: 클래식 스크롤, modern: 모던 카드, minimal: 미니멀 매거진) */
  layoutStyle?: InvitationLayoutStyle;
  /** 배경음악 시연 프리셋 */
  bgmPreset?: InvitationBgmpreset;
  /** 섹션 순서 커스텀 */
  sectionOrder?: InvitationSectionKey[];
};

/**
 * 하객 정보 (DB GUEST 모델 대응)
 * 개인정보 최소화 원칙: 전화번호·연락처 필드 없음
 */
export type Guest = {
  id: string;
  invitationId: string;
  displayName: string;
  /** 하객 개별 초대 토큰 (RSVP 작성 권한 확인용 불규칙 토큰) */
  guestToken: string;
  createdAt?: string;
  memo?: string;
};

/**
 * 참석 회신 (DB RSVP 모델 대응)
 * 타인에게 회신 목록을 노출하지 않으며 소유자/응답자 본인만 확인
 */
export type Rsvp = {
  invitationId: string;
  guestToken: string;
  response: RsvpResponse;
  /** 참석 인원수 (불참 시 0 가능) */
  partySize: number;
  /** 축하 메시지 또는 전달 메모 */
  note: string;
  /** 회신 시각 (ISO) */
  respondedAt: string;
};

export function isInvitationStatus(value: unknown): value is InvitationStatus {
  return typeof value === 'string' && (INVITATION_STATUSES as readonly string[]).includes(value);
}

export function isInvitationVisibility(value: unknown): value is InvitationVisibility {
  return typeof value === 'string' && (INVITATION_VISIBILITIES as readonly string[]).includes(value);
}

export function isRsvpResponse(value: unknown): value is RsvpResponse {
  return typeof value === 'string' && (RSVP_RESPONSES as readonly string[]).includes(value);
}

export function isInvitationThemeId(value: unknown): value is InvitationThemeId {
  return typeof value === 'string' && (INVITATION_THEME_IDS as readonly string[]).includes(value);
}
