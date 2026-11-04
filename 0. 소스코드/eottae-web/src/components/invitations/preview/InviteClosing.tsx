'use client';

import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Invitation } from '@/lib/invitations/types';
import { invitationPublicUrl } from './invite-asset';
import { copyInviteText } from './invite-clipboard';
import InviteStatus from './InviteStatus';
import type { InvitePreviewContent } from './sample-content';

export function InviteRsvp({ invitation }: { invitation?: Invitation }) {
  const titleId = useId();
  const router = useRouter();
  const token = invitation?.sharingToken?.trim() || 'k7Qm2pL9xRt4vNw8aB3cYd6e';
  const guestHref = `/invitations/rsvp/?t=${encodeURIComponent(token)}&g=gt-x8k2m9p1`;
  const deniedHref = `/invitations/rsvp/?t=${encodeURIComponent(token)}`;

  return (
    <section className="invite-section" aria-labelledby={titleId} data-invite-reveal>
      <h2 id={titleId} className="invite-h">
        참석 여부
      </h2>
      <p>참석을 미리 알려 주시면 자리를 준비하는 데 도움이 돼요.</p>
      <p className="invite-note">
        공개 화면에는 참석 명단과 다른 하객의 회신을 표시하지 않아요. 하객 전용 초대 링크에서만 회신할 수 있어요.
      </p>
      <div className="invite-row">
        <button type="button" className="invite-btn" onClick={() => router.push(deniedHref)}>
          토큰 없는 링크 확인
        </button>
        <button type="button" className="invite-btn primary" onClick={() => router.push(guestHref)}>
          하객 초대 링크로 회신
        </button>
      </div>
    </section>
  );
}

export function InviteGift({ accounts }: { accounts: InvitePreviewContent['accounts'] }) {
  const titleId = useId();
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string | null>(null);

  async function copyAccount(account: InvitePreviewContent['accounts'][number]) {
    const text = `${account.bank} ${account.masked} 예금주 ${account.holder} (가상)`;
    const ok = await copyInviteText(text);
    setStatus(ok ? '가상 계좌를 복사했어요. 예시은행 번호라 이체되지 않아요.' : `복사하지 못했어요. ${text}`);
  }

  return (
    <section className="invite-section" aria-labelledby={titleId} data-invite-reveal>
      <h2 id={titleId} className="invite-h">
        마음 전하기
      </h2>
      <div className="invite-stack">
        {accounts.map((account) => {
          const open = Boolean(openIds[account.id]);
          const panelId = `${titleId}-${account.id}`;
          return (
            <div key={account.id}>
              <button
                type="button"
                className="invite-btn"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIds((current) => ({ ...current, [account.id]: !current[account.id] }))}
              >
                {account.sideLabel} 마음 전하실 곳
              </button>
              <div id={panelId} className="invite-account" hidden={!open}>
                <p>{account.bank}</p>
                <p className="invite-account-no">{account.masked}</p>
                <p>예금주 {account.holder} (가상)</p>
                <button type="button" className="invite-btn" onClick={() => void copyAccount(account)}>
                  계좌 복사
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <InviteStatus text={status} />
    </section>
  );
}

export function InviteGuestbook({ seed }: { seed: InvitePreviewContent['guestbook'] }) {
  const titleId = useId();
  const nickId = useId();
  const bodyId = useId();
  const errorId = useId();
  const [posts, setPosts] = useState(seed);
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nickname.trim();
    const body = message.trim();
    if (!name || !body) {
      setError('닉네임과 메시지를 적어 주세요.');
      return;
    }
    setPosts((current) => [{ id: `local-${Date.now()}`, nickname: name, message: body }, ...current].slice(0, 20));
    setNickname('');
    setMessage('');
    setError(null);
  }

  return (
    <section className="invite-section" aria-labelledby={titleId} data-invite-reveal>
      <h2 id={titleId} className="invite-h">
        방명록
      </h2>
      <p className="invite-note">이 브라우저 데모 · 이 화면에만 남아요. 서버로는 보내지 않아요.</p>
      <form className="invite-form" onSubmit={onSubmit}>
        <label htmlFor={nickId}>닉네임</label>
        <input
          id={nickId}
          className="invite-field"
          value={nickname}
          maxLength={20}
          autoComplete="nickname"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setNickname(event.target.value)}
        />
        <label htmlFor={bodyId}>메시지</label>
        <textarea
          id={bodyId}
          className="invite-field invite-area"
          value={message}
          maxLength={200}
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setMessage(event.target.value)}
        />
        {error ? (
          <p id={errorId} className="invite-alert" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="invite-btn primary">
          방명록 남기기
        </button>
      </form>
      <ul className="invite-notes">
        {posts.map((post) => (
          <li className="invite-note-card" key={post.id}>
            <strong>{post.nickname}</strong>
            <p>{post.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InviteShare({ invitation }: { invitation: Invitation }) {
  const titleId = useId();
  const [status, setStatus] = useState<string | null>(null);

  async function copyLink() {
    if (!invitation.sharingToken.trim()) {
      setStatus('공유 링크를 만들 초대 토큰이 없어요.');
      return;
    }
    const url = invitationPublicUrl(invitation.sharingToken);
    const ok = await copyInviteText(url);
    setStatus(ok ? `링크를 복사했어요. ${url}` : `복사하지 못했어요. ${url}`);
  }

  return (
    <section className="invite-section" aria-labelledby={titleId} data-invite-reveal>
      <h2 id={titleId} className="invite-h">
        공유
      </h2>
      {invitation.contactNote?.trim() ? <p className="invite-note">{invitation.contactNote}</p> : null}
      <div className="invite-stack">
        <button type="button" className="invite-btn primary" onClick={() => void copyLink()}>
          링크 복사
        </button>
        <button
          type="button"
          className="invite-btn"
          onClick={() => setStatus('카카오톡 공유는 이 데모에서 열리지 않아요. 링크 복사를 써 주세요.')}
        >
          카카오톡 공유
        </button>
      </div>
      <InviteStatus text={status} />
    </section>
  );
}
