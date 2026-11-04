'use client';

import React, { useState, useEffect, useRef } from 'react';
import type {
  Invitation,
  InvitationSectionKey,
  InvitationThemeId,
  InvitationLayoutStyle,
  InvitationBgmpreset,
  AnimationEffectType,
  SectionCustomMap,
  PhotoFrameStyle,
  CalendarStyle,
  GalleryViewMode,
  ThemeCustomStyle,
} from '@/lib/invitations/types';
import { getThemePreset } from '@/lib/invitations/theme-presets';
import {
  WaxSealBadgeSVG,
  MaskingTapeSVG,
  BridalCoupleStudioSVG,
  BridalCoupleSunsetSVG,
  BridalCoupleForestSVG,
  BridalCoupleGardenHatSVG,
  BridalCoupleBenchSVG,
  BridalCoupleHanbokSVG,
  BridalCoupleBallroomSVG,
} from './ThemeHeroArtworks';

interface InvitationCardRendererProps {
  invitation: Invitation;
  previewMode?: boolean;
  overrideTheme?: InvitationThemeId;
  overrideLayout?: InvitationLayoutStyle;
  overrideBgm?: InvitationBgmpreset;
  overrideSectionOrder?: InvitationSectionKey[];
  sectionCustomMap?: SectionCustomMap;
  activeEffect?: AnimationEffectType;
  frameStyle?: PhotoFrameStyle;
  frameColor?: string;
  calendarStyle?: CalendarStyle;
  galleryMode?: GalleryViewMode;
  customThemeStyle?: ThemeCustomStyle;
  customMainPhoto?: string;
}

interface GuestComment {
  id: string;
  author: string;
  message: string;
  date: string;
  avatar: string;
}

