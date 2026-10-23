'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/match', label: '① 매칭' },
  { href: '/activities', label: '② 데이트·소모임' },
  { href: '/invitations', label: '③ 모바일 청첩장' },
  { href: '/safety', label: '안전센터', safety: true },
] as const;

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="서비스 메뉴" className="nav">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            href={item.href}
            key={item.href}
            className={'safety' in item && item.safety ? 'nav-safety' : undefined}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      <span className="login-slot" title="로그인 기능은 1차 MVP에서 구현 예정입니다">
        로그인 (준비 중)
      </span>
    </nav>
  );
}
