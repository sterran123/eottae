'use client';

import React, { useState, useEffect, useRef } from 'react';
import type {
  Invitation,
  InvitationBgmpreset,
  InvitationLayoutStyle,
  InvitationSectionKey,
  InvitationThemeId,
  AnimationEffectType,
  SectionCustomMap,
  SectionFontOption,
  PhotoFrameStyle,
  CalendarStyle,
  GalleryViewMode,
  ThemeCustomStyle,
} from '@/lib/invitations/types';
import { getThemePreset, THEME_MASTER_PRESETS } from '@/lib/invitations/theme-presets';
import InvitationCardRenderer from './InvitationCardRenderer';

interface InvitationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: Invitation;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/eottae';

const THEME_OPTIONS = Object.values(THEME_MASTER_PRESETS).map((p) => ({
  id: p.id,
  name: p.name,
  sub: p.sub,
  icon: p.icon,
}));

const LAYOUT_OPTIONS: { id: InvitationLayoutStyle; label: string; desc: string }[] = [
  { id: 'classic', label: '클래식 스크롤', desc: '연속된 우아한 전통 스크롤' },
  { id: 'modern', label: '모던 플로팅 카드', desc: '각 섹션이 입체 카드로 분리' },
  { id: 'minimal', label: '미니멀 매거진', desc: '여백과 타이포 중심의 매거진' },
];

const BGM_OPTIONS: { id: InvitationBgmpreset; label: string; icon: string; desc: string }[] = [
  { id: 'romantic', label: '멘델스존: 축혼 행진곡 (Wedding March)', icon: '🎺', desc: '결혼식의 정석 웅장한 행진곡' },
  { id: 'bach_air', label: '바흐: G선상의 아리아 (Air on G String)', icon: '🎻', desc: '고결하고 우아한 클래식 현악' },
  { id: 'canon', label: '파헬벨: 캐논 변주곡 (Pachelbel Canon)', icon: '🎼', desc: '맑고 감미로운 감성 피아노' },
  { id: 'piano', label: '쇼팽: 녹턴 Op.9 No.2 (Chopin Nocturne)', icon: '🎹', desc: '낭만적인 야상곡 피아노' },
  { id: 'thousand_years', label: '크리스티나 페리: A Thousand Years', icon: '💖', desc: '영원을 약속하는 로맨틱 발라드' },
  { id: 'acoustic', label: '폴킴: 너를 만나 (Acoustic Guitar)', icon: '🎸', desc: '따뜻하고 포근한 어쿠스틱 선율' },
  { id: 'spring_waltz', label: '봄날의 왈츠 (Spring Waltz)', icon: '🌸', desc: '경쾌하고 설레는 웨딩 왈츠' },
  { id: 'none', label: '무음 (배경음악 끔)', icon: '🔇', desc: '소리 재생 없음' },
];

const ANIMATION_OPTIONS: { id: AnimationEffectType; label: string; icon: string; desc: string }[] = [
  { id: 'petals', label: '벚꽃잎 날림', icon: '🌸', desc: '화사한 분홍 꽃잎' },
  { id: 'sparkles', label: '별빛 스파클', icon: '✨', desc: '골드 반짝이 별빛' },
  { id: 'snow', label: '로맨틱 눈꽃', icon: '❄️', desc: '겨울 감성 스노우' },
  { id: 'envelope', label: '봉투 왁스씰', icon: '✉️', desc: '실링 개봉 인트로' },
  { id: 'none', label: '효과 끔', icon: '🚫', desc: '시각 효과 없음' },
];

// 사용자 레포지토리(WeddingPlatform)의 16종 색상 프리셋
const COLOR_THEME_PRESETS = [
  { id: 'minimal', name: 'Minimal', bg: '#FFFFFF', primary: '#111827', text: '#111827', accent: '#4B5563' },
  { id: 'classic', name: 'Classic', bg: '#FDFBFB', primary: '#633231', text: '#1f2937', accent: '#8B5E5C' },
  { id: 'brown', name: 'Brown', bg: '#F9F7F6', primary: '#734F40', text: '#292524', accent: '#9C7E6B' },
  { id: 'spring', name: 'Spring', bg: '#F8F9F5', primary: '#647352', text: '#1c1917', accent: '#919C84' },
  { id: 'blue', name: 'Blue', bg: '#F5F7F9', primary: '#4A6375', text: '#0f172a', accent: '#768999' },
  { id: 'lavender', name: 'Lavender', bg: '#F7F6F9', primary: '#61557A', text: '#1e1b4b', accent: '#8A819C' },
  { id: 'pink', name: 'Pink', bg: '#FCF6F7', primary: '#C54B64', text: '#881337', accent: '#D68A9A' },
  { id: 'dark', name: 'Dark', bg: '#111827', primary: '#F3F4F6', text: '#F9FAFB', accent: '#9CA3AF' },
  { id: 'vivid', name: 'Vivid', bg: '#FFF5F8', primary: '#D81B60', text: '#1f2937', accent: '#EC407A' },
  { id: 'lemon', name: 'Lemon', bg: '#FEFDEB', primary: '#827717', text: '#27272a', accent: '#AFB42B' },
  { id: 'mint', name: 'Mint', bg: '#F2FAF9', primary: '#00695C', text: '#134e4a', accent: '#26A69A' },
  { id: 'cherry', name: 'Cherry', bg: '#FFF5F5', primary: '#C62828', text: '#1f2937', accent: '#EF5350' },
  { id: 'dusty-rose', name: 'Dusty-rose', bg: '#F9F4F5', primary: '#A64452', text: '#1f2937', accent: '#C27E88' },
  { id: 'sage', name: 'Sage', bg: '#F6F7F6', primary: '#708271', text: '#14532d', accent: '#9BA89C' },
  { id: 'charcoal', name: 'Charcoal', bg: '#F9FAFB', primary: '#374151', text: '#111827', accent: '#6B7280' },
  { id: 'slate', name: 'Slate', bg: '#F8FAFC', primary: '#475569', text: '#0f172a', accent: '#94A3B8' },
];

