/**
 * INV-001 색상 명도(Luminance) 및 WCAG 2.1 가독성·가시성 자동 보장 유틸리티
 * 어떠한 테마, 배경색, 포인트 색상 변경에도 텍스트가 항상 또렷하게 보이도록 보장합니다.
 */

export function parseHex(hexColor: string): [number, number, number] {
  let hex = hexColor.trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6) return [255, 255, 255];
  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;
  return [r, g, b];
}

export function getRelativeLuminance(hexColor: string): number {
  const [r, g, b] = parseHex(hexColor).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isDarkThemeBg(hexColor?: string): boolean {
  if (!hexColor) return false;
  const [r, g, b] = parseHex(hexColor);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 140;
}

/**
 * 주어진 배경색 위에 올릴 최적의 텍스트 색상 (#ffffff 또는 #111827)을 반환합니다.
 */
export function getContrastingTextColor(bgHex: string): '#ffffff' | '#111827' {
  if (!bgHex) return '#ffffff';
  const ratioWhite = getContrastRatio(bgHex, '#ffffff');
  const ratioDark = getContrastRatio(bgHex, '#111827');
  return ratioWhite >= ratioDark ? '#ffffff' : '#111827';
}

/**
 * 배경색과 전경색 간의 대비가 3.5:1 미만으로 떨어질 경우,
 * 가독성을 위해 자동으로 보정된 고대비 색상을 반환합니다.
 */
export function ensureLegibleColor(textColor: string, bgColor: string, minRatio = 4.0): string {
  const ratio = getContrastRatio(textColor, bgColor);
  if (ratio >= minRatio) return textColor;
  return getContrastingTextColor(bgColor);
}
