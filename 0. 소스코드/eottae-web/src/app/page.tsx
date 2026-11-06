import Link from 'next/link';
import ServiceCard from '@/components/shared/service-card';
import type { ServiceCardProps } from '@/components/shared/service-card';
import HeroParticles from '@/components/shared/hero-particles';
import { MotifIcon } from '@/components/shared/motif-icon';

const cards: ServiceCardProps[] = [
  {
    index: '01',
    title: '매칭',
    english: 'MATCH',
    tag: '1차 MVP · 데모 체험',
    live: true,
    desc: '취향부터 공통 질문, 쌍방 호감, 안전한 1:1 대화까지.',
    href: '/match',
    color: 'lav',
    motif: 'heart',
    cta: '데모 둘러보기',
  },
  {
    index: '02',
    title: '데이트·소모임',
    english: 'ACTIVITIES',
    tag: '2차 · 데모 체험',
    live: true,
    desc: '데이트 코스, 소모임, 취미 활동과 참석·일정 관리.',
    href: '/activities/',
    color: 'blue',
    motif: 'spark',
    cta: '데모 둘러보기',
  },
  {
    index: '03',
    title: '모바일 청첩장',
    english: 'INVITATIONS',
    tag: '3차 · 데모 체험',
    live: true,
    desc: '테마 고르기부터 에디터·공개 링크·참석 회신(RSVP)까지 데모로 체험해요.',
    href: '/invitations/',
    color: 'pink',
    motif: 'mail',
    cta: '데모 둘러보기',
  },
];

const steps = [
  ['01', '취향 선택', '좋아하는 것들로 나를 소개해요'],
  ['02', '공통 질문', '같은 질문, 서로의 답을 비교해요'],
  ['03', '쌍방 호감', '둘 다 좋아요일 때만 연결돼요'],
  ['04', '대화 시작', '동의한 두 사람만의 1:1 대화방'],
] as const;

const roadmap = [
  { phase: '1차', title: '매칭', desc: '취향 온보딩·추천·문답·1:1 채팅', now: true, motif: 'heart' },
  { phase: '2차', title: '데이트·소모임', desc: '코스 탐색·모임 참가·일정 투표', now: true, motif: 'spark' },
  { phase: '3차', title: '모바일 청첩장', desc: '에디터·공유 링크·참석 회신', now: true, motif: 'mail' },
] as const;

