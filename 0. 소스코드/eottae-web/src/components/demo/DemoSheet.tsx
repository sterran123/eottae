'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

type Props = {
  open: boolean;
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  /** 결제 시트만. 아래 글자 닫기를 숨기고, 시트 밖 클릭으로도 닫는다. */
  headClose?: boolean;
};

export default function DemoSheet({ open, labelledBy, onClose, children, headClose = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el || !open) return;

    const previous =
      document.activeElement instanceof HTMLElement && !el.contains(document.activeElement)
        ? document.activeElement
        : null;

    if (!el.open) el.showModal();
    if (headClose) el.querySelector<HTMLElement>('.act-modal-close')?.focus();

    return () => {
      if (el.open) el.close();
      if (previous?.isConnected) previous.focus();
    };
  }, [open, headClose]);

  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (!headClose) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (outside || event.target === event.currentTarget) onCloseRef.current();
  }

  const body = (
    <div className="demo-flow-sheet-body">
      {children}
      {!headClose && (
        <div className="demo-flow-sheet-bar">
          <button type="button" className="demo-flow-text-close" onClick={() => onCloseRef.current()}>
            닫기
          </button>
        </div>
      )}
    </div>
  );

  return (
    <dialog
      ref={ref}
      className={headClose ? 'demo-flow-sheet demo-flow-sheet-light' : 'demo-flow-sheet'}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onCloseRef.current();
      }}
      onClick={onDialogClick}
    >
      {headClose ? <div className="demo-flow-sheet-panel">{body}</div> : body}
    </dialog>
  );
}
