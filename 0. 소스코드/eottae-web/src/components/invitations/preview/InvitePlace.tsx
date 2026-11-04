'use client';

import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Invitation } from '@/lib/invitations/types';
import { copyInviteText } from './invite-clipboard';
import InviteStatus from './InviteStatus';
import type { InvitePreviewContent } from './sample-content';

type VenueProps = {
  invitation: Invitation;
  venue: InvitePreviewContent['venue'];
};

export function InviteVenue({ invitation, venue }: VenueProps) {
  const titleId = useId();
  const [status, setStatus] = useState<string | null>(null);
  const place = invitation.venueLabel.trim() || '장소 이름';

  async function copyAddress() {
    const text = `${place} ${venue.address}`.trim();
    const ok = await copyInviteText(text);
    setStatus(ok ? '주소를 복사했어요.' : `복사하지 못했어요. ${text}`);
  }

  return (
    <section className="invite-section invite-place" aria-labelledby={titleId} data-invite-reveal>
      <h2 id={titleId} className="invite-h">
        오시는 길
      </h2>
      <p className="invite-place-name">{place}</p>
      <p className="invite-address">{venue.address}</p>
      <div className="invite-stack">
        <button type="button" className="invite-btn" onClick={() => void copyAddress()}>
          주소 복사하기
        </button>
      </div>
      <img className="invite-map" src={venue.map.src} alt={venue.map.alt} width={800} height={520} loading="lazy" decoding="async" />
      <div className="invite-stack">
        <button
          type="button"
          className="invite-btn"
          onClick={() => setStatus('지도 앱은 열리지 않아요. 주소와 오시는 길을 봐 주세요. (데모)')}
        >
          지도 앱에서 보기
        </button>
      </div>
      {invitation.notice?.trim() ? <p className="invite-note">{invitation.notice}</p> : null}
      <dl className="invite-directions">
        <div>
          <dt>지하철</dt>
          <dd>{venue.subway}</dd>
        </div>
        <div>
          <dt>버스</dt>
          <dd>{venue.bus}</dd>
        </div>
        <div>
          <dt>주차</dt>
          <dd>{venue.parking}</dd>
        </div>
      </dl>
      <InviteStatus text={status} />
    </section>
  );
}

export function InviteGuide({ guides }: { guides: InvitePreviewContent['guides'] }) {
  const titleId = useId();
  const [selected, setSelected] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = guides[selected] ?? guides[0];

  function move(next: number) {
    const last = guides.length - 1;
    const index = next < 0 ? last : next > last ? 0 : next;
    setSelected(index);
    tabs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') move(selected + 1);
    else if (event.key === 'ArrowLeft') move(selected - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(guides.length - 1);
    else return;
    event.preventDefault();
  }

  if (!current) {
    return (
      <section className="invite-section" aria-labelledby={titleId} data-invite-reveal>
        <h2 id={titleId} className="invite-h">
          안내사항
        </h2>
        <p>아직 안내가 없어요.</p>
      </section>
    );
  }

  const panelId = `${titleId}-panel`;

  return (
    <section className="invite-section" aria-labelledby={titleId} data-invite-reveal>
      <h2 id={titleId} className="invite-h">
        안내사항
      </h2>
      <div role="tablist" aria-labelledby={titleId} className="invite-tablist" onKeyDown={onKeyDown}>
        {guides.map((guide, index) => (
          <button
            key={guide.id}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${titleId}-tab-${guide.id}`}
            className="invite-tab"
            aria-selected={index === selected}
            aria-controls={panelId}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => setSelected(index)}
          >
            {guide.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={panelId}
        className="invite-tabpanel"
        aria-labelledby={`${titleId}-tab-${current.id}`}
        tabIndex={0}
      >
        {current.body}
      </div>
    </section>
  );
}
