// 3차 모바일 청첩장 URL 생성 헬퍼 (INV-001)
// 정적 export 환경(output: 'export', trailingSlash: true)에서
// 동적 세그먼트 없이 쿼리 파라미터 방식으로 안전하게 라우팅한다.

export type InvitationsQuery = {
  view?: 'list' | 'new' | null;
  edit?: string | null;
  preview?: string | null;
};

/**
 * 청첩장 관리/에디터/미리보기 URL 생성
 */
export function invitationsHref(query: InvitationsQuery = {}): string {
  const params = new URLSearchParams();
  if (query.view && query.view !== 'list') params.set('view', query.view);
  if (query.edit) params.set('edit', query.edit);
  if (query.preview) params.set('preview', query.preview);

  const qs = params.toString();
  return qs ? `/invitations/?${qs}` : '/invitations/';
}

/**
 * 하객 공개 청첩장 / RSVP URL 생성
 * @param token 청첩장 공개 공유 토큰
 * @param guestToken (선택) 개별 하객 초대 토큰
 */
export function invitationGuestHref(token: string, guestToken?: string): string {
  const params = new URLSearchParams();
  if (token) params.set('t', token);
  if (guestToken) params.set('g', guestToken);

  const qs = params.toString();
  return qs ? `/invitations/p/?${qs}` : '/invitations/p/';
}
