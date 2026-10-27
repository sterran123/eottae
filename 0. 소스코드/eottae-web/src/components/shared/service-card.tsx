import Link from 'next/link';
import { MotifIcon, type MotifName } from './motif-icon';

export type ServiceCardProps = {
  index: string;
  title: string;
  english: string;
  tag: string;
  // 지금 체험 가능한 모듈 — 상태칩 점이 깜빡이고 카드 링크가 CTA 필로 강조된다
  live?: boolean;
  desc: string;
  href: string;
  color: 'lav' | 'blue' | 'pink';
  motif: MotifName;
  cta: string;
};

export default function ServiceCard({
  index,
  title,
  english,
  tag,
  live,
  desc,
  href,
  color,
  motif,
  cta,
}: ServiceCardProps) {
  return (
    <Link className={`service-card ${color}${live ? ' is-live' : ''}`} href={href}>
      <div className="card-top">
        <span className="index">{index}</span>
        <span className={live ? 'status dev' : 'status'}>{tag}</span>
      </div>
      <div className="motif" aria-hidden="true">
        <MotifIcon name={motif} size={34} />
      </div>
      <span className="english">{english}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
      <span className="card-link">
        {cta} <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
