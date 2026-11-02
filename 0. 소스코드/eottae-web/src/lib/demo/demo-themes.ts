// 3차 청첩장 테마 판매 미리보기. 가격은 예시이고 결제는 이 브라우저 목업이다.
// 카드번호·외부 결제 주소·PayApp 호출은 없다.

const STORAGE_KEY = 'eottae_demo_theme_purchases_v1';
export const DEMO_THEME_EVENT = 'eottae-demo-themes';

export type DemoThemeSwatch = 'lav' | 'blue' | 'pink' | 'point';

export type DemoTheme = {
  id: string;
  name: string;
  blurb: string;
  priceKrw: number;
  swatch: DemoThemeSwatch;
};

export type DemoThemeReceipt = {
  themeId: string;
  themeName: string;
  priceKrw: number;
  receiptNo: string;
  paidAt: string;
  approvedAt: string;
  cancelledAt: string;
};

export const DEMO_THEMES: readonly DemoTheme[] = [
  {
    id: 'spring-card',
    name: '봄꽃 카드',
    blurb: '옅은 꽃 배경의 모바일 청첩 예시',
    priceKrw: 3900,
    swatch: 'lav',
  },
  {
    id: 'moon-garden',
    name: '달빛 정원',
    blurb: '밤 정원 느낌의 초대장 예시',
    priceKrw: 5900,
    swatch: 'blue',
  },
  {
    id: 'hanji',
    name: '한지 결',
    blurb: '종이 결을 살린 단정한 초대장 예시',
    priceKrw: 7900,
    swatch: 'pink',
  },
  {
    id: 'star-table',
    name: '별밤 식탁',
    blurb: '식사 안내를 강조한 초대장 예시',
    priceKrw: 9900,
    swatch: 'point',
  },
];

export function formatKrw(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

function isReceipt(value: unknown): value is DemoThemeReceipt {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.themeId === 'string' &&
    typeof row.themeName === 'string' &&
    typeof row.priceKrw === 'number' &&
    typeof row.receiptNo === 'string' &&
    typeof row.paidAt === 'string' &&
    typeof row.approvedAt === 'string' &&
    typeof row.cancelledAt === 'string' &&
    !Number.isNaN(Date.parse(row.paidAt)) &&
    !Number.isNaN(Date.parse(row.approvedAt)) &&
    !Number.isNaN(Date.parse(row.cancelledAt))
  );
}

export function readDemoReceipts(): Record<string, DemoThemeReceipt> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const next: Record<string, DemoThemeReceipt> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!isReceipt(value) || value.themeId !== key) continue;
      next[key] = value;
    }
    return next;
  } catch {
    return {};
  }
}

export function saveDemoReceipt(receipt: DemoThemeReceipt): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = readDemoReceipts();
    current[receipt.themeId] = receipt;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(DEMO_THEME_EVENT));
  return true;
}

export function subscribeDemoThemes(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    onChange();
  };
  window.addEventListener(DEMO_THEME_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(DEMO_THEME_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
