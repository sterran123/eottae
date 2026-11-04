import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '모바일 청첩장',
  description: '모바일 청첩장 하객 열람 화면 (검색엔진 미노출)',
  robots: {
    index: false,
    follow: false,
  },
};

export default function GuestInvitationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

