'use client';

import { useEffect, useState } from 'react';

// 6개 테마 — 'system'만 OS 설정을 따르고 나머지는 명시 고정. 기본값은 'light'.
// layout.tsx의 FOUC 스크립트와 같은 목록·같은 localStorage 키를 쓴다.
type Theme = 'light' | 'cupcake' | 'cyberpunk' | 'disney' | 'dark' | 'system';
const THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: '라이트' },
  { id: 'cupcake', label: '컵케잌' },
  { id: 'cyberpunk', label: '사이버펑크' },
  { id: 'disney', label: '디즈니' },
  { id: 'dark', label: '다크' },
  { id: 'system', label: '시스템' },
];
const THEME_IDS = THEMES.map((t) => t.id);

// <meta name="theme-color"> 값 — globals.css 각 테마의 대표 크롬 색과 동기화 유지
const CHROME: Record<Exclude<Theme, 'system'>, string> = {
  light: '#7454c4',
  cupcake: '#c2578e',
  cyberpunk: '#0a0a14',
  disney: '#2f62b1',
  dark: '#10101b',
};

function syncChrome() {
  const t = document.documentElement.dataset.theme;
  const isDarkSystem =
    t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const color = isDarkSystem ? CHROME.dark : CHROME[t as keyof typeof CHROME] || CHROME.light;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('eottae-theme', theme);
  syncChrome();
}

// 팔레트 아이콘 — 최소 인라인 SVG (원 + 점 3개)
function Icon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('eottae-theme');
    const initial: Theme = THEME_IDS.includes(saved as Theme) ? (saved as Theme) : 'light';
    setTheme(initial);
    // FOUC 스크립트가 data-theme을 이미 붙였다 — 저장값이 없으면 기본 'light'를 명시
    if (document.documentElement.dataset.theme !== initial) apply(initial);
    else syncChrome();
    setMounted(true);

    // 'system' 선택 중 OS 다크/라이트가 바뀌면 크롬 색상만 따라간다 (화면 색상은 CSS 미디어쿼리가 처리)
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onOsChange = () => {
      if (document.documentElement.dataset.theme === 'system') syncChrome();
    };
    mql.addEventListener('change', onOsChange);
    return () => mql.removeEventListener('change', onOsChange);
  }, []);

  return (
    <label className="theme-picker">
      <Icon />
      <select
        aria-label="테마 선택"
        value={theme}
        disabled={!mounted}
        onChange={(e) => {
          const next = e.target.value as Theme;
          setTheme(next);
          apply(next);
        }}
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
