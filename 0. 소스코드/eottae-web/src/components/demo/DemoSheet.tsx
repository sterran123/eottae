'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
};

export default function DemoSheet({ open, labelledBy, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="demo-flow-sheet"
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="demo-flow-sheet-body">
        {children}
        <div className="demo-flow-sheet-bar">
          <button type="button" className="demo-flow-icon-btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </dialog>
  );
}
