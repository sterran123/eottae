// 브랜드 모티프 아이콘 — 시스템 폰트마다 모양·색이 달라지던 ♡ ✦ ✉ 글리프 대신 쓰는 인라인 SVG.
// 색은 currentColor라 부모의 토큰 색을 그대로 따른다(면은 같은 색 18% 틴트).
export type MotifName = 'heart' | 'spark' | 'mail' | 'shield' | 'lock';

const PATHS: Record<MotifName, React.ReactNode> = {
  heart: <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />,
  spark: <path d="M12 3.5c.6 4.2 2.3 6.4 7 8.5-4.7 2.1-6.4 4.3-7 8.5-.6-4.2-2.3-6.4-7-8.5 4.7-2.1 6.4-4.3 7-8.5Z" />,
  mail: (
    <>
      <rect x="3.5" y="6" width="17" height="12.5" rx="3" />
      <path d="m4.5 7.5 7.5 6 7.5-6" fill="none" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5.6c0 4.4-3 7.6-7 8.9-4-1.3-7-4.5-7-8.9V6l7-2.5Z" />
      <path d="m8.8 12.2 2.2 2.2 4.3-4.4" fill="none" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="3" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" />
    </>
  ),
};

export function MotifIcon({ name, size = 24 }: { name: MotifName; size?: number }) {
  return (
    <svg
      className="motif-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillOpacity={0.18}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
