import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div className="footer-brand">
          <b>어때?</b>
          <p>취향으로 시작되는 인연 — 하나의 앱 · 세 가지 순간</p>
          <p className="footer-team">팀 · 김민기 · 오하율 · 주한태 · 손준혁</p>
        </div>
        <nav className="footer-links" aria-label="서비스">
          <b>서비스</b>
          <Link href="/match">매칭</Link>
          <Link href="/activities">데이트·소모임</Link>
          <Link href="/invitations">모바일 청첩장</Link>
        </nav>
        <nav className="footer-links" aria-label="안내">
          <b>안내</b>
          <Link href="/safety">안전센터</Link>
          <Link href="/privacy">개인정보·계정 삭제 안내</Link>
        </nav>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 어때? · 팀 프로젝트 계획/시연용</span>
        <span>실제 회원 데이터는 수집하지 않습니다</span>
      </div>
    </footer>
  );
}
