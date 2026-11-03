// 3차 모바일 청첩장 데모 스토리지 (INV-001)
// 상태는 오직 이 브라우저의 localStorage('eottae.invitations.demo.v1')에만 저장된다.
// 서버·Supabase 호출은 일체 하지 않는다.

import { DEMO_GUESTS, DEMO_INVITATIONS, DEMO_RSVPS } from './demo-data';
import type { Guest, Invitation, Rsvp } from './types';
import { isInvitationStatus, isInvitationVisibility, isRsvpResponse } from './types';

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

export const INITIAL_INVITATIONS_DEMO: InvitationsDemoState = {
  invitations: [...DEMO_INVITATIONS],
  guests: [...DEMO_GUESTS],
  rsvps: [...DEMO_RSVPS],
};

function isStoredInvitation(value: unknown): value is Invitation {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    row.id.length > 0 &&
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
    row.weddingDate.length > 0 &&
    row.weddingDate.length <= 40 &&
    typeof row.venueLabel === 'string' &&
    row.venueLabel.trim().length >= 2 &&
    row.venueLabel.length <= 80 &&
    typeof row.greeting === 'string' &&
    row.greeting.length <= 1000 &&
    typeof row.sharingToken === 'string' &&
    row.sharingToken.length > 0 &&
    row.sharingToken.length <= 80 &&
    isInvitationVisibility(row.visibility) &&
    (row.expiry === null || (typeof row.expiry === 'string' && row.expiry.length <= 40)) &&
    typeof row.themeId === 'string' &&
    row.themeId.length <= 40 &&
    isInvitationStatus(row.status)
  );
}

function sanitizeInvitation(inv: Invitation): Invitation {
  return {
    id: inv.id,
    ownerId: inv.ownerId,
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
  };
}

function isStoredGuest(value: unknown): value is Guest {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    row.id.length > 0 &&
    row.id.length <= 80 &&
    typeof row.invitationId === 'string' &&
    row.invitationId.length <= 80 &&
    typeof row.displayName === 'string' &&
    row.displayName.trim().length >= 1 &&
    row.displayName.length <= 30 &&
    typeof row.guestToken === 'string' &&
    row.guestToken.length > 0 &&
    row.guestToken.length <= 80
  );
}

function isStoredRsvp(value: unknown): value is Rsvp {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.invitationId === 'string' &&
    row.invitationId.length <= 80 &&
    typeof row.guestToken === 'string' &&
    row.guestToken.length <= 80 &&
    isRsvpResponse(row.response) &&
    typeof row.partySize === 'number' &&
    Number.isInteger(row.partySize) &&
    row.partySize >= 1 &&
    row.partySize <= 10 &&
    typeof row.note === 'string' &&
    row.note.length <= 300 &&
    typeof row.respondedAt === 'string' &&
    row.respondedAt.length <= 40
  );
}

export function loadInvitationsDemo(): InvitationsDemoState {
  if (typeof window === 'undefined') return INITIAL_INVITATIONS_DEMO;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_INVITATIONS_DEMO;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return INITIAL_INVITATIONS_DEMO;
    const row = parsed as Partial<InvitationsDemoState>;

    const invitations = Array.isArray(row.invitations)
      ? row.invitations.filter(isStoredInvitation).slice(0, MAX_INVITATIONS).map(sanitizeInvitation)
      : [...DEMO_INVITATIONS];

    const guests = Array.isArray(row.guests)
      ? row.guests.filter(isStoredGuest).slice(0, MAX_GUESTS)
      : [...DEMO_GUESTS];

    const rsvps = Array.isArray(row.rsvps)
      ? row.rsvps.filter(isStoredRsvp).slice(0, MAX_RSVPS)
      : [...DEMO_RSVPS];

    return { invitations, guests, rsvps };
  } catch {
    return INITIAL_INVITATIONS_DEMO;
  }
}

export function saveInvitationsDemo(state: InvitationsDemoState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const payload: InvitationsDemoState = {
      invitations: state.invitations.slice(0, MAX_INVITATIONS).map(sanitizeInvitation),
      guests: state.guests.filter(isStoredGuest).slice(0, MAX_GUESTS),
      rsvps: state.rsvps.filter(isStoredRsvp).slice(0, MAX_RSVPS),
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
  if (!token) return undefined;
  const { invitations } = loadInvitationsDemo();
  return invitations.find((item) => item.sharingToken === token && item.status !== 'expired');
}

export function saveInvitation(invitation: Invitation): boolean {
  const state = loadInvitationsDemo();
  const index = state.invitations.findIndex((item) => item.id === invitation.id);
  const nextInvitations = [...state.invitations];
  const now = new Date().toISOString();

  if (index >= 0) {
    nextInvitations[index] = {
      ...invitation,
      updatedAt: now,
    };
  } else {
    nextInvitations.unshift({
      ...invitation,
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
  return saveInvitationsDemo({ ...state, invitations: nextInvitations });
}

/** 공유 토큰 재발급 (주한태 INV-002 지원용) */
export function regenerateSharingToken(id: string): string | null {
  const state = loadInvitationsDemo();
  const target = state.invitations.find((item) => item.id === id);
  if (!target) return null;

  const randSuffix = Math.random().toString(36).substring(2, 10);
  const nextToken = `sh-reissued-${Date.now().toString(36)}-${randSuffix}`;

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
  if (!guestToken) return undefined;
  const { guests } = loadInvitationsDemo();
  return guests.find(
    (g) => g.guestToken === guestToken && (!invitationId || g.invitationId === invitationId)
  );
}

/** RSVP 응답 제출/갱신 (손준혁 INV-003 지원용) */
export function submitRsvp(rsvp: Rsvp): boolean {
  const state = loadInvitationsDemo();
  // 동일한 guestToken의 기존 회신이 있으면 갱신, 없으면 추가
  const existingIndex = state.rsvps.findIndex(
    (r) => r.invitationId === rsvp.invitationId && r.guestToken === rsvp.guestToken
  );
  const nextRsvps = [...state.rsvps];
  if (existingIndex >= 0) {
    nextRsvps[existingIndex] = rsvp;
  } else {
    nextRsvps.push(rsvp);
  }
  return saveInvitationsDemo({ ...state, rsvps: nextRsvps });
}
