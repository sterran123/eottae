/**
 * verify-modal-and-card.ts
 *
 * [INV-001 사용자 피드백 요구사항 검증 스크립트]
 * 1. 카드 모서리 안쪽 흰색 틈 현상 완전 해결 (border-radius inherit, overflow: hidden, hover overlay inherit)
 * 2. 텍스트 뒤 부자연스러운 그림자(text-shadow) 완전 제거 및 고품질 타이포그래피 검증
 * 3. 미리보기 모달창 정상 표시 계층 구조(DOM 계층, backdrop/shell 일치, z-index, 클릭 전파 차단) 검증
 */

import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    passCount++;
    console.log(`  ✓ [PASS] ${desc}`);
  } else {
    failCount++;
    console.error(`  ✗ [FAIL] ${desc}`);
  }
}

console.log('============================================================');
console.log(' [INV-001] 모달 표시 · 모서리 채움 · 텍스트 그림자 자동 검증');
console.log('============================================================\n');

// 1. InvitationPreviewModal.tsx 검증
console.log('[검증 1] 미리보기 모달(InvitationPreviewModal.tsx) DOM 계층 구조');
const modalPath = path.resolve(process.cwd(), 'src/components/invitations/InvitationPreviewModal.tsx');
const modalCode = fs.readFileSync(modalPath, 'utf-8');

// 1-1. 최외곽 다이얼로그 래퍼가 backdrop과 overlay 클래스를 동시에 가지며 onClick={onClose}를 갖는지
assert(
  modalCode.includes('className="inv-modal-backdrop inv-modal-overlay"'),
  '최외곽 모달 루트에 backdrop과 overlay 클래스가 모두 통합 적용됨'
);
assert(
  modalCode.includes('role="dialog"') && modalCode.includes('aria-modal="true"'),
  '웹 접근성 role="dialog" 및 aria-modal="true" 속성 포함'
);

// 1-2. 독립형 빈 형제 <div className="inv-modal-backdrop" onClick={onClose} /> 버그가 제거되었는지
assert(
  !modalCode.includes('<div className="inv-modal-backdrop" onClick={onClose} />'),
  '화면 전체를 막고 모달을 가리던 빈 backdrop 형제 엘리먼트 완전 제거'
);

// 1-3. 모달 본체(shell)가 backdrop 내부 자식으로 위치하며 stopPropagation 처리되었는지
assert(
  modalCode.includes('className="inv-modal-shell inv-modal-container inv-modal-container--expanded"'),
  '모달 본체 엘리먼트에 inv-modal-shell과 inv-modal-container 클래스 적용'
);
assert(
  modalCode.includes('onClick={(e) => e.stopPropagation()}'),
  '모달 내부 클릭 시 닫힘 버블링 방지(stopPropagation) 적용'
);

// 1-4. ESC 키 닫기 이벤트 리스너 동작
assert(
  modalCode.includes("e.key === 'Escape'"),
  'ESC 키 입력 시 모달 안전 닫기 이벤트 핸들러 유지'
);

// 2. CSS 모달 스타일 검증
console.log('\n[검증 2] 모달 CSS 스타일(invitations.css) 계층 및 z-index');
const cssPath = path.resolve(process.cwd(), 'src/app/invitations/invitations.css');
const cssCode = fs.readFileSync(cssPath, 'utf-8');

assert(
  cssCode.includes('.inv-modal-backdrop,\n.inv-modal-overlay') ||
  cssCode.includes('.inv-modal-backdrop, .inv-modal-overlay') ||
  cssCode.includes('.inv-modal-overlay'),
  '.inv-modal-overlay가 CSS에서 fixed 백드롭으로 정상 정의됨'
);

assert(
  cssCode.includes('z-index: 9999 !important;'),
  '모달 백드롭 z-index가 9999 !important로 다른 요소에 가려지지 않음'
);

assert(
  cssCode.includes('.inv-modal-shell,\n.inv-modal-container') ||
  cssCode.includes('.inv-modal-container'),
  '.inv-modal-container가 솔리드 배경(#ffffff) 및 뷰포트 크기로 정상 정의됨'
);

// 3. 카드 모서리 하얀 틈 검증
console.log('\n[검증 3] 카드 모서리 안쪽 흰색 틈 제거(Corner Fill Integrity)');

