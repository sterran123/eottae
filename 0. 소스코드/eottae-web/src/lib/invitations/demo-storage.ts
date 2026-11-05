// 3차 모바일 청첩장 데모 스토리지 (INV-001)
// 상태는 오직 이 브라우저의 localStorage('eottae.invitations.demo.v1')에만 저장된다.
// 서버·Supabase 호출은 일체 하지 않는다.

import { DEMO_GUESTS, DEMO_INVITATIONS, DEMO_RSVPS } from './demo-data';
import type { Guest, Invitation, Rsvp, InvitationSectionKey } from './types';
import { isInvitationStatus, isInvitationThemeId, isInvitationVisibility, isRsvpResponse, INVITATION_BGM_PRESETS, INVITATION_SECTION_KEYS } from './types';

export const INVITATIONS_DEMO_STORAGE_KEY = 'eottae.invitations.demo.v1';
export const DEMO_INVITATIONS_EVENT = 'eottae-demo-invitations';

const STORAGE_KEY = INVITATIONS_DEMO_STORAGE_KEY;
const MAX_INVITATIONS = 20;
const MAX_GUESTS = 100;
const MAX_RSVPS = 200;

export type InvitationsDemoState = {
  invitations: Invitation[];
  guests: Guest[];
  rsvps: Rsvp[];
};

function getInitialDemoState(): InvitationsDemoState {
  return {
    invitations: DEMO_INVITATIONS.map((inv) => ({ ...inv })),
    guests: DEMO_GUESTS.map((g) => ({ ...g })),
    rsvps: DEMO_RSVPS.map((r) => ({ ...r })),
  };
}

export function isStoredInvitation(value: unknown): value is Invitation {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    row.id.trim().length > 0 &&
    row.id.length <= 80 &&
    typeof row.ownerId === 'string' &&
    row.ownerId.length <= 80 &&
    typeof row.title === 'string' &&
    row.title.trim().length >= 2 &&
    row.title.length <= 60 &&
    typeof row.hostNames === 'string' &&
    row.hostNames.trim().length >= 2 &&
    row.hostNames.length <= 60 &&
    typeof row.weddingDate === 'string' &&
    row.weddingDate.trim().length > 0 &&
    row.weddingDate.length <= 40 &&
    typeof row.venueLabel === 'string' &&
    row.venueLabel.trim().length >= 2 &&
    row.venueLabel.length <= 80 &&
    typeof row.greeting === 'string' &&
    row.greeting.length <= 1000 &&
    typeof row.sharingToken === 'string' &&
    row.sharingToken.trim().length > 0 &&
    row.sharingToken.length <= 80 &&
    isInvitationVisibility(row.visibility) &&
    (row.expiry === null || (typeof row.expiry === 'string' && row.expiry.length <= 40)) &&
    isInvitationThemeId(row.themeId) &&
    isInvitationStatus(row.status)
  );
}

function sanitizeInvitation(inv: Invitation): Invitation {
  return {
    id: inv.id.trim(),
    ownerId: inv.ownerId.trim(),
    title: inv.title.trim(),
    hostNames: inv.hostNames.trim(),
    weddingDate: inv.weddingDate.trim(),
    venueLabel: inv.venueLabel.trim(),
    greeting: inv.greeting.trim(),
    sharingToken: inv.sharingToken.trim(),
    visibility: inv.visibility,
    expiry: inv.expiry,
    themeId: inv.themeId,
    status: inv.status,
    viewerIsOwner: inv.viewerIsOwner === true,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    notice: typeof inv.notice === 'string' ? inv.notice.slice(0, 300) : undefined,
    contactNote: typeof inv.contactNote === 'string' ? inv.contactNote.slice(0, 200) : undefined,
    layoutStyle: inv.layoutStyle && ['classic', 'modern', 'minimal'].includes(inv.layoutStyle) ? inv.layoutStyle : 'classic',
    bgmPreset: inv.bgmPreset && (INVITATION_BGM_PRESETS as readonly string[]).includes(inv.bgmPreset) ? inv.bgmPreset : 'none',
    sectionOrder: Array.isArray(inv.sectionOrder)
      ? (inv.sectionOrder.filter((k) =>
          (INVITATION_SECTION_KEYS as readonly string[]).includes(k),
        ) as InvitationSectionKey[]).slice(0, 8)
      : undefined,
  };
}

