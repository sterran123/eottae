import type { Metadata } from 'next';
import InviteSampleStudio from '@/components/invitations/preview/InviteSampleStudio';

export const metadata: Metadata = {
  title: '청첩장 샘플 미리보기',
  description: '데모 · 예시 데이터로 보는 모바일 청첩장 미리보기',
};

export default function InvitationSamplePage() {
  return <InviteSampleStudio />;
}
