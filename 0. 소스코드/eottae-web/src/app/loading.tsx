export default function Loading() {
  return (
    <section className="shell subpage" aria-busy="true" aria-live="polite">
      <span className="eyebrow dark">LOADING</span>
      <h1>불러오는 중…</h1>
      <p className="lead">화면을 준비하고 있습니다.</p>
    </section>
  );
}
