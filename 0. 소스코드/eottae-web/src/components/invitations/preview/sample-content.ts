// 미리보기 전용 예시. Invitation 타입에 없는 이야기·질문·순서·안내·가상 계좌·방명록만 둔다.
// 오하율이 타입으로 올릴지는 나중에 정한다. 실존 인물·실주소·실은행은 넣지 않는다.

import type { Invitation } from '@/lib/invitations/types';
import { inviteAsset } from './invite-asset';
import { coupleFromHost } from './invite-format';

export const INVITE_PREVIEW_MESSAGES = {
  empty: '아직 적힌 초대장이 없어요.',
  loading: '불러오는 중이에요.',
  saveFail: '이 브라우저에 저장하지 못했어요.',
} as const;

export type InvitePhoto = {
  src: string;
  alt: string;
};

export type InviteParents = {
  groomLine: string;
  brideLine: string;
};

export type InviteOrderIcon = 'enter' | 'rite' | 'photo' | 'meal';

export type InvitePreviewContent = {
  kicker: string;
  cover: InvitePhoto;
  parents?: InviteParents;
  gallery: InvitePhoto[];
  story: { when: string; title: string; text: string; photo: InvitePhoto }[];
  faq: { question: string; answer: string }[];
  order: { title: string; text: string; icon: InviteOrderIcon }[];
  venue: {
    address: string;
    map: InvitePhoto;
    subway: string;
    bus: string;
    parking: string;
  };
  guides: { id: string; label: string; body: string }[];
  accounts: { id: string; sideLabel: string; holder: string; bank: string; masked: string }[];
  guestbook: { id: string; nickname: string; message: string }[];
};

function scene(file: string, alt: string): InvitePhoto {
  return { src: inviteAsset(`/invitations/${file}`), alt };
}

const PARENTS: Record<string, InviteParents> = {
  'demo-inv-1': {
    groomLine: '이하늘 · 이수풀의 장남',
    brideLine: '박도란 · 박이슬의 장녀',
  },
};

function venueCopy(invitation: Invitation): InvitePreviewContent['venue'] {
  const label = invitation.venueLabel.trim() || '가상 예식장';
  if (invitation.id === 'demo-inv-2') {
    return {
      address: '달동네 별빛길 7, 별빛하우스 야외가든',
      map: scene('map-hall.svg', `${label} 주변을 단순하게 그린 일러스트. 실제 지도가 아니에요.`),
      subway: '가상 달동네선 별빛역 1번 출구에서 오르막으로 4분이에요.',
      bus: '별빛02. 별빛하우스 앞 정류장에서 내려요.',
      parking: '야외가든 옆 자갈 주차장. 가득 차면 걸어서 들어와요.',
    };
  }
  if (invitation.id === 'demo-inv-3') {
    return {
      address: '한들시 파도마루길 3, 파도마루 전통연회장',
      map: scene('map-hall.svg', `${label} 주변을 단순하게 그린 일러스트. 실제 지도가 아니에요.`),
      subway: '가상 한들선 파도역 3번 출구에서 마루길로 5분이에요.',
      bus: '파도03. 전통연회장 정류장에서 내려요.',
      parking: '연회장 뒤 공터. 혼례 시간에는 자리를 비워 두는 설정이에요.',
    };
  }
  return {
    address: invitation.venueLabel.includes('온기동')
      ? '온기동 가든길 2, 가든하우스'
      : '노을구 달빛로 18, 달빛웨딩홀 2층 그랜드볼룸',
    map: scene('map-hall.svg', `${label} 주변을 단순하게 그린 일러스트. 실제 지도가 아니에요.`),
    subway: '가상 노을선 노을역 2번 출구에서 달빛로를 따라 6분이에요.',
    bus: '달빛01, 노을간선. 달빛웨딩홀 정류장에서 내려요.',
    parking: '건물 지하 1층부터 3층까지예요. 예식 전후 두 시간은 비워 두는 설정이에요.',
  };
}

