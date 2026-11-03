'use client';

import { useEffect, useRef } from 'react';
import ModalCloseButton from '@/components/activities/ModalCloseButton';

type Props = {
  titleId: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  backdropClassName?: string;
};

const FOCUSABLE =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)';

export default function DemoDialog({ titleId, title, onClose, children, panelClassName, backdropClassName }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const root = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = () => Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    items()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);

  return (
    <div
      className={backdropClassName ? `act-modal-backdrop ${backdropClassName}` : 'act-modal-backdrop'}
      onMouseDown={() => onCloseRef.current()}
    >
      <div
        ref={ref}
        className={panelClassName ? `act-modal ${panelClassName}` : 'act-modal'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="act-modal-head">
          <h2 id={titleId}>{title}</h2>
          <ModalCloseButton onClick={() => onCloseRef.current()} />
        </div>
        {children}
      </div>
    </div>
  );
}
