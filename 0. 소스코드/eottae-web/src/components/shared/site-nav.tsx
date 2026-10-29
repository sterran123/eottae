'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MotifIcon, type MotifName } from './motif-icon';

const NAV_ITEMS: { href: string; label: string; motif: MotifName; safety?: boolean }[] = [
  { href: '/match', label: '매칭', motif: 'heart' },
  { href: '/activities', label: '데이트·소모임', motif: 'spark' },
  { href: '/invitations', label: '모바일 청첩장', motif: 'mail' },
  { href: '/safety', label: '안전센터', motif: 'shield', safety: true },
  { href: '/settings', label: '설정', motif: 'gear' },
];

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
            className={item.safety ? 'nav-safety' : undefined}
            aria-current={active ? 'page' : undefined}
          >
            <MotifIcon name={item.motif} size={15} />
            {item.label}
          </Link>
        );
      })}
      <span className="login-slot" title="로그인 기능은 1차 MVP에서 구현 예정입니다">
        <MotifIcon name="lock" size={14} />
        로그인 · 준비 중
      </span>
    </nav>
  );
}
