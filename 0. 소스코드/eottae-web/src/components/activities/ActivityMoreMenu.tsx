'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type MoreMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
};

type Props = {
  items: readonly MoreMenuItem[];
};

export default function ActivityMoreMenu({ items }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusIndex = useRef(0);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const index = Math.min(Math.max(focusIndex.current, 0), items.length - 1);
    itemRefs.current[index]?.focus();
    const onPointer = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, items.length]);

  const openAt = (index: number) => {
    focusIndex.current = index;
    setOpen(true);
  };

  const closeToButton = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onButtonKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openAt(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(items.length - 1);
    }
  };

  const onItemKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeToButton();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      itemRefs.current[index === last ? 0 : index + 1]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      itemRefs.current[index === 0 ? last : index - 1]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      itemRefs.current[last]?.focus();
    }
  };

  return (
    <div className="act-more" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="act-more-btn"
        aria-label="더보기"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          if (open) setOpen(false);
          else openAt(0);
        }}
        onKeyDown={onButtonKey}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="4.2" r="1.6" fill="currentColor" />
          <circle cx="10" cy="10" r="1.6" fill="currentColor" />
          <circle cx="10" cy="15.8" r="1.6" fill="currentColor" />
        </svg>
      </button>
      {open && items.length > 0 && (
        <div id={menuId} className="act-menu" role="menu" aria-label="더보기">
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              className="act-menu-item"
              onKeyDown={(event) => onItemKey(event, index)}
              onClick={() => {
                closeToButton();
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
