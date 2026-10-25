import Link from 'next/link';
import SubpageHero from '@/components/shared/subpage-hero';

export default function NotFound() {
  return (
    <>
      <SubpageHero eyebrow="404" title="페이지를 찾을 수 없어요" motif="?">
        주소가 바뀌었거나 아직 만들어지지 않은 페이지입니다. 통합 홈에서 세 가지 서비스로 이동할
        수 있습니다.
      </SubpageHero>
      <section className="shell subpage">
        <Link className="btn outline" href="/">
          ← 통합 홈으로
        </Link>
      </section>
    </>
  );
}
