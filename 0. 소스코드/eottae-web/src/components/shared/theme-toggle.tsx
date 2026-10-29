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

// 헤더 피커와 설정 화면이 같은 탭에서 서로를 따라가게 — storage 이벤트는 다른 탭만 울린다.
const THEME_EVENT = 'eottae-theme-change';

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('eottae-theme', theme);
  syncChrome();
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

// 현재 테마 팔레트 미리보기 — 점 3개가 globals.css 토큰(브랜드·CTA·카드)을 그대로 칠한다.
// 색을 tsx에 두지 않으므로 테마가 바뀌면 CSS가 알아서 따라가고, key 교체로 통통 튀는 팝만 재생한다.
function Swatch() {
  return (
    <span className="theme-swatch" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

// variant: 헤더는 좁은 select, 설정은 같은 목록을 라디오로. 저장 키·apply는 하나다.
export default function ThemeToggle({ variant = 'picker' }: { variant?: 'picker' | 'choices' }) {
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

    const onTheme = (event: Event) => {
      const next = (event as CustomEvent<Theme>).detail;
      if (THEME_IDS.includes(next)) setTheme(next);
    };
    window.addEventListener(THEME_EVENT, onTheme);

    // 'system' 선택 중 OS 다크/라이트가 바뀌면 크롬 색상만 따라간다 (화면 색상은 CSS 미디어쿼리가 처리)
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onOsChange = () => {
      if (document.documentElement.dataset.theme === 'system') syncChrome();
    };
    mql.addEventListener('change', onOsChange);
    return () => {
      window.removeEventListener(THEME_EVENT, onTheme);
      mql.removeEventListener('change', onOsChange);
    };
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    apply(next);
  };

  if (variant === 'choices') {
    return (
      <fieldset className="theme-choices">
        <legend>테마 선택</legend>
        {THEMES.map((t) => (
          <label className="theme-choice" key={t.id}>
            <input
              type="radio"
              name="eottae-theme-choice"
              value={t.id}
              checked={theme === t.id}
              disabled={!mounted}
              onChange={() => choose(t.id)}
            />
            {t.label}
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <label className="theme-picker">
      <Swatch key={theme} />
      <select
        aria-label="테마 선택"
        value={theme}
        disabled={!mounted}
        onChange={(e) => choose(e.target.value as Theme)}
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
