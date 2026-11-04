import type { InvitationThemeId } from '@/lib/invitations/types';
import type { ReactNode } from 'react';
import './invite-preview.css';

type Props = {
  themeId: InvitationThemeId;
  children: ReactNode;
};

export default function InvitePhoneFrame({ themeId, children }: Props) {
  return (
    <div className="invite-stage">
      <div className="invite-card" data-invite-theme={themeId}>
        <div className="invite-frame">{children}</div>
      </div>
    </div>
  );
}
