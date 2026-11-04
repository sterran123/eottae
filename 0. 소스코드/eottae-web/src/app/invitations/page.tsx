import type { Metadata } from 'next';
import Link from 'next/link';
import SubpageHero from '@/components/shared/subpage-hero';
import { MotifIcon } from '@/components/shared/motif-icon';
import InvitationsHub from '@/components/invitations/InvitationsHub';
import ThemePreviewSection from '@/components/invitations/ThemePreviewSection';
import './invitations.css';

export const metadata: Metadata = {
  title: '모바일 청첩장',
  description: '모바일 청첩장 제작·공유·RSVP — 3차 데모 미리보기',
};

const features = [
  ['01', '청첩장 에디터', '행사 정보·테마·BGM·섹션 순서를 직접 구성해 모바일 초대장을 만듭니다.'],
  ['02', '공개 링크 공유', '불규칙 토큰 기반 초대 링크로 원하는 사람에게만 안전하게 공유합니다.'],
  ['03', '참석 회신(RSVP)', '하객의 참석 여부와 식사·인원 응답을 간편하게 받습니다.'],
  ['04', '개인정보 보호', '게스트 명단 비공개, 링크 만료·재발급, 행사 후 삭제 정책을 적용합니다.'],
] as const;

export default function InvitationsPage() {
  return (
    <>
      <SubpageHero
        eyebrow="MODULE 03 · INVITATIONS"
        status={{ label: '3차 MVP · 데모 미리보기' }}
        title="모바일 청첩장, 우리만의 특별한 초대"
        motif={<MotifIcon name="mail" size={56} />}
      >
        관계가 결실을 맺는 순간을 위해 청첩장 제작·공유·참석 회신을 3차 데모로 구현합니다.
        테마 선택, 레이아웃 변경, BGM 재생, 섹션 순서 커스텀을 직접 체험해 보세요.
      </SubpageHero>

      <section className="shell subpage">
        {/* 청첩장 메인 허브 (목록, 새 청첩장, 실시간 테마 체험 모달) */}
        <InvitationsHub />

        {/* 3차 주요 기능 소개 (내 청첩장 관리 섹션과 확실하게 분리) */}
        <div style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--line)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--ink)' }}>
            3차 모바일 청첩장 핵심 기능
          </h2>
          <div className="feature-grid">
            {features.map(([n, title, desc]) => (
              <article className="feature" key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>

        {/* 테마 모의 결제 섹션 (기존 기능 100% 보존 유지) */}
        <ThemePreviewSection />

        <aside className="warn">
          <strong>3차 모바일 청첩장 목업 안내</strong>
          <p>
            현재 청첩장 에디터·미리보기·공개 하객 뼈대는 데모 목업 단계로 제공됩니다.
            모든 청첩장 저장과 설정은 브라우저의 localStorage에서만 동작하며, 외부 서버로는 전송되지 않습니다.
          </p>
        </aside>

        <Link className="btn outline" href="/">
          ← 통합 홈으로
        </Link>
      </section>
    </>
  );
}
