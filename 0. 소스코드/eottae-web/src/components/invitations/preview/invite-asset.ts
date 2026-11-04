// 청첩장 일러스트·공유 경로. 활동 커버와 같이 basePath만 붙이고 외부 주소는 받지 않는다.

import { invitationGuestHref } from '@/lib/invitations/href';

export function inviteAsset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (base && (normalized === base || normalized.startsWith(`${base}/`))) return normalized;
  return `${base}${normalized}`;
}

/** 하객 공개 경로. 브라우저에서는 origin을 붙여 복사한다. */
export function invitationPublicUrl(token: string): string {
  const path = inviteAsset(invitationGuestHref(token));
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}
