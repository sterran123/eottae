import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '매칭',
  description: '취향·가치관 기반 성인 매칭 — 1차 MVP 개발 대상 모듈 소개',
};

const features = [
  ['01', '취향 온보딩', '나를 설명하는 관심사와 대화 스타일을 선택합니다.'],
  ['02', '카드 추천', '성인 검증·차단 필터를 적용한 후보를 추천합니다.'],
  ['03', '쌍방 매칭', '서로 관심을 표시해야만 1:1 대화가 열립니다.'],
  ['04', '안전한 채팅', '차단·신고·프로필 공개 동의를 우선 설계합니다.'],
] as const;

export default function MatchPage() {
  return (
    <section className="shell subpage">
      <span className="eyebrow dark">MODULE 01 · MATCH</span>
      <span className="status big dev">1차 MVP · 개발 대상</span>
      <h1>취향 먼저, 얼굴은 나중에.</h1>
      <p className="lead">
        마음에 드는 영화와 음악, 좋아하는 대화 방식으로 서로를 알아가고, 두 사람의 동의 후에만
        대화를 시작합니다.
      </p>

      <div className="feature-grid">
        {features.map(([n, title, desc]) => (
          <article className="feature" key={n}>
            <span>{n}</span>
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>

      <div className="chip-row" aria-label="매칭 이용 조건">
        <span className="chip">만 19세 이상 성인 확인 필수</span>
        <span className="chip">로그인 후 이용</span>
        <span className="chip">쌍방 동의 후에만 대화</span>
      </div>

      <aside className="warn">
        <strong>현재 상태: 기능 개발 전 — 진입만 가능합니다</strong>
        <p>
          회원가입·성인 인증·취향 온보딩·추천·1:1 채팅은 아직 작동하지 않습니다. 로그인과 성인
          확인이 구현된 뒤에야 실제 매칭 화면으로 진입할 수 있습니다.
        </p>
      </aside>

      <div className="actions">
        <span className="btn outline" aria-disabled="true">
          매칭 시작하기 (로그인·성인 확인 구현 후 개통)
        </span>
        <Link className="btn outline" href="/">
          ← 통합 홈으로
        </Link>
      </div>
    </section>
  );
}