export function isStoredGuest(value: unknown): value is Guest {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    row.id.trim().length > 0 &&
    row.id.length <= 80 &&
    typeof row.invitationId === 'string' &&
    row.invitationId.length <= 80 &&
    typeof row.displayName === 'string' &&
    row.displayName.trim().length >= 1 &&
    row.displayName.length <= 30 &&
    typeof row.guestToken === 'string' &&
    row.guestToken.trim().length > 0 &&
    row.guestToken.length <= 80
  );
}

function sanitizeGuest(guest: Guest): Guest {
  return {
    id: guest.id.trim(),
    invitationId: guest.invitationId.trim(),
    displayName: guest.displayName.trim(),
    guestToken: guest.guestToken.trim(),
    createdAt: guest.createdAt,
    memo: typeof guest.memo === 'string' ? guest.memo.trim().slice(0, 100) : undefined,
  };
}

export function isStoredRsvp(value: unknown): value is Rsvp {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.invitationId === 'string' &&
    row.invitationId.trim().length > 0 &&
    row.invitationId.length <= 80 &&
    typeof row.guestToken === 'string' &&
    row.guestToken.trim().length > 0 &&
    row.guestToken.length <= 80 &&
    isRsvpResponse(row.response) &&
    typeof row.partySize === 'number' &&
    Number.isInteger(row.partySize) &&
    row.partySize >= 0 &&
    row.partySize <= 10 &&
    typeof row.note === 'string' &&
    row.note.length <= 300 &&
    typeof row.respondedAt === 'string' &&
    row.respondedAt.length <= 40
  );
}

function sanitizeRsvp(rsvp: Rsvp): Rsvp {
  return {
    invitationId: rsvp.invitationId.trim(),
    guestToken: rsvp.guestToken.trim(),
    response: rsvp.response,
    partySize: rsvp.partySize,
    note: rsvp.note.trim().slice(0, 300),
    respondedAt: rsvp.respondedAt,
  };
}

export function loadInvitationsDemo(): InvitationsDemoState {
  if (typeof window === 'undefined') return getInitialDemoState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialDemoState();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return getInitialDemoState();
    const row = parsed as Partial<InvitationsDemoState>;

    const invitations = Array.isArray(row.invitations)
      ? row.invitations.filter(isStoredInvitation).slice(0, MAX_INVITATIONS).map(sanitizeInvitation)
      : DEMO_INVITATIONS.map((inv) => ({ ...inv }));

    const guests = Array.isArray(row.guests)
      ? row.guests.filter(isStoredGuest).slice(0, MAX_GUESTS).map(sanitizeGuest)
      : DEMO_GUESTS.map((g) => ({ ...g }));

    const rsvps = Array.isArray(row.rsvps)
      ? row.rsvps.filter(isStoredRsvp).slice(0, MAX_RSVPS).map(sanitizeRsvp)
      : DEMO_RSVPS.map((r) => ({ ...r }));

    return { invitations, guests, rsvps };
  } catch {
    return getInitialDemoState();
  }
}

