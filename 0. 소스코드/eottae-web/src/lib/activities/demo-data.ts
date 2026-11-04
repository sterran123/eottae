// 2차 데이트·소모임 DEMO 데이터.
// 지역·상호·닉네임은 모두 가상이다. 실존 가게·인물을 넣지 않는다.
// 이 파일의 값으로 서버 저장이나 실제 모임을 만들지 않는다.

import { COURSE_COVER_PATH, GATHERING_COVER_PATH } from './cover';
import type { DateCourse, Gathering, PollOption } from './types';

export function formatWon(amount: number): string {
  const digits = Math.abs(Math.round(amount)).toString();
  const withComma = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${amount < 0 ? '-' : ''}${withComma}원`;
}

export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours <= 0) return `${rest}분`;
  if (rest === 0) return `${hours}시간`;
  return `${hours}시간 ${rest}분`;
}

export function budgetBand(costWon: number): string {
  if (costWon < 10000) return '1만 원 미만';
  const man = Math.floor(costWon / 10000);
  return `${man}만 원대`;
}

export function courseTotals(course: DateCourse): { minutes: number; costWon: number } {
  return course.steps.reduce(
    (acc, step) => ({
      minutes: acc.minutes + step.minutes,
      costWon: acc.costWon + step.costWon,
    }),
    { minutes: 0, costWon: 0 }
  );
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** `YYYY-MM-DDTHH:mm` (datetime-local). 잘못된 달력 날짜는 null. */
export function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return null;
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }
  return date;
}

export function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatKoreanDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const week = WEEKDAYS[date.getDay()];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${week}) ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildDemoPoll(gatheringId: string, baseLocal: string): PollOption[] | null {
  const base = parseLocalDateTime(baseLocal);
  if (!base) return null;
  const slots = [base, new Date(base.getTime() + 2 * 60 * 60 * 1000), new Date(base.getTime() + 24 * 60 * 60 * 1000)];
  const votes = [2, 1, 0];
  return slots.map((slot, index) => ({
    id: `${gatheringId}-t${index + 1}`,
    label: formatKoreanDateTime(slot),
    demoVotes: votes[index] ?? 0,
  }));
}

function poll(id: string, rows: readonly [string, number][]): PollOption[] {
  return rows.map(([label, demoVotes], index) => ({
    id: `${id}-t${index + 1}`,
    label,
    demoVotes,
  }));
}

export const DEMO_COURSES: readonly DateCourse[] = [
  {
    id: 'course-neoul-tea',
    title: '노을구에서 책 한 권, 차 한 잔',
    region: '노을구',
    mood: '잔잔한',
    coverImage: COURSE_COVER_PATH['잔잔한'],
    summary: '말이 적어도 괜찮은 반나절 예시예요. 가상 서점과 찻집, 공개된 벤치만 잇습니다.',
    steps: [
      {
        title: '골목 서점',
        placeLabel: '가상 상호 · 페이지등대',
        minutes: 40,
        costWon: 0,
        note: '서로 고른 책 몇 쪽을 창가에서 읽어요. 구매는 하지 않아도 됩니다.',
      },
      {
        title: '따뜻한 차',
        placeLabel: '가상 상호 · 느린주전자',
        minutes: 70,
        costWon: 16000,
        note: '차 두 잔과 작은 과자. 대화가 멈추면 읽던 책 이야기로 돌아가요.',
      },
      {
        title: '강변 벤치',
        placeLabel: '예시 장소 · 노을 벤치',
        minutes: 20,
        costWon: 0,
        note: '사람 있는 산책로에서 잠시 걷고 각자 대중교통으로 헤어져요.',
      },
    ],
  },
  {
    id: 'course-dal-market',
    title: '달동네 야시장을 천천히',
    region: '달동네',
    mood: '활기찬',
    coverImage: COURSE_COVER_PATH['활기찬'],
    summary: '불빛이 많은 예시 시장을 네 걸음으로 도는 코스예요. 줄이 긴 집은 건너뜁니다.',
    steps: [
      {
        title: '입구 간식',
        placeLabel: '가상 상호 · 달꼬치',
        minutes: 25,
        costWon: 8000,
        note: '나눠 먹기 좋은 꼬치 하나. 자리 없이 서서 먹어요.',
      },
      {
        title: '골목 놀이',
        placeLabel: '예시 장소 · 종이별 부스',
        minutes: 35,
        costWon: 6000,
        note: '점수가 적어도 괜찮은 간단한 놀이. 상품은 예시 스티커뿐이에요.',
      },
      {
        title: '따뜻한 국물',
        placeLabel: '가상 상호 · 골목솥',
        minutes: 50,
        costWon: 18000,
        note: '앉는 자리가 있는 공개 좌석. 맵기는 순한 맛으로 부탁하는 예시예요.',
      },
      {
        title: '귀갓길',
        placeLabel: '예시 장소 · 달동네 광장',
        minutes: 20,
        costWon: 0,
        note: '광장 시계탑에서 다음 약속을 정하고 밝을 때 헤어져요.',
      },
    ],
  },
  {
    id: 'course-handle-picnic',
    title: '한들시 잔디에 김밥 펴기',
    region: '한들시',
    mood: '야외',
    coverImage: COURSE_COVER_PATH['야외'],
    summary: '그늘과 화장실이 있는 공원만 고른 낮 예시예요. 날씨가 궂으면 실내 코스로 바꿔요.',
    steps: [
      {
        title: '김밥 포장',
        placeLabel: '가상 상호 · 풀잎김밥',
        minutes: 30,
        costWon: 14000,
        note: '두 줄이면 충분해요. 매장 안에서 기다리고 바로 공원으로 걸어가요.',
      },
      {
        title: '잔디 시간',
        placeLabel: '예시 장소 · 한들 잔디광장',
        minutes: 80,
        costWon: 0,
        note: '지정된 피크닉 구역만 사용해요. 쓰레기는 입구 수거함으로 가져가요.',
      },
      {
        title: '음료 한 잔',
        placeLabel: '가상 상호 · 나무그늘',
        minutes: 25,
        costWon: 9000,
        note: '공원 안 공개 카페. 해가 기울기 전에 자리를 일어나요.',
      },
    ],
  },
  {
    id: 'course-byeol-night',
    title: '별포구 바닷바람과 야경',
    region: '별포구',
    mood: '야경',
    coverImage: COURSE_COVER_PATH['야경'],
    summary: '짧은 두 단계예요. 어두운 골목은 빼고, 등대가 보이는 밝은 데크만 걷습니다.',
    steps: [
      {
        title: '따뜻한 어묵',
        placeLabel: '가상 상호 · 등대국물',
        minutes: 40,
        costWon: 12000,
        note: '데크에 면한 창가 좌석. 술 없는 메뉴만 적었어요.',
      },
      {
        title: '밝은 데크',
        placeLabel: '예시 장소 · 별포 등대데크',
        minutes: 35,
        costWon: 0,
        note: '가로등이 켜진 구간만 왕복해요. 난간 밖으로는 나가지 않아요.',
      },
    ],
  },
  {
    id: 'course-ongi-craft',
    title: '온기동에서 작은 그릇 만들기',
    region: '온기동',
    mood: '실내',
    coverImage: COURSE_COVER_PATH['실내'],
    summary: '비 오는 날에 맞춘 실내 예시예요. 작품은 가져가지 않고 사진만 남기는 설정입니다.',
    steps: [
      {
        title: '도장 고르기',
        placeLabel: '가상 상호 · 구름도장',
        minutes: 20,
        costWon: 0,
        note: '예약석이 있는 공방 입구. 앞치마는 자리에서 받아요.',
      },
      {
        title: '그릇 빚기',
        placeLabel: '가상 상호 · 구름도장 작업실',
        minutes: 80,
        costWon: 36000,
        note: '두 사람 체험 비용 예시. 굽는 시간은 빼고 만드는 시간만 적었어요.',
      },
      {
        title: '옆집 차',
        placeLabel: '가상 상호 · 온기잔',
        minutes: 30,
        costWon: 11000,
        note: '흙손이 묻은 채로도 앉을 수 있다고 적어 둔 가상 찻집이에요.',
      },
    ],
  },
  {
    id: 'course-pado-film',
    title: '파도읍, 필름 세 장과 노을',
    region: '파도읍',
    mood: '감성',
    coverImage: COURSE_COVER_PATH['감성'],
    summary: '사진을 많이 찍지 않는 예시예요. 서로 찍기 전에는 한 번 더 물어보는 코스입니다.',
    steps: [
      {
        title: '필름 빌리기',
        placeLabel: '가상 상호 · 세장카메라',
        minutes: 20,
        costWon: 8000,
        note: '일회용 카메라 한 대. 사람 얼굴은 동의한 뒤 찍어요.',
      },
      {
        title: '방파제 노을',
        placeLabel: '예시 장소 · 파도 방파제',
        minutes: 40,
        costWon: 0,
        note: '난간 안쪽 보행로만. 파도가 높으면 이 단계는 건너뛰어요.',
      },
      {
        title: '기록 카페',
        placeLabel: '가상 상호 · 인화되지않은',
        minutes: 50,
        costWon: 14000,
        note: '찍은 장면을 말로 적어요. 인화는 데모에 포함하지 않았어요.',
      },
      {
        title: '역으로 걷기',
        placeLabel: '예시 장소 · 파도읍 역광장',
        minutes: 15,
        costWon: 0,
        note: '밝은 대로로 역까지. 각자 집으로 가는 길이라 여기서 끝나요.',
      },
    ],
  },
  {
    id: 'course-neoul-morning',
    title: '노을구 아침 시장, 두 걸음',
    region: '노을구',
    mood: '활기찬',
    coverImage: COURSE_COVER_PATH['활기찬'],
    summary: '오전에 끝나는 짧은 예시예요. 북적이는 시간 전, 문이 열린 가게만 지납니다.',
    steps: [
      {
        title: '빵 두 개',
        placeLabel: '가상 상호 · 첫오븐',
        minutes: 30,
        costWon: 9000,
        note: '포장해서 시장 안 공용 테이블에서 먹어요.',
      },
      {
        title: '꽃 구경',
        placeLabel: '가상 상호 · 이슬꽃집',
        minutes: 25,
        costWon: 0,
        note: '사지 않고 구경만. 사장님 예시 닉네임은 코스에 넣지 않았어요.',
      },
    ],
  },
  {
    id: 'course-dal-rain',
    title: '비 오는 달동네, 실내 세 곳',
    region: '달동네',
    mood: '감성',
    coverImage: COURSE_COVER_PATH['감성'],
    summary: '우산이 필요한 날을 위한 예시예요. 야외 대기는 없고 모두 실내 공개 장소입니다.',
    steps: [
      {
        title: '레코드 듣기',
        placeLabel: '가상 상호 · 창틈레코드',
        minutes: 45,
        costWon: 6000,
        note: '음료 두 잔 값의 예시. 헤드폰으로 같은 곡을 한 곡만 들어요.',
      },
      {
        title: '작은 전시',
        placeLabel: '가상 상호 · 골목액자',
        minutes: 40,
        costWon: 10000,
        note: '관람료 두 장. 작품 설명은 벽의 짧은 글만 읽어요.',
      },
      {
        title: '국수',
        placeLabel: '가상 상호 · 비온뒤국수',
        minutes: 40,
        costWon: 16000,
        note: '따뜻한 국수 두 그릇. 식후에는 역 연결된 통로로 나가요.',
      },
    ],
  },
];

export const DEMO_GATHERINGS: readonly Gathering[] = [
  {
    id: 'meet-sketch',
    title: '노을 스케치 소모임',
    category: '취미',
    coverImage: GATHERING_COVER_PATH['취미'],
    region: '노을구',
    viewerIsHost: true,
    startsAtLabel: '2026년 11월 8일 (일) 14:00',
    startsAtIso: '2026-11-08T14:00',
    capacity: 8,
    currentCount: 5,
    hostNickname: '모과차',
    intro: '연필만 가져오면 되는 예시 모임이에요. 잘 그리지 않아도 되고, 서로의 그림에 점수는 매기지 않아요. 자리는 창가 공용 테이블입니다.',
    placeLabel: '가상 상호 · 페이지등대 2층',
    safetyFlags: ['공개 장소', '첫 만남 안내', '정원 제한'],
    poll: poll('meet-sketch', [
      ['2026년 11월 8일 (일) 14:00', 4],
      ['2026년 11월 8일 (일) 16:00', 2],
      ['2026년 11월 9일 (월) 14:00', 1],
    ]),
  },
  {
    id: 'meet-dosirak',
    title: '달동네 도시락 나눠 먹기',
    category: '밥',
    coverImage: GATHERING_COVER_PATH['밥'],
    region: '달동네',
    startsAtLabel: '2026년 11월 9일 (월) 12:00',
    startsAtIso: '2026-11-09T12:00',
    capacity: 8,
    currentCount: 8,
    hostNickname: '느린토끼',
    intro: '각자 도시락을 싸 오는 예시예요. 음식 나눔은 강요하지 않고, 알레르기는 도시락 뚜껑에 메모하는 규칙만 적혀 있습니다. 정원은 이미 찬 상태예요.',
    placeLabel: '예시 장소 · 달동네 주민식당 홀',
    safetyFlags: ['공개 장소', '정원 마감', '첫 만남 안내'],
    poll: poll('meet-dosirak', [
      ['2026년 11월 9일 (월) 12:00', 5],
      ['2026년 11월 10일 (화) 12:00', 2],
      ['2026년 11월 9일 (월) 18:30', 1],
    ]),
  },
  {
    id: 'meet-walk',
    title: '한들 공원 가벼운 걷기',
    category: '운동',
    coverImage: GATHERING_COVER_PATH['운동'],
    region: '한들시',
    startsAtLabel: '2026년 11월 7일 (토) 10:00',
    startsAtIso: '2026-11-07T10:00',
    capacity: 10,
    currentCount: 4,
    hostNickname: '구름단추',
    intro: '뛰지 않는 산책 예시예요. 40분 정도 밝은 순환로만 걷고, 중간 벤치에서 물을 마셔요. 운동 복장은 편한 신발이면 됩니다.',
    placeLabel: '예시 장소 · 한들 잔디광장 입구',
    safetyFlags: ['공개 장소', '낮 시간', '첫 만남 안내'],
    poll: poll('meet-walk', [
      ['2026년 11월 7일 (토) 10:00', 3],
      ['2026년 11월 7일 (토) 16:00', 2],
      ['2026년 11월 14일 (토) 10:00', 1],
    ]),
  },
  {
    id: 'meet-reading',
    title: '별포 문장 나눔 스터디',
    category: '스터디',
    coverImage: GATHERING_COVER_PATH['스터디'],
    region: '별포구',
    startsAtLabel: '2026년 11월 12일 (목) 19:00',
    startsAtIso: '2026-11-12T19:00',
    capacity: 6,
    currentCount: 3,
    hostNickname: '새벽페이지',
    intro: '같은 짧은 글을 읽고 마음에 남은 문장 하나만 말하는 예시예요. 책 제목은 모임 전날 예시 공지로 정한다고 적어 두었습니다. 발언은 돌아가며 2분.',
    placeLabel: '가상 상호 · 등대국물 안쪽 테이블',
    safetyFlags: ['공개 장소', '소규모', '첫 만남 안내'],
    poll: poll('meet-reading', [
      ['2026년 11월 12일 (목) 19:00', 3],
      ['2026년 11월 13일 (금) 19:00', 2],
      ['2026년 11월 15일 (일) 15:00', 1],
    ]),
  },
  {
    id: 'meet-frame',
    title: '온기동 액자 이야기',
    category: '문화',
    coverImage: GATHERING_COVER_PATH['문화'],
    region: '온기동',
    startsAtLabel: '2026년 11월 14일 (토) 15:00',
    startsAtIso: '2026-11-14T15:00',
    capacity: 8,
    currentCount: 5,
    hostNickname: '보리산책',
    intro: '가상 전시실을 40분 보고, 카페에서 인상 깊었던 색만 이야기하는 예시예요. 미술 지식은 필요 없고, 조용히 듣기만 해도 됩니다.',
    placeLabel: '가상 상호 · 골목액자',
    safetyFlags: ['공개 장소', '실내', '첫 만남 안내'],
    poll: poll('meet-frame', [
      ['2026년 11월 14일 (토) 15:00', 4],
      ['2026년 11월 14일 (토) 17:00', 1],
      ['2026년 11월 21일 (토) 15:00', 2],
    ]),
  },
  {
    id: 'meet-board',
    title: '파도읍 보드 한 판',
    category: '취미',
    coverImage: GATHERING_COVER_PATH['취미'],
    region: '파도읍',
    startsAtLabel: '2026년 11월 15일 (일) 13:30',
    startsAtIso: '2026-11-15T13:30',
    capacity: 6,
    currentCount: 2,
    hostNickname: '노란우산',
    intro: '규칙이 한 장으로 끝나는 협동 게임 예시예요. 승패보다 설명 시간을 맞추는 게 목적입니다. 게임은 장소에서 빌리는 설정이에요.',
    placeLabel: '가상 상호 · 인화되지않은',
    safetyFlags: ['공개 장소', '소규모', '첫 만남 안내'],
    poll: poll('meet-board', [
      ['2026년 11월 15일 (일) 13:30', 2],
      ['2026년 11월 15일 (일) 16:00', 2],
      ['2026년 11월 16일 (월) 19:00', 1],
    ]),
  },
  {
    id: 'meet-brunch',
    title: '노을구 늦은 브런치',
    category: '밥',
    coverImage: GATHERING_COVER_PATH['밥'],
    region: '노을구',
    startsAtLabel: '2026년 11월 16일 (월) 11:00',
    startsAtIso: '2026-11-16T11:00',
    capacity: 8,
    currentCount: 7,
    hostNickname: '민트도장',
    intro: '메뉴는 따뜻한 수프와 빵으로 통일한 예시예요. 주류는 없고, 자리는 창가 공용석입니다. 한 자리만 비어 있어요.',
    placeLabel: '가상 상호 · 첫오븐',
    safetyFlags: ['공개 장소', '거의 마감', '첫 만남 안내'],
    poll: poll('meet-brunch', [
      ['2026년 11월 16일 (월) 11:00', 4],
      ['2026년 11월 17일 (화) 11:00', 2],
      ['2026년 11월 16일 (월) 13:00', 1],
    ]),
  },
  {
    id: 'meet-stretch',
    title: '달동네 아침 스트레칭',
    category: '운동',
    coverImage: GATHERING_COVER_PATH['운동'],
    region: '달동네',
    startsAtLabel: '2026년 11월 11일 (수) 07:30',
    startsAtIso: '2026-11-11T07:30',
    recruitmentEndsAt: '2026-11-01T18:00',
    capacity: 12,
    currentCount: 5,
    hostNickname: '파란의자',
    intro: '매트 없이 서서 하는 20분 예시예요. 통증이 있으면 동작을 쉬고, 강사는 없습니다. 모임장이 박자만 세는 설정입니다. 모집 마감 시각은 이미 지난 예시예요.',
    placeLabel: '예시 장소 · 달동네 광장',
    safetyFlags: ['공개 장소', '아침 시간', '첫 만남 안내'],
    poll: poll('meet-stretch', [
      ['2026년 11월 11일 (수) 07:30', 3],
      ['2026년 11월 12일 (목) 07:30', 2],
      ['2026년 11월 11일 (수) 18:30', 1],
    ]),
  },
  {
    id: 'meet-words',
    title: '한들 단어장 30분',
    category: '스터디',
    coverImage: GATHERING_COVER_PATH['스터디'],
    region: '한들시',
    startsAtLabel: '2026년 11월 18일 (수) 19:30',
    startsAtIso: '2026-11-18T19:30',
    capacity: 7,
    currentCount: 4,
    hostNickname: '따뜻한식빵',
    intro: '각자 단어 5개만 가져와 뜻을 맞추는 예시예요. 시험 준비 여부는 묻지 않고, 모르는 단어는 그냥 넘어갑니다.',
    placeLabel: '가상 상호 · 나무그늘',
    safetyFlags: ['공개 장소', '짧은 모임', '첫 만남 안내'],
    poll: poll('meet-words', [
      ['2026년 11월 18일 (수) 19:30', 3],
      ['2026년 11월 19일 (목) 19:30', 2],
      ['2026년 11월 18일 (수) 12:30', 1],
    ]),
  },
  {
    id: 'meet-screen',
    title: '별포 영화 엔딩 이야기',
    category: '문화',
    coverImage: GATHERING_COVER_PATH['문화'],
    region: '별포구',
    startsAtLabel: '2026년 11월 20일 (금) 18:00',
    startsAtIso: '2026-11-20T18:00',
    recruitmentClosed: true,
    capacity: 9,
    currentCount: 3,
    hostNickname: '포근담요',
    intro: '상영은 하지 않고, 이미 본 영화의 마지막 장면만 말하는 예시예요. 결말을 듣기 싫은 사람은 그 순서에 자리를 비워도 됩니다. 이 예시는 모집을 끝낸 상태예요.',
    placeLabel: '가상 상호 · 창틈레코드',
    safetyFlags: ['공개 장소', '실내', '첫 만남 안내'],
    poll: poll('meet-screen', [
      ['2026년 11월 20일 (금) 18:00', 2],
      ['2026년 11월 21일 (토) 14:00', 3],
      ['2026년 11월 22일 (일) 15:00', 1],
    ]),
  },
  {
    id: 'meet-past-tea',
    title: '온기동 식은 차 모임',
    category: '문화',
    coverImage: GATHERING_COVER_PATH['문화'],
    region: '온기동',
    startsAtLabel: '2026년 10월 18일 (일) 15:00',
    startsAtIso: '2026-10-18T15:00',
    recruitmentClosed: true,
    ended: true,
    demoAttended: true,
    capacity: 6,
    currentCount: 4,
    hostNickname: '유리주전자',
    intro: '이미 끝난 예시예요. 따뜻한 차 한 잔을 두고 오늘의 색만 말하고 헤어진 모임입니다. 이 데모에서는 내가 참가 확정된 사람으로 후기를 쓸 수 있어요.',
    placeLabel: '가상 상호 · 식은주전자',
    safetyFlags: ['종료된 모임', '공개 장소', '후기 예시'],
    poll: poll('meet-past-tea', [
      ['2026년 10월 18일 (일) 15:00', 3],
      ['2026년 10월 18일 (일) 17:00', 1],
      ['2026년 10월 17일 (토) 15:00', 1],
    ]),
  },
  {
    id: 'meet-past-walk',
    title: '파도읍 짧은 방파제 걷기',
    category: '운동',
    coverImage: GATHERING_COVER_PATH['운동'],
    region: '파도읍',
    startsAtLabel: '2026년 10월 24일 (토) 16:00',
    startsAtIso: '2026-10-24T16:00',
    recruitmentClosed: true,
    ended: true,
    demoAttended: true,
    capacity: 8,
    currentCount: 5,
    hostNickname: '조개단추',
    intro: '이미 끝난 낮 산책 예시예요. 방파제 끝의 벤치까지만 걷고 각자의 일정으로 흩어진 설정입니다. 참가 확정된 데모 계정으로 후기를 남길 수 있어요.',
    placeLabel: '예시 장소 · 파도읍 서쪽 벤치',
    safetyFlags: ['종료된 모임', '낮 시간', '후기 예시'],
    poll: poll('meet-past-walk', [
      ['2026년 10월 24일 (토) 16:00', 4],
      ['2026년 10월 24일 (토) 10:00', 1],
      ['2026년 10월 25일 (일) 16:00', 1],
    ]),
  },
  {
    id: 'meet-past-read',
    title: '노을구 짧은 문장 낭독',
    category: '스터디',
    coverImage: GATHERING_COVER_PATH['스터디'],
    region: '노을구',
    startsAtLabel: '2026년 10월 28일 (수) 19:00',
    startsAtIso: '2026-10-28T19:00',
    recruitmentClosed: true,
    ended: true,
    capacity: 6,
    currentCount: 3,
    hostNickname: '책갈피',
    intro: '이미 끝난 낭독 예시예요. 가져온 문장 하나만 읽고 끝낸 모임입니다. 이 데모에서는 내가 참가 확정자가 아니라 후기를 쓸 수 없어요.',
    placeLabel: '가상 상호 · 낮은책상',
    safetyFlags: ['종료된 모임', '공개 장소', '후기 잠금'],
    poll: poll('meet-past-read', [
      ['2026년 10월 28일 (수) 19:00', 2],
      ['2026년 10월 28일 (수) 20:00', 1],
      ['2026년 10월 29일 (목) 19:00', 1],
    ]),
  },
];

export type DemoReviewSeed = {
  id: string;
  gatheringId: string;
  nickname: string;
  stars: number;
  body: string;
  atLabel: string;
};

export const DEMO_REVIEWS: readonly DemoReviewSeed[] = [
  {
    id: 'rev-tea-1',
    gatheringId: 'meet-past-tea',
    nickname: '솜사탕',
    stars: 5,
    body: '창가 자리가 조용해서 처음인데도 말하기 편했어요.',
    atLabel: '2026-10-18 17:10',
  },
  {
    id: 'rev-tea-2',
    gatheringId: 'meet-past-tea',
    nickname: '작은램프',
    stars: 4,
    body: '차는 각자 시켰고, 약속한 한 시간 안에 끝났어요.',
    atLabel: '2026-10-18 18:02',
  },
  {
    id: 'rev-walk-1',
    gatheringId: 'meet-past-walk',
    nickname: '밤산책',
    stars: 4,
    body: '코스가 짧고 사람 있는 길이어서 마음이 놓였어요.',
    atLabel: '2026-10-24 17:20',
  },
  {
    id: 'rev-walk-2',
    gatheringId: 'meet-past-walk',
    nickname: '종이배',
    stars: 5,
    body: '중간에 벤치에서 쉬자는 안내가 미리 있어서 좋았어요.',
    atLabel: '2026-10-24 18:05',
  },
  {
    id: 'rev-read-1',
    gatheringId: 'meet-past-read',
    nickname: '도란도란',
    stars: 4,
    body: '한 문장만 읽어서 부담이 적었습니다.',
    atLabel: '2026-10-28 20:10',
  },
  {
    id: 'rev-read-2',
    gatheringId: 'meet-past-read',
    nickname: '하얀봉투',
    stars: 3,
    body: '자리는 조용했는데 문장 순서가 조금 헷갈렸어요.',
    atLabel: '2026-10-28 20:40',
  },
];

export function findCourse(id: string): DateCourse | undefined {
  return DEMO_COURSES.find((course) => course.id === id);
}

/** 카드에 보이는 좋아요·추천의 데모 시작값. 내 반응은 localStorage에서만 더한다. */
export type ReactionSeed = {
  likes: number;
  recommends: number;
  /** 최신순. 앞쪽 코스·모임이 더 최근 */
  listedAt: string;
};

export const DEMO_REACTION_SEED: Record<string, ReactionSeed> = {
  'course-neoul-tea': { likes: 18, recommends: 11, listedAt: '2026-10-28T11:00' },
  'course-dal-market': { likes: 9, recommends: 14, listedAt: '2026-10-26T19:30' },
  'course-handle-picnic': { likes: 22, recommends: 6, listedAt: '2026-10-24T13:10' },
  'course-byeol-night': { likes: 7, recommends: 19, listedAt: '2026-10-22T20:40' },
  'course-ongi-craft': { likes: 15, recommends: 9, listedAt: '2026-10-20T15:20' },
  'course-pado-film': { likes: 4, recommends: 8, listedAt: '2026-10-18T18:00' },
  'course-neoul-morning': { likes: 11, recommends: 3, listedAt: '2026-10-16T09:10' },
  'course-dal-rain': { likes: 13, recommends: 16, listedAt: '2026-10-14T16:45' },
  'meet-sketch': { likes: 20, recommends: 12, listedAt: '2026-10-30T10:00' },
  'meet-dosirak': { likes: 8, recommends: 5, listedAt: '2026-10-27T12:10' },
  'meet-walk': { likes: 14, recommends: 10, listedAt: '2026-10-25T08:40' },
  'meet-reading': { likes: 6, recommends: 9, listedAt: '2026-10-23T19:00' },
  'meet-frame': { likes: 17, recommends: 7, listedAt: '2026-10-21T17:20' },
  'meet-board': { likes: 5, recommends: 4, listedAt: '2026-10-19T15:00' },
  'meet-brunch': { likes: 11, recommends: 13, listedAt: '2026-10-17T11:30' },
  'meet-stretch': { likes: 3, recommends: 2, listedAt: '2026-10-15T07:10' },
  'meet-words': { likes: 9, recommends: 6, listedAt: '2026-10-13T18:20' },
  'meet-screen': { likes: 7, recommends: 8, listedAt: '2026-10-11T20:00' },
  'meet-past-tea': { likes: 16, recommends: 11, listedAt: '2026-10-09T16:00' },
  'meet-past-walk': { likes: 4, recommends: 3, listedAt: '2026-10-07T09:30' },
  'meet-past-read': { likes: 10, recommends: 9, listedAt: '2026-10-05T19:40' },
};
