// 정적 export + trailingSlash 에서 쿼리만으로 상세를 연다.

export type ActivitiesQuery = {
  tab?: 'courses' | 'gatherings' | null;
  course?: string | null;
  gathering?: string | null;
  region?: string | null;
  mood?: string | null;
  category?: string | null;
};

export function activitiesHref(query: ActivitiesQuery = {}): string {
  const params = new URLSearchParams();
  const entries: [string, string | null | undefined][] = [
    ['tab', query.tab === 'gatherings' ? 'gatherings' : null],
    ['course', query.course],
    ['gathering', query.gathering],
    ['region', query.region],
    ['mood', query.mood],
    ['category', query.category],
  ];
  for (const [key, value] of entries) {
    if (value && value !== 'all') params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/activities/?${qs}` : '/activities/';
}
