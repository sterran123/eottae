// ============================================================
//  저장 경로: src/components/match/icons.tsx
//  담당: 오하율 · MATCH-001
//  역할: 온보딩에서 쓰는 인라인 SVG 아이콘 모음.
//        외부 아이콘 폰트/CDN 의존 없음 (공통 영역 불변).
//        색은 currentColor 상속 → CSS 에서 color 로 제어.
// ============================================================

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function base(props: IconProps) {
  const { title, ...rest } = props;
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': title ? undefined : true,
    role: title ? 'img' : undefined,
    ...rest,
  };
}

export function IconCircleCheck(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2 2l4 -4" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M5 12l5 5l9 -9" />
    </svg>
  );
}

export function IconDots(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}

export function IconChevronDown(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M6 9l6 6l6 -6" />
    </svg>
  );
}

export function IconChevronUp(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M6 15l6 -6l6 6" />
    </svg>
  );
}

export function IconMoodOff(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01M9.5 15.5a3.5 3.5 0 0 1 5 0" />
    </svg>
  );
}

export function IconGenderMale(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="10" cy="14" r="5" />
      <path d="M14 10l6 -6M16 4h4v4" />
    </svg>
  );
}

export function IconGenderFemale(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v7M9 18h6" />
    </svg>
  );
}

export function IconFriends(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="8" cy="8" r="2.5" />
      <path d="M4 20v-1a4 4 0 0 1 4 -4h0a4 4 0 0 1 4 4v1" />
      <circle cx="17" cy="9" r="2" />
      <path d="M15.5 20v-1a3.5 3.5 0 0 1 5 -3.2" />
    </svg>
  );
}

export function IconShieldHeart(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M12 3l7 3v5c0 4 -3 7 -7 8c-4 -1 -7 -4 -7 -8V6z" />
      <path d="M12 15c-1.6 -1.1 -3 -2.2 -3 -3.6a1.6 1.6 0 0 1 3 -.7a1.6 1.6 0 0 1 3 .7c0 1.4 -1.4 2.5 -3 3.6z" />
    </svg>
  );
}

// ---- MATCH-002 추천 아이콘 ----

export function IconPin(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M12 21s-7 -5.5 -7 -11a7 7 0 0 1 14 0c0 5.5 -7 11 -7 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconX(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconBlock(p: IconProps) {
  return (
    <svg {...base(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="12" cy="12" r="9" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

/** 사람 실루엣(사진 비공개 자리표시). 채움 아이콘. */
export function IconUserSilhouette(p: IconProps) {
  const { title, ...rest } = p;
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...rest}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="8.5" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0z" />
    </svg>
  );
}

/** 하트(채움). 좋아요 버튼용. */
export function IconHeartFill(p: IconProps) {
  const { title, ...rest } = p;
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...rest}
    >
      {title && <title>{title}</title>}
      <path d="M12 21C5.5 15.5 3 12.5 3 9a4 4 0 0 1 7 -2.6A4 4 0 0 1 17 9c0 3.5 -2.5 6.5 -9 12z" />
    </svg>
  );
}

/** 도토리(재화). 화면 표기 '도토리', 식별자 acorn. 채움 아이콘. */
export function IconAcorn(p: IconProps) {
  const { title, ...rest } = p;
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...rest}
    >
      {title && <title>{title}</title>}
      <ellipse cx="12" cy="14.5" rx="6" ry="7" fill="#c58a4a" />
      <ellipse cx="12" cy="10.8" rx="5.7" ry="1.8" fill="#8a6230" />
      <path d="M12 9.3V6.5" stroke="#5f3f1c" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
