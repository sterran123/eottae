import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="shell subpage">
      <span className="eyebrow dark">404</span>
      <h1>페이지를 찾을 수 없어요</h1>
      <p className="lead">
        주소가 바뀌었거나 아직 만들어지지 않은 페이지입니다. 통합 홈에서 세 가지 서비스로 이동할
        수 있습니다.
      </p>
      <Link className="btn outline" href="/">
        ← 통합 홈으로
      </Link>
    </section>
  );
}