export function previewContentFor(invitation: Invitation): InvitePreviewContent {
  const couple = coupleFromHost(invitation.hostNames);
  const groom = couple.groom || '신랑';
  const bride = couple.bride || '신부';
  return {
    kicker: 'two seats, one table',
    cover: scene('cover-evening.svg', '꽃 아치와 빈 의자 둘을 그린 초대장 표지 일러스트'),
    parents: PARENTS[invitation.id],
    gallery: [
      scene('scene-arch.svg', '꽃 아치 일러스트'),
      scene('scene-table.svg', '잔이 둘 놓인 둥근 식탁 일러스트'),
      scene('scene-path.svg', '정원 오솔길 일러스트'),
      scene('scene-window.svg', '창과 화분 일러스트'),
      scene('scene-paper.svg', '봉투와 편지지 일러스트'),
      scene('scene-night.svg', '밤 식탁과 달 일러스트'),
      scene('scene-bouquet.svg', '꽃다발 일러스트'),
      scene('scene-chairs.svg', '마주 본 빈 의자 일러스트'),
      scene('scene-door.svg', '화환이 걸린 문 일러스트'),
    ],
    story: [
      {
        when: '2024년 봄',
        title: '같은 테이블',
        text: '노을구 작은 모임에서 처음 옆자리에 앉았어요.',
        photo: scene('scene-path.svg', '처음 걷던 길을 떠올린 오솔길 일러스트'),
      },
      {
        when: '2025년 가을',
        title: '골목을 먼저',
        text: '예식장 골목을 미리 걸어 보고 이곳을 골랐어요.',
        photo: scene('scene-window.svg', '골목 창을 떠올린 일러스트'),
      },
      {
        when: '2026년 여름',
        title: '식탁 리허설',
        text: '빈 의자를 두고 식순만 조용히 맞춰 봤어요.',
        photo: scene('scene-table.svg', '리허설 식탁 일러스트'),
      },
      {
        when: '2026년 가을',
        title: '청첩을 접다',
        text: '종이에 날짜를 적고 이 초대장을 만들기 시작했어요.',
        photo: scene('scene-paper.svg', '접어 둔 초대장 종이 일러스트'),
      },
    ],
    faq: [
      {
        question: '식사는 어디서 하나요?',
        answer: '예식 뒤 같은 건물 연회장에서 식사해요.',
      },
      {
        question: '주차는 되나요?',
        answer: '건물 지하를 써요. 가득 차면 가상 노을로 공용 주차를 안내하는 설정이에요.',
      },
      {
        question: '아이와 함께 가도 되나요?',
        answer: '함께 오셔도 돼요. 참석 회신 저장은 아직 준비 중이에요.',
      },
      {
        question: '옷은 어떻게 입을까요?',
        answer: '편한 차림이면 충분해요. 예복과 같은 아주 밝은색만 피하면 좋아요.',
      },
      {
        question: '축의는 어떻게 전하나요?',
        answer: '아래 마음 전하기의 번호는 예시은행 가상 계좌예요. 실제 이체는 되지 않아요.',
      },
    ],
    order: [
      { icon: 'enter', title: '입장 (10분)', text: '하객이 자리에 앉고 두 사람이 함께 들어와요.' },
      { icon: 'rite', title: '예식 (30분)', text: '서약과 인사로 예식을 마쳐요.' },
      { icon: 'photo', title: '사진 (20분)', text: '가족 사진 뒤 로비에서 짧게 찍어요.' },
      { icon: 'meal', title: '식사', text: '연회장으로 자리를 옮겨요.' },
    ],
    venue: venueCopy(invitation),
    guides: [
      {
        id: 'booth',
        label: '포토부스',
        body: '로비 오른쪽 커튼 뒤 가상 포토부스예요. 인화는 한 장이고, 줄이 길면 식사 뒤에 와도 돼요.',
      },
      {
        id: 'parking',
        label: '주차',
        body: '지하 1층부터 3층까지예요. 예식 한 시간 전부터 두 시간 동안 비워 두는 설정이고, 실제 주차 안내가 아니에요.',
      },
      {
        id: 'gift',
        label: '답례품',
        body: '출구 테이블에 작은 포장 하나를 두는 설정이에요. 이 데모에는 실제 상품이 없어요.',
      },
    ],
    accounts: [
      { id: 'groom', sideLabel: '신랑 측', holder: groom, bank: '예시은행', masked: '123-****-5678' },
      { id: 'bride', sideLabel: '신부 측', holder: bride, bank: '예시은행', masked: '890-****-4321' },
    ],
    guestbook: [
      { id: 'note-1', nickname: '솜사탕', message: '두 사람 이야기, 예식날 직접 들으러 갈게요.' },
      { id: 'note-2', nickname: '종이배', message: '자리는 맡아 뒀어요. 꽃다발은 제가 안 들고 갈게요.' },
      { id: 'note-3', nickname: '별사탕', message: '식사 시간에 맞춰 조용히 들어올게요.' },
    ],
  };
}
