export const INVITE_PRESETS = ['full', 'simple', 'photos'] as const;
export type InvitePresetId = (typeof INVITE_PRESETS)[number];

export const INVITE_PRESET_OPTIONS: readonly { id: InvitePresetId; label: string; hint: string }[] = [
  { id: 'full', label: '풀세트', hint: '표지부터 공유까지 한 장에 모두' },
  { id: 'simple', label: '심플', hint: '표지, 인사말, 달력, 장소, 참석, 마음 전하기' },
  { id: 'photos', label: '사진 많이', hint: '갤러리를 세 곳에 나눠 배치' },
];

export type InviteGalleryKey = 'all' | 'a' | 'b' | 'c';

export type InviteSectionSpec =
  | { kind: 'cover' }
  | { kind: 'greeting' }
  | { kind: 'gallery'; key: InviteGalleryKey; start: number; end: number }
  | { kind: 'calendar' }
  | { kind: 'story' }
  | { kind: 'faq' }
  | { kind: 'order' }
  | { kind: 'venue' }
  | { kind: 'guide' }
  | { kind: 'rsvp' }
  | { kind: 'gift' }
  | { kind: 'guestbook' }
  | { kind: 'share' };

const FULL: InviteSectionSpec[] = [
  { kind: 'cover' },
  { kind: 'greeting' },
  { kind: 'gallery', key: 'all', start: 0, end: 9 },
  { kind: 'calendar' },
  { kind: 'story' },
  { kind: 'faq' },
  { kind: 'order' },
  { kind: 'venue' },
  { kind: 'guide' },
  { kind: 'rsvp' },
  { kind: 'gift' },
  { kind: 'guestbook' },
  { kind: 'share' },
];

const SIMPLE: InviteSectionSpec[] = [
  { kind: 'cover' },
  { kind: 'greeting' },
  { kind: 'calendar' },
  { kind: 'venue' },
  { kind: 'rsvp' },
  { kind: 'gift' },
];

const PHOTOS: InviteSectionSpec[] = [
  { kind: 'cover' },
  { kind: 'gallery', key: 'a', start: 0, end: 3 },
  { kind: 'greeting' },
  { kind: 'gallery', key: 'b', start: 3, end: 6 },
  { kind: 'calendar' },
  { kind: 'story' },
  { kind: 'gallery', key: 'c', start: 6, end: 9 },
  { kind: 'faq' },
  { kind: 'order' },
  { kind: 'venue' },
  { kind: 'guide' },
  { kind: 'rsvp' },
  { kind: 'gift' },
  { kind: 'guestbook' },
  { kind: 'share' },
];

export function sectionsFor(preset: InvitePresetId): InviteSectionSpec[] {
  if (preset === 'simple') return SIMPLE;
  if (preset === 'photos') return PHOTOS;
  return FULL;
}

export function galleryTitle(key: InviteGalleryKey): string {
  if (key === 'a') return '앞쪽 사진';
  if (key === 'b') return '가운데 사진';
  if (key === 'c') return '뒤쪽 사진';
  return '갤러리';
}
