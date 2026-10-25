import type { Metadata } from 'next';
import Link from 'next/link';
import SubpageHero from '@/components/shared/subpage-hero';

export const metadata: Metadata = {
  title: '안전센터',
  description: '성인 전용 매칭·상호 동의·차단/신고·개인정보 최소화 — 어때? 안전 정책 초안',
};

const policies = [
  ['성인만 매칭', '매칭·채팅은 만 19세 이상 성인 확인 후에만 접근하도록 설계합니다. 확인 불가 시 접근을 거부합니다.'],
  ['프로필 공개 동의', '상호 동의하기 전 사진·연락처 등 개인 정보를 노출하지 않습니다.'],
  ['차단·신고', '차단 뒤 메시지와 추천을 즉시 막고 신고 처리 체계를 마련합니다.'],
  ['청소년 보호', '10대는 데이팅·1:1 채팅을 사용하지 못하며, 연령대별 안전 정책을 분리합니다.'],
] as const;

export default function SafetyPage() {
  return (
    <>
      <SubpageHero eyebrow="TRUST & SAFETY" title="안전센터 · 정책 초안" motif="♡">
        성인 전용 1:1 데이팅, 상호 동의, 개인정보 최소화, 차단·신고를 개발 최우선 조건으로
        정했습니다.
      </SubpageHero>
      <section className="shell subpage">

        <div className="feature-grid">
          {policies.map(([title, desc], i) => (
            <article className="feature" key={title}>
              <span>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>

        <aside className="warn">
          <strong>현재는 운영 전 초안입니다</strong>
          <p>
            실제 신고 접수·연령 확인은 아직 가동되지 않았습니다. 실사용자 대상 공개 서비스 전 정책과
            기능을 완성해야 합니다.
          </p>
        </aside>

        <Link className="btn outline" href="/">
          ← 홈으로
        </Link>
      </section>
    </>
  );
}
