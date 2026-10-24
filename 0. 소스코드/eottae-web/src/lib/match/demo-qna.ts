// ============================================================
//  저장 경로: src/lib/match/demo-qna.ts
//  담당: 오하율 · MATCH-009 (프로필 문답 · 궁합)
//  역할: 프로필 문답 40문항 DEMO 데이터 + 카테고리/관계 매핑.
//
//  [DEMO 경고] 문항·보기는 개발용 초안이다. 최종 문구는 운영/기획이 확정.
//  실제 저장/조회는 주한태 API로 대체(문항 id + 선택지 id 저장, 답변 삭제).
//  [규칙] 궁합은 '겹친 답 개수'(사실)만. 일치율 % 금지(브랜드 가이드).
//  [랜덤] 추천 질문 셔플은 화면에서 클라이언트 마운트 후 수행(hydration 안전).
// ============================================================

import type {
  QnaCategory,
  QnaQuestion,
  RelationGoal,
} from './types';

// ---- 카테고리 라벨(탭 표시) ----
export const QNA_CATEGORY_LABELS: Record<QnaCategory, string> = {
  lifestyle: '라이프스타일',
  love: '연애',
  date: '데이트',
  marriage: '결혼',
};

/** '전체' 포함 탭 순서. */
export const QNA_TABS: ReadonlyArray<{ id: 'all' | QnaCategory; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'lifestyle', label: '라이프스타일' },
  { id: 'love', label: '연애' },
  { id: 'marriage', label: '결혼' },
  { id: 'date', label: '데이트' },
];

// ---- 관계 목적 -> 추천 질문 우선 카테고리 ----
export const RELATION_TO_CATEGORIES: Record<RelationGoal, QnaCategory[]> = {
  neighbor_friend: ['lifestyle'],
  casual: ['love', 'date'],
  serious: ['love', 'marriage', 'date'],
  open: ['lifestyle', 'love', 'date', 'marriage'],
};

// ---- 동물상 14종 (type 'animal' 전용 보기) ----
export const ANIMAL_FACES: ReadonlyArray<{ id: string; label: string; emoji: string; nuance: string }> = [
  { id: 'dog', label: '강아지상', emoji: '🐶', nuance: '다정·활발' },
  { id: 'cat', label: '고양이상', emoji: '🐱', nuance: '시크·사랑스러움' },
  { id: 'fox', label: '여우상', emoji: '🦊', nuance: '영리·매력' },
  { id: 'bear', label: '곰상', emoji: '🐻', nuance: '든든·편안' },
  { id: 'deer', label: '사슴상', emoji: '🦌', nuance: '순수·우아' },
  { id: 'rabbit', label: '토끼상', emoji: '🐰', nuance: '귀엽·여린' },
  { id: 'wolf', label: '늑대상', emoji: '🐺', nuance: '카리스마' },
  { id: 'hedgehog', label: '고슴도치상', emoji: '🦔', nuance: '까칠하지만 여린' },
  { id: 'otter', label: '수달상', emoji: '🦦', nuance: '장난기·유쾌' },
  { id: 'panda', label: '판다상', emoji: '🐼', nuance: '느긋·사랑받는' },
  { id: 'hamster', label: '햄스터상', emoji: '🐹', nuance: '아담·부지런' },
  { id: 'tiger', label: '호랑이상', emoji: '🐯', nuance: '당당·리더십' },
  { id: 'owl', label: '부엉이상', emoji: '🦉', nuance: '지적·차분' },
  { id: 'dolphin', label: '돌고래상', emoji: '🐬', nuance: '밝고 사교적' },
];

// 4지선다 보기 헬퍼
const o = (id: string, label: string) => ({ id, label });

