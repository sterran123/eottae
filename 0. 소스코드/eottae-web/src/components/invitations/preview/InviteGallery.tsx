'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { InvitePhoto } from './sample-content';

type Props = {
  title: string;
  galleryKey: string;
  photos: InvitePhoto[];
};

export default function InviteGallery({ title, galleryKey, photos }: Props) {
  const titleId = useId();
  const hintId = useId();
  const labelId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    setOpenIndex(null);
  }, [galleryKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openIndex === null) {
      if (dialog.open) dialog.close();
      return;
    }
    const wasClosed = !dialog.open;
    if (wasClosed) dialog.showModal();
    if (wasClosed) dialog.querySelector<HTMLButtonElement>('.invite-lightbox-close')?.focus();
  }, [openIndex]);

  function step(delta: number) {
    setOpenIndex((current) => {
      if (current === null) return current;
      const next = current + delta;
      if (next < 0 || next >= photos.length) return current;
      return next;
    });
  }

  function onFilmKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.invite-photo'));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    let next = index;
    if (event.key === 'ArrowRight') next = Math.min(buttons.length - 1, index + 1);
    else if (event.key === 'ArrowLeft') next = Math.max(0, index - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next]?.focus();
    buttons[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    }
  }

  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  const current = openIndex === null ? null : photos[openIndex];

  return (
    <section className="invite-section" aria-labelledby={titleId} aria-describedby={hintId} data-reveal>
      <h2 id={titleId} className="invite-h">
        {title}
      </h2>
      {photos.length === 0 ? (
        <p className="invite-hint">아직 올린 사진이 없어요.</p>
      ) : (
        <div onKeyDown={onFilmKeyDown}>
          <ul className="invite-film">
            {photos.map((photo, index) => (
              <li key={photo.src}>
                <button
                  type="button"
                  className="invite-photo"
                  aria-label={`${photo.alt} 크게 보기`}
                  onClick={() => setOpenIndex(index)}
                >
                  <img src={photo.src} alt="" width={800} height={1000} loading="lazy" decoding="async" />
                </button>
              </li>
            ))}
          </ul>
          <p id={hintId} className="invite-hint">
            밀어서 사진 넘기기. 좌우 화살표로도 옮겨요.
          </p>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className="invite-lightbox"
        aria-labelledby={labelId}
        onClose={() => setOpenIndex(null)}
        onKeyDown={onDialogKeyDown}
        onClick={onDialogClick}
      >
        <button type="button" className="invite-lightbox-close" aria-label="닫기" title="닫기" onClick={() => dialogRef.current?.close()}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {current ? <img src={current.src} alt="" width={800} height={1000} /> : null}
        <p id={labelId} className="invite-lightbox-caption">
          {current && openIndex !== null
            ? `${current.alt}. 사진 ${openIndex + 1} / ${photos.length}`
            : '사진 크게 보기'}
        </p>
        <div className="invite-row">
          <button type="button" className="invite-btn" onClick={() => step(-1)} disabled={openIndex === null || openIndex <= 0}>
            이전 사진
          </button>
          <button
            type="button"
            className="invite-btn"
            onClick={() => step(1)}
            disabled={openIndex === null || openIndex >= photos.length - 1}
          >
            다음 사진
          </button>
        </div>
      </dialog>
    </section>
  );
}
