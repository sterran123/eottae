'use client';

import { useId } from 'react';
import type { InviteOrderIcon, InvitePreviewContent } from './sample-content';

export function InviteStory({ story }: { story: InvitePreviewContent['story'] }) {
  const titleId = useId();
  return (
    <section className="invite-section" aria-labelledby={titleId} data-reveal>
      <h2 id={titleId} className="invite-h">
        우리의 이야기
      </h2>
      {story.length === 0 ? (
        <p>아직 적힌 이야기가 없어요.</p>
      ) : (
        <ol className="invite-story">
          {story.map((item) => (
            <li className="invite-story-item" key={`${item.when}-${item.title}`}>
              <div className="invite-story-photo">
                <img src={item.photo.src} alt={item.photo.alt} width={800} height={1000} loading="lazy" decoding="async" />
              </div>
              <div className="invite-story-copy">
                <p className="invite-when">{item.when}</p>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function InviteFaq({ faq }: { faq: InvitePreviewContent['faq'] }) {
  const titleId = useId();
  return (
    <section className="invite-section" aria-labelledby={titleId} data-reveal>
      <h2 id={titleId} className="invite-h">
        질문과 답
      </h2>
      <div className="invite-faq">
        {faq.map((item) => (
          <details key={item.question}>
            <summary>
              <span>{item.question}</span>
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function OrderIcon({ name }: { name: InviteOrderIcon }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true as const,
    focusable: false as const,
  };
  if (name === 'enter') {
    return (
      <svg {...common}>
        <path d="M5 20V5h9v15" stroke="currentColor" strokeWidth="1.7" />
        <path d="M14 12h5M17 9.5 19.5 12 17 14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'rite') {
    return (
      <svg {...common}>
        <circle cx="9" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="15" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === 'photo') {
    return (
      <svg {...common}>
        <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M5 10h14v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-3z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function InviteOrder({ order }: { order: InvitePreviewContent['order'] }) {
  const titleId = useId();
  return (
    <section className="invite-section" aria-labelledby={titleId} data-reveal>
      <h2 id={titleId} className="invite-h">
        예식 순서
      </h2>
      <ol className="invite-order">
        {order.map((item) => (
          <li key={item.title}>
            <span className="invite-order-icon">
              <OrderIcon name={item.icon} />
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
