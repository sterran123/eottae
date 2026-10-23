// 히어로 배경 파티클 — 브랜드 모티프(♡ 하트, ✦ 별, ✉ 편지)가 천천히 떠다닌다.
// 순수 CSS 애니메이션이라 JS 없이 동작하고, prefers-reduced-motion에서 자동 정지한다.
const PARTICLES = [
  { g: '♡', x: '6%',  y: '18%', s: 26, d: '9s',  delay: '0s',   o: 0.5 },
  { g: '✦', x: '14%', y: '68%', s: 18, d: '11s', delay: '-3s',  o: 0.55 },
  { g: '✉', x: '23%', y: '32%', s: 22, d: '10s', delay: '-6s',  o: 0.4 },
  { g: '♡', x: '36%', y: '78%', s: 20, d: '12s', delay: '-2s',  o: 0.45 },
  { g: '✦', x: '47%', y: '12%', s: 15, d: '8s',  delay: '-5s',  o: 0.6 },
  { g: '♡', x: '58%', y: '58%', s: 30, d: '13s', delay: '-8s',  o: 0.35 },
  { g: '✉', x: '67%', y: '24%', s: 24, d: '9.5s',delay: '-1.5s',o: 0.5 },
  { g: '✦', x: '76%', y: '70%', s: 17, d: '10.5s',delay: '-4s', o: 0.55 },
  { g: '♡', x: '85%', y: '40%', s: 22, d: '12s', delay: '-7s',  o: 0.45 },
  { g: '✦', x: '92%', y: '14%', s: 20, d: '9s',  delay: '-2.5s',o: 0.5 },
  { g: '♡', x: '31%', y: '52%', s: 14, d: '8.5s',delay: '-5.5s',o: 0.6 },
  { g: '✉', x: '52%', y: '85%', s: 18, d: '11.5s',delay: '-9s', o: 0.4 },
];

export default function HeroParticles() {
  return (
    <div className="hero-particles" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={
            {
              left: p.x,
              top: p.y,
              fontSize: `${p.s}px`,
              opacity: p.o,
              '--dur': p.d,
              '--del': p.delay,
            } as React.CSSProperties
          }
        >
          {p.g}
        </span>
      ))}
    </div>
  );
}