interface GuestPhoto {
  id: string;
  uploader: string;
  caption: string;
  icon: string;
  bg: string;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/eottae';

const imgGreenCanopy = `${basePath}/invitations/wedding-green-canopy.jpg`;
const imgSunset = `${basePath}/invitations/wedding-sunset.jpg`;
const imgStudioPeach = `${basePath}/invitations/wedding-studio-peach.jpg`;
const imgCherryBlossom = `${basePath}/invitations/wedding-cherry-blossom.jpg`;
const imgWaxEnvelope = `${basePath}/invitations/wedding-wax-envelope.jpg`;
const imgTapeBw = `${basePath}/invitations/wedding-tape-bw.jpg`;
const imgForestLaugh = `${basePath}/invitations/wedding-forest-laugh.jpg`;
const imgBenchQuiet = `${basePath}/invitations/wedding-bench-quiet.jpg`;
const imgNightGarden = `${basePath}/invitations/wedding-night-garden.jpg`;
const imgHanbok = `${basePath}/invitations/wedding-hanbok.jpg`;
const imgLuxuryHotel = `${basePath}/invitations/wedding-luxury-hotel.jpg`;

export default function InvitationCardRenderer({
  invitation,
  overrideTheme,
  overrideLayout,
  overrideBgm,
  overrideSectionOrder,
  sectionCustomMap = {},
  activeEffect = 'petals',
  frameStyle = 'arch',
  frameColor = '#ffffff',
  calendarStyle = 'classic_table',
  galleryMode = 'carousel',
  customThemeStyle,
  customMainPhoto,
}: InvitationCardRendererProps) {
  const activeThemeId = overrideTheme || invitation.themeId || 'wax-seal';
  const themePreset = getThemePreset(activeThemeId);

  const activeLayout = overrideLayout || themePreset.defaultLayout || 'classic';
  const activeBgm = overrideBgm || themePreset.defaultBgm || 'romantic';
  const activeSections = overrideSectionOrder || themePreset.defaultSectionOrder;

  const [isPlaying, setIsPlaying] = useState<boolean>(activeBgm !== 'none');
  const [groomAccountOpen, setGroomAccountOpen] = useState<boolean>(false);
  const [brideAccountOpen, setBrideAccountOpen] = useState<boolean>(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [envelopeOpened, setEnvelopeOpened] = useState<boolean>(false);

  // 갤러리 캐러셀 인덱스
  const [carouselIdx, setCarouselIdx] = useState<number>(0);
  const galleryItems = [
    { img: imgGreenCanopy, icon: '🌿', caption: '웨딩 스냅 1: 설레는 봄날의 싱그러운 산책', label: 'Wedding Snap 01' },
    { img: imgSunset, icon: '🌅', caption: '웨딩 스냅 2: 노을빛 강변에서 나눈 영원의 약속', label: 'Wedding Snap 02' },
    { img: imgStudioPeach, icon: '💐', caption: '웨딩 스냅 3: 우리가 처음 함께 웃던 스튜디오', label: 'Wedding Snap 03' },
    { img: imgCherryBlossom, icon: '🌸', caption: '웨딩 스냅 4: 벚꽃길 아래 다정한 눈맞춤', label: 'Wedding Snap 04' },
    { img: imgBenchQuiet, icon: '🕊️', caption: '웨딩 스냅 5: 조용하고 평온한 우리 둘만의 시간', label: 'Wedding Snap 05' },
    { img: imgNightGarden, icon: '✨', caption: '웨딩 스냅 6: 별빛 정원 아래 반짝이는 서약', label: 'Wedding Snap 06' },
  ];

  // 하객 방명록 실시간 인터랙션
  const [comments, setComments] = useState<GuestComment[]>([
    {
      id: 'c1',
      author: '민지 (절친)',
      message: '서윤아 하람아 결혼 너무너무 축하해! 세상에서 제일 행복한 부부가 되길 🌸',
      date: '방금 전',
      avatar: '👭',
    },
    {
      id: 'c2',
      author: '준우 선배',
      message: '둘이 정말 선남선녀다. 예식날 정장 멋지게 차려입고 축하하러 갈게!',
      date: '10분 전',
      avatar: '🤵',
    },
  ]);
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');

  // 하객 스냅 사진
  const [guestPhotos, setGuestPhotos] = useState<GuestPhoto[]>([
    { id: 'gp1', uploader: '하객 유진', caption: '신부대기실 너무 눈부셔요 ✨', icon: '📸', bg: '#fce7f3' },
    { id: 'gp2', uploader: '하객 성훈', caption: '포토테이블 액자 예쁩니다 🌸', icon: '🌷', bg: '#fef3c7' },
  ]);

  // Web Audio BGM 합성
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeBgm === 'none') {
      setIsPlaying(false);
      stopSynth();
      return;
    }
    if (isPlaying) {
      playSynth(activeBgm);
    }
    return () => {
      stopSynth();
    };
  }, [activeBgm, isPlaying]);

  function playSynth(preset: InvitationBgmpreset) {
    stopSynth();
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const melodies: Record<InvitationBgmpreset, number[]> = {
        none: [],
        romantic: [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63],
        piano: [293.66, 369.99, 440.0, 554.37, 440.0, 369.99],
        acoustic: [220.0, 277.18, 329.63, 440.0, 329.63, 277.18],
      };

      const notes = melodies[preset] || melodies.romantic;
      let noteIndex = 0;

      const scheduleNote = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const now = audioCtxRef.current.currentTime;
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();

        const freq = notes[noteIndex % notes.length];
        osc.type = preset === 'piano' ? 'sine' : preset === 'acoustic' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);

        osc.start(now);
        osc.stop(now + 1.2);

        noteIndex++;
      };

      scheduleNote();
      synthTimerRef.current = window.setInterval(scheduleNote, 1400);
    } catch {
      // 무음 처리
    }
  }

  function stopSynth() {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
  }

  function toggleBgm() {
    if (activeBgm === 'none') return;
    setIsPlaying((prev) => {
      const next = !prev;
      if (!next) stopSynth();
      return next;
    });
  }

  function handleCopyText(text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    setCopyNotice(`${label} 복사되었습니다.`);
    setTimeout(() => setCopyNotice(null), 2500);
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newMessage.trim()) return;
    const item: GuestComment = {
      id: `c_${Date.now()}`,
      author: newAuthor.trim(),
      message: newMessage.trim(),
      date: '방금 전',
      avatar: '💐',
    };
    setComments([item, ...comments]);
    setNewAuthor('');
    setNewMessage('');
  };

  const handleAddGuestPhoto = () => {
    const icons = ['📷', '🎉', '🥂', '💖'];
    const bgs = ['#fdf2f8', '#fef9c3', '#e0e7ff', '#ecfdf5'];
    const randomIdx = Math.floor(Math.random() * icons.length);
    const item: GuestPhoto = {
      id: `gp_${Date.now()}`,
      uploader: `하객 ${comments.length + 1}`,
      caption: '예식장 축하 현장 사진 등록!',
      icon: icons[randomIdx],
      bg: bgs[randomIdx],
    };
    setGuestPhotos([item, ...guestPhotos]);
  };

  // 예식 일시 파싱
  const parsedDate = new Date(invitation.weddingDate || '2026-11-28T14:00:00');
  const year = parsedDate.getFullYear() || 2026;
  const month = parsedDate.getMonth() + 1 || 11;
  const day = parsedDate.getDate() || 28;
  const hours = parsedDate.getHours() || 14;
  const minutes = parsedDate.getMinutes() || 0;
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHour = hours % 12 || 12;

  let dDayText = 'D-DAY';
  let diffDays = 0;
  try {
    const diff = parsedDate.getTime() - Date.now();
    diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (diffDays === 0) dDayText = 'D-DAY 오늘';
    else if (diffDays > 0) dDayText = `D-${diffDays}`;
    else dDayText = `D+${Math.abs(diffDays)}`;
  } catch {
    dDayText = 'D-Day';
  }

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarWeeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstDayOfWeek).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      calendarWeeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    calendarWeeks.push(currentWeek);
  }

  const hostNames = invitation.hostNames || '이서윤 · 박하람';
  const venueTitle = invitation.venueLabel || '노을구 달빛웨딩홀 2층 그랜드볼룸';
  const venueAddress = sectionCustomMap.location?.body || '서울특별시 노을구 달빛로 123 (노을역 3번 출구)';

  // 현재 적용 색상 및 폰트
  const effectiveBgColor = customThemeStyle?.bgColor || themePreset.defaultBgColor;
  const effectiveTextColor = customThemeStyle?.textColor || themePreset.defaultTextColor;
  const effectiveAccentColor = customThemeStyle?.accentColor || themePreset.defaultAccentColor;

  // [INV-001 고도화] 테마 및 커스텀 배경색의 명도(Luminance)를 정밀 계산하여 다크 테마 판별
  const isDarkColor = (colorStr?: string): boolean => {
    if (!colorStr) return false;
    let hex = colorStr.trim();
    if (!hex.startsWith('#')) return false;
    hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 140;
  };

  const isDarkTheme =
    isDarkColor(effectiveBgColor) ||
    ['typo-frame', 'moonlight-garden', 'starlight-banquet', 'cinematic-movie', 'the-wedding'].includes(activeThemeId);

  const getSectionStyle = (key: InvitationSectionKey) => {
    const config = sectionCustomMap[key];
    const fontMap = {
      serif: '"Nanum Myeongjo", "Batang", "Noto Serif KR", Georgia, serif',
      sans: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      script: '"Caveat", "Dancing Script", cursive, "Nanum Pen Script", cursive',
    };
    const activeFont = config?.fontFamily || themePreset.defaultFont;
    const defaultColor = isDarkTheme ? (effectiveTextColor || '#fefae0') : (effectiveTextColor || '#1c1917');
    return {
      fontFamily: fontMap[activeFont],
      color: config?.textColor || defaultColor,
    };
  };

  const getSectionAccent = (key: InvitationSectionKey) => {
    return sectionCustomMap[key]?.accentColor || effectiveAccentColor;
  };

  // ============================================================
  // [사용자 핵심 지적 반영] 실사 포토 기반 16종 시그니처 히어로 커버 렌더러
  // pagesisters.cc 퀄리티 실사 포토 & 타이포그래피 100% 동기화
  // ============================================================
  const renderSignatureThemeHero = () => {
    const heroPhoto = (defaultImg: string) => customMainPhoto || defaultImg;

    switch (themePreset.heroType) {
      // 1. 그린 캐노피 (야외 숲속 캐노피 가든)
      case 'green-canopy':
      case 'botanical-garden':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgGreenCanopy)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--gradient-duo" />
            <div className="inv-cover-top-names">
              <span>{hostNames.split('·')[0]?.trim() || '신랑'}</span>
              <span>{hostNames.split('·')[1]?.trim() || '신부'}</span>
            </div>
            <div className="inv-cover-center-korean-cursive">
              우리,
              <br />
              결혼합니다
            </div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h2 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h2>
              <div className="inv-sig-date" style={{ color: '#fef08a' }}>
                {year}년 {month}월 {day}일 {ampm} {displayHour}시
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      // 2. The Wedding (노을빛 강변 시네마틱 로맨스)
      case 'the-wedding':
      case 'cinematic-movie':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgSunset)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--sunset" />
            <div className="inv-cover-top-center-names">THE WEDDING OF</div>
            <div className="inv-cover-center-script-huge">The Wedding</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h2 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h2>
              <div className="inv-sig-date" style={{ color: '#fed7aa' }}>
                {year}. {month < 10 ? `0${month}` : month}. {day < 10 ? `0${day}` : day} {ampm} {displayHour}시
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.85)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      // 3. 배경 사진 (정갈한 인포 박스 분할형)
      case 'photo-background':
      case 'minimal-arch':
        return (
          <div className="inv-hero-sig inv-hero-sig--split">
            <div className="inv-hero-split-photo" style={{ backgroundImage: `url(${heroPhoto(imgStudioPeach)})` }} />
            <div className="inv-hero-split-info">
              <div className="inv-split-info-header">
                <span className="inv-split-names">{hostNames}</span>
                <span className="inv-split-sub">The First Day of Us</span>
              </div>
              <div className="inv-split-divider" />
              <div className="inv-split-row">
                <span className="inv-split-label">일시 /</span>
                <span className="inv-split-val">{year}년 {month}월 {day}일 {ampm} {displayHour}시</span>
              </div>
              <div className="inv-split-row">
                <span className="inv-split-label">장소 /</span>
                <span className="inv-split-val">{venueTitle}</span>
              </div>
            </div>
          </div>
        );

      // 4. 위드 러브 (소프트 페이드 핑크빛 캘리그라피)
      case 'with-love':
        return (
          <div className="inv-hero-sig inv-hero-sig--withlove">
            <div className="inv-withlove-photo-wrap" style={{ backgroundImage: `url(${heroPhoto(imgStudioPeach)})` }}>
              <div className="inv-cover-top-names" style={{ color: '#ffffff' }}>
                <span>{hostNames.split('·')[0]?.trim() || '신랑'}</span>
                <span>{hostNames.split('·')[1]?.trim() || '신부'}</span>
              </div>
              <div className="inv-withlove-gradient-mask" />
            </div>
            <div className="inv-withlove-body">
              <div className="inv-script-with-love">with love</div>
              <h2 className="inv-sig-names" style={{ fontFamily: 'serif', marginTop: 6 }}>{hostNames}</h2>
              <div className="inv-sig-date">
                {year}년 {month}월 {day}일 {ampm} {displayHour}시
              </div>
              <div className="inv-sig-venue">{venueTitle}</div>
            </div>
          </div>
        );

      // 5. 왁스 씰 (핸드메이드 린넨 봉투 + 3D 붉은 왁스 씰 실사)
      case 'wax-seal':
        return (
          <div
            className="inv-hero-sig inv-hero-sig--wax-seal"
            style={{
              backgroundImage: `url(${customMainPhoto || imgWaxEnvelope})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
            }}
          >
            <div
              className="wax-seal-interactive-hotspot"
              onClick={() => setEnvelopeOpened(true)}
              role="button"
              tabIndex={0}
              title="클릭하여 왁스 씰 개봉"
            />
            <div className="inv-wax-envelope-bottom-text">
              <div className="inv-wax-calligraphy-names">{hostNames}</div>
              <div className="inv-wax-calligraphy-venue">{venueTitle}</div>
              <div className="inv-wax-calligraphy-date">
                {year}. {month < 10 ? `0${month}` : month}. {day < 10 ? `0${day}` : day} {ampm} {displayHour}시
              </div>
            </div>
          </div>
        );

      // 6. 테이프 카드 (마스킹 테이프 + 흑백 필름 폴라로이드)
      case 'tape-card':
        return (
          <div className="inv-hero-sig inv-hero-sig--tape-card">
            <div className="inv-sig-script-badge">save the date</div>
            <div className="inv-tape-card-polaroid-frame">
              <div className="inv-washi-tape-strip" />
              <div className="inv-tape-polaroid-photo" style={{ backgroundImage: `url(${heroPhoto(imgTapeBw)})` }} />
              <div className="polaroid-caption">
                <span className="polaroid-caption-date">
                  {year}. {month < 10 ? `0${month}` : month}. {day < 10 ? `0${day}` : day}
                </span>
                <span className="polaroid-caption-names">{hostNames}</span>
              </div>
            </div>
            <div className="inv-sig-content" style={{ marginTop: 14 }}>
              <div className="inv-sig-eng-text">JAEHYUN &amp; HYEJIN ARE GETTING MARRIED</div>
              <div className="inv-sig-venue">{venueTitle}</div>
            </div>
          </div>
        );

      // 7. 타이포 프레임 (숲속 세리프 타이포 '결혼합니다')
      case 'typo-frame':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgGreenCanopy)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--forest" />
            <div className="inv-typo-top-group">
              <div className="inv-typo-sub-lead">THE WEDDING OF</div>
              <h1 className="inv-typo-headline">결혼합니다</h1>
            </div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h2 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h2>
              <div className="inv-sig-date" style={{ color: '#fefae0' }}>
                {year}년 {month}월 {day}일 {ampm} {displayHour}시
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      // 8. 포토 온리 (풀스크린 웨딩 매거진 커버)
      case 'photo-only':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgStudioPeach)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--subtle" />
            <div className="inv-sig-content inv-sig-content--floating">
              <span className="inv-photo-only-sub">OUR BEGINNING</span>
              <h2 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h2>
              <div className="inv-sig-date" style={{ color: '#f8fafc' }}>
                {year}. {month < 10 ? `0${month}` : month}. {day < 10 ? `0${day}` : day} {ampm} {displayHour}시
              </div>
              <div className="inv-sig-venue" style={{ color: '#cbd5e1' }}>{venueTitle}</div>
            </div>
          </div>
        );

      // 9. 스크립트 카드 (흘림체 영문 'Our Day' 캘리그라피)
      case 'script-card':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgGreenCanopy)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--bottom-heavy" />
            <div className="inv-script-ourday-badge">Our Day</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h2 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h2>
              <div className="inv-sig-date" style={{ color: '#fef08a' }}>
                {year}년 {month}월 {day}일 {ampm} {displayHour}시
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      // 10. 센터 라인 (노을빛 04 / SEP / 2027 세로 중앙선 디바이더)
      case 'center-line':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgSunset)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--sunset" />
            <div className="inv-centerline-top-meta">
              <span>SAVE THE DATE</span>
              <strong>{hostNames}</strong>
            </div>
            <div className="inv-centerline-stack">
              <div className="inv-cl-day">{day < 10 ? `0${day}` : day}</div>
              <div className="inv-cl-month">{month < 10 ? `0${month}` : month} · MONTH</div>
              <div className="inv-cl-divider" />
              <div className="inv-cl-year">{year}</div>
            </div>
            <div className="inv-sig-content inv-sig-content--floating">
              <div className="inv-sig-venue" style={{ color: '#ffffff' }}>{venueTitle}</div>
            </div>
          </div>
        );

      // 11. 커버 A (The First Day of Us + 상단 바 & 가든 룩)
      case 'cover-a':
        return (
          <div className="inv-hero-sig inv-hero-sig--cover-a">
            <div className="inv-cover-a-top-bar">
              <div>
                <strong className="inv-ca-names">{hostNames}</strong>
                <div className="inv-ca-date-sm">{year}. {month < 10 ? `0${month}` : month}. {day < 10 ? `0${day}` : day} {ampm} {displayHour}시</div>
                <div className="inv-ca-venue-sm">{venueTitle}</div>
              </div>
              <span className="inv-ca-script-title">The First Day of Us</span>
            </div>
            <div className="inv-cover-a-photo-body" style={{ backgroundImage: `url(${heroPhoto(imgStudioPeach)})`, height: 320 }} />
          </div>
        );

      // 12. 콰이어트 (차분하고 정갈한 아이보리 미니멀리즘)
      case 'quiet':
        return (
          <div className="inv-hero-sig inv-hero-sig--quiet">
            <div className="inv-quiet-top-text">
              <span className="inv-quiet-label">OUR WEDDING DAY</span>
              <div className="inv-quiet-names">{hostNames}</div>
            </div>
            <div className="inv-quiet-photo-wrap" style={{ backgroundImage: `url(${heroPhoto(imgBenchQuiet)})`, height: 260 }} />
            <div className="inv-sig-content">
              <div className="inv-sig-date">{year}년 {month}월 {day}일 {ampm} {displayHour}시</div>
              <div className="inv-sig-venue">{venueTitle}</div>
            </div>
          </div>
        );

      // 13. 봄날의 벚꽃 (화사한 벚꽃 핑크빛 감성)
      case 'spring-blossom':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgCherryBlossom)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--cherry" />
            <div className="inv-cherry-top-tag">SPRING BLOSSOM 🌸</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h2 className="inv-sig-names" style={{ color: '#ffffff', fontFamily: 'serif' }}>{hostNames}</h2>
              <div className="inv-sig-date" style={{ color: '#fbcfe8' }}>
                {year}년 {month}월 {day}일 {ampm} {displayHour}시
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      // 14. 달빛 정원 (Moonlight Symphony)
      case 'moonlight-garden':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgNightGarden)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--night" />
            <div className="inv-night-top-tag">MOONLIGHT GARDEN 🌙</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h2 className="inv-sig-names" style={{ color: '#f8fafc' }}>{hostNames}</h2>
              <div className="inv-sig-date" style={{ color: '#93c5fd' }}>
                {year}년 {month}월 {day}일 {ampm} {displayHour}시
              </div>
              <div className="inv-sig-venue" style={{ color: '#cbd5e1' }}>{venueTitle}</div>
            </div>
          </div>
        );

      // 15. 전통 한지 & 한옥 헤리티지 (기와 & 단청 & 격자 창호문)
      case 'traditional-hanji':
      case 'hanok-heritage':
        return (
          <div className="inv-hero-sig inv-hero-sig--hanji">
            <div className="inv-hanji-top-banner">백년가약 (百年佳約)</div>
            <div className="inv-hanji-window-frame" style={{ backgroundImage: `url(${heroPhoto(imgHanbok)})`, height: 300, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="inv-hanji-grid-border" />
            </div>
            <div className="inv-sig-content">
              <h2 className="inv-sig-names" style={{ fontFamily: 'serif' }}>{hostNames}</h2>
              <div className="inv-sig-date">{year}년 {month}월 {day}일 {ampm} {displayHour}시</div>
              <div className="inv-sig-venue">{venueTitle}</div>
            </div>
          </div>
        );

      // 16. 별빛 연회 (블랙 & 골드 샴페인 럭셔리)
      case 'starlight-banquet':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgLuxuryHotel)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--luxury" />
            <div className="inv-luxury-top-tag">HOTEL GRAND BALLROOM ✨</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h2 className="inv-sig-names" style={{ color: '#fef08a' }}>{hostNames}</h2>
              <div className="inv-sig-date" style={{ color: '#fde047' }}>
                {year}. {month}. {day} 럭셔리 웨딩
              </div>
              <div className="inv-sig-venue" style={{ color: '#e2e8f0' }}>{venueTitle}</div>
            </div>
          </div>
        );

      // 기본값
      default:
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${imgGreenCanopy})` }}>
            <div className="inv-real-photo-overlay inv-overlay--gradient-duo" />
            <div className="inv-sig-content inv-sig-content--floating">
              <h3 className="inv-hero-names" style={{ color: '#ffffff' }}>{hostNames}</h3>
              <div className="inv-hero-date-line" style={{ color: '#fef08a' }}>
                {year}. {month < 10 ? `0${month}` : month}. {day < 10 ? `0${day}` : day} {ampm} {displayHour}시
              </div>
              <div className="inv-hero-venue-line" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );
    }
  };

  // 섹션별 렌더러
  const renderSection = (key: InvitationSectionKey) => {
    const custom = sectionCustomMap[key];
    const sectionStyle = getSectionStyle(key);
    const accent = getSectionAccent(key);

    switch (key) {
      case 'greeting': {
        const title = custom?.title || '소중한 분들을 초대합니다';
        const bodyText =
          custom?.body ||
          invitation.greeting ||
          '서로 마주 보며 다져온 사랑을\n이제 한곳을 바라보며 걸어가고자 합니다.\n소중한 걸음으로 축복해 주시면\n더없는 기쁨으로 간직하겠습니다.';
        return (
          <section key="greeting" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              INVITATION
            </span>
            <h4 className="inv-main-heading">{title}</h4>
            <div className="inv-greeting-box">
              <p className="inv-greeting-poem">{bodyText}</p>
              <div className="inv-family-line">
                <div>
                  <span style={{ opacity: 0.75 }}>이성민 · 김은숙</span> 의 장남{' '}
                  <strong style={{ fontSize: 14 }}>이서윤</strong>
                </div>
                <div>
                  <span style={{ opacity: 0.75 }}>박진우 · 정미경</span> 의 장녀{' '}
                  <strong style={{ fontSize: 14 }}>박하람</strong>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case 'schedule': {
        const title = custom?.title || '예식 일시 & 달력';
        const activeCalStyle = custom?.calendarStyle || calendarStyle || themePreset.defaultCalendarStyle;

        return (
          <section key="schedule" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              WEDDING DAY
            </span>
            <h4 className="inv-main-heading">{title}</h4>

            <div className="inv-calendar-card">
              <div className="inv-calendar-header">
                {year}년 {month}월 {day}일 {ampm} {displayHour}시{' '}
                {minutes > 0 ? `${minutes}분` : '정각'}
              </div>

              {activeCalStyle === 'classic_table' && (
                <table className="inv-calendar-table">
                  <thead>
                    <tr>
                      <th>일</th>
                      <th>월</th>
                      <th>화</th>
                      <th>수</th>
                      <th>목</th>
                      <th>금</th>
                      <th>토</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarWeeks.map((week, wIdx) => (
                      <tr key={wIdx}>
                        {week.map((cellDay, dIdx) => {
                          const isWeddingDay = cellDay === day;
                          const isSunday = dIdx === 0;
                          const isSaturday = dIdx === 6;
                          return (
                            <td key={dIdx} className={isWeddingDay ? 'inv-calendar-wedding-day' : ''}>
                              {cellDay ? (
                                <span
                                  style={{
                                    color: isWeddingDay
                                      ? '#ffffff'
                                      : isSunday
                                      ? (isDarkTheme ? '#fca5a5' : '#dc2626')
                                      : isSaturday
                                      ? (isDarkTheme ? '#93c5fd' : '#2563eb')
                                      : (isDarkTheme ? '#f8fafc' : '#1f2937'),
                                    fontWeight: isWeddingDay ? 700 : 500,
                                  }}
                                >
                                  {cellDay}
                                </span>
                              ) : (
                                ''
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeCalStyle === 'heart_stamp' && (
                <div className="inv-heart-stamp-view">
                  <div className="inv-heart-stamp-circle">
                    <span style={{ fontSize: 28 }}>❤️</span>
                    <strong style={{ fontSize: 20 }}>{day}일</strong>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>WEDDING</span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: isDarkTheme ? '#fefae0' : 'inherit' }}>
                    {month}월의 어느 멋진 날, 두 사람의 시작
                  </div>
                </div>
              )}

              {activeCalStyle === 'box_badge' && (
                <div className="inv-countdown-box-view">
                  <div className="inv-countdown-grid">
                    <div className="inv-count-cell">
                      <strong style={{ color: isDarkTheme ? '#ffffff' : 'inherit' }}>{Math.max(0, diffDays)}</strong>
                      <span>DAYS</span>
                    </div>
                    <div className="inv-count-cell">
                      <strong style={{ color: isDarkTheme ? '#ffffff' : 'inherit' }}>14</strong>
                      <span>HOURS</span>
                    </div>
                    <div className="inv-count-cell">
                      <strong style={{ color: isDarkTheme ? '#ffffff' : 'inherit' }}>30</strong>
                      <span>MINS</span>
                    </div>
                  </div>
                </div>
              )}

              {activeCalStyle === 'minimal_text' && (
                <div style={{ padding: '24px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontFamily: 'serif', fontWeight: 700, color: isDarkTheme ? '#fefae0' : '#1c1917' }}>
                    {year}. {month}. {day}
                  </div>
                  <div style={{ fontSize: 13, letterSpacing: '0.1em', marginTop: 4, opacity: 0.85, color: isDarkTheme ? 'rgba(254, 250, 224, 0.85)' : 'rgba(28, 25, 23, 0.85)' }}>
                    SATURDAY AFTERNOON 2:00 PM
                  </div>
                </div>
              )}

              <div className="inv-dday-badge" style={{ backgroundColor: accent, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>
                <span>{dDayText}</span>
                <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>
                  {custom?.body || '소중한 날, 따뜻한 마음으로 함께해 주세요'}
                </span>
              </div>
            </div>
          </section>
        );
      }

      case 'gallery': {
        const title = custom?.title || '우리의 아름다운 순간 (갤러리)';
        const activeGalMode = custom?.galleryMode || galleryMode || themePreset.defaultGalleryMode;

        return (
          <section key="gallery" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              PHOTO GALLERY
            </span>
            <h4 className="inv-main-heading">{title}</h4>
            <p style={{ fontSize: 12, opacity: 0.75, textAlign: 'center', marginBottom: 16 }}>
              {custom?.body || '함께 걸어온 설레는 시간들을 기록합니다'}
            </p>

            {activeGalMode === 'carousel' && (
              <div className="inv-gallery-carousel-slider">
                {/* 부드러운 슬라이딩 뷰포트 & 트랙 */}
                <div className="inv-carousel-viewport">
                  <div
                    className="inv-carousel-track"
                    style={{
                      display: 'flex',
                      width: `${galleryItems.length * 100}%`,
                      transform: `translateX(-${carouselIdx * (100 / galleryItems.length)}%)`,
                      transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  >
                    {galleryItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="inv-carousel-slide-item"
                        style={{
                          width: `${100 / galleryItems.length}%`,
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        <div className="inv-carousel-photo-frame">
                          <img
                            src={item.img}
                            alt={item.caption}
                            className="inv-carousel-photo-img"
                            loading="lazy"
                          />
                          <div className="inv-carousel-gradient-mask" />
                          <div className="inv-carousel-caption-content">
                            <span className="inv-carousel-caption-badge">{item.label}</span>
                            <p className="inv-carousel-caption-desc">{item.caption}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* [2번 이미지 핵심 요구사항] 이미지 양 끝쪽에 위치하는 플로팅 좌/우 슬라이딩 화살표 버튼 */}
                  <button
                    type="button"
                    className="inv-carousel-edge-btn inv-carousel-edge-btn--prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarouselIdx((prev) => (prev > 0 ? prev - 1 : galleryItems.length - 1));
                    }}
                    aria-label="이전 사진 보기"
                  >
                    <span>❮</span>
                  </button>
                  <button
                    type="button"
                    className="inv-carousel-edge-btn inv-carousel-edge-btn--next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarouselIdx((prev) => (prev < galleryItems.length - 1 ? prev + 1 : 0));
                    }}
                    aria-label="다음 사진 보기"
                  >
                    <span>❯</span>
                  </button>

                  {/* 슬라이드 우측 상단 카운터 배지 */}
                  <div className="inv-carousel-counter-tag">
                    {carouselIdx + 1} / {galleryItems.length}
                  </div>
                </div>

                {/* 하단 동적 슬라이드 인디케이터 점 네비게이션 */}
                <div className="inv-carousel-indicator-dots">
                  {galleryItems.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      className={`inv-carousel-indicator-dot ${carouselIdx === dotIdx ? 'inv-carousel-indicator-dot--active' : ''}`}
                      onClick={() => setCarouselIdx(dotIdx)}
                      aria-label={`${dotIdx + 1}번째 웨딩 스냅`}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeGalMode === 'life4cut_strip' && (
              <div className="inv-life4cut-strip-wrap">
                <div className="inv-life4cut-film">
                  <div className="inv-life4cut-header">★ LIFE 4 CUT WEDDING ★</div>
                  {galleryItems.slice(0, 4).map((it, idx) => (
                    <div key={idx} className="inv-life4cut-cell" style={{ height: 110, overflow: 'hidden', padding: 0 }}>
                      <img src={it.img} alt={it.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  <div className="inv-life4cut-footer">
                    <span>{year}. {month}. {day}</span>
                    <span>{hostNames}</span>
                  </div>
                </div>
              </div>
            )}

            {activeGalMode === 'grid3x3' && (
              <div className="inv-gallery-grid">
                {galleryItems.map((item, i) => (
                  <div key={i} className="inv-gallery-item" style={{ overflow: 'hidden', padding: 0, height: 100, borderRadius: 8 }}>
                    <img src={item.img} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      case 'guestbook': {
        const title = custom?.title || '축하의 한마디 (하객 방명록)';
        return (
          <section key="guestbook" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              GUESTBOOK
            </span>
            <h4 className="inv-main-heading">{title}</h4>
            <p style={{ fontSize: 12, opacity: 0.75, textAlign: 'center', marginBottom: 14 }}>
              신랑 신부에게 따뜻한 축하의 메시지를 남겨주세요.
            </p>

            <form onSubmit={handleAddComment} className="inv-guestbook-form">
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="작성자 성함 (예: 친구 지수)"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="inv-field-input"
                  style={{ width: '40%' }}
                />
                <input
                  type="text"
                  placeholder="축하 메시지를 입력하세요"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="inv-field-input"
                  style={{ flex: 1 }}
                />
              </div>
              <button
                type="submit"
                className="inv-btn-primary"
                style={{
                  minHeight: 38,
                  fontSize: 12,
                  marginTop: 6,
                  backgroundColor: accent || 'var(--brand)',
                }}
              >
                💌 축하글 등록하기
              </button>
            </form>

            <div className="inv-guestbook-list">
              {comments.map((cmt) => (
                <div key={cmt.id} className="inv-guestbook-card">
                  <div className="inv-guestbook-card__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{cmt.avatar}</span>
                      <strong>{cmt.author}</strong>
                    </div>
                    <span style={{ fontSize: 10, opacity: 0.6 }}>{cmt.date}</span>
                  </div>
                  <div className="inv-guestbook-card__body">{cmt.message}</div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'guest_snap': {
        const title = custom?.title || '하객 즉석 스냅 앨범';
        return (
          <section key="guest_snap" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              GUEST LIVE SNAPS
            </span>
            <h4 className="inv-main-heading">{title}</h4>
            <p style={{ fontSize: 12, opacity: 0.75, textAlign: 'center', marginBottom: 12 }}>
              오늘 예식에 참석하신 하객분들이 직접 촬영한 현장 사진들입니다.
            </p>

            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <button
                type="button"
                className="inv-btn-secondary"
                style={{ minHeight: 38, fontSize: 12, padding: '0 16px' }}
                onClick={handleAddGuestPhoto}
              >
                📸 예식 사진 직접 올리기 (체험)
              </button>
            </div>

            <div className="inv-guest-snap-grid">
              {guestPhotos.map((gp) => (
                <div key={gp.id} className="inv-guest-snap-item" style={{ backgroundColor: gp.bg }}>
                  <span style={{ fontSize: 32 }}>{gp.icon}</span>
                  <div className="inv-guest-snap-caption">{gp.caption}</div>
                  <span style={{ fontSize: 9, opacity: 0.7 }}>by {gp.uploader}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'location': {
        const title = custom?.title || '오시는 길 & 약도';
        const naverUrl = `https://map.naver.com/v5/search/${encodeURIComponent(venueTitle)}`;
        const kakaoUrl = `https://map.kakao.com/link/search/${encodeURIComponent(venueTitle)}`;
        const googleUrl = `https://www.google.com/maps/search/${encodeURIComponent(venueTitle)}`;

        return (
          <section key="location" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              LOCATION
            </span>
            <h4 className="inv-main-heading">{title}</h4>

            <div className="inv-map-box">
              <div className="inv-interactive-map-frame">
                <iframe
                  title="웨딩홀 지도 위치"
                  width="100%"
                  height="220"
                  style={{ border: 0, borderRadius: 14 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent('서울역')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              <div className="inv-venue-info-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <strong style={{ fontSize: 14, color: isDarkTheme ? '#ffffff' : '#1f2937' }}>{venueTitle}</strong>
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4, textAlign: 'center', color: isDarkTheme ? 'rgba(255,255,255,0.85)' : 'inherit' }}>
                  {venueAddress}
                </div>

                <div style={{ textAlign: 'center', marginTop: 10 }}>
                  <button
                    type="button"
                    className="inv-address-copy-btn"
                    onClick={() => handleCopyText(venueAddress, '웨딩홀 주소가')}
                  >
                    📋 주소 복사하기
                  </button>
                </div>
              </div>

              <div className="inv-map-btn-row">
                <a
                  href={naverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inv-btn-secondary inv-map-link-btn"
                  style={{ textDecoration: 'none', color: '#03c75a' }}
                >
                  🟢 네이버 지도
                </a>
                <a
                  href={kakaoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inv-btn-secondary inv-map-link-btn"
                  style={{ textDecoration: 'none', color: '#f59e0b' }}
                >
                  🟡 카카오맵
                </a>
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inv-btn-secondary inv-map-link-btn"
                  style={{ textDecoration: 'none', color: '#2563eb' }}
                >
                  🔵 구글 지도
                </a>
              </div>

              <div className="inv-transport-guide">
                <div>
                  <strong>🚇 지하철:</strong> 노을역 3번 출구 도보 5분
                </div>
                <div>
                  <strong>🚌 버스:</strong> 달빛웨딩홀 정류장 하차 (간선 101, 지선 7016)
                </div>
                <div>
                  <strong>🚗 자가용 / 주차:</strong> 웨딩홀 건물 지하 1~3층 무료 주차 2시간
                </div>
              </div>
            </div>
          </section>
        );
      }

      case 'account': {
        const title = custom?.title || '마음 전하실 곳';
        return (
          <section key="account" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              ACCOUNT
            </span>
            <h4 className="inv-main-heading">{title}</h4>
            <p style={{ fontSize: 12, opacity: 0.75, textAlign: 'center', marginBottom: 14 }}>
              {custom?.body || '축복해 주시는 따뜻한 마음을 소중히 간직하겠습니다.'}
            </p>

            <div className="inv-account-accordion">
              <div className="inv-account-card">
                <div
                  className="inv-account-row"
                  onClick={() => setGroomAccountOpen(!groomAccountOpen)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setGroomAccountOpen(!groomAccountOpen);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>👔</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>신랑측 계좌번호</span>
                  </div>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>
                    {groomAccountOpen ? '▲ 닫기' : '▼ 펼치기'}
                  </span>
                </div>

                {groomAccountOpen && (
                  <div className="inv-account-detail">
                    <div className="inv-account-line">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>신랑 이서윤</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                          달빛은행 123-456-789012
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inv-copy-chip"
                        onClick={() => handleCopyText('달빛은행 123-456-789012', '신랑 이서윤 계좌번호가')}
                      >
                        복사
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="inv-account-card" style={{ marginTop: 8 }}>
                <div
                  className="inv-account-row"
                  onClick={() => setBrideAccountOpen(!brideAccountOpen)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setBrideAccountOpen(!brideAccountOpen);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>👰</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>신부측 계좌번호</span>
                  </div>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>
                    {brideAccountOpen ? '▲ 닫기' : '▼ 펼치기'}
                  </span>
                </div>

                {brideAccountOpen && (
                  <div className="inv-account-detail">
                    <div className="inv-account-line">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>신부 박하람</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                          노을은행 987-654-321098
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inv-copy-chip"
                        onClick={() => handleCopyText('노을은행 987-654-321098', '신부 박하람 계좌번호가')}
                      >
                        복사
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      }

      case 'rsvp_preview': {
        const title = custom?.title || '참석 여부 전달 (RSVP)';
        return (
          <section key="rsvp_preview" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              ATTENDANCE
            </span>
            <h4 className="inv-main-heading">{title}</h4>
            <div className="inv-rsvp-box">
              <p style={{ fontSize: 12, opacity: 0.8, textAlign: 'center', marginBottom: 14 }}>
                {custom?.body ||
                  '원활한 예식 준비와 연회 식사 좌석 안내를 위해 참석 여부를 미리 알려주시면 진심으로 감사드리겠습니다.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button
                  type="button"
                  className="inv-btn-primary"
                  style={{ minHeight: 44, fontSize: 13, padding: '0 20px', backgroundColor: accent }}
                  onClick={() => alert('참석 회신 폼은 손준혁(#86) 작업과 연계되는 슬롯입니다.')}
                >
                  🌸 참석합니다
                </button>
                <button
                  type="button"
                  className="inv-btn-secondary"
                  style={{ minHeight: 44, fontSize: 13, padding: '0 18px' }}
                  onClick={() => alert('불참 회신 폼은 손준혁(#86) 작업과 연계되는 슬롯입니다.')}
                >
                  💌 마음으로 축하
                </button>
              </div>
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  const dynamicBackgroundStyle = {
    backgroundColor: effectiveBgColor,
    color: effectiveTextColor,
  };

  return (
    <div
      className={`inv-render-canvas inv-theme--${activeThemeId} inv-layout--${activeLayout} ${
        isDarkTheme ? 'inv-mode--dark' : 'inv-mode--light'
      }`}
      style={dynamicBackgroundStyle}
    >
      {/* 복사 완료 토스트 알림 */}
      {copyNotice && <div className="inv-floating-toast">{copyNotice}</div>}

      {/* 봉투 & 왁스씰 개봉 인트로 오버레이 */}
      {activeEffect === 'envelope' && !envelopeOpened && (
        <div className="inv-envelope-intro-overlay">
          <div className="inv-envelope-intro-box">
            <div className="inv-envelope-top-flap" />
            <div className="inv-envelope-seal" onClick={() => setEnvelopeOpened(true)}>
              <span className="inv-envelope-seal__wax">💍</span>
              <span className="inv-envelope-seal__click-text">탭하여 봉투 열기</span>
            </div>
            <div className="inv-envelope-body">
              <div style={{ fontFamily: 'serif', fontSize: 14, fontWeight: 700 }}>
                WEDDING INVITATION
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                {hostNames}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 BGM 플레이어 */}
      {activeBgm !== 'none' && (
        <button
          type="button"
          className="inv-bgm-floating"
          onClick={toggleBgm}
          title={isPlaying ? '배경음악 일시정지' : '배경음악 재생'}
          aria-label={isPlaying ? '배경음악 일시정지' : '배경음악 재생'}
        >
          <div className={`inv-bgm-disc ${isPlaying ? 'inv-bgm-disc--spinning' : ''}`}>🎵</div>
          <div className={`inv-bgm-eq ${isPlaying ? 'inv-bgm-eq--active' : ''}`}>
            <div className="inv-bgm-eq__bar" />
            <div className="inv-bgm-eq__bar" />
            <div className="inv-bgm-eq__bar" />
          </div>
          <span>{isPlaying ? 'BGM ON' : 'BGM OFF'}</span>
        </button>
      )}

      {/* 최상단: [선택한 테마의 1:1 매칭 시그니처 히어로 커버] */}
      <header className="inv-hero-wrap">
        {renderSignatureThemeHero()}
      </header>

      {/* 동적 섹션 목록 */}
      <div className="inv-sections-container">
        {activeSections.map((secKey) => renderSection(secKey))}
      </div>

      {/* 하단 푸터 */}
      <footer
        style={{
          padding: '30px 20px 40px',
          textAlign: 'center',
          fontSize: 12,
          opacity: 0.75,
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.65)',
          borderTop: isDarkTheme ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        {invitation.title}
        <br />
        <span style={{ fontSize: 10 }}>어때? 모바일 청첩장 고도화 스튜디오 · INV-001</span>
      </footer>
    </div>
  );
}
