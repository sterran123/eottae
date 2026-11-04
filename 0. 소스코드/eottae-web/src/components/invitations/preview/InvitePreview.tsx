'use client';

import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import type { Invitation } from '@/lib/invitations/types';
import InviteCalendar from './InviteCalendar';
import { InviteGift, InviteGuestbook, InviteRsvp, InviteShare } from './InviteClosing';
import { InviteCover, InviteGreeting } from './InviteCover';
import InviteGallery from './InviteGallery';
import { InviteFaq, InviteOrder, InviteStory } from './InviteNarrative';
import InvitePhoneFrame from './InvitePhoneFrame';
import { InviteGuide, InviteVenue } from './InvitePlace';
import { galleryTitle, sectionsFor, type InvitePresetId, type InviteSectionSpec } from './presets';
import { INVITE_PREVIEW_MESSAGES, previewContentFor, type InvitePreviewContent } from './sample-content';

const STATUS_LABEL: Record<Invitation['status'], string> = {
  draft: '초안',
  published: '공개',
  expired: '만료',
  revoked: '폐기',
};

type Props = {
  invitation: Invitation;
  preset?: InvitePresetId;
  content?: InvitePreviewContent;
};

function sectionKey(spec: InviteSectionSpec): string {
  if (spec.kind === 'gallery') return `gallery-${spec.key}`;
  return spec.kind;
}

function frameScrollRoot(sheet: HTMLElement): HTMLElement | null {
  const frame = sheet.closest('.invite-frame');
  let current: HTMLElement | null = sheet;
  while (current) {
    const overflowY = getComputedStyle(current).overflowY;
    const scrolls =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      current.scrollHeight > current.clientHeight + 1;
    if (scrolls) return current;
    if (frame && current === frame) break;
    current = current.parentElement;
  }
  return null;
}

function inView(node: HTMLElement, scrollRoot: HTMLElement | null): boolean {
  const rect = node.getBoundingClientRect();
  const box = scrollRoot
    ? scrollRoot.getBoundingClientRect()
    : { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };
  return rect.bottom > box.top && rect.top < box.bottom && rect.right > box.left && rect.left < box.right;
}

export default function InvitePreview({ invitation, preset = 'full', content }: Props) {
  const emptyId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const extra = useMemo(() => content ?? previewContentFor(invitation), [content, invitation]);
  const bare =
    invitation.hostNames.trim().length === 0 &&
    invitation.greeting.trim().length === 0 &&
    invitation.weddingDate.trim().length === 0 &&
    invitation.venueLabel.trim().length === 0;

  // 프리셋·테마로 섹션이 다시 그려져도 다시 묶는다. 의존성 배열과 MutationObserver는 쓰지 않는다.
  useLayoutEffect(() => {
    const root = sheetRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-invite-reveal]'));
    const show = (node: HTMLElement) => node.classList.add('is-visible');

    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach(show);
      root.removeAttribute('data-reveal-ready');
      return;
    }

    const scrollRoot = frameScrollRoot(root);
    nodes.forEach((node) => {
      if (inView(node, scrollRoot)) show(node);
    });
    root.setAttribute('data-reveal-ready', '');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { root: scrollRoot, threshold: 0 },
    );
    nodes.forEach((node) => {
      if (!node.classList.contains('is-visible')) io.observe(node);
    });

    const timer = window.setTimeout(() => {
      root.querySelectorAll<HTMLElement>('[data-invite-reveal]').forEach((node) => {
        if (!node.classList.contains('is-visible')) show(node);
      });
      io.disconnect();
    }, 1500);

    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      root.removeAttribute('data-reveal-ready');
    };
  });

  const sections = sectionsFor(preset).map((spec) => {
    const key = sectionKey(spec);
    switch (spec.kind) {
      case 'cover':
        return <InviteCover key={key} invitation={invitation} content={extra} />;
      case 'greeting':
        return <InviteGreeting key={key} invitation={invitation} content={extra} />;
      case 'gallery':
        return (
          <InviteGallery
            key={key}
            galleryKey={spec.key}
            title={galleryTitle(spec.key)}
            photos={extra.gallery.slice(spec.start, spec.end)}
          />
        );
      case 'calendar':
        return <InviteCalendar key={key} invitation={invitation} />;
      case 'story':
        return <InviteStory key={key} story={extra.story} />;
      case 'faq':
        return <InviteFaq key={key} faq={extra.faq} />;
      case 'order':
        return <InviteOrder key={key} order={extra.order} />;
      case 'venue':
        return <InviteVenue key={key} invitation={invitation} venue={extra.venue} />;
      case 'guide':
        return <InviteGuide key={key} guides={extra.guides} />;
      case 'rsvp':
        return <InviteRsvp key={key} />;
      case 'gift':
        return <InviteGift key={key} accounts={extra.accounts} />;
      case 'guestbook':
        return <InviteGuestbook key={key} seed={extra.guestbook} />;
      case 'share':
        return <InviteShare key={key} invitation={invitation} />;
      default:
        return null;
    }
  });

  return (
    <InvitePhoneFrame themeId={invitation.themeId}>
      {invitation.status !== 'published' ? (
        <p className="invite-banner" role="note">
          이 예시는 공개 상태가 아니에요. {STATUS_LABEL[invitation.status]}
        </p>
      ) : null}
      <div className="invite-sheet" ref={sheetRef}>
        {bare ? (
          <section className="invite-section" aria-labelledby={emptyId} data-invite-reveal>
            <h2 id={emptyId} className="invite-h">
              초대장
            </h2>
            <p>{INVITE_PREVIEW_MESSAGES.empty}</p>
          </section>
        ) : (
          sections
        )}
      </div>
    </InvitePhoneFrame>
  );
}

export type { InvitePresetId } from './presets';
