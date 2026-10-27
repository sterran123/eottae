import type { Metadata } from 'next';
import Link from 'next/link';
import SubpageHero from '@/components/shared/subpage-hero';
import { MotifIcon } from '@/components/shared/motif-icon';

export const metadata: Metadata = {
  title: '오프라인',
  description: '네트워크 연결이 끊긴 상태에서 표시되는 안내 페이지',
};

export default function OfflinePage() {
  return (
    <>
      <SubpageHero eyebrow="OFFLINE" title="지금은 오프라인이에요" motif={<MotifIcon name="mail" size={56} />}>
        네트워크 연결을 확인한 뒤 다시 시도해 주세요. 이전에 열어둔 화면은 캐시된 상태로 계속 볼 수
        있습니다.
      </SubpageHero>
      <section className="shell subpage">
        <Link className="btn outline" href="/">
          ← 통합 홈으로
        </Link>
      </section>
    </>
  );
}
