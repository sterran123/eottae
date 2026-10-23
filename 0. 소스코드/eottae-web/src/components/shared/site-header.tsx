import Link from 'next/link';
import SiteNav from './site-nav';
import ThemeToggle from './theme-toggle';

export default function SiteHeader() {
  return (
    <header className="sitebar">
      <div className="sitebar-inner">
        <Link href="/" className="brand" aria-label="어때? 홈">
          {/* 수동 테마 토글 지원을 위해 picture 대신 CSS 표시 전환을 쓴다.
              다크 로고: BRAND-004 투명·파스텔 변형(tools/make_dark_logo.py로 재생성 가능) */}
          <img
            className="brand-logo logo-light"
            src="/eottae/eottae-logo-light.png"
            alt="어때?"
            width={104}
            height={58}
          />
          <img
            className="brand-logo logo-dark"
            src="/eottae/eottae-logo-dark-transparent.png"
            alt=""
            aria-hidden="true"
            width={104}
            height={58}
          />
          <small>하나의 앱 · 세 가지 순간</small>
        </Link>
        <SiteNav />
        <div className="header-side">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
