import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '하객 참석 회신 (RSVP)',
  description: '초대받은 하객 전용 참석 회신 화면 (3차 목업)',
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvitationRsvpLayout({ children }: { children: ReactNode }) {
  return children;
}

