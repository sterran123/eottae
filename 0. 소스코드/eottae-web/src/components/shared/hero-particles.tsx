// 히어로 배경 파티클 — 브랜드 모티프(♡ 하트, ✦ 별, ✉ 편지)가 천천히 떠다닌다.
// 순수 CSS 애니메이션이라 JS 없이 동작하고, prefers-reduced-motion에서 자동 정지한다.
// 앞 6개는 모바일에서도 남는 것 — 본문 글자와 겹치지 않게 가장자리(위·아래 띠, 오른쪽 끝)에만 둔다.
// 나머지는 데스크톱 전용으로 텍스트 열(왼쪽 ~48%)을 피해 캐릭터 주변에 흩뿌린다.
const PARTICLES = [
  { g: '♡', x: '4%',  y: '6%',  s: 22, d: '9s',  delay: '0s',   o: 0.5 },
  { g: '✦', x: '30%', y: '4%',  s: 15, d: '11s', delay: '-3s',  o: 0.55 },
  { g: '✉', x: '90%', y: '44%', s: 20, d: '10s', delay: '-6s',  o: 0.4 },
  { g: '♡', x: '93%', y: '76%', s: 18, d: '12s', delay: '-2s',  o: 0.45 },
  { g: '✦', x: '62%', y: '91%', s: 15, d: '8s',  delay: '-5s',  o: 0.6 },
  { g: '♡', x: '18%', y: '93%', s: 16, d: '13s', delay: '-8s',  o: 0.35 },
  { g: '✉', x: '55%', y: '22%', s: 24, d: '9.5s',delay: '-1.5s',o: 0.5 },
  { g: '✦', x: '58%', y: '68%', s: 17, d: '10.5s',delay: '-4s', o: 0.55 },
  { g: '♡', x: '52%', y: '46%', s: 20, d: '12s', delay: '-7s',  o: 0.4 },
  { g: '✦', x: '92%', y: '12%', s: 20, d: '9s',  delay: '-2.5s',o: 0.5 },
  { g: '♡', x: '96%', y: '30%', s: 14, d: '8.5s',delay: '-5.5s',o: 0.6 },
  { g: '✉', x: '44%', y: '88%', s: 18, d: '11.5s',delay: '-9s', o: 0.4 },
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
