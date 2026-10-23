import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div>
          <b>어때? · 팀 프로젝트 기본 골격</b>
          <p>김민기 · 오하율 · 주한태 · 손준혁</p>
        </div>
        <div className="footer-links">
          <Link href="/privacy">개인정보·계정 삭제 안내</Link>
          <Link href="/safety">안전센터</Link>
          <span>© 2026 · 계획/시연용</span>
        </div>
      </div>
    </footer>
  );
}
