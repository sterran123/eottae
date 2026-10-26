// 서브페이지 머리 — 홈 히어로의 아기자기 언어(파스텔 띠·도트·스캘럽·점선 스티커)를 옮긴 공통 헤더.
// 색은 전부 globals.css 토큰을 따르므로 6테마에서 자동으로 추적한다.
type Props = {
  eyebrow: string;
  title: React.ReactNode;
  status?: { label: string; dev?: boolean };
  // 데스크톱 오른쪽 스티커에 들어가는 모티프 (캐릭터 일러스트 또는 ♡ ✦ ✉ 글리프)
  motif?: React.ReactNode;
  children?: React.ReactNode;
};

export default function SubpageHero({ eyebrow, title, status, motif = '♡', children }: Props) {
  return (
    <header className="subhero">
      <div className="shell subhero-inner">
        <span className="eyebrow dark">{eyebrow}</span>
        {status && <span className={status.dev ? 'status big dev' : 'status big'}>{status.label}</span>}
        <h1>{title}</h1>
        {children && <p className="lead">{children}</p>}
        <span className="subhero-motif" aria-hidden="true">
          {motif}
        </span>
      </div>
    </header>
  );
}