// 20대 세련된 신랑신부 비주얼 프리셋 사진 컬렉션 (Pagesisters 급 퀄리티, basePath 완벽 연동)
const PRESET_COUPLE_PHOTOS = [
  {
    id: 'studio-peach',
    label: '스튜디오 피치',
    tag: '아이돌 비주얼',
    url: `${basePath}/invitations/wedding-studio-peach.jpg`,
    desc: '네이비 슬림 턱시도 & 화이트 실크 드레스 20대 커플',
  },
  {
    id: 'green-canopy',
    label: '그린 캐노피',
    tag: '내추럴 가든',
    url: `${basePath}/invitations/wedding-green-canopy.jpg`,
    desc: '야외 플라워 아치 아래 환하게 웃는 20대 신랑신부',
  },
  {
    id: 'sunset',
    label: '노을 로맨스',
    tag: '시네마틱 한강',
    url: `${basePath}/invitations/wedding-sunset.jpg`,
    desc: '황금빛 한강 일몰 빛을 등진 20대 커플 포옹',
  },
  {
    id: 'cherry-blossom',
    label: '봄날 벚꽃',
    tag: '화사한 핑크',
    url: `${basePath}/invitations/wedding-cherry-blossom.jpg`,
    desc: '만개한 벚꽃길 아래 다정한 눈맞춤 20대 신랑신부',
  },
  {
    id: 'night-garden',
    label: '달빛 정원',
    tag: '야간 조명',
    url: `${basePath}/invitations/wedding-night-garden.jpg`,
    desc: '로맨틱한 페어리 전구 가든 20대 커플',
  },
  {
    id: 'bench-quiet',
    label: '콰이어트 벤치',
    tag: '세련된 미니멀',
    url: `${basePath}/invitations/wedding-bench-quiet.jpg`,
    desc: '정갈한 원목 벤치에 나란히 앉은 20대 커플',
  },
  {
    id: 'tape-bw',
    label: '흑백 필름',
    tag: '클래식 빈티지',
    url: `${basePath}/invitations/wedding-tape-bw.jpg`,
    desc: '감각적인 빈티지 흑백 스튜디오 스냅',
  },
  {
    id: 'luxury-hotel',
    label: '럭셔리 호텔',
    tag: '그랜드볼룸',
    url: `${basePath}/invitations/wedding-luxury-hotel.jpg`,
    desc: '웅장한 샹들리에 버진로드 20대 커플',
  },
];

const SECTION_LABELS: Record<InvitationSectionKey, string> = {
  greeting: '1. 모시는 글 (소중한 분들을 초대합니다)',
  schedule: '2. 예식 일시 & 달력 (D-Day)',
  gallery: '3. 갤러리 1: 신랑·신부 웨딩 갤러리 (공식 화보)',
  guest_snap: '4. 갤러리 2: 하객 실시간 현장 스냅 (참여형 앨범)',
  location: '5. 오시는 길 & 약도 (인터랙티브 지도)',
  guestbook: '6. 실시간 축하 방명록 (하객 덕담)',
  account: '7. 마음 전하실 곳 (계좌번호 안내)',
  rsvp_preview: '8. 참석 여부 회신 (RSVP)',
};