export function saveInvitationsDemo(state: InvitationsDemoState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const validInvitations = state.invitations.filter(isStoredInvitation);
    if (validInvitations.length !== state.invitations.length) return false;
    const validGuests = state.guests.filter(isStoredGuest);
    if (validGuests.length !== state.guests.length) return false;
    const validRsvps = state.rsvps.filter(isStoredRsvp);
    if (validRsvps.length !== state.rsvps.length) return false;

    if (
      state.invitations.length > MAX_INVITATIONS ||
      state.guests.length > MAX_GUESTS ||
      state.rsvps.length > MAX_RSVPS
    ) {
      return false;
    }

    const payload: InvitationsDemoState = {
      invitations: validInvitations.map(sanitizeInvitation),
      guests: validGuests.map(sanitizeGuest),
      rsvps: validRsvps.map(sanitizeRsvp),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event(DEMO_INVITATIONS_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function resetInvitationsDemo(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소 접근 실패 시 무시
  }
  window.dispatchEvent(new Event(DEMO_INVITATIONS_EVENT));
}

export function subscribeInvitationsDemo(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    onChange();
  };
  window.addEventListener(DEMO_INVITATIONS_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(DEMO_INVITATIONS_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

// 헬퍼 함수들 (INV-001/002/003 공통 활용)

export function getInvitationById(id: string): Invitation | undefined {
  const { invitations } = loadInvitationsDemo();
  return invitations.find((item) => item.id === id);
}

export function getInvitationByToken(token: string): Invitation | undefined {
  if (!token || !token.trim()) return undefined;
  const { invitations } = loadInvitationsDemo();
  return invitations.find((item) => {
    if (item.sharingToken !== token || item.status !== 'published') return false;
    if (item.visibility === 'private') return false;
    if (item.expiry === null) return true;
    const expiresAt = Date.parse(item.expiry);
    return !Number.isNaN(expiresAt) && expiresAt > Date.now();
  });
}

export function saveInvitation(invitation: Invitation): boolean {
  if (!isStoredInvitation(invitation)) return false;

  // TC-015: 쇼케이스 둘러보기 가상 청첩장 또는 비소유자 청첩장 저장 차단
  if (invitation.id.startsWith('showcase-') || invitation.viewerIsOwner === false) {
    return false;
  }

  const state = loadInvitationsDemo();
  const index = state.invitations.findIndex((item) => item.id === invitation.id);
  const nextInvitations = [...state.invitations];
  const now = new Date().toISOString();

  if (index >= 0) {
    const existing = state.invitations[index];
    // TC-015: 소유자만 수정 가능, 비소유자 저장 우회 원천 차단
    if (existing.viewerIsOwner !== true || (existing.ownerId && existing.ownerId !== 'user-demo-me')) {
      return false;
    }
    nextInvitations[index] = {
      ...invitation,
      ownerId: existing.ownerId,
      viewerIsOwner: true,
      updatedAt: now,
    };
  } else {
    nextInvitations.unshift({
      ...invitation,
      ownerId: 'user-demo-me',
      viewerIsOwner: true,
      createdAt: invitation.createdAt || now,
      updatedAt: now,
    });
  }

  return saveInvitationsDemo({ ...state, invitations: nextInvitations });
}

export function deleteInvitation(id: string): boolean {
  const state = loadInvitationsDemo();
  const nextInvitations = state.invitations.filter((item) => item.id !== id);
  if (nextInvitations.length === state.invitations.length) return false;
  return saveInvitationsDemo({
    invitations: nextInvitations,
    guests: state.guests.filter((item) => item.invitationId !== id),
    rsvps: state.rsvps.filter((item) => item.invitationId !== id),
  });
}

/** 공유 토큰 재발급 (주한태 INV-002 지원용) */
export function regenerateSharingToken(id: string): string | null {
  const state = loadInvitationsDemo();
  const target = state.invitations.find((item) => item.id === id);
  if (!target) return null;

  // 불규칙 토큰 생성
  const randSuffix = Math.random().toString(36).substring(2, 10);
  const nextToken = `sh-${Date.now().toString(36)}-${randSuffix}`;

  const nextInvitations = state.invitations.map((item) =>
    item.id === id ? { ...item, sharingToken: nextToken, updatedAt: new Date().toISOString() } : item
  );

  const ok = saveInvitationsDemo({ ...state, invitations: nextInvitations });
  return ok ? nextToken : null;
}

export function getRsvpsForInvitation(invitationId: string): Rsvp[] {
  const { rsvps } = loadInvitationsDemo();
  return rsvps.filter((item) => item.invitationId === invitationId);
}

export function getGuestByToken(guestToken: string, invitationId?: string): Guest | undefined {
  if (!guestToken || !guestToken.trim()) return undefined;
  const { guests } = loadInvitationsDemo();
  return guests.find(
    (g) => g.guestToken === guestToken && (!invitationId || g.invitationId === invitationId)
  );
}

/** RSVP 응답 제출/갱신 (손준혁 INV-003 지원용) */
export function submitRsvp(rsvp: Rsvp): boolean {
  if (!isStoredRsvp(rsvp)) return false;
  const state = loadInvitationsDemo();
  const invitation = state.invitations.find((item) => item.id === rsvp.invitationId);
  if (!invitation || invitation.status !== 'published') return false;
  if (invitation.expiry !== null) {
    const expiresAt = Date.parse(invitation.expiry);
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) return false;
  }
  const guestOk = state.guests.some(
    (item) => item.invitationId === rsvp.invitationId && item.guestToken === rsvp.guestToken
  );
  if (!guestOk) return false;
  const nextRsvps = [...state.rsvps];
  const index = nextRsvps.findIndex(
    (item) => item.invitationId === rsvp.invitationId && item.guestToken === rsvp.guestToken
  );
  if (index >= 0) nextRsvps[index] = rsvp;
  else nextRsvps.push(rsvp);
  return saveInvitationsDemo({ ...state, rsvps: nextRsvps });
}
