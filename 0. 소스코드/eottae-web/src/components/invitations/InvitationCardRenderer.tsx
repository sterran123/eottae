'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  getContrastingTextColor,
  ensureLegibleColor,
  isDarkThemeBg,
} from '@/lib/invitations/contrast-helper';
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
  customBgmUrl?: string;
  customBgmTitle?: string;
  guestToken?: string;
}

interface GuestComment {
  id: string;
  author: string;
  message: string;
  date: string;
  avatar: string;
  isNew?: boolean;
}

interface GuestPhoto {
  id: string;
  uploader: string;
  caption: string;
  icon: string;
  bg: string;
  img?: string;
  time: string;
  likes: number;
  hasLiked?: boolean;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/eottae';

// URL 경로 정규화 헬퍼 (basePath 안전 처리)
const resolveAssetUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith(basePath)) return url;
  if (url.startsWith('/')) return `${basePath}${url}`;
  return `${basePath}/${url}`;
};

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

export const BGM_LABEL_MAP: Record<string, string> = {
  romantic: '가상 축혼 행진곡',
  piano: '가상 로맨틱 피아노',
  acoustic: '어쿠스틱 선율',
  bach_air: '가상 클래식 스트링',
  canon: '가상 캐논 피아노',
  thousand_years: '로맨틱 앙상블',
  spring_waltz: '봄날의 왈츠',
  none: '무음',
  custom: '커스텀 BGM',
};

export function getThemeDefaultPhoto(themeId: string): string {
  switch (themeId) {
    case 'forest-fresh':
    case 'green-canopy':
    case 'botanical-garden':
    case 'botanical':
    case 'typo-frame':
    case 'script-card':
      return imgGreenCanopy;
    case 'our-vow':
    case 'the-wedding':
    case 'cinematic-movie':
    case 'center-line':
    case 'sunset-center-line':
      return imgSunset;
    case 'photo-background':
    case 'minimal-arch':
    case 'warm-heart':
    case 'with-love':
    case 'photo-only':
    case 'cover-a':
    case 'wax-seal':
      return imgStudioPeach;
    case 'tape-card':
      return imgTapeBw;
    case 'quiet':
      return imgBenchQuiet;
    case 'spring-blossom':
    case 'spring-card':
      return imgCherryBlossom;
    case 'moonlight-garden':
    case 'moon-garden':
      return imgNightGarden;
    case 'traditional-hanji':
    case 'hanok-heritage':
    case 'hanji':
      return imgHanbok;
    case 'starlight-banquet':
    case 'star-table':
      return imgLuxuryHotel;
    default:
      return imgStudioPeach;
  }
}