export default function Home() {
  return (
    <>
      <section className="hero">
        <HeroParticles />
        {/* 브랜드 일러스트 — ima2-gen 생성 에셋(public/brand/) */}
        <div className="hero-visual" aria-hidden="true">
          <img src="/eottae/brand/hero-visual.webp" alt="" width={340} height={340} />
        </div>
        <div className="shell hero-content">
          <div className="eyebrow">ONE WEB APP · THREE MOMENTS</div>
          <h1>
            취향이 어때?
            <br />
            <span>함께 만날래?</span>
            <br />
            그다음은 우리 이야기.
          </h1>
          <p>
            서로를 알아가는 첫 질문부터 같이 만드는 추억까지.
            <br />
            한 곳에서 이어지는 세 가지 관계의 여정.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/match">
              매칭 데모 체험하기
            </Link>
            <a className="btn light" href="#services">
              3가지 서비스 보기
            </a>
          </div>
          <div className="notice">
            팀 프로젝트 3차 최종 제출(목업) — 매칭·데이트·소모임·모바일 청첩장 모두 데모 데이터로
            체험할 수 있어요. 데모 기록은 이 브라우저에만 남고, 실제 결제·본인 확인은 연결하지 않았어요.
          </div>
        </div>
      </section>

      <section id="services" className="shell section">
        <div className="section-head" data-reveal>
          <span className="eyebrow dark">OUR PLATFORM</span>
          <h2>세 가지 순간, 하나의 앱</h2>
          <p>하나의 회원 시스템과 공통 디자인으로 연결되는 매칭 · 데이트·소모임 · 모바일 청첩장</p>
        </div>
        <div className="card-grid">
          {cards.map((c, i) => (
            <div key={c.index} data-reveal style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}>
              <ServiceCard {...c} />
            </div>
          ))}
        </div>
      </section>

      <section className="shell section narrow">
        <div className="section-head" data-reveal>
          <span className="eyebrow dark">HOW IT WORKS</span>
          <h2>첫 만남까지, 천천히</h2>
          <p>얼굴보다 취향이 먼저 — 두 사람이 모두 동의해야 다음 단계가 열려요</p>
        </div>
        <ol className="steps">
          {steps.map(([n, label, desc], i) => (
            <li
              className="step"
              key={n}
              data-reveal
              style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}
            >
              <strong>{n}</strong>
              <span>{label}</span>
              <small>{desc}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="shell section">
        <div className="safety-highlight" data-reveal>
          <span className="safety-badge" aria-hidden="true">
            <MotifIcon name="shield" />
          </span>
          <div className="safety-copy">
            <span className="eyebrow dark">SAFETY FIRST</span>
            <h2>안전이 먼저인 만남</h2>
            <p>
              매칭과 대화는 만 19세 이상 성인 확인 후 제공하며, 차단·신고·동의 기반 프로필 공개를
              기본 정책으로 설계합니다.
            </p>
          </div>
          <Link className="btn outline" href="/safety">
            안전 원칙 보기
          </Link>
        </div>
      </section>

      <section className="shell section narrow">
        <div className="section-head" data-reveal>
          <span className="eyebrow dark">FAQ</span>
          <h2>자주 묻는 질문</h2>
        </div>
        <div className="faq">
          <details>
            <summary>지금 바로 매칭을 이용할 수 있나요?</summary>
            <p>
              네, 데모로 체험할 수 있어요. 상단 「로그인」에서 「데모로 로그인」을 누르고 시연용 성인
              확인(만 19세)을 거치면 온보딩·추천·문답·채팅이 열려요. 실제 회원 매칭과 대화는 실제
              본인 확인·서버 연동과 안전 검증을 마친 뒤 개통합니다.
            </p>
          </details>
          <details>
            <summary>청첩장만 따로 이용할 수 있나요?</summary>
            <p>
              네, 모바일 청첩장은 매칭 이용 이력과 관계없이 누구나 독립적으로 이용할 수 있어요.
              「어때?」에서 커플이 되면 무료로 연계해 쓸 수 있도록 설계했습니다 (지금은 데모).
            </p>
          </details>
          <details>
            <summary>휴대폰 홈 화면에 앱처럼 설치할 수 있나요?</summary>
            <p>
              네, 「어때?」는 PWA라 설치할 수 있어요. <b>iPhone(Safari)</b>: 공유 버튼 → 「홈 화면에
              추가」. <b>Android(Chrome)</b>: 메뉴 ⋮ → 「앱 설치」 또는 「홈 화면에 추가」. 설치 후에는
              네트워크가 끊겨도 마지막으로 본 화면과 오프라인 안내가 열립니다.
            </p>
          </details>
          <details>
            <summary>제 데이터는 어떻게 삭제하나요?</summary>
            <p>
              시연에서 입력한 데이터는 이 기기 브라우저에만 남아요. 설정 → 계정 → 회원 탈퇴·데이터
              삭제에서 확인 문구를 입력하면 그 데모 기록을 지울 수 있어요. 실제 계정은 삭제하지
              않아요. 자세한 내용은 <Link href="/privacy">개인정보·계정 삭제 안내</Link>에서 확인할 수
              있습니다.
            </p>
          </details>
        </div>
      </section>

      <section className="shell section bottom">
        <div className="section-head" data-reveal>
          <span className="eyebrow dark">ROADMAP</span>
          <h2>만남에서 결혼까지, 세 단계 모두 체험</h2>
          <p>
            1차 매칭, 2차 데이트·소모임, 3차 모바일 청첩장까지 모두 데모 데이터로 체험할 수 있어요.
            실제 회원 연동과 결제는 안전 검증을 마친 뒤 이어갑니다.
          </p>
        </div>
        <ol className="roadmap">
          {roadmap.map((r, i) => (
            <li
              key={r.phase}
              className={'now' in r && r.now ? 'is-now' : undefined}
              data-reveal
              style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}
            >
              <span className="roadmap-icon" aria-hidden="true">
                <MotifIcon name={r.motif} />
              </span>
              <span className="roadmap-phase">
                {r.phase}
                {'now' in r && r.now ? ' · 데모 체험' : ''}
              </span>
              <b>{r.title}</b>
              <small>{r.desc}</small>
            </li>
          ))}
        </ol>
        <div className="actions center">
          <Link className="btn primary" href="/match">
            매칭 데모 체험하기
          </Link>
        </div>
      </section>
    </>
  );
}