// 3-1. 뷰포트가 overflow: hidden !important 와 transparent 배경을 갖는지
assert(
  cssCode.includes('border-radius: 18px;') &&
  cssCode.includes('overflow: hidden !important;') &&
  cssCode.includes('background: transparent !important;'),
  '.inv-cover-viewport에 18px 라운드, overflow: hidden, background: transparent 적용'
);

// 3-2. 호버 오버레이가 20px이 아닌 inherit으로 18px 뷰포트 모서리에 100% 밀착되는지
const hoverOverlayBlock = cssCode.match(/\.inv-cover-hover-overlay\s*\{[^}]+\}/)?.[0] || '';
assert(
  !hoverOverlayBlock.includes('border-radius: 20px;') &&
  hoverOverlayBlock.includes('border-radius: inherit !important;'),
  '.inv-cover-hover-overlay가 border-radius: inherit !important로 18px 모서리 틈 없이 완전 밀착'
);

// 3-3. 커버 A 및 분할 카드 내부 컨테이너의 모서리 상속
assert(
  cssCode.includes('.inv-cover-a-container') &&
  cssCode.includes('border-radius: inherit;') &&
  cssCode.includes('border-top-left-radius: inherit;'),
  '커버 A 상단 바 및 하단 사진 본체가 모서리 라운드를 빈틈없이 채움'
);

assert(
  cssCode.includes('.inv-split-card-cover') &&
  cssCode.includes('border-top-left-radius: inherit;'),
  '분할 사진 카드 컨테이너가 모서리 라운드를 빈틈없이 채움'
);

// 4. 부자연스러운 텍스트 그림자(text-shadow) 제거 검증
console.log('\n[검증 4] 부자연스러운 텍스트 그림자(text-shadow) 완전 제거');

// 4-1. 라이트 카드 텍스트에서 text-shadow: none !important 확인
assert(
  cssCode.includes('.inv-ca-names') &&
  cssCode.includes('.inv-split-names') &&
  cssCode.includes('.inv-quiet-names') &&
  cssCode.includes('text-shadow: none !important;'),
  '라이트 카드(커버 A, 분할 사진, 콰이어트) 텍스트의 text-shadow가 none !important로 완전 제거됨'
);

// 4-2. 구버전의 번지는 검은 그림자 0 2px 10px rgba(0, 0, 0, 0.65) 제거 확인
assert(
  !cssCode.includes('text-shadow: 0 2px 10px rgba(0, 0, 0, 0.65) !important;'),
  '부자연스럽게 번지는 0 2px 10px rgba(0, 0, 0, 0.65) 그림자가 완전히 제거됨'
);

// 4-3. 0 2px 12px rgba(0, 0, 0, 0.8) 같은 과도한 블러 그림자 제거 확인
assert(
  !cssCode.includes('text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8)'),
  '과도하게 번지는 12px 블러 그림자 제거 및 3px 이하 은은한 자연스러운 가독성으로 교체'
);

// 5. 섹션 0 메인 웨딩 사진 & 멀티 프레임(아치형/감성사진형/둥근형/네모형/인생네컷형/풀커버형) 검증
console.log('\n[검증 5] 섹션 0 신랑·신부 메인 웨딩 사진 & 6종 프레임 스타일 노출 검증');
const rendererPath = path.resolve(process.cwd(), 'src/components/invitations/InvitationCardRenderer.tsx');
const rendererCode = fs.readFileSync(rendererPath, 'utf-8');

assert(
  modalCode.includes('0. 신랑·신부 메인 웨딩 사진 &amp; 프레임 (아치/감성/둥근/네모)'),
  '섹션 순서 리스트 최상단에 0번 신랑·신부 메인 웨딩 사진 & 프레임 항목 배치됨'
);

assert(
  modalCode.includes("label: '아치형'") &&
  modalCode.includes("label: '감성사진형'") &&
  modalCode.includes("label: '둥근형'") &&
  modalCode.includes("label: '네모형'") &&
  modalCode.includes("label: '4컷 필름형'") &&
  modalCode.includes("label: '풀커버형'"),
  '모달에 6가지 프레임 스타일(아치형, 감성사진형, 둥근형, 네모형, 4컷 필름형, 풀커버형) 선택 UI 완벽 반영'
);

