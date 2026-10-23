import Link from 'next/link';
import SiteNav from './site-nav';

export default function SiteHeader() {
  return (
    <header className="sitebar">
      <div className="sitebar-inner">
        <Link href="/" className="brand" aria-label="어때? 홈">
          <picture>
            <source media="(prefers-color-scheme: dark)" srcSet="/eottae-logo-dark.png" />
            {/* 원본 로고 1678x937 — 비율 유지, 다크 로고는 검정 불투명 배경(BRAND-004 미완) */}
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
