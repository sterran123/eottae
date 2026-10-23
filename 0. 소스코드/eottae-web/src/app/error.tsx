'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="shell subpage">
      <span className="eyebrow dark">ERROR</span>
      <h1>화면을 불러오지 못했어요</h1>
      <p className="lead">
        일시적인 문제가 발생했습니다. 다시 시도하거나 통합 홈으로 돌아가 주세요.
      </p>
      <div className="actions">
        <button className="btn primary" onClick={reset} type="button">
          다시 시도
        </button>
        <a className="btn outline" href="/">
          ← 통합 홈으로
        </a>
      </div>
    </section>
  );
}