export default function InvitationPreviewModal({
  isOpen,
  onClose,
  invitation,
}: InvitationPreviewModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<InvitationThemeId>(
    invitation.themeId || 'spring-blossom'
  );
  const [selectedLayout, setSelectedLayout] = useState<InvitationLayoutStyle>(
    invitation.layoutStyle || 'classic'
  );
  const [selectedBgm, setSelectedBgm] = useState<InvitationBgmpreset>(
    invitation.bgmPreset || 'romantic'
  );
  const [activeEffect, setActiveEffect] = useState<AnimationEffectType>('petals');

  // 모달 진입 시 살짝 반투명 마우스 스크롤 유도 오버레이
  const [isPreviewUnlocked, setIsPreviewUnlocked] = useState<boolean>(false);

  // 사진 프레임 스타일 (5종 + 풀스크린)
  const [frameStyle, setFrameStyle] = useState<PhotoFrameStyle>('arch');
  const [frameColor, setFrameColor] = useState<string>('#ffffff');

  // 캘린더 스타일
  const [calendarStyle, setCalendarStyle] = useState<CalendarStyle>('classic_table');

  // 갤러리 뷰 모드
  const [galleryMode, setGalleryMode] = useState<GalleryViewMode>('carousel');

  // 사용자 레포 색상 테마 커스텀 상태 (배경색 실시간 변경)
  const [customThemeStyle, setCustomThemeStyle] = useState<ThemeCustomStyle>({
    bgColor: '#ffffff',
    primaryColor: '#111827',
    textColor: '#1f2937',
    accentColor: '#e11d48',
  });

  // 메인 커버 사진 직접 첨부(파일 업로드) & 20대 프리셋 교체 상태
  const [customMainPhoto, setCustomMainPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const phoneScreenRef = useRef<HTMLDivElement | null>(null);

  // 사용자 직접 BGM 음원 파일 업로드 상태
  const [customBgmUrl, setCustomBgmUrl] = useState<string | undefined>(undefined);
  const [customBgmTitle, setCustomBgmTitle] = useState<string | undefined>(undefined);
  const bgmFileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('사진 파일 용량은 15MB 이하만 업로드 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setCustomMainPhoto(dataUrl);
        setIsPreviewUnlocked(true);
        if (phoneScreenRef.current) {
          phoneScreenRef.current.scrollTop = 0;
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomBgmUrl(url);
    setCustomBgmTitle(file.name);
    setSelectedBgm('custom');
  };

  const [sectionOrder, setSectionOrder] = useState<InvitationSectionKey[]>([
    'greeting',
    'schedule',
    'gallery',
    'guest_snap',
    'location',
    'guestbook',
    'account',
    'rsvp_preview',
  ]);

  // 아코디언 확장 상태
  const [expandedSection, setExpandedSection] = useState<InvitationSectionKey | null>('gallery');

  // 섹션별 세부 커스텀
  const [customConfigs, setCustomConfigs] = useState<SectionCustomMap>({
    greeting: {
      title: '소중한 분들을 초대합니다',
      body: '서로 마주 보며 다져온 사랑을 이제 한곳을 바라보며 걸어가고자 합니다.\n소중한 걸음으로 축복해 주시면 더없는 기쁨으로 간직하겠습니다.',
      fontFamily: 'serif',
      textColor: '#1f2937',
      accentColor: '#e11d48',
    },
    schedule: {
      title: '예식 일시 & 달력',
      body: '소중한 날, 따뜻한 마음으로 함께해 주세요',
      fontFamily: 'serif',
      textColor: '#1f2937',
      accentColor: '#e11d48',
      calendarStyle: 'classic_table',
    },
    gallery: {
      title: '우리의 아름다운 순간 (신랑·신부 공식 화보)',
      body: '함께 걸어온 설레는 시간들을 기록합니다',
      galleryMode: 'carousel',
      frameStyle: 'arch',
    },
    guest_snap: {
      title: '하객 실시간 현장 스냅 (참여형 앨범)',
      body: '오늘 예식 현장에서 촬영하신 소중한 사진들을 올려주세요!',
    },
    location: {
      title: '오시는 길 & 약도',
      body: '서울특별시 노을구 달빛로 123 (노을역 3번 출구 도보 5분)',
      fontFamily: 'sans',
      textColor: '#1f2937',
      accentColor: '#2563eb',
    },
    guestbook: {
      title: '축하의 한마디 (실시간 방명록)',
      body: '신랑 신부의 새로운 출발을 따뜻한 메시지로 축복해 주세요.',
    },
    account: {
      title: '마음 전하실 곳',
      body: '축복해 주시는 따뜻한 마음을 소중히 간직하겠습니다.',
      fontFamily: 'sans',
      textColor: '#1f2937',
      accentColor: '#d97706',
    },
    rsvp_preview: {
      title: '참석 여부 회신 (RSVP)',
      body: '원활한 예식 준비와 연회 식사 좌석 안내를 위해 참석 여부를 미리 알려주시면 감사하겠습니다.',
      fontFamily: 'sans',
      textColor: '#1f2937',
      accentColor: '#e11d48',
    },
  });

  // 애니메이션 파티클 캔버스
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 드래그 앤 드롭 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 스마트폰 뷰포트 영구 애니메이션 캔버스 (스크롤 시 끊김 문제 해결)
  useEffect(() => {
    if (!isOpen || activeEffect === 'none' || activeEffect === 'envelope') return;
    const canvas = fxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const w = (canvas.width = canvas.parentElement?.clientWidth || 380);
    const h = (canvas.height = canvas.parentElement?.clientHeight || 740);

    type Particle = {
      x: number;
      y: number;
      r: number;
      speedY: number;
      speedX: number;
      rot: number;
      rotSpeed: number;
      opacity: number;
      color: string;
    };

    const count = activeEffect === 'petals' ? 26 : activeEffect === 'sparkles' ? 42 : 36;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: activeEffect === 'petals' ? 4 + Math.random() * 5 : 2 + Math.random() * 3,
      speedY: 0.6 + Math.random() * 1.4,
      speedX: (Math.random() - 0.5) * 0.9,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      opacity: 0.35 + Math.random() * 0.55,
      color:
        activeEffect === 'petals'
          ? ['#fbcfe8', '#f472b6', '#fda4af', '#fecdd3'][Math.floor(Math.random() * 4)]
          : activeEffect === 'sparkles'
          ? ['#fde047', '#fef08a', '#ffffff', '#fbbf24'][Math.floor(Math.random() * 4)]
          : '#ffffff',
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rot += p.rotSpeed;

        if (p.y > h + 10) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        if (p.x > w + 10) p.x = -10;
        else if (p.x < -10) p.x = w + 10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;

        if (activeEffect === 'petals') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.5, p.r * 0.85, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (activeEffect === 'sparkles') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-p.r * 1.8, 0);
          ctx.lineTo(p.r * 1.8, 0);
          ctx.moveTo(0, -p.r * 1.8);
          ctx.lineTo(0, p.r * 1.8);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeEffect]);

  // 테마 변경 시 프리셋 동기화
  const applyTheme = (themeId: InvitationThemeId) => {
    setSelectedTheme(themeId);
    const preset = getThemePreset(themeId);
    setSelectedLayout(preset.defaultLayout);
    setActiveEffect(preset.defaultEffect);
    setFrameStyle(preset.defaultFrameStyle);
    setCalendarStyle(preset.defaultCalendarStyle);
    setGalleryMode(preset.defaultGalleryMode);
    setSelectedBgm(preset.defaultBgm);

    setCustomThemeStyle({
      bgColor: preset.defaultBgColor,
      textColor: preset.defaultTextColor,
      accentColor: preset.defaultAccentColor,
      primaryColor: preset.defaultTextColor,
    });

    if (phoneScreenRef.current) {
      phoneScreenRef.current.scrollTop = 0;
    }
  };

  // 모달 오픈 시 최상단 스크롤
  useEffect(() => {
    if (isOpen && phoneScreenRef.current) {
      phoneScreenRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    setSectionOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const toggleAccordion = (key: InvitationSectionKey) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  const updateCustomField = (
    key: InvitationSectionKey,
    field: string,
    value: string
  ) => {
    setCustomConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const applyColorTheme = (p: typeof COLOR_THEME_PRESETS[number]) => {
    setCustomThemeStyle({
      bgColor: p.bg,
      primaryColor: p.primary,
      textColor: p.text,
      accentColor: p.accent,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="inv-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inv-preview-modal-title"
    >
      <div className="inv-modal-backdrop" onClick={onClose} />

      <div className="inv-modal-container inv-modal-container--expanded">
        {/* 상단 헤더 */}
        <header className="inv-modal-header">
          <div className="inv-modal-title-area">
            <span className="inv-badge-chip">실시간 체험 스튜디오</span>
            <h3 id="inv-preview-modal-title">청첩장 디자인 &amp; 레이아웃 실시간 프리뷰</h3>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
              • 배경색·사진 프레임·레이아웃·BGM 실시간 즉시 반영
            </span>
          </div>
          <button
            type="button"
            className="inv-modal-close-btn"
            onClick={onClose}
            aria-label="미리보기 닫기"
          >
            ✕
          </button>
        </header>

        {/* 본문: 좌측 와이드 툴바 + 우측 고화질 스마트폰 뷰어 */}
        <div className="inv-modal-body">
          {/* 좌측 컨트롤러 */}
          <aside className="inv-modal-toolbar">
            {/* 0. 메인 커버 사진 직접 첨부(파일 업로드) & 20대 프리셋 교체 */}
            <div className="inv-ctrl-group inv-ctrl-group--highlight">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="inv-ctrl-label" style={{ margin: 0 }}>
                  <span>📸 메인 사진 직접 첨부 &amp; 교체</span>
                  <span className="inv-pill-tag">실시간 반영</span>
                </span>
                {customMainPhoto && (
                  <button
                    type="button"
                    className="inv-reset-btn"
                    onClick={() => {
                      setCustomMainPhoto(null);
                      if (phoneScreenRef.current) phoneScreenRef.current.scrollTop = 0;
                    }}
                    title="기본 테마 원본 사진으로 복원"
                  >
                    기본 사진 복원
                  </button>
                )}
              </div>

              <p style={{ fontSize: 11, color: '#4b5563', margin: '0 0 10px', lineHeight: 1.45 }}>
                내 PC/스마트폰의 실제 웨딩 사진을 첨부하거나, 세련된 20대 비주얼 프리셋으로 즉시 교체해 보세요.
              </p>

              {/* 파일 직접 첨부 업로드 박스 */}
              <div
                className="inv-photo-upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
                <div className="inv-dropzone-content">
                  <div className="inv-dropzone-icon">📷</div>
                  <div className="inv-dropzone-text">
                    <strong>내 웨딩 사진 파일 첨부하기</strong>
                    <span>클릭하여 사진 파일(JPG/PNG/WEBP)을 선택하세요</span>
                  </div>
                  <button
                    type="button"
                    className="inv-dropzone-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    파일 찾기
                  </button>
                </div>
              </div>

              {/* 20대 세련된 신랑신부 비주얼 프리셋 */}
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1f2937', display: 'block', marginBottom: 6 }}>
                  ✨ 20대 세련된 신랑신부 비주얼 프리셋 (클릭 시 즉시 교체)
                </span>
                <div className="inv-preset-photos-grid">
                  {PRESET_COUPLE_PHOTOS.map((photo) => {
                    const isSelected = customMainPhoto === photo.url;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        className={`inv-preset-photo-card ${isSelected ? 'inv-preset-photo-card--active' : ''}`}
                        onClick={() => {
                          setCustomMainPhoto(photo.url);
                          setIsPreviewUnlocked(true);
                          if (phoneScreenRef.current) {
                            phoneScreenRef.current.scrollTop = 0;
                          }
                        }}
                        title={`${photo.desc} (${photo.tag})`}
                      >
                        <div
                          className="inv-preset-photo-thumb"
                          style={{ backgroundImage: `url(${photo.url})` }}
                        >
                          {isSelected && <span className="inv-photo-check-badge">✓ 적용</span>}
                        </div>
                        <span className="inv-preset-photo-title">{photo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* [사용자 핵심 요구] 사진 프레임 형태 (5종) & 테두리 색상 선택 */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1f2937', display: 'block', marginBottom: 6 }}>
                  🖼️ 사진 프레임 형태 (5종) &amp; 테두리 색상
                </span>
                <div className="inv-frame-style-grid">
                  {[
                    { id: 'arch' as PhotoFrameStyle, label: '모던 아치', icon: '🏛️' },
                    { id: 'life4cut' as PhotoFrameStyle, label: '인생네컷', icon: '🎞️' },
                    { id: 'polaroid' as PhotoFrameStyle, label: '폴라로이드', icon: '📷' },
                    { id: 'gold_round' as PhotoFrameStyle, label: '골드 앤틱 타원', icon: '👑' },
                    { id: 'square' as PhotoFrameStyle, label: '클래식 스퀘어', icon: '🖼️' },
                    { id: 'full' as PhotoFrameStyle, label: '풀스크린 커버', icon: '📱' },
                  ].map((fs) => (
                    <button
                      key={fs.id}
                      type="button"
                      className={`inv-frame-card-btn ${frameStyle === fs.id ? 'inv-frame-card-btn--active' : ''}`}
                      onClick={() => {
                        setFrameStyle(fs.id);
                        if (phoneScreenRef.current) phoneScreenRef.current.scrollTop = 0;
                      }}
                    >
                      <span className="inv-frame-card-btn__icon">{fs.icon}</span>
                      <span className="inv-frame-card-btn__label">{fs.label}</span>
                    </button>
                  ))}
                </div>

                <div className="inv-frame-color-picker-row" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#4b5563', marginRight: 6 }}>프레임 테두리:</span>
                  {[
                    { color: '#ffffff', label: '화이트' },
                    { color: '#0f172a', label: '블랙' },
                    { color: '#fce7f3', label: '핑크' },
                    { color: '#dcfce7', label: '민트' },
                    { color: '#fef9c3', label: '옐로우' },
                    { color: '#d4af37', label: '골드' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      className={`inv-frame-color-dot ${frameColor === c.color ? 'inv-frame-color-dot--active' : ''}`}
                      style={{ backgroundColor: c.color }}
                      onClick={() => setFrameColor(c.color)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 1. 디자인 테마 선택 (16종) */}
            <div className="inv-ctrl-group">
              <span className="inv-ctrl-label">
                <span>디자인 테마 선택</span>
                <span className="inv-pill-tag">즉시 반영</span>
              </span>
              <div className="inv-themes-grid">
                {THEME_OPTIONS.map((theme) => {
                  const isActive = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      className={`inv-theme-choice-btn ${isActive ? 'inv-theme-choice-btn--active' : ''}`}
                      onClick={() => applyTheme(theme.id as InvitationThemeId)}
                    >
                      <span className="inv-theme-icon">{theme.icon}</span>
                      <div className="inv-theme-info">
                        <strong className="inv-theme-name">{theme.name}</strong>
                        <span className="inv-theme-sub">{theme.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 배경색 & 색상 테마 커스텀 */}
            <div className="inv-ctrl-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="inv-ctrl-label" style={{ margin: 0 }}>
                  <span>청첩장 배경색 &amp; 색상 테마</span>
                </span>
                <button
                  type="button"
                  className="inv-reset-btn"
                  onClick={() =>
                    setCustomThemeStyle({
                      bgColor: '#ffffff',
                      primaryColor: '#111827',
                      textColor: '#1f2937',
                      accentColor: '#e11d48',
                    })
                  }
                >
                  기본색 초기화
                </button>
              </div>

              {/* 16종 색상 테마 드롭다운 셀렉트 */}
              <div className="inv-theme-select-container">
                <select
                  className="inv-color-theme-dropdown"
                  value={
                    COLOR_THEME_PRESETS.find(
                      (p) =>
                        p.bg.toLowerCase() === customThemeStyle.bgColor.toLowerCase() &&
                        p.accent.toLowerCase() === customThemeStyle.accentColor.toLowerCase()
                    )?.id || ''
                  }
                  onChange={(e) => {
                    const preset = COLOR_THEME_PRESETS.find((p) => p.id === e.target.value);
                    if (preset) applyColorTheme(preset);
                  }}
                  aria-label="청첩장 색상 테마 프리셋 선택"
                >
                  <option value="" disabled>
                    🎨 색상 테마 프리셋 선택 (16종)
                  </option>
                  {COLOR_THEME_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (배경 {p.bg} / 악센트 {p.accent})
                    </option>
                  ))}
                </select>
              </div>

              {/* 미니 팔레트 칩 그리드 */}
              <div className="inv-color-chips-grid">
                {COLOR_THEME_PRESETS.map((p) => {
                  const isSelected =
                    p.bg.toLowerCase() === customThemeStyle.bgColor.toLowerCase() &&
                    p.accent.toLowerCase() === customThemeStyle.accentColor.toLowerCase();
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`inv-color-preset-card ${isSelected ? 'inv-color-preset-card--selected' : ''}`}
                      onClick={() => applyColorTheme(p)}
                      title={`${p.name} (배경: ${p.bg}, 포인트: ${p.accent})`}
                    >
                      <div className="inv-palette-dots">
                        <span className="inv-palette-dot" style={{ backgroundColor: p.bg }} />
                        <span className="inv-palette-dot" style={{ backgroundColor: p.primary }} />
                        <span className="inv-palette-dot" style={{ backgroundColor: p.accent }} />
                      </div>
                      <span className="inv-color-preset-name">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 웨딩 시각 효과 (애니메이션) */}
            <div className="inv-ctrl-group">
              <span className="inv-ctrl-label">
                <span>웨딩 시각 효과 (애니메이션)</span>
                <span style={{ color: 'var(--brand)', fontSize: 11, fontWeight: 700 }}>
                  화면 끝까지 끊김 없음
                </span>
              </span>
              <div className="inv-fx-grid">
                {ANIMATION_OPTIONS.map((eff) => (
                  <button
                    key={eff.id}
                    type="button"
                    className={`inv-fx-card-btn ${activeEffect === eff.id ? 'inv-fx-card-btn--active' : ''}`}
                    onClick={() => setActiveEffect(eff.id)}
                  >
                    <span className="inv-fx-card-btn__icon">{eff.icon}</span>
                    <div className="inv-fx-card-btn__text">
                      <span className="inv-fx-card-btn__title">{eff.label}</span>
                      <span className="inv-fx-card-btn__desc">{eff.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. 레이아웃 스타일 */}
            <div className="inv-ctrl-group">
              <span className="inv-ctrl-label">
                <span>레이아웃 스타일 (구조 변형)</span>
              </span>
              <div className="inv-layout-choices-grid">
                {LAYOUT_OPTIONS.map((layout) => {
                  const isActive = selectedLayout === layout.id;
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      className={`inv-layout-choice-btn ${isActive ? 'inv-layout-choice-btn--active' : ''}`}
                      onClick={() => setSelectedLayout(layout.id)}
                    >
                      <strong className="inv-layout-choice-title">{layout.label}</strong>
                      <span className="inv-layout-choice-desc">{layout.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. [사용자 지적 반영] BGM 드롭다운 & 음원 파일 직접 업로드 */}
            <div className="inv-ctrl-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="inv-ctrl-label" style={{ margin: 0 }}>
                  <span>배경음악 (BGM) 드롭다운 &amp; 직접 첨부</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>인기 웨딩 명곡</span>
              </div>

              {/* BGM 선택 드롭다운 */}
              <div style={{ marginBottom: 10 }}>
                <select
                  className="inv-field-input"
                  value={selectedBgm}
                  onChange={(e) => setSelectedBgm(e.target.value as InvitationBgmpreset)}
                  style={{ fontSize: 13, height: 40 }}
                >
                  {BGM_OPTIONS.map((bgm) => (
                    <option key={bgm.id} value={bgm.id}>
                      {bgm.icon} {bgm.label} ({bgm.desc})
                    </option>
                  ))}
                  {customBgmTitle && (
                    <option value="custom">🎵 [직접 업로드 음원] {customBgmTitle}</option>
                  )}
                </select>
              </div>

              {/* 사용자 커스텀 BGM 파일 업로드 */}
              <div className="inv-bgm-upload-row">
                <input
                  ref={bgmFileInputRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={handleBgmUpload}
                />
                <button
                  type="button"
                  className="inv-btn-secondary"
                  style={{ width: '100%', minHeight: 36, fontSize: 12 }}
                  onClick={() => bgmFileInputRef.current?.click()}
                >
                  🎵 내 BGM 음원 파일 첨부 (.mp3, .wav, .m4a)
                </button>
                {customBgmTitle && (
                  <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, textAlign: 'center' }}>
                    ✓ 적용된 음원: {customBgmTitle}
                  </div>
                )}
              </div>
            </div>

            {/* 6. 섹션 순서 & 상세 디자인 커스텀 (불필요 화살표 완전 제거 및 자연스러운 배치) */}
            <div className="inv-ctrl-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="inv-ctrl-label" style={{ margin: 0 }}>
                  <span>섹션 순서 &amp; 상세 디자인 커스텀</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>
                  ⋮⋮ 드래그 이동 • 클릭하여 편집
                </span>
              </div>

              <div className="inv-section-order-list">
                {sectionOrder.map((secKey, idx) => {
                  const isExpanded = expandedSection === secKey;
                  const isDragging = draggedIndex === idx;
                  const isOver = dragOverIndex === idx;
                  const config = customConfigs[secKey] || {};

                  return (
                    <div
                      key={secKey}
                      className={`inv-section-accordion-wrap ${
                        isDragging ? 'inv-section-item--dragging' : ''
                      } ${isOver ? 'inv-section-item--dragover' : ''}`}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                    >
                      {/* 섹션 아이템 바 */}
                      <div className="inv-section-order-item">
                        <div
                          className="inv-drag-handle"
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragEnd={handleDragEnd}
                          title="마우스로 끌어서 순서 변경"
                          aria-label="드래그하여 순서 변경"
                        >
                          <span className="inv-drag-dots">⋮⋮</span>
                        </div>

                        <div
                          className="inv-section-title-wrap"
                          onClick={() => toggleAccordion(secKey)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') toggleAccordion(secKey);
                          }}
                        >
                          <span className="inv-section-name">
                            {SECTION_LABELS[secKey]}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`inv-accordion-toggle-btn ${isExpanded ? 'inv-accordion-toggle-btn--active' : ''}`}
                          onClick={() => toggleAccordion(secKey)}
                          title={isExpanded ? '접기' : '디자인 커스텀 열기'}
                        >
                          {isExpanded ? '닫기 ▲' : '편집 ▼'}
                        </button>
                      </div>

                      {/* 아코디언 상세 편집 패널 */}
                      {isExpanded && (
                        <div className="inv-accordion-drawer">
                          <div className="inv-accordion-field">
                            <label className="inv-field-label">표시 타이틀</label>
                            <input
                              type="text"
                              className="inv-field-input"
                              value={config.title || ''}
                              onChange={(e) => updateCustomField(secKey, 'title', e.target.value)}
                              placeholder={SECTION_LABELS[secKey]}
                            />
                          </div>

                          {/* 달력 형태 선택 */}
                          {secKey === 'schedule' && (
                            <div className="inv-accordion-field">
                              <label className="inv-field-label">달력 디자인 형태</label>
                              <div className="inv-calendar-style-row">
                                {[
                                  { id: 'classic_table' as CalendarStyle, label: '클래식 테이블' },
                                  { id: 'heart_stamp' as CalendarStyle, label: '하트 스탬프' },
                                  { id: 'box_badge' as CalendarStyle, label: '모던 박스' },
                                  { id: 'minimal_text' as CalendarStyle, label: '미니멀 텍스트' },
                                ].map((cal) => (
                                  <button
                                    key={cal.id}
                                    type="button"
                                    className={`inv-cal-choice-btn ${calendarStyle === cal.id ? 'inv-cal-choice-btn--active' : ''}`}
                                    onClick={() => setCalendarStyle(cal.id)}
                                  >
                                    {cal.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 갤러리 1 뷰 모드 */}
                          {secKey === 'gallery' && (
                            <div className="inv-accordion-field">
                              <label className="inv-field-label">갤러리 1 화보 뷰 모드</label>
                              <div className="inv-gallery-mode-row">
                                {[
                                  { id: 'carousel' as GalleryViewMode, label: '슬라이드 캐러셀' },
                                  { id: 'life4cut_strip' as GalleryViewMode, label: '인생네컷 필름' },
                                  { id: 'grid3x3' as GalleryViewMode, label: '3x3 그리드' },
                                ].map((gm) => (
                                  <button
                                    key={gm.id}
                                    type="button"
                                    className={`inv-gal-mode-btn ${galleryMode === gm.id ? 'inv-gal-mode-btn--active' : ''}`}
                                    onClick={() => setGalleryMode(gm.id)}
                                  >
                                    {gm.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 내용 문구 */}
                          <div className="inv-accordion-field">
                            <label className="inv-field-label">상세 본문 문구</label>
                            <textarea
                              className="inv-field-textarea"
                              rows={3}
                              value={config.body || ''}
                              onChange={(e) => updateCustomField(secKey, 'body', e.target.value)}
                              placeholder="표시될 문구를 입력하세요"
                            />
                          </div>

                          {/* 폰트 스타일 */}
                          <div className="inv-accordion-field">
                            <label className="inv-field-label">타이포그래피 (폰트 스타일)</label>
                            <div className="inv-font-choice-row">
                              {[
                                { id: 'serif' as SectionFontOption, label: '우아한 명조', font: 'serif' },
                                { id: 'sans' as SectionFontOption, label: '깔끔한 고딕', font: 'sans-serif' },
                                { id: 'script' as SectionFontOption, label: '감성 필름체', font: 'cursive' },
                              ].map((fontItem) => (
                                <button
                                  key={fontItem.id}
                                  type="button"
                                  className={`inv-font-btn ${config.fontFamily === fontItem.id ? 'inv-font-btn--active' : ''}`}
                                  style={{ fontFamily: fontItem.font }}
                                  onClick={() => updateCustomField(secKey, 'fontFamily', fontItem.id)}
                                >
                                  {fontItem.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* 우측 스마트폰 디바이스 목업 (최상위 고정 파티클 캔버스 배치로 스크롤 시에도 끊김 없음) */}
          <main className="inv-modal-viewer-area">
            <div className="inv-phone-mockup">
              {/* 상단 노치 바 */}
              <div className="inv-phone-notch">
                <div className="inv-phone-notch__bar" />
              </div>

              {/* 스마트폰 디바이스 목업 전체를 덮는 최상위 고정 캔버스 */}
              {activeEffect !== 'none' && activeEffect !== 'envelope' && (
                <canvas ref={fxCanvasRef} className="inv-phone-fx-overlay" />
              )}

              {/* 모달 진입 시 은은한 반투명 + 마우스 스크롤 유도 오버레이 */}
              {!isPreviewUnlocked && (
                <div
                  className="inv-phone-tap-hint-overlay"
                  onClick={() => setIsPreviewUnlocked(true)}
                  onTouchStart={() => setIsPreviewUnlocked(true)}
                  onWheel={() => setIsPreviewUnlocked(true)}
                  role="button"
                  tabIndex={0}
                  title="화면을 터치하거나 스크롤하여 둘러보기"
                >
                  <div className="inv-tap-hint-card">
                    {/* 마우스 스크롤 휠 애니메이션 */}
                    <div className="inv-mouse-scroll-icon">
                      <div className="inv-mouse-wheel-dot" />
                    </div>
                    <div className="inv-tap-hint-text">
                      <strong>스크롤하여 둘러보기</strong>
                      <span>화면을 클릭 또는 스크롤하세요</span>
                    </div>
                    <span className="inv-tap-hint-badge">터치하여 시작 ✦</span>
                  </div>
                </div>
              )}

              {/* 스크롤되는 스마트폰 스크린 */}
              <div
                ref={phoneScreenRef}
                className="inv-phone-screen"
                style={{ backgroundColor: customThemeStyle?.bgColor || '#ffffff' }}
                onScroll={() => {
                  if (!isPreviewUnlocked) setIsPreviewUnlocked(true);
                }}
              >
                <InvitationCardRenderer
                  invitation={invitation}
                  previewMode={true}
                  overrideTheme={selectedTheme}
                  overrideLayout={selectedLayout}
                  overrideBgm={selectedBgm}
                  overrideSectionOrder={sectionOrder}
                  sectionCustomMap={customConfigs}
                  activeEffect={activeEffect}
                  frameStyle={frameStyle}
                  frameColor={frameColor}
                  calendarStyle={calendarStyle}
                  galleryMode={galleryMode}
                  customThemeStyle={customThemeStyle}
                  customMainPhoto={customMainPhoto || undefined}
                  customBgmUrl={customBgmUrl}
                  customBgmTitle={customBgmTitle}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
