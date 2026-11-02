import { recruitmentView } from '@/lib/activities/recruitment';
import type { Gathering } from '@/lib/activities/types';

const TONE: Record<'capacity' | 'seats' | 'soon' | 'closed', string> = {
  capacity: 'act-badge act-badge-capacity',
  seats: 'act-badge act-badge-seats',
  soon: 'act-badge act-badge-soon',
  closed: 'act-badge act-badge-closed',
};

type Props = {
  gathering: Gathering;
  requested: boolean;
  now?: Date;
};

export default function RecruitmentBadges({ gathering, requested, now = new Date() }: Props) {
  const view = recruitmentView(gathering, requested, now);
  return (
    <ul className="act-badges" aria-label="모집 상태">
      {view.badges.map((badge) => (
        <li key={badge.id} className={TONE[badge.id]}>
          {badge.label}
        </li>
      ))}
    </ul>
  );
}