// ---- 40문항 ----
export const DEMO_QUESTIONS: QnaQuestion[] = [
  // --- 라이프스타일 (11 + 동물상 1 = 12) ---
  { id: 'ls1', category: 'lifestyle', type: 'choice', allowCustom: true,
    question: '주말을 보내는 나만의 방식은?',
    options: [o('a', '집에서 느긋하게 충전해요'), o('b', '밖으로 나가 활동해요'), o('c', '계획을 세워 알차게'), o('d', '발길 닿는 대로')] },
  { id: 'ls2', category: 'lifestyle', type: 'choice', allowCustom: true,
    question: '스트레스를 푸는 방법은?',
    options: [o('a', '혼자만의 시간을 가져요'), o('b', '사람들과 수다 떨어요'), o('c', '운동으로 땀 흘려요'), o('d', '먹거나 쇼핑해요')] },
  { id: 'ls3', category: 'lifestyle', type: 'choice', allowCustom: true,
    question: '돈을 쓸 때 나는?',
    options: [o('a', '경험에 투자해요'), o('b', '갖고 싶은 건 사요'), o('c', '일단 저축부터'), o('d', '가끔은 플렉스')] },
  { id: 'ls4', category: 'lifestyle', type: 'choice', allowCustom: true,
    question: '친구들 사이에서 나는?',
    options: [o('a', '분위기 메이커'), o('b', '이끄는 리더'), o('c', '잘 들어주는 사람'), o('d', '마이페이스')] },
  { id: 'ls5', category: 'lifestyle', type: 'choice', allowCustom: true,
    question: '새로운 걸 시작할 때 나는?',
    options: [o('a', '일단 도전해요'), o('b', '신중히 계획해요'), o('c', '정보를 모아봐요'), o('d', '주변을 따라가요')] },
  { id: 'ls6', category: 'lifestyle', type: 'choice', allowCustom: false,
    question: '아침형 vs 저녁형?',
    options: [o('a', '아침형이에요'), o('b', '저녁형이에요'), o('c', '그때그때 달라요'), o('d', '밤샘도 거뜬')] },
  { id: 'ls7', category: 'lifestyle', type: 'choice', allowCustom: true,
    question: '혼자 여행 간다면 스타일은?',
    options: [o('a', '빡빡한 계획형'), o('b', '즉흥 자유형'), o('c', '휴양·힐링'), o('d', '액티비티 위주')] },
  { id: 'ls8', category: 'lifestyle', type: 'choice', allowCustom: false,
    question: 'SNS를 쓰는 방식은?',
    options: [o('a', '적극 공유해요'), o('b', '눈팅 위주'), o('c', '거의 안 해요'), o('d', '비공개·소수에게만')] },
  { id: 'ls9', category: 'lifestyle', type: 'choice', allowCustom: true,
    question: '반려동물에 대한 생각은?',
    options: [o('a', '이미 키우고 있어요'), o('b', '키우고 싶어요'), o('c', '좋아하지만 여건상'), o('d', '잘 모르겠어요')] },
  { id: 'ls10', category: 'lifestyle', type: 'choice', allowCustom: false,
    question: '운동·건강 관리는?',
    options: [o('a', '꾸준히 관리해요'), o('b', '가끔 생각날 때'), o('c', '활동적이라 따로 안 해요'), o('d', '관심은 많지 않아요')] },
  { id: 'ls11', category: 'lifestyle', type: 'choice', allowCustom: false,
    question: '혼자만의 시간이 필요한 정도는?',
    options: [o('a', '많이 필요해요'), o('b', '적당히 필요해요'), o('c', '함께가 더 좋아요'), o('d', '상황에 따라요')] },
  { id: 'ls12', category: 'lifestyle', type: 'choice', allowCustom: false,
    question: '음주는 어느 정도 즐기는 편이에요?',
    options: [o('a', '거의 안 마셔요'), o('b', '가끔 분위기로'), o('c', '즐기는 편이에요'), o('d', '상황에 따라요')] },
  { id: 'ls_animal', category: 'lifestyle', type: 'animal', allowCustom: false,
    question: '내 연애 스타일을 동물상으로 표현하면?',
    options: ANIMAL_FACES.map((a) => ({ id: a.id, label: a.label, emoji: a.emoji })) },

  // --- 연애 (10) ---
  { id: 'lv1', category: 'love', type: 'choice', allowCustom: true,
    question: '연애할 때 연락 빈도는 어느 정도가 좋아요?',
    options: [o('a', '소소한 이야기도 자주'), o('b', '중요한 건 공유하면 돼요'), o('c', '각자 일상에 집중'), o('d', '크게 중요하지 않아요')] },
  { id: 'lv2', category: 'love', type: 'choice', allowCustom: true,
    question: '애정 표현은 어떻게 하는 편이에요?',
    options: [o('a', '말로 자주 표현해요'), o('b', '스킨십으로'), o('c', '행동·챙김으로'), o('d', '선물·이벤트로')] },
  { id: 'lv3', category: 'love', type: 'choice', allowCustom: true,
    question: '다툰 뒤 화해는 어떻게 하는 편이에요?',
    options: [o('a', '그 자리에서 바로 풀어요'), o('b', '시간을 두고 차분히'), o('c', '편지나 메시지로'), o('d', '먼저 사과하는 편')] },
  { id: 'lv4', category: 'love', type: 'choice', allowCustom: true,
    question: '연인과 이상적인 거리감은?',
    options: [o('a', '매일 붙어 있고 싶어요'), o('b', '적당한 거리가 좋아요'), o('c', '각자 시간이 중요해요'), o('d', '자유롭게')] },
  { id: 'lv5', category: 'love', type: 'choice', allowCustom: true,
    question: '질투를 느낄 때 나는?',
    options: [o('a', '솔직하게 표현해요'), o('b', '속으로 삭여요'), o('c', '대화로 풀어요'), o('d', '잘 안 느껴요')] },
  { id: 'lv6', category: 'love', type: 'choice', allowCustom: true,
    question: '연애에서 가장 중요한 가치는?',
    options: [o('a', '신뢰'), o('b', '설렘'), o('c', '안정감'), o('d', '함께 성장')] },
  { id: 'lv7', category: 'love', type: 'choice', allowCustom: true,
    question: '서운할 때 표현하는 방식은?',
    options: [o('a', '바로 말해요'), o('b', '티가 나는 편'), o('c', '혼자 삭이다 터져요'), o('d', '대수롭지 않게 넘겨요')] },
  { id: 'lv8', category: 'love', type: 'choice', allowCustom: false,
    question: '기념일을 챙기는 편이에요?',
    options: [o('a', '꼭 챙겨요'), o('b', '상대가 챙기면 좋아요'), o('c', '부담스러워요'), o('d', '그때그때 달라요')] },
  { id: 'lv9', category: 'love', type: 'choice', allowCustom: true,
    question: '연인의 이성 친구에 대한 생각은?',
    options: [o('a', '쿨하게 괜찮아요'), o('b', '선은 있어야죠'), o('c', '조금 불편해요'), o('d', '상황 봐서')] },
  { id: 'lv10', category: 'love', type: 'choice', allowCustom: true,
    question: '장거리 연애에 대한 생각은?',
    options: [o('a', '사랑이면 가능해요'), o('b', '많이 힘들 것 같아요'), o('c', '해봤는데 괜찮았어요'), o('d', '피하고 싶어요')] },

  // --- 데이트 (8) ---
  { id: 'dt1', category: 'date', type: 'choice', allowCustom: true,
    question: '이상적인 데이트 코스는?',
    options: [o('a', '맛집 탐방'), o('b', '전시·문화 데이트'), o('c', '집에서 느긋하게'), o('d', '액티비티')] },
  { id: 'dt2', category: 'date', type: 'choice', allowCustom: true,
    question: '첫 데이트로 선호하는 장소는?',
    options: [o('a', '분위기 좋은 카페'), o('b', '맛집'), o('c', '가벼운 산책'), o('d', '전시·공연')] },
  { id: 'dt3', category: 'date', type: 'choice', allowCustom: true,
    question: '데이트 비용은 어떻게 하는 게 좋아요?',
    options: [o('a', '더치페이'), o('b', '번갈아 내기'), o('c', '여유 있는 사람이 더'), o('d', '그때그때')] },
  { id: 'dt4', category: 'date', type: 'choice', allowCustom: false,
    question: '데이트 빈도는 어느 정도가 좋아요?',
    options: [o('a', '주 2~3회'), o('b', '주 1회'), o('c', '격주 정도'), o('d', '상황에 따라')] },
  { id: 'dt5', category: 'date', type: 'choice', allowCustom: true,
    question: '데이트할 때 가장 중요한 건?',
    options: [o('a', '대화·교감'), o('b', '분위기'), o('c', '함께하는 활동'), o('d', '맛있는 음식')] },
  { id: 'dt6', category: 'date', type: 'choice', allowCustom: false,
    question: '즉흥 데이트 vs 계획 데이트?',
    options: [o('a', '즉흥이 설레요'), o('b', '계획이 편해요'), o('c', '반반이 좋아요'), o('d', '상대에 맞춰요')] },
  { id: 'dt7', category: 'date', type: 'choice', allowCustom: true,
    question: '함께 가보고 싶은 여행지 유형은?',
    options: [o('a', '바다·휴양'), o('b', '도시 탐방'), o('c', '자연·캠핑'), o('d', '해외')] },
  { id: 'dt8', category: 'date', type: 'choice', allowCustom: false,
    question: '데이트 중 휴대폰 사용에 대한 생각은?',
    options: [o('a', '거의 안 봐요'), o('b', '필요할 때만'), o('c', '자주 보는 편'), o('d', '크게 신경 안 써요')] },

  // --- 결혼 (9) ---
  { id: 'mr1', category: 'marriage', type: 'choice', allowCustom: true,
    question: '결혼관에서 가장 중요한 건?',
    options: [o('a', '사랑'), o('b', '안정'), o('c', '가치관 일치'), o('d', '현실 조건')] },
  { id: 'mr2', category: 'marriage', type: 'choice', allowCustom: true,
    question: '결혼 시기에 대한 생각은?',
    options: [o('a', '빠를수록 좋아요'), o('b', '30대 중반쯤'), o('c', '천천히 하고 싶어요'), o('d', '비혼도 고려해요')] },
  { id: 'mr3', category: 'marriage', type: 'choice', allowCustom: true,
    question: '결혼 후 맞벌이에 대한 생각은?',
    options: [o('a', '당연히 맞벌이'), o('b', '외벌이도 괜찮아요'), o('c', '상황에 따라'), o('d', '아직 모르겠어요')] },
  { id: 'mr4', category: 'marriage', type: 'choice', allowCustom: true,
    question: '자녀 계획에 대한 생각은?',
    options: [o('a', '꼭 갖고 싶어요'), o('b', '1명 정도'), o('c', '딩크도 좋아요'), o('d', '아직 모르겠어요')] },
  { id: 'mr5', category: 'marriage', type: 'choice', allowCustom: true,
    question: '결혼 후 양가 가족과의 관계는?',
    options: [o('a', '가깝게 지내고 싶어요'), o('b', '적당한 거리로'), o('c', '독립적으로'), o('d', '상황에 따라')] },
  { id: 'mr6', category: 'marriage', type: 'choice', allowCustom: true,
    question: '집안일 분담에 대한 생각은?',
    options: [o('a', '5:5 공평하게'), o('b', '잘하는 사람이 더'), o('c', '번갈아 가며'), o('d', '외주도 활용')] },
  { id: 'mr7', category: 'marriage', type: 'choice', allowCustom: true,
    question: '결혼 후 돈 관리는 어떻게?',
    options: [o('a', '공동 통장'), o('b', '각자 관리'), o('c', '한 명이 관리'), o('d', '비율로 분담')] },
  { id: 'mr8', category: 'marriage', type: 'choice', allowCustom: true,
    question: '결혼 후 거주 형태 선호는?',
    options: [o('a', '아파트'), o('b', '주택'), o('c', '도심'), o('d', '자연 근처')] },
  { id: 'mr9', category: 'marriage', type: 'choice', allowCustom: true,
    question: '결혼에서 타협할 수 없는 한 가지는?',
    options: [o('a', '신뢰·정직'), o('b', '경제 관념'), o('c', '가족관'), o('d', '생활 습관')] },
];

// ---- DEMO: 내가 이미 답한 문항 (목록의 '답변 완료' 표시용) ----
export const DEMO_MY_ANSWERS: Record<string, { optionId: string | null; customText?: string }> = {
  lv1: { optionId: 'b' },
  lv6: { optionId: 'a' },
  ls1: { optionId: 'a' },
  ls3: { optionId: 'a' },
  dt1: { optionId: 'b' },
  mr1: { optionId: 'c' },
};

/** 전체 문항 수 · 답변 수(진행률 표시). */
export const DEMO_QNA_TOTAL = DEMO_QUESTIONS.length;
export const DEMO_QNA_ANSWERED = Object.keys(DEMO_MY_ANSWERS).length;
