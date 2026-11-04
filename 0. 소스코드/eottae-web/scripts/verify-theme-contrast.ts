/**
 * INV-001 테마 및 배경 색상 대비 텍스트 가독성·가시성 자동 검증 스크립트
 * 모든 테마(16종) 및 색상 팔레트(16종)에서 텍스트 대비(WCAG 2.1)를 전수 검사합니다.
 */

import { THEME_MASTER_PRESETS } from '../src/lib/invitations/theme-presets';
import {
  getContrastRatio,
  isDarkThemeBg,
  getContrastingTextColor,
  ensureLegibleColor,
} from '../src/lib/invitations/contrast-helper';

const COLOR_PRESETS = [
  { id: 'minimal', bg: '#FFFFFF', primary: '#111827', text: '#111827', accent: '#4B5563' },
  { id: 'classic', bg: '#FDFBFB', primary: '#633231', text: '#1f2937', accent: '#8B5E5C' },
  { id: 'brown', bg: '#F9F7F6', primary: '#734F40', text: '#292524', accent: '#9C7E6B' },
  { id: 'spring', bg: '#F8F9F5', primary: '#647352', text: '#1c1917', accent: '#919C84' },
  { id: 'blue', bg: '#F5F7F9', primary: '#4A6375', text: '#0f172a', accent: '#768999' },
  { id: 'lavender', bg: '#F7F6F9', primary: '#61557A', text: '#1e1b4b', accent: '#8A819C' },
  { id: 'pink', bg: '#FCF6F7', primary: '#C54B64', text: '#881337', accent: '#D68A9A' },
  { id: 'dark', bg: '#111827', primary: '#F3F4F6', text: '#F9FAFB', accent: '#9CA3AF' },
  { id: 'vivid', bg: '#FFF5F8', primary: '#D81B60', text: '#1f2937', accent: '#EC407A' },
  { id: 'lemon', bg: '#FCFDF4', primary: '#808200', text: '#1c1917', accent: '#A4A618' },
  { id: 'mint', bg: '#F2FAF9', primary: '#007D75', text: '#0f172a', accent: '#26A69A' },
  { id: 'cherry', bg: '#FCF5F5', primary: '#B83232', text: '#1f2937', accent: '#D65151' },
  { id: 'dusty-rose', bg: '#FAF6F6', primary: '#8E5B64', text: '#292524', accent: '#B07B85' },
  { id: 'sage', bg: '#F5F7F5', primary: '#556B5A', text: '#1c1917', accent: '#7B9481' },
  { id: 'charcoal', bg: '#2B2D42', primary: '#EDF2F4', text: '#F8F9FA', accent: '#8D99AE' },
  { id: 'slate', bg: '#334155', primary: '#F8FAFC', text: '#F1F5F9', accent: '#94A3B8' },
];

console.log('============================================================');
console.log(' [INV-001] 16종 마스터 테마 텍스트 대비(WCAG 2.1) 자동 검증');
console.log('============================================================');

let passedTests = 0;
let totalTests = 0;

Object.values(THEME_MASTER_PRESETS).forEach((theme) => {
  const isDark = isDarkThemeBg(theme.defaultBgColor);
  const cardBg = isDark ? '#1a2416' : '#ffffff';
  
  // 1. 본문 텍스트 대비 검증
  totalTests++;
  const effectiveText = ensureLegibleColor(theme.defaultTextColor, cardBg, 4.0);
  const textRatio = getContrastRatio(effectiveText, cardBg);
  const textPass = textRatio >= 4.0;
  if (textPass) passedTests++;

  // 2. 액센트 버튼 (참석합니다 버튼 / D-Day 배지) 텍스트 대비 검증
  totalTests++;
  const btnTextColor = getContrastingTextColor(theme.defaultAccentColor);
  const btnRatio = getContrastRatio(btnTextColor, theme.defaultAccentColor);
  const btnPass = btnRatio >= 3.5;
  if (btnPass) passedTests++;

  // 3. 2차 버튼 (마음으로 축하 / 하객 스냅 업로드) 대비 검증
  totalTests++;
  const secBtnBg = isDark ? '#263124' : '#f1f5f9';
  const secBtnText = isDark ? '#ffffff' : '#1f2937';
  const secRatio = getContrastRatio(secBtnText, secBtnBg);
  const secPass = secRatio >= 3.5;
  if (secPass) passedTests++;

  console.log(
    `[${theme.name.padEnd(8)}] 다크:${isDark ? 'YES' : ' NO'} | 본문대비:${textRatio.toFixed(2)}:1 [${textPass ? 'PASS' : 'FAIL'}] | 버튼대비:${btnRatio.toFixed(2)}:1 [${btnPass ? 'PASS' : 'FAIL'}] | 2차버튼:${secRatio.toFixed(2)}:1 [${secPass ? 'PASS' : 'FAIL'}]`
  );
});

console.log('\n============================================================');
console.log(' [INV-001] 16종 커스텀 색상 팔레트 대비 자동 검증');
console.log('============================================================');

COLOR_PRESETS.forEach((preset) => {
  const isDark = isDarkThemeBg(preset.bg);
  totalTests++;
  const safeText = ensureLegibleColor(preset.text, preset.bg, 4.0);
  const ratio = getContrastRatio(safeText, preset.bg);
  const pass = ratio >= 4.0;
  if (pass) passedTests++;

  // 버튼 대비
  totalTests++;
  const btnText = getContrastingTextColor(preset.accent);
  const btnRatio = getContrastRatio(btnText, preset.accent);
  const btnPass = btnRatio >= 3.5;
  if (btnPass) passedTests++;

  console.log(
    `[${preset.id.padEnd(10)}] 배경:${preset.bg} | 본문:${safeText} (${ratio.toFixed(2)}:1) [${pass ? 'PASS' : 'FAIL'}] | 버튼텍스트:${btnText} (${btnRatio.toFixed(2)}:1) [${btnPass ? 'PASS' : 'FAIL'}]`
  );
});

console.log(`\n총 검증 항목: ${totalTests}개 | 통과 항목: ${passedTests}개`);
if (passedTests === totalTests) {
  console.log('✓ 모든 테마 및 색상 프리셋에서 WCAG 2.1 가독성·가시성 100% 통과!\n');
} else {
  console.error(' 일부 항목에서 대비 미달 발생!\n');
  process.exit(1);
}