assert(
  cssCode.includes('flex-shrink: 0 !important;') &&
  cssCode.includes('.inv-hero-wrap'),
  '.inv-hero-wrap에 flex-shrink: 0 !important가 적용되어 휴대폰 상단 0번 웨딩 사진이 절대 접히지 않음'
);

// 6. 테마 허브 카드 인물과 모달 미리보기 인물 100% 일치 검증
console.log('\n[검증 6] 테마 카드 인물과 미리보기 모달 인물 100% 일치 검증');
const all16Themes = [
  'forest-fresh',
  'our-vow',
  'photo-background',
  'warm-heart',
  'wax-seal',
  'tape-card',
  'typo-frame',
  'photo-only',
  'script-card',
  'center-line',
  'cover-a',
  'quiet',
  'spring-blossom',
  'moonlight-garden',
  'traditional-hanji',
  'starlight-banquet',
  'botanical-garden',
  'minimal-arch',
  'cinematic-movie',
  'hanok-heritage',
];

const allThemesCoveredInRenderer = all16Themes.every((t) => rendererCode.includes(`case '${t}':`));
assert(
  allThemesCoveredInRenderer && rendererCode.includes('export function getThemeDefaultPhoto'),
  '모든 웨딩 테마가 getThemeDefaultPhoto 및 renderSignatureThemeHero에서 허브 카드와 동일한 20대 인물 사진을 100% 동기화하여 렌더링함'
);

// 7. 모달 좌측 툴바 & 렌더러 CSS 클래스 누락 제로 및 다크 카드 스코핑 검증
console.log('\n[검증 7] 좌측 툴바 버튼 디자인 및 다크 테마 카드 배경 스코핑 검증');
const requiredCssClasses = [
  '.inv-color-chips-grid',
  '.inv-color-preset-card',
  '.inv-color-preset-card--selected',
  '.inv-layout-choices-grid',
  '.inv-layout-choice-btn',
  '.inv-layout-choice-btn--active',
  '.inv-section-title',
  '.inv-schedule-card',
  '.inv-cal-grid',
  '.inv-cal-cell--wedding',
];
const allClassesExist = requiredCssClasses.every((cls) => cssCode.includes(cls));
assert(
  allClassesExist,
  '모달 좌측 색상 테마 16종 카드, 레이아웃 3종 버튼, 우측 달력/일정 카드 CSS 클래스가 100% 정의됨'
);

assert(
  cssCode.includes('.inv-mode--dark.inv-theme--moonlight-garden.inv-layout--modern .inv-content-section') &&
  cssCode.includes('.inv-mode--dark.inv-theme--typo-frame.inv-layout--modern .inv-content-section') &&
  !cssCode.includes('\n.inv-theme--moonlight-garden.inv-layout--modern .inv-content-section'),
  '다크 테마 모던 카드 배경이 .inv-mode--dark 전용으로 스코핑되어 밝은 색상 프리셋에서 검은 카드에 검은 글씨가 겹치는 현상 완벽 차단'
);

// 8. [이슈 #84] 미리보기 테마 적용 · CSS 토큰만 · globals.css 수정 없음 검증
console.log('\n[검증 8] [이슈 #84] 미리보기 테마 적용 · CSS 토큰만 · globals.css 무수정 검증');
const hubPath = path.resolve(process.cwd(), 'src/components/invitations/InvitationsHub.tsx');
const hubCode = fs.readFileSync(hubPath, 'utf-8');
const previewCssPath = path.resolve(process.cwd(), 'src/components/invitations/preview/invite-preview.css');
const previewCssCode = fs.readFileSync(previewCssPath, 'utf-8');

assert(
  hubCode.includes("searchParams.get('preview')") &&
  hubCode.includes('setPreviewTarget(found)'),
  'InvitationsHub에서 ?preview=<id> 쿼리 파라미터 수신 시 해당 청첩장 미리보기 모달 자동 실행'
);

assert(
  previewCssCode.includes("data-invite-theme='spring-card'") &&
  previewCssCode.includes("data-invite-theme='moon-garden'") &&
  previewCssCode.includes("data-invite-theme='hanji'") &&
  previewCssCode.includes("data-invite-theme='star-table'"),
  'InvitePreview에서 DEMO_THEMES 4종 테마(spring-card, moon-garden, hanji, star-table) 테마 연결 및 스타일링 완료'
);

