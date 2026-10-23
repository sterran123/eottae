import Link from 'next/link';

export type ServiceCardProps = {
  index: string;
  title: string;
  english: string;
  tag: string;
  desc: string;
  href: string;
  color: 'lav' | 'blue' | 'pink';
  motif: string;
  cta: string;
};

export default function ServiceCard({
  index,
  title,
  english,
  tag,
  desc,
  href,
  color,
  motif,
  cta,
}: ServiceCardProps) {
  return (
    <Link className={`service-card ${color}`} href={href}>
      <div className="card-top">
        <span className="index">{index}</span>
        <span className="status">{tag}</span>
      </div>
      <div className="motif" aria-hidden="true">
        {motif}
      </div>
      <span className="english">{english}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
      <span className="card-link">{cta} →</span>
    </Link>
  );
}
