import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '데이트·소모임',
  description: '데이트 코스·취미 소모임·일정 투표 — 2차 MVP에서 개통 예정',
};

const features = [
  ['01', '모임 탐색', '공개된 데이트 코스와 취미·밥·운동 모임을 지역·관심사로 찾습니다.'],
  ['02', '참가 신청', '모임별 정책에 맞는 참가 요청과 중복 신청 방지를 제공합니다.'],
  ['03', '일정 투표', '모임장 비서 아이디어를 차용한 일정 조율 투표를 제공합니다.'],
  ['04', '안전 운영', '후기·신고·차단 연동과 위치 정보 최소화를 함께 설계합니다.'],
] as const;

export default function ActivitiesPage() {
  return (
    <section className="shell subpage">
      <span className="eyebrow dark">MODULE 02 · ACTIVITIES</span>
      <span className="status big">2차 MVP · 준비 중</span>
      <h1>데이트와 소모임, 함께하는 하루</h1>
      <p className="lead">
        매칭으로 연결된 사람들과 취향이 맞는 사람들이 오프라인에서도 만날 수 있도록, 데이트
        코스·소모임·일정 관리를 2차 MVP에서 구현합니다.
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

      <aside className="warn">
        <strong>현재는 서비스 입구와 계획 안내만 제공합니다</strong>
        <p>
          모임 생성·참가·투표 등 실제 사용자 기능은 개발하지 않았습니다. 1차 매칭 모듈이 안정화된
          뒤 순차적으로 개통합니다.
        </p>
      </aside>

      <Link className="btn outline" href="/">
        ← 통합 홈으로
      </Link>
    </section>
  );
}
