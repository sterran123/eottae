'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// [data-reveal] 요소가 화면에 들어오면 .is-visible을 붙인다.
// 서버 컴포넌트는 속성만 달면 되고, 관찰자는 이 하나가 전부 처리한다.
// 레이아웃은 페이지 이동 시 리마운트되지 않으므로 pathname을 구독해
// 클라이언트 내비게이션으로 새로 마운트된 요소도 다시 관찰한다.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const show = (el: Element) => el.classList.add('is-visible');

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      els.forEach(show);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
