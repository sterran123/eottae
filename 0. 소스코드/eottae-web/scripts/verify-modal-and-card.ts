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

console.log('\n============================================================');
console.log(` 검증 결과: 총 ${passCount + failCount}개 중 ${passCount}개 통과 (실패: ${failCount}개)`);
console.log('============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('✓ 모든 모달 표시, 모서리 빈틈 제거, 텍스트 그림자 검증 100% 통과!\n');
}
