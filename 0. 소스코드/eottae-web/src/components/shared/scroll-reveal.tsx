'use client';

import { useEffect } from 'react';

// [data-reveal] 요소가 화면에 들어오면 .is-visible을 붙인다.
// 서버 컴포넌트는 속성만 달면 되고, 관찰자는 이 하나가 전부 처리한다.
export default function ScrollReveal() {
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
  }, []);

  return null;
}
