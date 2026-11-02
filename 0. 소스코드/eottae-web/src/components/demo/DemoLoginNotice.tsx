import Link from 'next/link';
import './demo-flow.css';

export default function DemoLoginNotice({
  heading,
  body,
  nextPath,
}: {
  heading: string;
  body: string;
  nextPath: string;
}) {
  const href = `/auth/login?next=${encodeURIComponent(nextPath)}`;
  return (
    <div className="demo-adult-block">
      <h1>{heading}</h1>
      <p>{body}</p>
      <p>데모 로그인만 이 브라우저에 남아요. 실제 계정 서버에는 접속하지 않아요.</p>
      <div className="demo-flow-actions">
        <Link className="btn primary" href={href}>
          로그인 안내
        </Link>
        <Link className="btn outline" href="/">
          홈으로
        </Link>
      </div>
    </div>
  );
}
