import type { Metadata } from 'next';
import Link from 'next/link';
import SubpageHero from '@/components/shared/subpage-hero';

export const metadata: Metadata = {
  title: '모바일 청첩장',
  description: '모바일 청첩장 제작·공유·RSVP — 3차 MVP에서 개통 예정',
};

const features = [
  ['01', '청첩장 에디터', '행사 정보·사진·테마를 담은 모바일 초대장을 만듭니다.'],
  ['02', '공개 링크 공유', '불규칙 토큰 기반 초대 링크로 원하는 사람에게만 공유합니다.'],
  ['03', '참석 회신(RSVP)', '하객의 참석 여부와 식사·인원 응답을 간편하게 받습니다.'],
  ['04', '개인정보 보호', '게스트 명단 비공개, 링크 만료·재발급, 행사 후 삭제 정책을 적용합니다.'],
] as const;

export default function InvitationsPage() {
  return (
    <>
      <SubpageHero
        eyebrow="MODULE 03 · INVITATIONS"
        status={{ label: '3차 MVP · 준비 중' }}
        title="모바일 청첩장, 우리만의 특별한 초대"
        motif="✉"
      >
        관계가 결실을 맺는 순간을 위해 청첩장 제작·공유·참석 회신을 3차 MVP에서 구현합니다.
        매칭 이용 이력과 무관하게 누구나 독립적으로 이용할 수 있도록 설계합니다.
      </SubpageHero>
      <section className="shell subpage">

        <div className="feature-grid">
          {features.map(([n, title, desc]) => (
            <article className="feature" key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>

        <aside className="warn">
          <strong>현재는 서비스 입구와 계획 안내만 제공합니다</strong>
          <p>
            에디터·공유 링크·RSVP 등 실제 사용자 기능은 개발하지 않았습니다. 1·2차 모듈 이후
            순차적으로 개통합니다.
          </p>
        </aside>

        <Link className="btn outline" href="/">
          ← 통합 홈으로
        </Link>
      </section>
    </>
  );
}