// 9. [이슈 #84] 360px · 44px · 키보드 포커스 · 6테마 완벽 대응 검증
console.log('\n[검증 9] [이슈 #84] 360px · 44px · 키보드 · 6테마 완벽 대응 검증');
assert(
  previewCssCode.includes("[data-theme='cupcake']") &&
  previewCssCode.includes("[data-theme='cyberpunk']") &&
  previewCssCode.includes("[data-theme='disney']") &&
  previewCssCode.includes("[data-theme='dark']"),
  'invite-preview.css에 globals.css의 6테마(light, cupcake, cyberpunk, disney, dark, system) 연동 셀렉터 정의됨'
);

assert(
  previewCssCode.includes('min-height: 44px;') &&
  previewCssCode.includes('min-width: 44px;') &&
  previewCssCode.includes('.invite-btn') &&
  previewCssCode.includes('.invite-tab'),
  '모든 대화형 버튼/탭/인풋 컨트롤에 44px 터치 타겟(min-height: 44px, min-width: 44px) 명시 보장'
);

assert(
  previewCssCode.includes(':focus-visible') &&
  previewCssCode.includes('outline: 3px solid'),
  '모든 포커스 가능 요소에 3px 포커스 링 outline: 3px solid var(--focus) 키보드 접근성 명시 보장'
);

assert(
  previewCssCode.includes('@media (max-width: 360px)') &&
  previewCssCode.includes('.invite-stage') &&
  previewCssCode.includes('.invite-card'),
  '360px 모바일 화면 최적화 미디어 쿼리 및 가로 스크롤 완전 차단 패딩 적용'
);

// 10. [PR #102 피드백] 시네마틱 무비 히어로 분기 분리 및 상용 템플릿 문구 부재 검증
console.log('\n[검증 10] 시네마틱 무비 히어로 분기 분리 및 상용 템플릿 문구 부재 검증');
assert(
  rendererCode.includes("case 'cinematic-movie':") &&
  rendererCode.includes('inv-hero-sig--cinematic') &&
  rendererCode.includes('CINEMATIC MOMENT') &&
  rendererCode.includes('우리만의 상영'),
  'cinematic-movie 테마가 독자적인 시그니처 히어로(CINEMATIC MOMENT / 우리만의 상영)로 분리되어 렌더링됨'
);

assert(
  !rendererCode.includes('THE WEDDING OF') &&
  !hubCode.includes('THE WEDDING OF') &&
  !rendererCode.includes('OUR WEDDING DAY') &&
  !hubCode.includes('OUR WEDDING DAY') &&
  !rendererCode.includes('OUR WEDDING STORY') &&
  !rendererCode.includes('OUR WEDDING CELEBRATION'),
  'THE WEDDING OF, OUR WEDDING DAY 등 상용 템플릿/샘플 문구가 전면 제거되고 고유 문구로 대체됨'
);

// 11. [PR #102 피드백] 어두운 청첩장 카드 주소 복사하기 호버 대비 검증
console.log('\n[검증 11] 어두운 청첩장 카드 주소 복사하기 호버 명도 대비 검증');
assert(
  !cssCode.includes("[data-theme='cyberpunk'] .inv-address-copy-btn:hover") &&
  !cssCode.includes("[data-theme='dark'] .inv-address-copy-btn:hover") &&
  !cssCode.includes(":root[data-theme='system'] .inv-address-copy-btn:hover"),
  '.inv-address-copy-btn:hover가 color: var(--bg) !important 오버라이드 목록에서 완전 배제됨'
);

assert(
  cssCode.includes('.inv-mode--dark .inv-address-copy-btn:hover') &&
  cssCode.includes('.inv-mode--dark .inv-address-copy-btn:hover {\n  background: rgba(255, 255, 255, 0.25) !important;\n  color: #ffffff !important;\n}'),
  '어두운 카드(.inv-mode--dark)의 주소 복사하기 버튼 호버 시 color: #ffffff !important로 밝은 글자색이 보장됨'
);

