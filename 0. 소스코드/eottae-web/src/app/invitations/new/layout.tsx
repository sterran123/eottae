import type { Metadata } from 'next';

// new/page.tsx는 'use client'라 metadata를 둘 수 없어, 브라우저 탭 제목을 여기서 준다 (#117)
export const metadata: Metadata = {
  title: '새 청첩장 만들기',
  description: '모바일 청첩장 만들기 화면 (데모 데이터로 동작하는 3차 미리보기)',
};

export default function NewInvitationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
