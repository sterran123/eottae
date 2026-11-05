// 3차 모바일 청첩장 RSVP 접근 제어·제출 로직 (INV-003, TC-016 목업)
// - 공유 토큰(t)과 게스트 토큰(g)이 모두 맞고 청첩장이 published·미만료일 때만 회신을 연다.
// - 거절 사유는 호출부에 구분해 알리지 않는다(토큰 추측 방지). 행사 상세·다른 하객 정보를 돌려주지 않는다.
// - 회신은 오직 이 브라우저 localStorage('eottae.invitations.demo.v1')에만 저장한다. 서버 호출 없음.
// - 연속 제출 제한은 서버 속도 제한이 아니라 같은 하객 토큰의 직전 respondedAt 으로 판정하는 목업이다.

import {
  getGuestByToken,
  getInvitationById,
  getInvitationByToken,
  getRsvpsForInvitation,
  loadInvitationsDemo,
  submitRsvp,
} from './demo-storage';
import {
  isRsvpMeal,
  isRsvpResponse,
  type Guest,
  type Invitation,
  type Rsvp,
  type RsvpMeal,
  type RsvpResponse,
} from './types';

export const RSVP_DENIED_MESSAGE = '초대 링크가 없어 회신할 수 없어요';
export const RSVP_COOLDOWN_MESSAGE = '잠시 뒤에 다시 시도해 주세요';
export const RSVP_NOT_OWNER_MESSAGE =
  '이 청첩장의 소유자가 아니라 편집과 회신 명단 열람을 할 수 없어요';
/** 같은 게스트 토큰의 연속 제출을 막는 데모 간격 (서버 속도 제한 아님) */
export const RSVP_COOLDOWN_MS = 10_000;
export const RSVP_PARTY_MAX = 10;
export const RSVP_NOTE_MAX = 300;
const TOKEN_MAX_LENGTH = 80;

export type RsvpAccess =
  | { ok: false }
  | {
      ok: true;
      invitation: Invitation;
      guest: Guest;
      /** 이 게스트 토큰 본인의 기존 회신만. 다른 하객 회신은 절대 담지 않는다. */
      myRsvp: Rsvp | null;
    };

/** 폼 입력값 (인원은 입력 문자열 그대로 받아 검증한다) */
export type RsvpDraft = {
  response: RsvpResponse | null;
  partySize: string;
  meal: RsvpMeal | null;
  note: string;
};

export type RsvpSubmitFailure = {
  ok: false;
  reason: 'denied' | 'invalid' | 'cooldown' | 'storage';
  message: string;
};

export type RsvpSubmitResult = { ok: true; rsvp: Rsvp } | RsvpSubmitFailure;

export const EMPTY_RSVP_DRAFT: RsvpDraft = { response: null, partySize: '1', meal: null, note: '' };

export function draftFromRsvp(rsvp: Rsvp): RsvpDraft {
  return {
    response: rsvp.response,
    partySize: String(rsvp.partySize > 0 ? rsvp.partySize : 1),
    meal: rsvp.meal ?? null,
    note: rsvp.note,
  };
}

/**
 * 공유 토큰 t + 게스트 토큰 g 로 회신 권한을 판정한다.
 * 둘 중 하나라도 없거나 틀리면, 또는 청첩장이 published 가 아니거나 만료·폐기·비공개면 { ok: false }.
 */
export function resolveRsvpAccess(
  token: string,
  guestToken: string,
  now: number = Date.now(),
): RsvpAccess {
  const t = token.trim();
  const g = guestToken.trim();
  if (!t || !g || t.length > TOKEN_MAX_LENGTH || g.length > TOKEN_MAX_LENGTH) return { ok: false };

  const invitation = getInvitationByToken(t);
  if (!invitation) return { ok: false };
  if (invitation.expiry !== null) {
    const expiresAt = Date.parse(invitation.expiry);
    if (Number.isNaN(expiresAt) || expiresAt <= now) return { ok: false };
  }

  const guest = getGuestByToken(g, invitation.id);
  if (!guest) return { ok: false };

  const myRsvp =
    loadInvitationsDemo().rsvps.find(
      (item) => item.invitationId === invitation.id && item.guestToken === guest.guestToken,
    ) ?? null;

  return { ok: true, invitation, guest, myRsvp };
}

function invalid(message: string): RsvpSubmitFailure {
  return { ok: false, reason: 'invalid', message };
}

