'use client';

import { useEffect, useId, useMemo, useRef } from 'react';
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

export default function InvitePreview({ invitation, preset = 'full', content }: Props) {
  const emptyId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const extra = useMemo(() => content ?? previewContentFor(invitation), [content, invitation]);
  const bare =
    invitation.hostNames.trim().length === 0 &&
    invitation.greeting.trim().length === 0 &&
    invitation.weddingDate.trim().length === 0 &&
    invitation.venueLabel.trim().length === 0;

  useEffect(() => {
    const root = sheetRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    nodes.forEach((node) => {
      if (!node.classList.contains('is-visible')) io.observe(node);
    });
    return () => io.disconnect();
  }, [preset, invitation.id, invitation.themeId, bare]);

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
          <section className="invite-section" aria-labelledby={emptyId} data-reveal>
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
