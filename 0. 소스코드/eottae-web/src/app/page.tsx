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
    tag: '2차 · 준비 중',
    desc: '데이트 코스, 소모임, 취미 활동과 참석·일정 관리.',
    href: '/activities',
    color: 'blue',
    motif: 'spark',
    cta: '서비스 소개 보기',
  },
  {
    index: '03',
    title: '모바일 청첩장',
    english: 'INVITATIONS',
    tag: '3차 · 준비 중',
    desc: '모바일 청첩장 제작, 결혼식 안내, 참석 응답과 초대장 공유.',
    href: '/invitations',
    color: 'pink',
    motif: 'mail',
    cta: '서비스 소개 보기',
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
  { phase: '2차', title: '데이트·소모임', desc: '코스 탐색·모임 참가·일정 투표', motif: 'spark' },
  { phase: '3차', title: '모바일 청첩장', desc: '에디터·공유 링크·참석 회신', motif: 'mail' },
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
            팀 프로젝트 1차 MVP — 매칭 화면은 데모 데이터로 체험할 수 있고, 실제 회원 매칭·대화는
            로그인·성인 인증 구현 후 열립니다.
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
              온보딩·추천·문답·채팅 화면은 데모 데이터로 미리 체험할 수 있어요. 실제 회원 매칭과
              대화는 로그인·만 19세 이상 성인 확인·쌍방 동의 기능이 구현되고 안전 검증을 통과한 뒤
              1차 MVP에서 개통합니다.
            </p>
          </details>
          <details>
            <summary>청첩장만 따로 이용할 수 있나요?</summary>
            <p>
              3차 개통 후에는 매칭 이용 이력과 관계없이 누구나 독립적으로 이용할 수 있도록
              설계하고 있습니다.
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
              현재는 계정 자체가 없어 저장되는 개인 데이터도 없습니다. 로그인 도입 후 설정 →
              계정 → 회원 탈퇴·데이터 삭제 경로를 제공할 예정이며, 자세한 내용은{' '}
              <Link href="/privacy">개인정보·계정 삭제 안내</Link>에서 확인할 수 있습니다.
            </p>
          </details>
        </div>
      </section>

      <section className="shell section bottom">
        <div className="section-head" data-reveal>
          <span className="eyebrow dark">ROADMAP</span>
          <h2>나중에는 함께 즐기는 기능도</h2>
          <p>
            선택의 방 질문 기능은 매칭 이후, 모임장 비서의 일정 투표는 2차, 모바일 청첩장은 3차에
            확장합니다.
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
                {'now' in r && r.now ? ' · 지금' : ''}
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