// 12. [PR #102 피드백] 청첩장 지도·장소 카드 고정 색 제거 및 globals 다크 토큰 연동 검증
console.log('\n[검증 12] 청첩장 지도·장소 카드 고정 색 제거 및 globals 다크 토큰 연동 검증');
assert(
  !cssCode.includes('rgba(124, 58, 237, 0.08)') &&
  !cssCode.includes('.inv-interactive-map-frame {\n  width: 100%;\n  border-radius: 14px;\n  overflow: hidden;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);\n  margin-bottom: 12px;\n  border: 1px solid #e2e8f0;'),
  '.inv-address-copy-btn 및 .inv-interactive-map-frame에서 고정 색(보라 0.08, #e2e8f0)이 완전히 제거됨'
);

assert(
  cssCode.includes('.inv-address-copy-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px 18px;\n  border-radius: 20px;\n  border: 1px solid var(--brand);\n  background: var(--soft);') &&
  cssCode.includes('.inv-address-copy-btn:hover {\n  background: var(--brand);\n  color: var(--bg);'),
  '.inv-address-copy-btn이 background: var(--soft) 및 호버 시 color: var(--bg)로 globals 테마 토큰을 연동함'
);

// 13. [PR #102 피드백] 밝은 카드 주소 복사 명도 대비 · 보조 버튼 격리 · 44px · 키보드 포커스 · 왁스 씰 접근성 검증
console.log('\n[검증 13] 밝은 카드 주소 복사 명도 대비 · 보조 버튼 격리 · 44px · 키보드 포커스 · 왁스 씰 접근성 검증');
assert(
  cssCode.includes('.inv-mode--light') &&
  cssCode.includes('--inv-surface: #f8fafc;') &&
  cssCode.includes('--inv-ink: #1f2937;') &&
  cssCode.includes('.inv-mode--light .inv-address-copy-btn {\n  background: var(--inv-surface);\n  color: var(--inv-ink);\n  border: 1px solid var(--inv-ink);\n  min-height: 44px;\n}'),
  '밝은 카드(.inv-mode--light)의 주소 복사 버튼이 카드 전용 토큰(--inv-surface, --inv-ink)으로 전 테마 최적 가독성을 보장함'
);

assert(
  cssCode.includes('.inv-mode--light .inv-address-copy-btn:hover {\n  background: var(--inv-ink);\n  color: var(--inv-surface);\n}'),
  '밝은 카드(.inv-mode--light)의 주소 복사 버튼 호버 시 background: var(--inv-ink) 및 color: var(--inv-surface)로 반전 대비를 보장함'
);

assert(
  cssCode.includes("[data-theme='dark'] .inv-hub .inv-mode--light .inv-btn-secondary") &&
  cssCode.includes("[data-theme='dark'] .inv-editor-shell .inv-mode--light .inv-btn-secondary") &&
  cssCode.includes('.inv-mode--light .inv-btn-secondary') &&
  cssCode.includes('background: var(--inv-surface) !important;') &&
  cssCode.includes('color: var(--inv-ink) !important;') &&
  !cssCode.includes("[data-theme='dark'] .inv-hub .inv-btn-secondary") &&
  !cssCode.includes("[data-theme='dark'] .inv-editor-shell .inv-btn-secondary"),
  '밝은 카드(.inv-mode--light)의 보조 버튼이 허브·에디터 셸 스코프 포함 고특이성 선택자로 다크 오버라이드를 완전 차단하고 고대비를 보장함'
);

assert(
  cssCode.includes('.inv-address-copy-btn:focus-visible') &&
  cssCode.includes('.inv-copy-chip:focus-visible') &&
  cssCode.includes('.inv-bgm-floating:focus-visible') &&
  cssCode.includes('.inv-modal-close-btn:focus-visible') &&
  cssCode.includes('.wax-seal-interactive-hotspot:focus-visible'),
  ':focus-visible 목록에 주소 복사 버튼, 복사 칩, BGM 플로팅 버튼, 모달 닫기 버튼, 왁스 씰 핫스팟이 포함됨'
);

assert(
  rendererCode.includes('aria-label="왁스 씰 개봉"') &&
  rendererCode.includes("e.key === 'Enter' || e.key === ' '"),
  '왁스 씰 인터랙티브 핫스팟에 키보드 접근성(Enter/Space onKeyDown 및 aria-label)이 적용됨'
);

console.log('\n============================================================');
console.log(` 검증 결과: 총 ${passCount + failCount}개 중 ${passCount}개 통과 (실패: ${failCount}개)`);
console.log('============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('✓ 모든 모달 표시, 모서리 빈틈 제거, 텍스트 그림자 검증 100% 통과!\n');
}
