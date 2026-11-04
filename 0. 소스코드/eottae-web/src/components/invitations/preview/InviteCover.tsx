'use client';

import { useId } from 'react';
import type { Invitation } from '@/lib/invitations/types';
import { coupleFromHost, formatWeddingLine } from './invite-format';
import type { InvitePreviewContent } from './sample-content';

type CoverProps = {
  invitation: Invitation;
  content: InvitePreviewContent;
};

export function InviteCover({ invitation, content }: CoverProps) {
  const titleId = useId();
  const couple = coupleFromHost(invitation.hostNames);
  const line = formatWeddingLine(invitation.weddingDate, invitation.venueLabel);

  return (
    <section className="invite-section invite-cover" aria-labelledby={titleId} data-reveal>
      <img
        className="invite-cover-photo"
        src={content.cover.src}
        alt={content.cover.alt}
        width={900}
        height={1200}
        loading="eager"
        decoding="async"
      />
      <div className="invite-cover-copy">
        <p className="invite-kicker">{content.kicker}</p>
        <h2 id={titleId} className="invite-names">
          {couple.groom ? <span>{couple.groom}</span> : null}
          {couple.groom && couple.bride ? <span className="invite-names-join">그리고</span> : null}
          {couple.bride ? <span>{couple.bride}</span> : null}
          {!couple.groom && !couple.bride ? <span>이름을 적어 주세요.</span> : null}
        </h2>
        <p className="invite-dateline">{line ?? '날짜와 장소를 적어 주세요.'}</p>
      </div>
    </section>
  );
}

type GreetingProps = {
  invitation: Invitation;
  content: InvitePreviewContent;
};

export function InviteGreeting({ invitation, content }: GreetingProps) {
  const titleId = useId();
  const couple = coupleFromHost(invitation.hostNames);
  const parents = content.parents;

  return (
    <section className="invite-section" aria-labelledby={titleId} data-reveal>
      <h2 id={titleId} className="invite-h">
        인사말
      </h2>
      <p className="invite-greeting">
        {invitation.greeting.trim() ? invitation.greeting : '인사말이 아직 없어요.'}
      </p>
      <hr className="invite-rule" />
      {parents && (couple.groom || couple.bride) ? (
        <div className="invite-parents">
          {couple.groom ? (
            <p>
              {parents.groomLine} {couple.groom}
            </p>
          ) : null}
          {couple.bride ? (
            <p>
              {parents.brideLine} {couple.bride}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="invite-parents">{couple.line || '이름을 적어 주세요.'}</p>
      )}
    </section>
  );
}