export default function InvitationCardRenderer({
  invitation,
  previewMode = false,
  guestToken,
  overrideTheme,
  overrideLayout,
  overrideBgm,
  overrideSectionOrder,
  sectionCustomMap = {},
  activeEffect: propEffect,
  frameStyle: propFrameStyle,
  frameColor: propFrameColor,
  calendarStyle: propCalendarStyle,
  galleryMode: propGalleryMode,
  customThemeStyle,
  customMainPhoto,
  customBgmUrl,
  customBgmTitle,
}: InvitationCardRendererProps) {
  const router = useRouter();
  const activeThemeId = overrideTheme || invitation.themeId || 'wax-seal';
  const themePreset = getThemePreset(activeThemeId);

  const activeLayout = overrideLayout || invitation.layoutStyle || themePreset.defaultLayout || 'classic';
  const activeBgm = overrideBgm || invitation.bgmPreset || themePreset.defaultBgm || 'romantic';
  const baseSections: InvitationSectionKey[] =
    overrideSectionOrder || invitation.sectionOrder || themePreset.defaultSectionOrder;
  const PUBLIC_HIDDEN = new Set<InvitationSectionKey>(['guestbook', 'guest_snap']);
  // 공개 하객 화면(/invitations/p/?t=, previewMode === false)에서도 하객이 참석 여부를 회신할 수 있도록 rsvp_preview 섹션 포함 보장 (타 하객 명단/방명록은 격리)
  const baseList: InvitationSectionKey[] = baseSections.includes('rsvp_preview')
    ? baseSections
    : [...baseSections, 'rsvp_preview'];
  const activeSections: InvitationSectionKey[] = previewMode
    ? baseSections
    : baseList.filter((sec) => !PUBLIC_HIDDEN.has(sec));

  const activeEffect = propEffect || themePreset.defaultEffect || 'petals';
  const frameStyle = propFrameStyle || themePreset.defaultFrameStyle || 'arch';
  const frameColor = propFrameColor || '#ffffff';
  const calendarStyle = propCalendarStyle || themePreset.defaultCalendarStyle || 'classic_table';
  const galleryMode = propGalleryMode || themePreset.defaultGalleryMode || 'carousel';

  const [isPlaying, setIsPlaying] = useState<boolean>(previewMode ? activeBgm !== 'none' : false);
  const [groomAccountOpen, setGroomAccountOpen] = useState<boolean>(false);
  const [brideAccountOpen, setBrideAccountOpen] = useState<boolean>(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [envelopeOpened, setEnvelopeOpened] = useState<boolean>(false);

  // activeBgm 변경 시 재생 상태 동기화 (하객 공개 화면은 사용자 클릭 전 무음 유지)
  useEffect(() => {
    if (activeBgm === 'none' && !customBgmUrl) {
      setIsPlaying(false);
    } else if (previewMode) {
      setIsPlaying(true);
    }
  }, [activeBgm, customBgmUrl, previewMode]);

  // 1. [갤러리 1: 신랑·신부 공식 웨딩 화보 갤러리]
  const [carouselIdx, setCarouselIdx] = useState<number>(0);
  const [officialPhotos, setOfficialPhotos] = useState<
    { img: string; icon: string; caption: string; label: string }[]
  >([
    { img: imgGreenCanopy, icon: '🌿', caption: '웨딩 화보 1: 설레는 봄날의 싱그러운 산책', label: 'Wedding Snap 01' },
    { img: imgSunset, icon: '🌅', caption: '웨딩 화보 2: 노을빛 강변에서 나눈 영원의 약속', label: 'Wedding Snap 02' },
    { img: imgStudioPeach, icon: '💐', caption: '웨딩 화보 3: 우리가 처음 함께 웃던 스튜디오', label: 'Wedding Snap 03' },
    { img: imgCherryBlossom, icon: '🌸', caption: '웨딩 화보 4: 벚꽃길 아래 다정한 눈맞춤', label: 'Wedding Snap 04' },
    { img: imgBenchQuiet, icon: '🕊️', caption: '웨딩 화보 5: 조용하고 평온한 우리 둘만의 시간', label: 'Wedding Snap 05' },
    { img: imgNightGarden, icon: '✨', caption: '웨딩 화보 6: 별빛 정원 아래 반짝이는 서약', label: 'Wedding Snap 06' },
  ]);
  const officialPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // 2. [갤러리 2: 하객 실시간 현장 스냅 앨범]
  // 공개 하객 렌더(previewMode=false)에서는 시드 배열을 비우고, 미리보기(previewMode=true)에서는 hostNames 기반 예시만 노출 (Refs #97)
  const [guestPhotos, setGuestPhotos] = useState<GuestPhoto[]>(() => {
    if (!previewMode) return [];
    const host = invitation.hostNames || '신랑 · 신부';
    return [
      {
        id: 'gp1',
        uploader: `${host} (예시 · 제안 P1)`,
        caption: '현장 스냅 사진을 실시간으로 공유할 수 있는 참여형 공간입니다. (예시 · 제안 P1)',
        icon: '📸',
        bg: '#fce7f3',
        img: imgStudioPeach,
        time: '예시',
        likes: 12,
        hasLiked: false,
      },
    ];
  });
  const [showGuestUploadForm, setShowGuestUploadForm] = useState<boolean>(false);
  const [guestUploaderName, setGuestUploaderName] = useState<string>('');
  const [guestCaptionText, setGuestCaptionText] = useState<string>('');
  const [guestSnapFileImg, setGuestSnapFileImg] = useState<string | null>(null);
  const guestPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // 3. [하객 실시간 축하 방명록]
  // 공개 하객 렌더(previewMode=false)에서는 시드 배열을 비우고, 미리보기(previewMode=true)에서는 hostNames 기반 예시만 노출 (Refs #97)
  const [comments, setComments] = useState<GuestComment[]>(() => {
    if (!previewMode) return [];
    const host = invitation.hostNames || '신랑 · 신부';
    return [
      {
        id: 'c1',
        author: `${host} (예시 · 제안 P1)`,
        message: `${host} 두 분의 소중한 결혼을 축하드리며, 하객의 따뜻한 축하 글이 실시간으로 공유되는 공간입니다. (예시 · 제안 P1)`,
        date: '예시',
        avatar: '🌸',
      },
    ];
  });
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🌸');

  // 오디오 재생 관리
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // 사용자 업로드 음원 재생 관리
  useEffect(() => {
    if (customBgmUrl && customAudioRef.current) {
      if (isPlaying) {
        customAudioRef.current.play().catch(() => {});
      } else {
        customAudioRef.current.pause();
      }
    }
  }, [customBgmUrl, isPlaying]);

  // Web Audio API 신디사이저 재생
  useEffect(() => {
    if (customBgmUrl) return; // 사용자 커스텀 음원이 있으면 신디사이저 비활성화
    if (!isPlaying || activeBgm === 'none') {
      stopSynth();
      return;
    }
    playSynth(activeBgm);
    return () => stopSynth();
  }, [isPlaying, activeBgm, customBgmUrl]);

  function playSynth(preset: InvitationBgmpreset) {
    stopSynth();
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }

      const melodies: Record<string, number[]> = {
        romantic: [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63],
        piano: [293.66, 369.99, 440.0, 554.37, 440.0, 369.99],
        acoustic: [220.0, 277.18, 329.63, 440.0, 329.63, 277.18],
        bach_air: [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88],
        canon: [293.66, 220.0, 246.94, 196.0, 220.0, 174.61, 196.0],
        thousand_years: [261.63, 329.63, 392.0, 440.0, 392.0, 329.63],
        spring_waltz: [329.63, 392.0, 493.88, 523.25, 392.0, 329.63],
      };

      const notes = melodies[preset] || melodies.romantic;
      let noteIndex = 0;

      const scheduleNote = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const now = audioCtxRef.current.currentTime;
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = preset === 'piano' || preset === 'bach_air' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(notes[noteIndex % notes.length], now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);

        osc.start(now);
        osc.stop(now + 1.3);

        noteIndex++;
        synthTimerRef.current = window.setTimeout(scheduleNote, 1400);
      };

      scheduleNote();
    } catch {
      // AudioContext 비활성화 시 무시
    }
  }

  function stopSynth() {
    if (synthTimerRef.current) {
      window.clearTimeout(synthTimerRef.current);
      synthTimerRef.current = null;
    }
  }

  const toggleBgm = () => {
    if (customBgmUrl && customAudioRef.current) {
      if (isPlaying) {
        customAudioRef.current.pause();
        setIsPlaying(false);
      } else {
        void customAudioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
      stopSynth();
    } else {
      setIsPlaying(true);
      playSynth(activeBgm);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      const isAccount = label.includes('계좌');
      setCopyNotice(
        isAccount
          ? `${label} 복사되었습니다! (가상 계좌 · 실제 이체되지 않음)`
          : `${label} 복사되었습니다!`
      );
      setTimeout(() => setCopyNotice(null), 2500);
    }
  };

  // 신랑·신부 공식 사진 추가 업로드 핸들러
  const handleAddOfficialPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setOfficialPhotos((prev) => [
          {
            img: dataUrl,
            icon: '💍',
            caption: `신규 화보 ${prev.length + 1}: 소중한 우리들의 순간`,
            label: `Wedding Snap 0${prev.length + 1}`,
          },
          ...prev,
        ]);
        setCopyNotice('신랑·신부 공식 화보 사진이 추가되었습니다 (이 미리보기 화면에서만 보입니다) 📸');
        setTimeout(() => setCopyNotice(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // 하객 스냅 사진 좋아요 핸들러
  const handleLikeGuestPhoto = (id: string) => {
    setGuestPhotos((prev) =>
      prev.map((gp) => {
        if (gp.id === id) {
          return {
            ...gp,
            likes: gp.hasLiked ? gp.likes - 1 : gp.likes + 1,
            hasLiked: !gp.hasLiked,
          };
        }
        return gp;
      })
    );
  };

  // 하객 실시간 스냅 제출 핸들러
  const handleGuestSnapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestUploaderName.trim() && !guestCaptionText.trim()) return;
    const newSnap: GuestPhoto = {
      id: `gp_${Date.now()}`,
      uploader: guestUploaderName.trim() || '익명의 하객',
      caption: guestCaptionText.trim() || '두 분의 행복한 시작을 온 마음으로 축하합니다! 🎉',
      icon: '📸',
      bg: '#f0fdf4',
      img: guestSnapFileImg || imgLuxuryHotel,
      time: '방금 전',
      likes: 1,
      hasLiked: true,
    };
    setGuestPhotos((prev) => [newSnap, ...prev]);
    setGuestUploaderName('');
    setGuestCaptionText('');
    setGuestSnapFileImg(null);
    setShowGuestUploadForm(false);
    setCopyNotice('🎉 하객 현장 스냅이 등록되었습니다 (이 미리보기 화면에서만 보입니다)');
    setTimeout(() => setCopyNotice(null), 3000);
  };

  // 실시간 방명록 제출 핸들러
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const item: GuestComment = {
      id: `c_${Date.now()}`,
      author: newAuthor.trim() || '따뜻한 하객',
      message: newMessage.trim(),
      date: '방금 전',
      avatar: selectedEmoji,
      isNew: true,
    };
    setComments([item, ...comments]);
    setNewMessage('');
    setNewAuthor('');
    setCopyNotice('💌 축하 메시지가 등록되었습니다 (이 미리보기 화면에서만 보입니다)');
    setTimeout(() => setCopyNotice(null), 3000);
  };

  // 예식 일시 파싱
  const parsedDate = new Date(invitation.weddingDate || '2026-11-28T14:00:00');
  const year = parsedDate.getFullYear() || 2026;
  const month = parsedDate.getMonth() + 1 || 11;
  const day = parsedDate.getDate() || 28;
  const rawHours = parsedDate.getHours();
  const hours = Number.isNaN(rawHours) ? 14 : rawHours;
  const rawMinutes = parsedDate.getMinutes();
  const minutes = Number.isNaN(rawMinutes) ? 0 : rawMinutes;
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHour = hours % 12 || 12;
  const displayTimeKorean = `${year}년 ${month}월 ${day}일 ${ampm} ${displayHour}시${minutes > 0 ? ` ${minutes}분` : ' 정각'}`;
  const displayTimeDot = `${year}. ${month < 10 ? `0${month}` : month}. ${day < 10 ? `0${day}` : day} ${ampm} ${displayHour}시${minutes > 0 ? ` ${minutes}분` : ''}`;

  let dDayText = 'D-DAY';
  let diffDays = 0;
  try {
    // 자정(00:00:00) 기준 날짜 차이 계산으로 예식 당일 오전에도 항상 'D-DAY 오늘' 표시
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const targetMidnight = new Date(year, month - 1, day).getTime();
    diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
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
  const venueAddress = sectionCustomMap.location?.body || `${venueTitle} (노을역 3번 출구 방향)`;

  // 신랑·신부 성함 동적 파싱
  const parts = hostNames
    .split(/\s*[·ㆍ・&,/|]\s*|\s+와\s+|\s+과\s+/)
    .map((s) => s.replace(/^(신랑|신부|groom|bride)\s*/i, '').trim())
    .filter(Boolean);
  const groomName = parts[0] || '신랑';
  const brideName = parts[1] || '신부';

  // 현재 적용 색상 및 폰트 (WCAG 명도 대비 자동 보정 적용)
  const effectiveBgColor = customThemeStyle?.bgColor || themePreset.defaultBgColor || 'var(--paper, #ffffff)';
  const rawThemeTextColor = customThemeStyle?.textColor || themePreset.defaultTextColor || 'var(--ink, #1f2937)';
  const rawThemeAccentColor = customThemeStyle?.accentColor || themePreset.defaultAccentColor || 'var(--brand, #e11d48)';

  const isDarkTheme = isDarkThemeBg(effectiveBgColor);
  const effectiveTextColor = ensureLegibleColor(rawThemeTextColor, effectiveBgColor, 4.5);
  const effectiveAccentColor = ensureLegibleColor(rawThemeAccentColor, effectiveBgColor, 3.5);

  const getSectionStyle = (key: InvitationSectionKey) => {
    const config = sectionCustomMap[key];
    const fontMap = {
      serif: '"Nanum Myeongjo", "Batang", "Noto Serif KR", Georgia, serif',
      sans: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      script: '"Caveat", "Dancing Script", cursive, "Nanum Pen Script", cursive',
    };
    const activeFont = config?.fontFamily || themePreset.defaultFont;
    const candidateColor = config?.textColor || effectiveTextColor;
    return {
      fontFamily: fontMap[activeFont],
      color: ensureLegibleColor(candidateColor, effectiveBgColor, 4.5),
    };
  };

  const getSectionAccent = (key: InvitationSectionKey) => {
    const candidateAccent = sectionCustomMap[key]?.accentColor || effectiveAccentColor;
    return ensureLegibleColor(candidateAccent, effectiveBgColor, 3.5);
  };

  // ============================================================
  // [사용자 핵심 지적 반영] 섹션 0번: 신랑·신부 메인 웨딩 사진 포토 프레임 렌더러
  // 아치형(arch), 감성사진형(polaroid), 둥근형(gold_round), 네모형(square), 4컷 필름형(life4cut)
  // ============================================================
  const renderFramedHeroPhoto = (photoUrl: string) => {
    const resolvedUrl = resolveAssetUrl(photoUrl);
    const captionColor = effectiveTextColor;
    const subCaptionColor = isDarkTheme ? 'rgba(248, 250, 252, 0.78)' : '#64748b';
    const cardTextColor = isDarkThemeBg(frameColor) ? '#f8fafc' : '#1e293b';

    switch (frameStyle) {
      case 'arch':
        return (
          <div className="inv-framed-arch-wrap">
            <div
              className="inv-framed-arch"
              style={{
                borderColor: frameColor,
                backgroundImage: `url(${resolvedUrl})`,
              }}
            >
              <div className="inv-framed-arch-overlay" />
              <div className="inv-framed-arch-badge">SAVE THE DATE</div>
            </div>
            <div className="inv-framed-caption" style={{ color: captionColor }}>
              <h1 className="inv-framed-names" style={{ margin: 0, color: captionColor }}>{hostNames}</h1>
              <span className="inv-framed-meta" style={{ color: subCaptionColor }}>
                {year}. {month < 10 ? `0${month}` : month}. {day < 10 ? `0${day}` : day} · {venueTitle}
              </span>
            </div>
          </div>
        );

      case 'life4cut':
        return (
          <div className="inv-framed-life4cut-wrap">
            <div
              className="inv-framed-life4cut-strip"
              style={{ backgroundColor: frameColor, color: cardTextColor }}
            >
              <div className="inv-life4cut-top-logo" style={{ color: cardTextColor }}>
                ✦ 4-CUT WEDDING · OUR SPECIAL DAY ✦
              </div>
              <div className="inv-life4cut-cells">
                <div className="inv-life4cut-cell" style={{ backgroundImage: `url(${resolvedUrl})` }} />
                <div className="inv-life4cut-cell" style={{ backgroundImage: `url(${imgSunset})` }} />
                <div className="inv-life4cut-cell" style={{ backgroundImage: `url(${imgStudioPeach})` }} />
                <div className="inv-life4cut-cell inv-life4cut-cell--quote">
                  <span>사랑하는 사람과 함께 걷는 길</span>
                  <h1 style={{ margin: 0, fontSize: 'inherit', fontFamily: 'inherit' }}>{hostNames}</h1>
                </div>
              </div>
              <div className="inv-life4cut-bottom-watermark" style={{ color: cardTextColor }}>
                <span>{year}. {month < 10 ? `0${month}` : month}. {day < 10 ? `0${day}` : day}</span>
                <span>SPECIAL MOMENT</span>
              </div>
            </div>
          </div>
        );

      case 'polaroid':
        return (
          <div className="inv-framed-polaroid-wrap">
            <div
              className="inv-framed-polaroid-card"
              style={{ backgroundColor: frameColor, color: cardTextColor }}
            >
              <div className="inv-polaroid-tape-strip" />
              <div
                className="inv-polaroid-photo-area"
                style={{ backgroundImage: `url(${resolvedUrl})` }}
              />
              <div className="inv-polaroid-footer-text" style={{ color: cardTextColor }}>
                <div className="inv-polaroid-cursive-title" style={{ color: cardTextColor }}>
                  The First Day of Us
                </div>
                <div className="inv-polaroid-names-date" style={{ color: cardTextColor }}>
                  <h1 style={{ margin: 0, font: 'inherit' }}>{hostNames}</h1>
                  <span>{year}. {month}. {day}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'gold_round':
        return (
          <div className="inv-framed-gold-wrap">
            <div className="inv-framed-gold-round" style={{ borderColor: frameColor || '#d4af37' }}>
              <div className="inv-gold-inner-ring">
                <div
                  className="inv-gold-photo"
                  style={{ backgroundImage: `url(${resolvedUrl})` }}
                />
              </div>
            </div>
            <div className="inv-framed-caption" style={{ marginTop: 12, color: captionColor }}>
              <span className="inv-gold-royal-title" style={{ color: effectiveAccentColor }}>
                CELEBRATION OF LOVE
              </span>
              <h1 className="inv-framed-names" style={{ margin: 0, fontFamily: 'serif', color: captionColor }}>
                {hostNames}
              </h1>
              <span className="inv-framed-meta" style={{ color: subCaptionColor }}>
                {year}년 {month}월 {day}일 · {venueTitle}
              </span>
            </div>
          </div>
        );

      case 'square':
        return (
          <div className="inv-framed-square-wrap">
            <div
              className="inv-framed-square"
              style={{
                borderColor: frameColor,
                backgroundColor: frameColor,
              }}
            >
              <div
                className="inv-square-inner-photo"
                style={{ backgroundImage: `url(${resolvedUrl})` }}
              />
            </div>
            <div className="inv-framed-caption" style={{ color: captionColor }}>
              <h1 className="inv-framed-names" style={{ margin: 0, color: captionColor }}>{hostNames}</h1>
              <span className="inv-framed-meta" style={{ color: subCaptionColor }}>
                {displayTimeDot}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================
  // [사용자 핵심 지적 반영] 실사 포토 기반 16종 시그니처 히어로 커버 렌더러
  // 테마 카드 인물과 미리보기 모달 인물 100% 일치 보장
  // ============================================================
  const renderSignatureThemeHero = () => {
    const defaultThemePhoto = getThemeDefaultPhoto(activeThemeId);
    const rawPhoto = customMainPhoto || defaultThemePhoto;
    const heroPhoto = (defaultImg: string) => resolveAssetUrl(customMainPhoto || defaultImg);

    // 사용자가 'full' 이외의 프레임 스타일(아치형, 감성사진형, 둥근형, 네모형, 4컷 필름형)을 선택한 경우
    if (frameStyle && frameStyle !== 'full') {
      return (
        <div className="inv-hero-framed-container">
          {renderFramedHeroPhoto(rawPhoto)}
        </div>
      );
    }

    // 기본 'full' 풀커버 테마별 시그니처 히어로 (16종 전 테마 완벽 매핑)
    const DIRECT_HERO_IDS = new Set([
      'forest-fresh', 'green-canopy', 'botanical-garden',
      'our-vow', 'the-wedding', 'cinematic-movie',
      'warm-heart', 'with-love', 'photo-background',
      'minimal-arch', 'cover-a', 'wax-seal', 'tape-card',
      'typo-frame', 'script-card', 'center-line', 'quiet',
      'spring-blossom', 'moonlight-garden', 'traditional-hanji',
      'hanok-heritage', 'starlight-banquet', 'photo-only',
    ]);
    const heroKey = DIRECT_HERO_IDS.has(activeThemeId)
      ? activeThemeId
      : themePreset.heroType;
    switch (heroKey) {
      case 'forest-fresh':
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
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#fef08a' }}>
                {displayTimeKorean}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'our-vow':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgSunset)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--sunset" />
            <div className="inv-cover-top-center-names">OUR SACRED VOW</div>
            <div className="inv-cover-center-script-huge">Our Vow</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#fed7aa' }}>
                {displayTimeDot}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.85)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'the-wedding':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgSunset)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--sunset" />
            <div className="inv-cover-top-center-names">WEDDING INVITATION</div>
            <div className="inv-cover-center-script-huge">우리 둘의 약속</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#fed7aa' }}>
                {displayTimeDot}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.85)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'cinematic-movie':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full inv-hero-sig--cinematic" style={{ backgroundImage: `url(${heroPhoto(imgSunset)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--sunset" />
            <div className="inv-cover-top-center-names">CINEMATIC MOMENT</div>
            <div className="inv-cover-center-script-huge">우리만의 상영</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#fed7aa' }}>
                {displayTimeDot}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.85)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'photo-background':
      case 'minimal-arch':
      case 'cover-a':
        return (
          <div className="inv-hero-sig inv-hero-sig--split">
            <div className="inv-hero-split-photo" style={{ backgroundImage: `url(${heroPhoto(imgStudioPeach)})` }} />
            <div className="inv-hero-split-info">
              <div className="inv-split-info-header">
                <h1 className="inv-split-names" style={{ margin: 0 }}>{hostNames}</h1>
                <span className="inv-split-sub">The First Day of Us</span>
              </div>
              <div className="inv-split-divider" />
              <div className="inv-split-row">
                <span className="inv-split-label">일시 /</span>
                <span className="inv-split-val">{displayTimeKorean}</span>
              </div>
              <div className="inv-split-row">
                <span className="inv-split-label">장소 /</span>
                <span className="inv-split-val">{venueTitle}</span>
              </div>
            </div>
          </div>
        );

      case 'warm-heart':
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
              <div className="inv-script-with-love">warm heart</div>
              <h1 className="inv-sig-names" style={{ fontFamily: 'serif', marginTop: 6 }}>{hostNames}</h1>
              <div className="inv-sig-date">
                {displayTimeKorean}
              </div>
              <div className="inv-sig-venue">{venueTitle}</div>
            </div>
          </div>
        );

      case 'wax-seal':
        return (
          <div
            className="inv-hero-sig inv-hero-sig--wax-seal"
            style={{
              backgroundImage: `url(${heroPhoto(imgWaxEnvelope)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
            }}
          >
            <div
              className="wax-seal-interactive-hotspot"
              onClick={() => setEnvelopeOpened(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEnvelopeOpened(true);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="왁스 씰 개봉"
              title="클릭하여 왁스 씰 개봉"
            />
            <div className="inv-wax-envelope-bottom-text">
              <h1 className="inv-wax-calligraphy-names" style={{ margin: 0 }}>{hostNames}</h1>
              <div className="inv-wax-calligraphy-venue">{venueTitle}</div>
              <div className="inv-wax-calligraphy-date">
                {displayTimeDot}
              </div>
            </div>
          </div>
        );

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
                <h1 className="polaroid-caption-names" style={{ margin: 0, font: 'inherit' }}>{hostNames}</h1>
              </div>
            </div>
            <div className="inv-sig-content" style={{ marginTop: 14 }}>
              <div className="inv-sig-eng-text">WE ARE GETTING MARRIED</div>
              <div className="inv-sig-venue">{venueTitle}</div>
            </div>
          </div>
        );

      case 'typo-frame':
      case 'script-card':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgGreenCanopy)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--forest" />
            <div className="inv-typo-top-group">
              <div className="inv-typo-sub-lead">{themePreset.heroType === 'script-card' ? 'OUR SPECIAL DAY' : 'WEDDING INVITATION'}</div>
              <h1 className="inv-typo-headline">{themePreset.heroType === 'script-card' ? 'Our Day' : '결혼합니다'}</h1>
            </div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#fefae0' }}>
                {displayTimeKorean}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'center-line':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgSunset)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--sunset" />
            <div className="inv-cover-top-center-names">SAVE THE DATE</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#fed7aa' }}>
                {displayTimeDot}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'quiet':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgBenchQuiet)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--subtle" />
            <div className="inv-sig-content inv-sig-content--floating">
              <span className="inv-photo-only-sub">INVITATION</span>
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#f8fafc' }}>
                {displayTimeDot}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'spring-blossom':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgCherryBlossom)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--cherry" />
            <div className="inv-cover-top-center-names">SPRING BLOSSOM 🌸</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#ffe4e6' }}>
                {displayTimeKorean}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.92)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'moonlight-garden':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgNightGarden)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--night" />
            <div className="inv-cover-top-center-names">MOONLIGHT GARDEN 🌙</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#fde047' }}>
                {displayTimeKorean}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'traditional-hanji':
      case 'hanok-heritage':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgHanbok)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--subtle" />
            <div className="inv-cover-top-center-names">백년가약 (百年佳約)</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#fef08a' }}>
                {displayTimeKorean}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'starlight-banquet':
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(imgLuxuryHotel)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--luxury" />
            <div className="inv-cover-top-center-names">HOTEL GRAND BALLROOM ✨</div>
            <div className="inv-sig-content inv-sig-content--floating">
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#fde047' }}>
                {displayTimeKorean}
              </div>
              <div className="inv-sig-venue" style={{ color: 'rgba(255,255,255,0.9)' }}>{venueTitle}</div>
            </div>
          </div>
        );

      case 'photo-only':
      default:
        return (
          <div className="inv-hero-sig inv-hero-sig--photo-full" style={{ backgroundImage: `url(${heroPhoto(defaultThemePhoto)})` }}>
            <div className="inv-real-photo-overlay inv-overlay--subtle" />
            <div className="inv-sig-content inv-sig-content--floating">
              <span className="inv-photo-only-sub">OUR BEGINNING</span>
              <h1 className="inv-sig-names" style={{ color: '#ffffff' }}>{hostNames}</h1>
              <div className="inv-sig-date" style={{ color: '#f8fafc' }}>
                {displayTimeDot}
              </div>
              <div className="inv-sig-venue" style={{ color: '#cbd5e1' }}>{venueTitle}</div>
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
            <h3 className="inv-section-title">{title}</h3>

            <div className="inv-greeting-box">
              <p className="inv-greeting-text">{bodyText}</p>
              <div className="inv-divider-line" />
              <div className="inv-host-names-block">
                <div>
                  <strong>신랑측 혼주</strong> 의 장남 <strong>{groomName}</strong>
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>신부측 혼주</strong> 의 장녀 <strong>{brideName}</strong>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case 'schedule': {
        const title = custom?.title || '예식 일시 & 달력';
        const activeCalendarStyle = custom?.calendarStyle || calendarStyle || 'classic_table';
        const badgeSurface = isDarkTheme ? '#161423' : '#ffffff';
        const badgeBg = badgeSurface;
        const badgeInk = ensureLegibleColor(accent, badgeSurface, 4.5);
        const badgeLabel = getContrastingTextColor(badgeSurface);

        return (
          <section key="schedule" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              WEDDING DAY
            </span>
            <h3 className="inv-section-title">{title}</h3>

            <div className={`inv-schedule-card inv-schedule-card--${activeCalendarStyle}`}>
              {/* 모던 박스 뱃지 스타일 (box_badge) */}
              {activeCalendarStyle === 'box_badge' && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ padding: '8px 12px', background: badgeBg, border: `2px solid ${accent}`, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: badgeLabel, opacity: 0.75, fontWeight: 700, letterSpacing: '0.04em' }}>YEAR</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: badgeInk }}>{year}</div>
                  </div>
                  <div style={{ padding: '8px 12px', background: badgeBg, border: `2px solid ${accent}`, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: badgeLabel, opacity: 0.75, fontWeight: 700, letterSpacing: '0.04em' }}>DATE</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: badgeInk }}>{month}월 {day}일</div>
                  </div>
                  <div style={{ padding: '8px 12px', background: badgeBg, border: `2px solid ${accent}`, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: badgeLabel, opacity: 0.75, fontWeight: 700, letterSpacing: '0.04em' }}>TIME</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: badgeInk }}>{ampm} {displayHour}시{minutes > 0 ? ` ${minutes}분` : ''}</div>
                  </div>
                </div>
              )}

              <div className="inv-wedding-time-badge">
                <span className="inv-time-strong">
                  {displayTimeKorean}
                </span>
                <span
                  className="inv-dday-badge"
                  style={{
                    backgroundColor: accent,
                    color: getContrastingTextColor(accent),
                  }}
                >
                  {dDayText}
                </span>
              </div>

              {/* 미니멀 텍스트 모드 (minimal_text): 테이블 달력 대신 정갈한 타이포그래피 카드 */}
              {activeCalendarStyle === 'minimal_text' ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: 12, margin: '14px 0' }}>
                  <div style={{ fontSize: 13, letterSpacing: '0.15em', color: accent, fontWeight: 700, marginBottom: 6 }}>
                    SAVE THE DATE
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'serif', marginBottom: 8 }}>
                    {year}. {month < 10 ? `0${month}` : month}. {day < 10 ? `0${day}` : day}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>
                    {ampm} {displayHour}시{minutes > 0 ? ` ${minutes}분` : ' 정각'} · {venueTitle}
                  </div>
                  <div style={{ marginTop: 12, display: 'inline-block', padding: '4px 12px', background: accent, color: getContrastingTextColor(accent), borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {dDayText}
                  </div>
                </div>
              ) : (
                /* 달력 그리드 (classic_table, heart_stamp, box_badge) */
                <div className={`inv-calendar-wrapper inv-calendar-wrapper--${activeCalendarStyle}`}>
                  <div className="inv-cal-header-row">
                    {['일', '월', '화', '수', '목', '금', '토'].map((dow, idx) => (
                      <span key={dow} className={idx === 0 ? 'inv-dow--sun' : idx === 6 ? 'inv-dow--sat' : ''}>
                        {dow}
                      </span>
                    ))}
                  </div>
                  <div className="inv-cal-grid">
                    {calendarWeeks.map((week, wIdx) => (
                      <div key={wIdx} className="inv-cal-week">
                        {week.map((d, dIdx) => {
                          const isWeddingDay = d === day;
                          return (
                            <div
                              key={dIdx}
                              className={`inv-cal-cell ${isWeddingDay ? 'inv-cal-cell--wedding' : ''} ${isWeddingDay && activeCalendarStyle === 'heart_stamp' ? 'inv-cal-cell--heart-stamp' : ''}`}
                              style={
                                isWeddingDay
                                  ? {
                                      backgroundColor: accent,
                                      color: getContrastingTextColor(accent),
                                      boxShadow: activeCalendarStyle === 'heart_stamp' ? `0 0 0 3px ${accent}44, 0 4px 10px rgba(0,0,0,0.15)` : undefined,
                                    }
                                  : undefined
                              }
                            >
                              {d !== null ? d : ''}
                              {isWeddingDay && (
                                <span className="inv-cal-heart-dot" style={{ fontSize: activeCalendarStyle === 'heart_stamp' ? 14 : 10 }}>
                                  ♥
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      }

      case 'gallery': {
        const title = custom?.title || '우리의 아름다운 순간 (신랑·신부 공식 화보)';
        const activeGalMode = galleryMode || custom?.galleryMode || 'carousel';

        return (
          <section key="gallery" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              OFFICIAL GALLERY 1
            </span>
            <h4 className="inv-main-heading">{title}</h4>
            <p style={{ fontSize: 12, opacity: 0.75, textAlign: 'center', marginBottom: 14 }}>
              신랑·신부가 직접 엄선한 공식 웨딩 화보 앨범입니다.
            </p>

            {/* 신랑·신부 공식 화보 사진 추가 버튼 (미리보기 체험 전용) */}
            {previewMode && (
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <input
                  ref={officialPhotoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAddOfficialPhoto}
                />
                <button
                  type="button"
                  className="inv-btn-secondary"
                  style={{ minHeight: 44, fontSize: 13, padding: '0 16px' }}
                  onClick={() => officialPhotoInputRef.current?.click()}
                >
                  📸 신랑·신부 공식 사진 추가 등록 (체험)
                </button>
              </div>
            )}

            {/* 캐러셀 슬라이더 모드 */}
            {activeGalMode === 'carousel' && (
              <div className="inv-carousel-wrap">
                <div className="inv-carousel-viewport">
                  {officialPhotos.length > 0 && (
                    <div className="inv-carousel-slide">
                      <img
                        src={resolveAssetUrl(officialPhotos[carouselIdx]?.img)}
                        alt={officialPhotos[carouselIdx]?.caption || '웨딩 사진'}
                        className="inv-carousel-slide-img"
                      />
                      <div className="inv-carousel-caption">
                        <span className="inv-carousel-label">{officialPhotos[carouselIdx]?.label}</span>
                        <p className="inv-carousel-text">{officialPhotos[carouselIdx]?.caption}</p>
                      </div>
                    </div>
                  )}

                  {/* 좌우 슬라이드 네비게이션 버튼 (사진 양 끝에 배치) */}
                  <button
                    type="button"
                    className="inv-carousel-arrow-btn inv-carousel-arrow-btn--prev"
                    onClick={() =>
                      setCarouselIdx((prev) => (prev > 0 ? prev - 1 : officialPhotos.length - 1))
                    }
                    title="이전 사진 보기"
                    aria-label="이전 사진"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="inv-carousel-arrow-btn inv-carousel-arrow-btn--next"
                    onClick={() =>
                      setCarouselIdx((prev) => (prev < officialPhotos.length - 1 ? prev + 1 : 0))
                    }
                    title="다음 사진 보기"
                    aria-label="다음 사진"
                  >
                    ›
                  </button>
                </div>

                <div className="inv-carousel-indicators">
                  {officialPhotos.map((_, dotIdx) => (
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

            {/* 4컷 필름 모드 */}
            {activeGalMode === 'life4cut_strip' && (
              <div className="inv-life4cut-strip-wrap">
                <div className="inv-life4cut-film" style={{ borderColor: frameColor }}>
                  <div className="inv-life4cut-header">★ 4-CUT WEDDING ★</div>
                  {officialPhotos.slice(0, 4).map((it, idx) => (
                    <div key={idx} className="inv-life4cut-cell" style={{ height: 110, overflow: 'hidden', padding: 0 }}>
                      <img src={resolveAssetUrl(it.img)} alt={it.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  <div className="inv-life4cut-footer">
                    <span>{year}. {month}. {day}</span>
                    <span>{hostNames}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3x3 그리드 모드 */}
            {activeGalMode === 'grid3x3' && (
              <div className="inv-gallery-grid">
                {officialPhotos.map((item, i) => (
                  <div key={i} className="inv-gallery-item" style={{ overflow: 'hidden', padding: 0, height: 100, borderRadius: 8 }}>
                    <img src={resolveAssetUrl(item.img)} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      case 'guest_snap': {
        const title = custom?.title || '하객 실시간 현장 스냅 (참여형 앨범)';
        return (
          <section key="guest_snap" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              GUEST LIVE SNAPS 2
            </span>
            <h4 className="inv-main-heading">{title}</h4>
            <p style={{ fontSize: 12, opacity: 0.75, textAlign: 'center', marginBottom: 12 }}>
              오늘 예식에 참석하신 하객분들이 직접 촬영한 생생한 현장 사진을 실시간으로 함께 공유합니다.
            </p>

            {!previewMode ? (
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--paper)', borderRadius: 12, border: '1px dashed var(--line)', margin: '12px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>📸 하객 실시간 현장 스냅 업로드는 준비 중이에요 (데모)</span>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <button
                    type="button"
                    className="inv-btn-primary"
                    style={{
                      minHeight: 44,
                      fontSize: 13,
                      padding: '0 18px',
                      backgroundColor: accent,
                      color: getContrastingTextColor(accent),
                    }}
                    onClick={() => setShowGuestUploadForm(!showGuestUploadForm)}
                  >
                    {showGuestUploadForm ? '닫기 ▲' : '📸 나도 현장 사진 올리기 (체험)'}
                  </button>
                </div>

                {/* 하객 사진 업로드 폼 */}
                {showGuestUploadForm && (
                  <form onSubmit={handleGuestSnapSubmit} className="inv-guest-upload-card">
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <input
                        type="text"
                        placeholder="하객 닉네임 (예: 신랑 후배 준혁)"
                        value={guestUploaderName}
                        onChange={(e) => setGuestUploaderName(e.target.value)}
                        className="inv-field-input"
                        style={{ width: '45%' }}
                      />
                      <input
                        type="text"
                        placeholder="사진 한 줄 설명 (예: 신부대기실 너무 예뻐요)"
                        value={guestCaptionText}
                        onChange={(e) => setGuestCaptionText(e.target.value)}
                        className="inv-field-input"
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        ref={guestPhotoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 15 * 1024 * 1024) {
                            alert('사진 파일 용량은 15MB 이하만 업로드 가능합니다.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setGuestSnapFileImg(ev.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <button
                        type="button"
                        className="inv-btn-secondary"
                        style={{ minHeight: 44, fontSize: 13, padding: '0 14px' }}
                        onClick={() => guestPhotoInputRef.current?.click()}
                      >
                        {guestSnapFileImg ? '✓ 사진 선택됨' : '📷 사진 선택'}
                      </button>
                      <button
                        type="submit"
                        className="inv-btn-primary"
                        style={{
                          flex: 1,
                          minHeight: 44,
                          fontSize: 13,
                          backgroundColor: accent,
                          color: getContrastingTextColor(accent),
                        }}
                      >
                        🎉 등록
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* 하객 스냅 카드 목록 */}
            <div className="inv-guest-snap-list">
              {guestPhotos.map((gp) => (
                <div key={gp.id} className="inv-guest-snap-card">
                  {gp.img && (
                    <div
                      className="inv-guest-snap-photo"
                      style={{ backgroundImage: `url(${resolveAssetUrl(gp.img)})` }}
                    />
                  )}
                  <div className="inv-guest-snap-info">
                    <div className="inv-guest-snap-meta">
                      <span className="inv-uploader-badge">📸 {gp.uploader}</span>
                      <span className="inv-time-badge">{gp.time}</span>
                    </div>
                    <p className="inv-guest-snap-caption-text">{gp.caption}</p>
                    <div className="inv-guest-snap-actions">
                      <button
                        type="button"
                        className={`inv-snap-like-btn ${gp.hasLiked ? 'inv-snap-like-btn--active' : ''}`}
                        onClick={() => handleLikeGuestPhoto(gp.id)}
                      >
                        {gp.hasLiked ? '❤️' : '🤍'} {gp.likes}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'location': {
        const title = custom?.title || '오시는 길 & 약도';

        return (
          <section key="location" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              LOCATION &amp; MAP
            </span>
            <h4 className="inv-main-heading">{title}</h4>

            <div className="inv-map-box">
              {/* 인터랙티브 비주얼 약도 & 핀 */}
              <div className="inv-interactive-map-frame">
                <div className="inv-svg-map-canvas">
                  <div className="inv-map-grid-bg" />
                  <div className="inv-map-road inv-map-road--h1" />
                  <div className="inv-map-road inv-map-road--h2" />
                  <div className="inv-map-road inv-map-road--v1" />
                  <div className="inv-map-river" />
                  <div className="inv-subway-station-pin">
                    <span className="inv-subway-badge">🚇 노을역 3번 출구</span>
                  </div>
                  <div className="inv-wedding-hall-pin">
                    <div className="inv-radar-pulse" />
                    <span className="inv-map-pin-icon">📍</span>
                    <span className="inv-map-hall-badge">{venueTitle}</span>
                  </div>
                </div>
              </div>

              {/* 웨딩홀 주소 카드 및 원클릭 복사 */}
              <div className="inv-venue-info-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontSize: 20 }}>💒</span>
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

              {/* 교통편 & 식사 안내 배너 (notice) */}
              {invitation.notice?.trim() ? (
                <div
                  className="inv-notice-banner"
                  style={{
                    padding: '12px 14px',
                    background: isDarkTheme ? 'rgba(255, 255, 255, 0.08)' : '#f8fafc',
                    border: isDarkTheme ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e2e8f0',
                    borderRadius: 8,
                    marginBottom: 14,
                    fontSize: 12,
                    lineHeight: 1.5,
                    textAlign: 'left',
                  }}
                >
                  <strong style={{ color: accent, display: 'block', marginBottom: 3 }}>
                    🍽️ 식사 &amp; 교통편 안내
                  </strong>
                  <span>{invitation.notice}</span>
                </div>
              ) : null}

              {/* 교통수단 상세 안내 */}
              <div className="inv-transport-guide">
                <div>
                  <strong>🚇 지하철 / 대중교통:</strong> 인근 지하철역 도보 5~10분
                </div>
                <div>
                  <strong>🚌 버스:</strong> {venueTitle} 인근 정류장 하차
                </div>
                <div>
                  <strong>🚗 자가용 / 주차:</strong> 웨딩홀 건물 내 무료 주차 지원
                </div>
              </div>
            </div>
          </section>
        );
      }

      case 'guestbook': {
        const title = custom?.title || '축하의 한마디 (실시간 방명록)';
        return (
          <section key="guestbook" className="inv-content-section" style={sectionStyle}>
            <span className="inv-sub-heading" style={{ color: accent }}>
              GUESTBOOK
            </span>
            <h4 className="inv-main-heading">{title}</h4>
            <p style={{ fontSize: 12, opacity: 0.75, textAlign: 'center', marginBottom: 14 }}>
              신랑 신부에게 따뜻한 축하의 메시지를 남겨주세요. 실시간으로 반영됩니다.
            </p>

            {!previewMode ? (
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--paper)', borderRadius: 12, border: '1px dashed var(--line)', margin: '12px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>💌 축하 방명록 등록은 준비 중이에요 (데모)</span>
              </div>
            ) : (
              <form onSubmit={handleAddComment} className="inv-guestbook-form">
                {/* 스티커 이모지 선택 바 */}
                <div className="inv-emoji-selector-row">
                  {['🌸', '💍', '🎉', '🥂', '🕊️', '❤️'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`inv-emoji-chip ${selectedEmoji === em ? 'inv-emoji-chip--active' : ''}`}
                      onClick={() => setSelectedEmoji(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>

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
                    minHeight: 44,
                    fontSize: 13,
                    marginTop: 6,
                    backgroundColor: accent || 'var(--brand)',
                    color: getContrastingTextColor(accent || 'var(--brand)'),
                  }}
                >
                  💌 축하글 실시간 등록하기 (체험)
                </button>
              </form>
            )}

            <div className="inv-guestbook-list">
              {comments.map((cmt) => (
                <div key={cmt.id} className="inv-guestbook-card">
                  <div className="inv-guestbook-card__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{cmt.avatar}</span>
                      <strong>{cmt.author}</strong>
                      {cmt.isNew && <span className="inv-badge-new">NEW</span>}
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
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setGroomAccountOpen(!groomAccountOpen);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>👔</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>신랑측 계좌번호</span>
                  </div>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    {groomAccountOpen ? '▲ 닫기' : '▼ 펼치기'}
                  </span>
                </div>

                {groomAccountOpen && (
                  <div className="inv-account-detail">
                    <div className="inv-account-line">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>신랑 {groomName}</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                          달빛은행 123-456-{invitation.id.replace(/[^0-9]/g, '').slice(-6) || '789012'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inv-copy-chip"
                        onClick={() =>
                          handleCopyText(
                            `달빛은행 123-456-${invitation.id.replace(/[^0-9]/g, '').slice(-6) || '789012'}`,
                            `신랑 ${groomName} 계좌번호가`
                          )
                        }
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
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setBrideAccountOpen(!brideAccountOpen);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>👰</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>신부측 계좌번호</span>
                  </div>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    {brideAccountOpen ? '▲ 닫기' : '▼ 펼치기'}
                  </span>
                </div>

                {brideAccountOpen && (
                  <div className="inv-account-detail">
                    <div className="inv-account-line">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>신부 {brideName}</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                          노을은행 987-654-{invitation.id.replace(/[^0-9]/g, '').slice(-6) || '321098'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inv-copy-chip"
                        onClick={() =>
                          handleCopyText(
                            `노을은행 987-654-${invitation.id.replace(/[^0-9]/g, '').slice(-6) || '321098'}`,
                            `신부 ${brideName} 계좌번호가`
                          )
                        }
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
        const title = custom?.title || '참석 여부 회신 (RSVP)';
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
                  style={{
                    minHeight: 44,
                    fontSize: 13,
                    padding: '0 20px',
                    backgroundColor: accent,
                    color: getContrastingTextColor(accent),
                  }}
                  onClick={() => {
                    if (previewMode) {
                      setCopyNotice(
                        '참석 회신은 하객 전용 초대 링크(t와 g)에서만 열려요. 이 미리보기에서는 이동하지 않아요.',
                      );
                      setTimeout(() => setCopyNotice(null), 3000);
                      return;
                    }
                    const token = invitation.sharingToken?.trim() || '';
                    const g = guestToken?.trim() || '';
                    if (token && g) {
                      const params = new URLSearchParams();
                      params.set('t', token);
                      params.set('g', g);
                      router.push(`/invitations/rsvp/?${params.toString()}`);
                      return;
                    }
                    setCopyNotice(
                      '참석 회신은 청첩장에 동봉된 개인별 하객 링크(g)로 접속했을 때만 가능해요.',
                    );
                    setTimeout(() => setCopyNotice(null), 3000);
                  }}
                >
                  🌸 참석합니다
                </button>
                <button
                  type="button"
                  className="inv-btn-secondary"
                  style={{ minHeight: 44, fontSize: 13, padding: '0 18px' }}
                  onClick={() => {
                    setCopyNotice('마음으로 축하하기 기능은 현재 준비 중입니다 (제안 · P1)');
                    setTimeout(() => setCopyNotice(null), 3000);
                  }}
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
      className={`inv-render-canvas inv-theme--${themePreset.id} inv-theme--${activeThemeId} inv-layout--${activeLayout} ${
        isDarkTheme ? 'inv-mode--dark' : 'inv-mode--light'
      }`}
      data-invite-theme={themePreset.id}
      data-invite-theme-alias={activeThemeId}
      style={dynamicBackgroundStyle}
    >
      {/* 사용자 음원 오디오 태그 */}
      {customBgmUrl && <audio ref={customAudioRef} src={customBgmUrl} loop />}

      {/* 복사 완료 토스트 알림 */}
      {copyNotice && <div className="inv-floating-toast">{copyNotice}</div>}

      {/* 봉투 & 왁스씰 개봉 인트로 오버레이 */}
      {activeEffect === 'envelope' && !envelopeOpened && (
        <div className="inv-envelope-intro-overlay">
          <div className="inv-envelope-intro-box">
            <div className="inv-envelope-top-flap" />
            <button
              type="button"
              className="inv-envelope-seal"
              onClick={() => setEnvelopeOpened(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEnvelopeOpened(true);
                }
              }}
              aria-label="봉투 열기"
            >
              <span className="inv-envelope-seal__wax">💍</span>
              <span className="inv-envelope-seal__click-text">탭하여 봉투 열기</span>
            </button>
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
      {(activeBgm !== 'none' || customBgmUrl) && (
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
          <span>
            {isPlaying
              ? (customBgmTitle || BGM_LABEL_MAP[activeBgm] || 'BGM ON')
              : 'BGM OFF'}
          </span>
        </button>
      )}

      {/* 최상단: [선택한 테마/프레임의 시그니처 히어로 커버] */}
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
