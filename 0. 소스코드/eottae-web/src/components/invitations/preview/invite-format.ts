// 예식 시각은 Asia/Seoul 달력으로만 읽는다. 서버 시계와 화면 시계의 날짜 경계만 맞춘다.

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type SeoulStamp = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

export type CalendarCell = {
  key: string;
  day: number;
  inMonth: boolean;
};

export function parseSeoul(iso: string): SeoulStamp | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const weekday = WEEKDAY_INDEX[pick('weekday').replace('.', '')];
  const year = Number(pick('year'));
  const month = Number(pick('month'));
  const day = Number(pick('day'));
  let hour = Number(pick('hour'));
  const minute = Number(pick('minute'));
  if (hour === 24) hour = 0;
  if (
    weekday === undefined ||
    [year, month, day, hour, minute].some((value) => Number.isNaN(value))
  ) {
    return null;
  }
  return { year, month, day, hour, minute, weekday };
}

export function seoulWeekday(year: number, month: number, day: number): number {
  const date = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  })
    .format(date)
    .replace('.', '');
  return WEEKDAY_INDEX[name] ?? 0;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dayIndex(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

export function daysFromToday(target: SeoulStamp, now = new Date()): number | null {
  const today = parseSeoul(now.toISOString());
  if (!today) return null;
  return dayIndex(target.year, target.month, target.day) - dayIndex(today.year, today.month, today.day);
}

export function formatKoreanClock(hour: number, minute: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized < 12 ? '오전' : '오후';
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  if (minute === 0) return `${period} ${hour12}시`;
  return `${period} ${hour12}시 ${minute}분`;
}

export function formatCellTime(hour: number, minute: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  if (minute === 0) return `${hour12}시`;
  return `${hour12}:${String(minute).padStart(2, '0')}`;
}

export function formatWeddingLine(iso: string, venue: string): string | null {
  const stamp = parseSeoul(iso);
  if (!stamp) return null;
  const when = `${stamp.year}년 ${stamp.month}월 ${stamp.day}일 ${WEEKDAY_LABELS[stamp.weekday]}요일 ${formatKoreanClock(stamp.hour, stamp.minute)}`;
  return venue.trim() ? `${when} · ${venue.trim()}` : when;
}

export function buildCalendar(year: number, month: number): CalendarCell[][] {
  const start = seoulWeekday(year, month, 1);
  const count = daysInMonth(year, month);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevCount = daysInMonth(prevYear, prevMonth);
  const cells: CalendarCell[] = [];
  for (let index = 0; index < start; index += 1) {
    const day = prevCount - start + 1 + index;
    cells.push({ key: `p-${day}`, day, inMonth: false });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({ key: `d-${day}`, day, inMonth: true });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ key: `n-${next}`, day: next, inMonth: false });
    next += 1;
  }
  const rows: CalendarCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }
  return rows;
}

export function coupleFromHost(hostNames: string): { groom: string; bride: string; line: string } {
  const parts = hostNames
    .split(/[·•]/)
    .map((part) => part.replace(/신랑|신부/g, '').trim())
    .filter(Boolean);
  const groom = parts[0] ?? '';
  const bride = parts[1] ?? '';
  const line = [groom, bride].filter(Boolean).join(' · ');
  return { groom, bride, line: line || hostNames.trim() };
}

export function countdownCopy(days: number): { lead: string; badge: string } {
  if (days > 0) return { lead: `앞으로 ${days}일 남았어요`, badge: `D-${days}` };
  if (days === 0) return { lead: '오늘이 예식일이에요', badge: 'D-Day' };
  return { lead: '예식일이 지났어요', badge: `D+${Math.abs(days)}` };
}
