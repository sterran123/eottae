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

const BGM_OPTIONS: { id: InvitationBgmpreset; label: string; icon: string }[] = [
  { id: 'romantic', label: '웨딩마치 (오케스트라)', icon: '🎺' },
  { id: 'piano', label: '피아노 선율 (감성)', icon: '🎹' },
  { id: 'acoustic', label: '어쿠스틱 기타 (내추럴)', icon: '🎸' },
  { id: 'none', label: '무음 (소리 끔)', icon: '🔇' },
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

// 20대 세련된 신랑신부 비주얼 프리셋 사진 컬렉션 (Pagesisters 급 퀄리티)
const PRESET_COUPLE_PHOTOS = [
  {
    id: 'studio-peach',
    label: '스튜디오 피치',
    tag: '아이돌 비주얼',
    url: '/invitations/wedding-studio-peach.jpg',
    desc: '네이비 슬림 턱시도 & 화이트 실크 드레스 20대 커플',
  },
  {
    id: 'green-canopy',
    label: '그린 캐노피',
    tag: '내추럴 가든',
    url: '/invitations/wedding-green-canopy.jpg',
    desc: '야외 플라워 아치 아래 환하게 웃는 20대 신랑신부',
  },
  {
    id: 'sunset',
    label: '노을 로맨스',
    tag: '시네마틱 한강',
    url: '/invitations/wedding-sunset.jpg',
    desc: '황금빛 한강 일몰 빛을 등진 20대 커플 포옹',
  },
  {
    id: 'cherry-blossom',
    label: '봄날 벚꽃',
    tag: '화사한 핑크',
    url: '/invitations/wedding-cherry-blossom.jpg',
    desc: '만개한 벚꽃길 아래 다정한 눈맞춤 20대 신랑신부',
  },
  {
    id: 'night-garden',
    label: '달빛 정원',
    tag: '야간 조명',
    url: '/invitations/wedding-night-garden.jpg',
    desc: '로맨틱한 페어리 전구 가든 20대 커플',
  },
  {
    id: 'bench-quiet',
    label: '콰이어트 벤치',
    tag: '세련된 미니멀',
    url: '/invitations/wedding-bench-quiet.jpg',
    desc: '정갈한 원목 벤치에 나란히 앉은 20대 커플',
  },
  {
    id: 'tape-bw',
    label: '흑백 필름',
    tag: '클래식 빈티지',
    url: '/invitations/wedding-tape-bw.jpg',
    desc: '감각적인 빈티지 흑백 스튜디오 스냅',
  },
  {
    id: 'luxury-hotel',
    label: '럭셔리 호텔',
    tag: '그랜드볼룸',
    url: '/invitations/wedding-luxury-hotel.jpg',
    desc: '웅장한 샹들리에 버진로드 20대 커플',
  },
];

const SECTION_LABELS: Record<InvitationSectionKey, string> = {
  greeting: '모시는 글 (인사말)',
  schedule: '예식 일시 & 달력',
  gallery: '웨딩 갤러리 (캐러셀/인생네컷)',
  location: '오시는 길 & 약도 지도',
  guestbook: '하객 축하 방명록 (롤링페이퍼)',
  guest_snap: '하객 즉석 스냅 사진 앨범',
  account: '마음 전하실 곳 (계좌)',
  rsvp_preview: '참석 여부 회신 (RSVP)',
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

  // 2번 이미지 요구사항: 모달 진입 시 살짝 반투명 마우스 스크롤 유도 오버레이
  const [isPreviewUnlocked, setIsPreviewUnlocked] = useState<boolean>(false);

  // 사진 프레임 스타일
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

  // [사용자 핵심 요구사항] 메인 커버 사진 직접 첨부(파일 업로드) & 20대 프리셋 교체 상태
  const [customMainPhoto, setCustomMainPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const phoneScreenRef = useRef<HTMLDivElement | null>(null);

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

  const [sectionOrder, setSectionOrder] = useState<InvitationSectionKey[]>([
    'greeting',
    'schedule',
    'gallery',
    'location',
    'guestbook',
    'guest_snap',
    'account',
    'rsvp_preview',
  ]);

  // 아코디언 확장 상태
  const [expandedSection, setExpandedSection] = useState<InvitationSectionKey | null>('location');

  // 섹션별 세부 커스텀
  const [customConfigs, setCustomConfigs] = useState<SectionCustomMap>({
    greeting: {
      title: '소중한 분들을 초대합니다',
      body:
        invitation.greeting ||
        '서로 마주 보며 다져온 사랑을 이제 한곳을 바라보며 걸어가고자 합니다.\n소중한 걸음으로 축복해 주시면 더없는 기쁨으로 간직하겠습니다.',
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
      title: '우리의 아름다운 순간 (갤러리)',
      body: '함께 걸어온 설레는 시간들을 기록합니다',
      galleryMode: 'carousel',
      frameStyle: 'arch',
    },
    location: {
      title: '오시는 길 & 약도',
      body: '서울특별시 노을구 달빛로 123 (노을역 3번 출구 도보 5분)',
      fontFamily: 'sans',
      textColor: '#1f2937',
      accentColor: '#2563eb',
    },
    guestbook: {
      title: '축하의 한마디 (하객 방명록)',
      body: '신랑 신부의 새로운 출발을 따뜻한 메시지로 축복해 주세요.',
    },
    guest_snap: {
      title: '하객 즉석 스냅 앨범',
      body: '오늘 예식 현장에서 촬영하신 소중한 사진들을 올려주세요!',
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
      body: '원활한 예식 준비와 연회 식사 좌석 안내를 위해 참석 여부를 미리 알려주시면 진심으로 감사드리겠습니다.',
      fontFamily: 'sans',
      textColor: '#1f2937',
      accentColor: '#7c3aed',
    },
  });

  // 드래그 앤 드롭 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // [중요 수정] 스크롤 시에도 화면 끝까지 끊김 없이 고정 동작하는 최상위 뷰포트 캔버스
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!fxCanvasRef.current || activeEffect === 'none' || activeEffect === 'envelope') return;
    const canvas = fxCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 390);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 750);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = activeEffect === 'sparkles' ? 50 : 35;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (activeEffect === 'sparkles' ? 4 : 8) + 4,
      speedY: Math.random() * 1.3 + 0.7,
      speedX: Math.sin(Math.random() * 2) * 0.8,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.6 + 0.35,
      pulse: Math.random() * Math.PI,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.015) * 0.5 + p.speedX * 0.3;
        p.rotation += p.rotSpeed;
        p.pulse += 0.05;

        // 화면 하단 끝을 넘어가면 위에서 다시 생성
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (activeEffect === 'petals') {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 182, 193, ${p.opacity * 0.9})`;
          ctx.ellipse(0, 0, p.size, p.size * 1.5, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (activeEffect === 'sparkles') {
          const currentSize = p.size * (0.8 + Math.sin(p.pulse) * 0.35);
          ctx.fillStyle = `rgba(245, 215, 110, ${p.opacity * 0.95})`;
          ctx.beginPath();
          ctx.arc(0, 0, currentSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 245, 180, ${p.opacity * 0.85})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-currentSize, 0);
          ctx.lineTo(currentSize, 0);
          ctx.moveTo(0, -currentSize);
          ctx.lineTo(0, currentSize);
          ctx.stroke();
        } else if (activeEffect === 'snow') {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.95})`;
          ctx.arc(0, 0, p.size / 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeEffect]);

  // 테마 마스터 프리셋 1:1 일괄 동기화 함수
  const applyTheme = (themeId: InvitationThemeId) => {
    const preset = getThemePreset(themeId);
    setSelectedTheme(preset.id);
    setSelectedLayout(preset.defaultLayout);
    setSelectedBgm(preset.defaultBgm);
    setActiveEffect(preset.defaultEffect);
    setFrameStyle(preset.defaultFrameStyle);
    setCalendarStyle(preset.defaultCalendarStyle);
    setGalleryMode(preset.defaultGalleryMode);
    setCustomThemeStyle({
      bgColor: preset.defaultBgColor,
      primaryColor: preset.defaultAccentColor,
      textColor: preset.defaultTextColor,
      accentColor: preset.defaultAccentColor,
    });
    setSectionOrder(preset.defaultSectionOrder);

    // 테마 기본 폰트 및 액센트 색상 섹션 일괄 동기화
    setCustomConfigs((prev) => {
      const next = { ...prev };
      (Object.keys(next) as InvitationSectionKey[]).forEach((key) => {
        if (next[key]) {
          next[key] = {
            ...next[key],
            fontFamily: preset.defaultFont,
            textColor: preset.defaultTextColor,
            accentColor: preset.defaultAccentColor,
          };
        }
      });
      return next;
    });

    setIsPreviewUnlocked(false);
    if (phoneScreenRef.current) {
      phoneScreenRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (invitation) {
      applyTheme(invitation.themeId || 'wax-seal');
      setCustomMainPhoto(null);
    }
  }, [invitation]);

  useEffect(() => {
    if (isOpen && phoneScreenRef.current) {
      phoneScreenRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // HTML5 DnD 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setSectionOrder((prev) => {
      const next = [...prev];
      const [removed] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, removed);
      return next;
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const toggleAccordion = (key: InvitationSectionKey) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  const updateCustomField = (key: InvitationSectionKey, field: string, value: unknown) => {
    setCustomConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  // 색상 테마 프리셋 적용
  const applyColorTheme = (p: typeof COLOR_THEME_PRESETS[number]) => {
    setCustomThemeStyle({
      bgColor: p.bg,
      primaryColor: p.primary,
      textColor: p.text,
      accentColor: p.accent,
    });
  };

  return (
    <div
      className="inv-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inv-preview-modal-title"
    >
      <div className="inv-modal-shell" onClick={(e) => e.stopPropagation()}>
        {/* 상단 헤더 */}
        <header className="inv-modal-header">
          <div className="inv-modal-title-area">
            <span className="inv-badge-chip">실시간 체험 스튜디오</span>
            <h3 id="inv-preview-modal-title">청첩장 디자인 & 레이아웃 실시간 프리뷰</h3>
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
            {/* 0. [사용자 핵심 요구사항] 메인 커버 사진 직접 첨부(파일 업로드) & 20대 프리셋 교체 */}
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

              {/* 현재 사용자 업로드 사진 표시 배너 */}
              {customMainPhoto && (
                <div className="inv-current-photo-banner">
                  <div
                    className="inv-current-photo-mini"
                    style={{ backgroundImage: `url(${customMainPhoto})` }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>✓ 커버 사진 적용 중</div>
                    <div style={{ fontSize: 10, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      우측 청첩장 메인 커버에 실시간 반영되었습니다
                    </div>
                  </div>
                </div>
              )}

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
            </div>

            {/* 1. 웨딩 애니메이션 시각 효과 (2열 와이드 카드 그리드) */}
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

            {/* 2. [사용자 지적 반영] 배경색 & 색상 테마 커스텀 (드롭다운 선택형) */}
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
                <span className="inv-dropdown-carat">▾</span>
              </div>

              {/* 현재 테마 색상 팔레트 미니 바 */}
              <div className="inv-palette-bar">
                <div className="inv-palette-dots-row">
                  <span
                    className="inv-palette-dot"
                    style={{ backgroundColor: customThemeStyle.bgColor, border: '1px solid #cbd5e1' }}
                    title={`배경색: ${customThemeStyle.bgColor}`}
                  />
                  <span
                    className="inv-palette-dot"
                    style={{ backgroundColor: customThemeStyle.primaryColor }}
                    title={`주요색: ${customThemeStyle.primaryColor}`}
                  />
                  <span
                    className="inv-palette-dot"
                    style={{ backgroundColor: customThemeStyle.accentColor }}
                    title={`포인트: ${customThemeStyle.accentColor}`}
                  />
                  <span
                    className="inv-palette-dot"
                    style={{ backgroundColor: customThemeStyle.textColor }}
                    title={`본문글자색: ${customThemeStyle.textColor}`}
                  />
                </div>
                <span className="inv-palette-text">
                  현재 색상: <strong style={{ color: customThemeStyle.accentColor }}>{customThemeStyle.accentColor}</strong> 포인트
                </span>
              </div>

              {/* 직접 색상 지정 행 (가독성/가시성 대폭 향상, 텍스트 겹침 없음) */}
              <div className="inv-custom-colors-row">
                <div className="inv-custom-color-item">
                  <span className="inv-color-item-label">배경색</span>
                  <div className="inv-color-chip-input-wrap">
                    <input
                      type="color"
                      className="inv-native-color-input"
                      value={customThemeStyle.bgColor}
                      onChange={(e) =>
                        setCustomThemeStyle((prev) => ({ ...prev, bgColor: e.target.value }))
                      }
                      title="배경색 직접 지정"
                    />
                    <span className="inv-color-hex-tag">{customThemeStyle.bgColor}</span>
                  </div>
                </div>

                <div className="inv-custom-color-item">
                  <span className="inv-color-item-label">글자색</span>
                  <div className="inv-color-chip-input-wrap">
                    <input
                      type="color"
                      className="inv-native-color-input"
                      value={customThemeStyle.textColor}
                      onChange={(e) =>
                        setCustomThemeStyle((prev) => ({ ...prev, textColor: e.target.value }))
                      }
                      title="글자색 직접 지정"
                    />
                    <span className="inv-color-hex-tag">{customThemeStyle.textColor}</span>
                  </div>
                </div>

                <div className="inv-custom-color-item">
                  <span className="inv-color-item-label">포인트색</span>
                  <div className="inv-color-chip-input-wrap">
                    <input
                      type="color"
                      className="inv-native-color-input"
                      value={customThemeStyle.accentColor}
                      onChange={(e) =>
                        setCustomThemeStyle((prev) => ({ ...prev, accentColor: e.target.value }))
                      }
                      title="포인트색 직접 지정"
                    />
                    <span className="inv-color-hex-tag">{customThemeStyle.accentColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. [사진 프레임 형태 5종] */}
            <div className="inv-ctrl-group">
              <span className="inv-ctrl-label">
                <span>메인 사진 프레임 형태</span>
                <span style={{ color: 'var(--brand)', fontSize: 11 }}>즉각 변경</span>
              </span>
              <div className="inv-frame-choices-grid">
                {[
                  { id: 'arch' as PhotoFrameStyle, label: '모던 아치', icon: '🏛️' },
                  { id: 'life4cut' as PhotoFrameStyle, label: '인생네컷 필름', icon: '🎞️' },
                  { id: 'polaroid' as PhotoFrameStyle, label: '폴라로이드 테이프', icon: '📷' },
                  { id: 'gold_round' as PhotoFrameStyle, label: '골드 앤틱 타원', icon: '👑' },
                  { id: 'square' as PhotoFrameStyle, label: '클래식 스퀘어', icon: '🖼️' },
                ].map((fr) => (
                  <button
                    key={fr.id}
                    type="button"
                    className={`inv-frame-btn ${frameStyle === fr.id ? 'inv-frame-btn--active' : ''}`}
                    onClick={() => setFrameStyle(fr.id)}
                  >
                    <span>{fr.icon}</span>
                    <span>{fr.label}</span>
                  </button>
                ))}
              </div>

              {/* 프레임 테두리 색상 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>프레임 테두리:</span>
                <div className="inv-color-chips-row">
                  {[
                    { label: '순백 화이트', color: '#ffffff' },
                    { label: '클래식 블랙', color: '#18181b' },
                    { label: '로맨틱 핑크', color: '#fbcfe8' },
                    { label: '포레스트 그린', color: '#dcfce7' },
                    { label: '빈티지 베이지', color: '#fef3c7' },
                  ].map((col) => (
                    <button
                      key={col.color}
                      type="button"
                      className={`inv-color-chip ${frameColor === col.color ? 'inv-color-chip--active' : ''}`}
                      style={{ backgroundColor: col.color }}
                      onClick={() => setFrameColor(col.color)}
                      title={col.label}
                    />
                  ))}
                  <input
                    type="color"
                    className="inv-color-picker"
                    value={frameColor}
                    onChange={(e) => setFrameColor(e.target.value)}
                    title="프레임 색상 직접 지정"
                  />
                </div>
              </div>
            </div>

            {/* 4. 디자인 테마 선택 (2열 버튼) */}
            <div className="inv-ctrl-group">
              <span className="inv-ctrl-label">
                <span>디자인 테마 선택</span>
                <span style={{ color: 'var(--brand)', fontSize: 11 }}>즉시 반영</span>
              </span>
              <div className="inv-theme-selector-grid">
                {THEME_OPTIONS.map((theme) => {
                  const isActive = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      className={`inv-theme-choice-btn ${isActive ? 'inv-theme-choice-btn--active' : ''}`}
                      onClick={() => applyTheme(theme.id)}
                    >
                      <span className="inv-theme-choice-btn__icon">{theme.icon}</span>
                      <div className="inv-theme-choice-btn__text">
                        <span className="inv-theme-choice-btn__name">{theme.name}</span>
                        <span className="inv-theme-choice-btn__sub">{theme.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. [2번 이미지 지적 반영] 레이아웃 스타일 (단독 행으로 분리) */}
            <div className="inv-ctrl-group">
              <span className="inv-ctrl-label">
                <span>레이아웃 스타일 (구조 변형)</span>
                <span style={{ color: 'var(--brand)', fontSize: 11 }}>단독 행 분리</span>
              </span>
              <div className="inv-layout-cards-col">
                {LAYOUT_OPTIONS.map((layout) => {
                  const isActive = selectedLayout === layout.id;
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      className={`inv-layout-choice-card ${isActive ? 'inv-layout-choice-card--active' : ''}`}
                      onClick={() => setSelectedLayout(layout.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{layout.id === 'modern' ? '🗂️' : layout.id === 'minimal' ? '📰' : '📜'}</span>
                        <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{layout.label}</strong>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{layout.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. [2번 이미지 지적 반영] 배경음악 BGM 설정 (단독 행으로 분리) */}
            <div className="inv-ctrl-group">
              <span className="inv-ctrl-label">
                <span>배경음악 (BGM) 시연</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>단독 행 분리</span>
              </span>
              <div className="inv-bgm-choices-grid">
                {BGM_OPTIONS.map((bgm) => {
                  const isActive = selectedBgm === bgm.id;
                  return (
                    <button
                      key={bgm.id}
                      type="button"
                      className={`inv-bgm-choice-btn ${isActive ? 'inv-bgm-choice-btn--active' : ''}`}
                      onClick={() => setSelectedBgm(bgm.id)}
                    >
                      <span>{bgm.icon}</span>
                      <span style={{ fontSize: 12 }}>{bgm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. 버거바 드래그 순서 재배치 & 아코디언 편집 */}
            <div className="inv-ctrl-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="inv-ctrl-label" style={{ margin: 0 }}>
                  <span>섹션 순서 & 상세 디자인 커스텀</span>
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
                          <span className="inv-section-index">{idx + 1}.</span>
                          <span className="inv-section-name">
                            {config.title || SECTION_LABELS[secKey]}
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
                              <label className="inv-field-label">달력 표시 디자인 형태</label>
                              <div className="inv-choice-pills-row">
                                {[
                                  { id: 'classic_table' as CalendarStyle, label: '월별 달력 표' },
                                  { id: 'heart_stamp' as CalendarStyle, label: '하트 스탬프' },
                                  { id: 'box_badge' as CalendarStyle, label: 'D-Day 박스' },
                                  { id: 'minimal_text' as CalendarStyle, label: '감성 타이포' },
                                ].map((cal) => (
                                  <button
                                    key={cal.id}
                                    type="button"
                                    className={`inv-choice-pill ${calendarStyle === cal.id ? 'inv-choice-pill--active' : ''}`}
                                    onClick={() => {
                                      setCalendarStyle(cal.id);
                                      updateCustomField(secKey, 'calendarStyle', cal.id);
                                    }}
                                  >
                                    {cal.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 갤러리 모드 선택 */}
                          {secKey === 'gallery' && (
                            <div className="inv-accordion-field">
                              <label className="inv-field-label">사진 갤러리 레이아웃</label>
                              <div className="inv-choice-pills-row">
                                {[
                                  { id: 'carousel' as GalleryViewMode, label: '좌우 슬라이딩 캐러셀' },
                                  { id: 'life4cut_strip' as GalleryViewMode, label: '인생네컷 필름 4컷' },
                                  { id: 'grid3x3' as GalleryViewMode, label: '인스타 6컷 그리드' },
                                ].map((gm) => (
                                  <button
                                    key={gm.id}
                                    type="button"
                                    className={`inv-choice-pill ${galleryMode === gm.id ? 'inv-choice-pill--active' : ''}`}
                                    onClick={() => {
                                      setGalleryMode(gm.id);
                                      updateCustomField(secKey, 'galleryMode', gm.id);
                                    }}
                                  >
                                    {gm.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 본문 문구 수정 */}
                          <div className="inv-accordion-field">
                            <label className="inv-field-label">
                              {secKey === 'greeting'
                                ? '인사말 문구 내용'
                                : secKey === 'location'
                                ? '웨딩홀 상세 주소 (복사 대상)'
                                : secKey === 'account'
                                ? '계좌 안내 전달 문구'
                                : '안내 본문 내용'}
                            </label>
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

          {/* 우측 스마트폰 디바이스 목업 (최상위 고정 파티클 캔버스 배치로 스크롤 시에도 절대 끊김 없음!) */}
          <main className="inv-modal-viewer-area">
            <div className="inv-phone-mockup">
              {/* 상단 노치 바 */}
              <div className="inv-phone-notch">
                <div className="inv-phone-notch__bar" />
              </div>

              {/* [완전 해결] 스마트폰 디바이스 목업 전체를 영구히 덮는 최상위 고정 캔버스 */}
              {activeEffect !== 'none' && activeEffect !== 'envelope' && (
                <canvas ref={fxCanvasRef} className="inv-phone-fx-overlay" />
              )}

              {/* [2번 이미지 요구사항] 모달 진입 시 은은한 반투명 + 마우스 스크롤 유도 오버레이 */}
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
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
