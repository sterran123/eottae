'use client';

// ============================================================
//  저장 경로: src/components/safety/SafetyDialog.tsx
//  담당: 손준혁 · MATCH-008
//  역할: 신고·차단 모달 공통 껍데기. 네이티브 <dialog> + showModal() 사용.
//        포커스 가두기·Esc 닫기·배경 비활성은 브라우저가 처리하므로
//        role/aria-modal/수동 focus trap을 넣지 않는다.
//  [주의] CSS에서 dialog에 display를 무조건 지정하면 닫힌 상태가 깨진다 → [open]에만 지정.
// ============================================================

import { useEffect, useRef, type ReactNode } from 'react';

interface SafetyDialogProps {
  open: boolean;
  /** Esc·닫기 버튼·form method=dialog 등 어떤 경로로든 닫힐 때 호출 */
  onClose: () => void;
  titleId: string;
  children: ReactNode;
}

export default function SafetyDialog({ open, onClose, titleId, children }: SafetyDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // open prop ↔ 네이티브 dialog 상태 동기화
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="mt-safety-dialog" aria-labelledby={titleId} onClose={onClose}>
      {children}
    </dialog>
  );
}
