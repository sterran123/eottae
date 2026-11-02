import type { Metadata } from 'next';
import DemoProfileScreen from '@/components/demo/DemoProfileScreen';

export const metadata: Metadata = {
  title: '내 프로필',
  description: '데모 로그인 상태에서만 여는 내 프로필 (DEMO)',
};

export default function ProfilePage() {
  return (
    <section className="shell subpage">
      <DemoProfileScreen />
    </section>
  );
}
