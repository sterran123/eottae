import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보·계정 삭제 안내',
  description: '개인정보 처리방침 준비 상태와 계정·데이터 삭제 요청 경로 안내',
};

export default function PrivacyPage() {
  return (
    <section className="shell subpage">
      <span className="eyebrow dark">DATA POLICY</span>
      <h1>개인정보·계정 삭제 안내</h1>
      <p className="lead">
        이 사이트는 아직 공개 운영되지 않는 팀 프로젝트 기본 골격입니다. 실제 개인정보 수집을
        시작하기 전 개인정보 처리방침, 이용약관 및 법률 검토를 완료해야 합니다.
      </p>

      <div className="feature-grid">
        <article className="feature">
          <span>CORE-004</span>
          <h3>계정·데이터 삭제 요청 경로</h3>
          <p>
            로그인 기능이 도입되면 <b>설정 &gt; 계정 &gt; 회원 탈퇴·데이터 삭제</b>에서 본인 인증
            후 삭제를 요청할 수 있도록 구현합니다. 로그인 도입 전에는 계정 자체가 존재하지 않아
            삭제할 개인 데이터도 없습니다.
          </p>
        </article>
        <article className="feature">
          <span>계획</span>
          <h3>삭제 처리 원칙</h3>
          <p>
            삭제 요청 시 프로필·취향·매칭·대화 데이터를 정책에 따라 삭제하고, 신고·안전 기록 등
            보존 의무가 있는 항목만 최소 기간 보관 후 파기하는 정책을 API 계약과 함께 검증합니다.
          </p>
        </article>
        <article className="feature">
          <span>계획</span>
          <h3>수집 최소화</h3>
          <p>
            성인 인증은 결과와 만료 시각만 저장하는 방향을 검토하며, 신분 원본·정밀 위치·연락처는
            수집하지 않는 것을 기본으로 합니다.
          </p>
        </article>
        <article className="feature">
          <span>계획</span>
          <h3>문의 창구</h3>
          <p>
            운영 창구가 확정되기 전까지 개인정보 관련 요청은 이 안내 페이지와 안전센터를 통해
            안내합니다. 실제 접수 채널은 서비스 공개 전 확정해 고지합니다.
          </p>
        </article>
      </div>

      <aside className="warn">
        <strong>준비 상태</strong>
        <p>
          현재 로그인·회원 데이터가 없으므로 수집·보관 중인 개인정보는 없습니다. 처리방침 본문과
          법률 검토는 서비스 공개 전 완료 항목입니다.
        </p>
      </aside>

      <Link className="btn outline" href="/">
        ← 홈으로
      </Link>
    </section>
  );
}
