import type { Metadata } from 'next';
import Link from 'next/link';
import SubpageHero from '@/components/shared/subpage-hero';

export const metadata: Metadata = {
  title: '매칭',
  description: '취향·가치관 기반 성인 매칭 — 1차 MVP 취향 온보딩·카드 추천·문답·1:1 채팅',
};

const modules = [
  {
    num: '01',
    title: '취향 온보딩',
    desc: '나를 설명하는 관심사(음악·음식·여행·스타일)와 대화 스타일을 선택합니다.',
    href: '/match/onboarding',
    tag: 'MATCH-001',
    cta: '온보딩 시작',
  },
  {
    num: '02',
    title: '카드 추천',
    desc: '성인 검증 및 취향 일치율을 바탕으로 엄선된 상대 카드를 둘러봅니다.',
    href: '/match/recommend',
    tag: 'MATCH-002',
    cta: '추천 카드 보기',
  },
  {
    num: '03',
    title: '프로필 문답',
    desc: '가치관 질문에 답하고 서로의 생각을 비교해보며 깊이 있는 대화를 준비합니다.',
    href: '/match/qna',
    tag: 'MATCH-009',
    cta: '문답 작성하기',
  },
  {
    num: '04',
    title: '1:1 채팅',
    desc: '쌍방 동의 후에만 열리는 안전하고 프라이빗한 1:1 실시간 대화방입니다.',
    href: '/match/chat',
    tag: 'MATCH-007',
    cta: '채팅방 체험',
  },
] as const;

export default function MatchPage() {
  return (
    <>
      <SubpageHero
        eyebrow="MODULE 01 · MATCH"
        title="취향 먼저, 얼굴은 나중에."
        motif={
          <img
            src="/eottae/brand/hero-visual.webp"
            alt="어때? 캐릭터"
            width={114}
            height={114}
            style={{
              width: '114px',
              height: '114px',
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
              boxShadow: '0 2px 8px rgba(116, 84, 196, 0.15)',
            }}
          />
        }
      >
        마음에 드는 영화와 음악, 좋아하는 대화 방식으로 서로를 알아가고, 두 사람의 동의 후에만
        대화를 시작합니다.
      </SubpageHero>

      <section className="shell subpage">
        <div className="feature-grid">
          {modules.map(({ num, title, desc, href, tag, cta }) => (
            <article className="feature" key={num}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span>{num}</span>
                <span className="chip" style={{ fontSize: '11px', padding: '2px 8px' }}>{tag}</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <div style={{ marginTop: '14px' }}>
                <Link
                  className="btn outline"
                  href={href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    height: '32px',
                    minHeight: '32px',
                    padding: '0 14px',
                    lineHeight: '1',
                  }}
                >
                  {cta} →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="chip-row" aria-label="매칭 이용 조건">
          <span className="chip">만 19세 이상 성인 확인 필수</span>
          <span className="chip">로그인 후 이용</span>
          <span className="chip">쌍방 동의 후에만 대화</span>
        </div>

        <aside className="warn">
          <strong>1차 MVP 프로토타입 체험 안내</strong>
          <p>
            현재 1차 매칭 모듈의 핵심 4단계(취향 온보딩, 추천 카드, 프로필 문답, 1:1 채팅) UI 및 인터랙션이
            모두 구현되어 있습니다. 각 기능 카드의 링크를 클릭해 직접 시연해 보실 수 있습니다.
          </p>
        </aside>

        <div className="actions">
          <Link className="btn primary" href="/match/onboarding">
            취향 온보딩 바로가기 →
          </Link>
          <Link className="btn outline" href="/">
            ← 통합 홈으로
          </Link>
        </div>
      </section>
    </>
  );
}
