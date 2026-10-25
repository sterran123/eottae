'use client';

import Link from 'next/link';
import SubpageHero from '@/components/shared/subpage-hero';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <SubpageHero eyebrow="ERROR" title="화면을 불러오지 못했어요" motif="!">
        일시적인 문제가 발생했습니다. 다시 시도하거나 통합 홈으로 돌아가 주세요.
      </SubpageHero>
      <section className="shell subpage">
        <div className="actions">
          <button className="btn primary" onClick={reset} type="button">
            다시 시도
          </button>
          <Link className="btn outline" href="/">
            ← 통합 홈으로
          </Link>
        </div>
      </section>
    </>
  );
}