/**
 * 회신 저장. UI 상태를 믿지 않고 제출 시점에 접근 권한을 다시 판정한다.
 * 같은 게스트 토큰으로 RSVP_COOLDOWN_MS 안에 다시 제출하면 저장하지 않고 안내만 돌려준다.
 */
export function submitGuestRsvp(
  token: string,
  guestToken: string,
  draft: RsvpDraft,
  now: number = Date.now(),
): RsvpSubmitResult {
  const access = resolveRsvpAccess(token, guestToken, now);
  if (!access.ok) return { ok: false, reason: 'denied', message: RSVP_DENIED_MESSAGE };

  if (access.myRsvp) {
    const elapsed = now - Date.parse(access.myRsvp.respondedAt);
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < RSVP_COOLDOWN_MS) {
      return { ok: false, reason: 'cooldown', message: RSVP_COOLDOWN_MESSAGE };
    }
  }

  if (!isRsvpResponse(draft.response)) return invalid('참석 여부를 골라 주세요.');

  let partySize = 0;
  if (draft.response !== 'no') {
    const raw = draft.partySize.trim();
    if (!/^\d+$/.test(raw)) return invalid(`인원은 1~${RSVP_PARTY_MAX}명 사이 숫자로 적어 주세요.`);
    partySize = Number(raw);
    if (partySize < 1 || partySize > RSVP_PARTY_MAX) {
      return invalid(`인원은 1~${RSVP_PARTY_MAX}명 사이 숫자로 적어 주세요.`);
    }
  }

  if (draft.meal !== null && !isRsvpMeal(draft.meal)) return invalid('식사 여부를 다시 골라 주세요.');

  const note = draft.note.trim();
  if (note.length > RSVP_NOTE_MAX) return invalid(`메모는 ${RSVP_NOTE_MAX}자까지 적을 수 있어요.`);

  const rsvp: Rsvp = {
    invitationId: access.invitation.id,
    guestToken: access.guest.guestToken,
    response: draft.response,
    partySize,
    ...(draft.response !== 'no' && draft.meal ? { meal: draft.meal } : {}),
    note,
    respondedAt: new Date(now).toISOString(),
  };

  if (!submitRsvp(rsvp)) {
    return {
      ok: false,
      reason: 'storage',
      message: '이 브라우저에 저장하지 못했어요. 저장 공간 설정을 확인해 주세요.',
    };
  }
  return { ok: true, rsvp };
}

export type OwnerRsvpRow = {
  guestDisplayName: string;
  guestToken: string;
  response: RsvpResponse;
  partySize: number;
  meal?: RsvpMeal;
  note: string;
  respondedAt: string;
};

export type OwnerRsvpOverview =
  | { ok: false; message: string; title?: string }
  | {
      ok: true;
      invitation: Invitation;
      rows: OwnerRsvpRow[];
    };

/**
 * 소유자 전용 회신 현황 읽기 (읽기 전용 — 주한태 정책 패널과 동일한 localStorage 데이터를 읽기만 함).
 * viewerIsOwner !== true 이거나 소유자가 아니면 명단을 돌려주지 않고 거절한다 (TC-015 목업).
 */
export function resolveOwnerRsvpOverview(invitationId: string): OwnerRsvpOverview {
  const id = invitationId.trim();
  if (!id) return { ok: false, message: RSVP_NOT_OWNER_MESSAGE };
  const invitation = getInvitationById(id);
  if (!invitation) return { ok: false, message: RSVP_NOT_OWNER_MESSAGE };
  if (invitation.viewerIsOwner !== true || invitation.ownerId !== 'user-demo-me') {
    return { ok: false, message: RSVP_NOT_OWNER_MESSAGE, title: invitation.title };
  }
  const state = loadInvitationsDemo();
  const guestsByToken = new Map(
    state.guests
      .filter((g) => g.invitationId === invitation.id)
      .map((g) => [g.guestToken, g.displayName]),
  );
  const rows: OwnerRsvpRow[] = getRsvpsForInvitation(invitation.id).map((r) => ({
    guestDisplayName: guestsByToken.get(r.guestToken) ?? '초대 하객',
    guestToken: r.guestToken,
    response: r.response,
    partySize: r.partySize,
    meal: r.meal,
    note: r.note,
    respondedAt: r.respondedAt,
  }));
  return { ok: true, invitation, rows };
}


