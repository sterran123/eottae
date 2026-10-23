import Link from 'next/link';
import SiteNav from './site-nav';

export default function SiteHeader() {
  return (
    <header className="sitebar">
      <div className="sitebar-inner">
        <Link href="/" className="brand" aria-label="어때? 홈">
          <picture>
            <source media="(prefers-color-scheme: dark)" srcSet="/eottae-logo-dark-transparent.png" />
            {/* 다크 로고: BRAND-004 투명·파스텔 변형(tools/make_dark_logo.py로 재생성 가능) */}
            <img
              className="brand-logo"
              src="/eottae-logo-light.png"
              alt="어때?"
              width={104}
              height={58}
            />
          </picture>
          <small>하나의 앱 · 세 가지 순간</small>
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
