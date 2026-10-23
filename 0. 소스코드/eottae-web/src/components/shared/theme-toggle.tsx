'use client';

import { useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';
const ORDER: Theme[] = ['system', 'light', 'dark'];
const LABEL: Record<Theme, string> = {
  system: '시스템',
  light: '라이트',
  dark: '다크',
};

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
    localStorage.removeItem('eottae-theme');
  } else {
    root.dataset.theme = theme;
    localStorage.setItem('eottae-theme', theme);
  }
}

// 라이트=해, 다크=달, 시스템=모니터 — 최소 인라인 SVG
function Icon({ theme }: { theme: Theme }) {
  const p = {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    'aria-hidden': true,
  };
  if (theme === 'light')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="4.4" />
        <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7" />
      </svg>
    );
  if (theme === 'dark')
    return (
      <svg {...p}>
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
    );
  return (
    <svg {...p}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('eottae-theme');
    if (saved === 'light' || saved === 'dark') setTheme(saved);
    setMounted(true);
  }, []);

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];

  return (
    <button
      type="button"
      className="theme-toggle"
      disabled={!mounted}
      aria-label={`테마: ${LABEL[theme]}. 누르면 ${LABEL[next]} 모드로 바뀝니다`}
      title={`테마: ${LABEL[theme]}`}
      onClick={() => {
        setTheme(next);
        apply(next);
      }}
    >
      <Icon theme={theme} />
      <span>{LABEL[theme]}</span>
    </button>
  );
}
