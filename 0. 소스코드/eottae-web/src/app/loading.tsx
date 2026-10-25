import SubpageHero from '@/components/shared/subpage-hero';

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <SubpageHero eyebrow="LOADING" title="불러오는 중…" motif="♡">
        화면을 준비하고 있습니다.
      </SubpageHero>
      <section className="shell subpage">
        {/* 하트 세 개가 차례로 통통 — 모션 감소 설정에선 정지 */}
        <div className="loader-hearts" aria-hidden="true">
          <span>♡</span>
          <span>♡</span>
          <span>♡</span>
        </div>
      </section>
    </div>
  );
}
