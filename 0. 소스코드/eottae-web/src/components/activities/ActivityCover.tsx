import { coverFor, type CoverSource } from '@/lib/activities/cover';

type Props = {
  item: CoverSource;
  large?: boolean;
  lazy?: boolean;
};

export default function ActivityCover({ item, large = false, lazy = true }: Props) {
  const cover = coverFor(item);
  return (
    <img
      className={large ? 'act-cover act-cover-lg' : 'act-cover'}
      src={cover.src}
      alt={cover.alt}
      width={640}
      height={360}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
    />
  );
}
