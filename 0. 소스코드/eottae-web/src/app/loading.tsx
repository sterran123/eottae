import SubpageHero from '@/components/shared/subpage-hero';
import { MotifIcon } from '@/components/shared/motif-icon';

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <SubpageHero eyebrow="LOADING" title="불러오는 중…" motif={<MotifIcon name="heart" size={56} />}>
        화면을 준비하고 있습니다.
      </SubpageHero>
      <section className="shell subpage">
        {/* 하트 세 개가 차례로 통통 + 카드 자리 스켈레톤 — 모션 감소 설정에선 정지 */}
        <div className="loader-hearts" aria-hidden="true">
          <span>♡</span>
          <span>♡</span>
          <span>♡</span>
        </div>
        <div className="skeleton-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div className="skeleton-card" key={i}>
              <span className="skeleton sk-chip" />
              <span className="skeleton sk-title" />
              <span className="skeleton sk-line" />
              <span className="skeleton sk-line short" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
