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
