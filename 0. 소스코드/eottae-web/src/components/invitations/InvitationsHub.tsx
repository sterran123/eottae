'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Invitation, InvitationThemeId, InvitationLayoutStyle } from '@/lib/invitations/types';
import {
  loadInvitationsDemo,
  deleteInvitation,
  subscribeInvitationsDemo,
} from '@/lib/invitations/demo-storage';
import { invitationGuestHref } from '@/lib/invitations/href';
import { getThemePreset } from '@/lib/invitations/theme-presets';
import InvitationPreviewModal from './InvitationPreviewModal';
import InvitationEditor from './InvitationEditor';

type ThemeCategory = 'all' | 'photo' | 'typo' | 'emotional' | 'heritage';

interface DesignCoverItem {
  id: string;
  name: string;
  category: ThemeCategory;
  themeId: InvitationThemeId;
  layoutStyle: InvitationLayoutStyle;
  coverClass: string;
  tag: string;
  hostNames: string;
  renderCover: () => React.ReactNode;
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

// 어때? 프리미엄 감성 모바일 청첩장 16가지 디자인 컬렉션
const DESIGN_COLLECTION: DesignCoverItem[] = [
  // 1열: 최신 웨딩 트렌드 (실사 포토/타이포)
  {
    id: 'green-canopy',
    name: '숲속의 싱그러움',
    category: 'photo',
    themeId: 'green-canopy',
    layoutStyle: 'classic',
    coverClass: 'inv-cover--green-canopy',
    tag: 'BEST',
    hostNames: '차진우 · 황슬기',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgGreenCanopy})` }}>
        <div className="inv-real-photo-overlay inv-overlay--gradient-duo" />
        <div className="inv-cover-top-names">
          <span>차진우</span>
          <span>황슬기</span>
        </div>
        <div className="inv-cover-center-korean-cursive">
          우리,
          <br />
          결혼합니다
        </div>
        <div className="inv-cover-bottom-date">2027. 05. 22. SAT 12:30</div>
      </div>
    ),
  },
  {
    id: 'the-wedding',
    name: '우리 둘의 서약',
    category: 'photo',
    themeId: 'the-wedding',
    layoutStyle: 'modern',
    coverClass: 'inv-cover--the-wedding',
    tag: 'CINEMA',
    hostNames: '이시우 · 정유린',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgSunset})` }}>
        <div className="inv-real-photo-overlay inv-overlay--sunset" />
        <div className="inv-cover-top-center-names">SIWOO &amp; YURIN</div>
        <div className="inv-cover-center-script-huge">Our Wedding</div>
        <div className="inv-cover-bottom-date">2027.11.13</div>
      </div>
    ),
  },
  {
    id: 'photo-background',
    name: '모던 스플릿',
    category: 'photo',
    themeId: 'photo-background',
    layoutStyle: 'minimal',
    coverClass: 'inv-cover--photo-background',
    tag: 'STUDIO',
    hostNames: '이태현 · 최지은',
    renderCover: () => (
      <div className="inv-split-card-cover">
        <div className="inv-split-photo" style={{ backgroundImage: `url(${imgStudioPeach})` }} />
        <div className="inv-split-info-box">
          <div className="inv-split-info-header">
            <span className="inv-split-names">이태현 · 최지은</span>
            <span className="inv-split-sub">The First Day of Us</span>
          </div>
          <div className="inv-split-divider" />
          <div className="inv-split-row">
            <span className="inv-split-label">일시 /</span>
            <span className="inv-split-val">2027년 6월 12일 토요일 오후 1시</span>
          </div>
          <div className="inv-split-row">
            <span className="inv-split-label">장소 /</span>
            <span className="inv-split-val">그랜드힐컨벤션 3층 그랜드볼룸</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'with-love',
    name: '사랑을 담아',
    category: 'emotional',
    themeId: 'with-love',
    layoutStyle: 'classic',
    coverClass: 'inv-cover--with-love',
    tag: 'ROMANTIC',
    hostNames: '홍민석 · 표하영',
    renderCover: () => (
      <div className="inv-fade-card-cover">
        <div className="inv-fade-photo" style={{ backgroundImage: `url(${imgStudioPeach})` }}>
          <div className="inv-cover-top-names" style={{ color: '#ffffff' }}>
            <span>홍민석</span>
            <span>표하영</span>
          </div>
          <div className="inv-fade-bottom-gradient" />
        </div>
        <div className="inv-fade-content">
          <div className="inv-script-with-love">with love</div>
          <div className="inv-fade-info">
            <div>2027년 4월 17일 토요일 오후 2시</div>
            <div style={{ marginTop: 2 }}>JW 메리어트 호텔 서울</div>
          </div>
        </div>
      </div>
    ),
  },

  // 2열: 감성 & 시그니처 텍스처
  {
    id: 'wax-seal',
    name: '클래식 실링인장',
    category: 'heritage',
    themeId: 'wax-seal',
    layoutStyle: 'classic',
    coverClass: 'inv-cover--wax-seal',
    tag: 'SIGNATURE',
    hostNames: '박서진 · 윤채원',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgWaxEnvelope})`, backgroundPosition: 'center 40%' }}>
        <div className="inv-wax-envelope-bottom-text">
          <div className="inv-wax-calligraphy-names">박서진 &amp; 윤채원</div>
          <div className="inv-wax-calligraphy-venue">아펠가모 광화문</div>
          <div className="inv-wax-calligraphy-date">26. 11. 14. Sat 12:30</div>
        </div>
      </div>
    ),
  },
  {
    id: 'tape-card',
    name: '스냅 포토카드',
    category: 'emotional',
    themeId: 'tape-card',
    layoutStyle: 'minimal',
    coverClass: 'inv-cover--tape-card',
    tag: 'NEW',
    hostNames: '정재현 · 김혜진',
    renderCover: () => (
      <div className="inv-tape-card-container">
        <div className="inv-tape-top-save">save the date</div>
        <div className="inv-tape-polaroid-wrap">
          <div className="inv-washi-tape-strip" />
          <div className="inv-tape-polaroid-inner" style={{ backgroundImage: `url(${imgTapeBw})` }} />
        </div>
        <div className="inv-tape-bottom-text">
          <div className="inv-tape-date">23 October 2027</div>
          <div className="inv-tape-sub">JAEHYUN &amp; HYEJIN</div>
          <div className="inv-tape-kicker">ARE GETTING MARRIED</div>
        </div>
      </div>
    ),
  },
  {
    id: 'typo-frame',
    name: '에디토리얼 프레임',
    category: 'typo',
    themeId: 'typo-frame',
    layoutStyle: 'modern',
    coverClass: 'inv-cover--typo-frame',
    tag: 'POPULAR',
    hostNames: '하민혁 · 염윤슬',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgGreenCanopy})` }}>
        <div className="inv-real-photo-overlay inv-overlay--forest" />
        <div className="inv-typo-top-group">
          <div className="inv-typo-sub-lead">THE WEDDING OF</div>
          <div className="inv-typo-headline">결혼합니다</div>
        </div>
        <div className="inv-typo-bottom-group">
          <div className="inv-typo-couple-names">하민혁 ♥ 염윤슬</div>
          <div className="inv-typo-date-loc">2027. 09. 25. 5 PM</div>
        </div>
      </div>
    ),
  },
  {
    id: 'photo-only',
    name: '모던 풀스크린',
    category: 'photo',
    themeId: 'photo-only',
    layoutStyle: 'classic',
    coverClass: 'inv-cover--photo-only',
    tag: 'STUDIO',
    hostNames: '이서윤 · 박하람',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgStudioPeach})` }}>
        <div className="inv-real-photo-overlay inv-overlay--subtle" />
      </div>
    ),
  },

  // 3열: 에디토리얼 & 매거진
  {
    id: 'script-card',
    name: '손글씨 레터',
    category: 'emotional',
    themeId: 'script-card',
    layoutStyle: 'minimal',
    coverClass: 'inv-cover--script-card',
    tag: 'ROMANTIC',
    hostNames: '황승현 · 한다솜',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgGreenCanopy})` }}>
        <div className="inv-real-photo-overlay inv-overlay--bottom-heavy" />
        <div className="inv-script-ourday-badge">Our Day</div>
        <div className="inv-script-card-bottom">
          <div className="inv-script-names">황승현 · 한다솜</div>
          <div className="inv-script-date">2027년 5월 15일 토요일 오후 1시</div>
          <div className="inv-script-venue">아펠가모 선릉</div>
        </div>
      </div>
    ),
  },
  {
    id: 'center-line',
    name: '노을빛 실루엣',
    category: 'typo',
    themeId: 'center-line',
    layoutStyle: 'modern',
    coverClass: 'inv-cover--center-line',
    tag: 'MODERN',
    hostNames: '강진우 · 서하영',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgSunset})` }}>
        <div className="inv-real-photo-overlay inv-overlay--sunset" />
        <div className="inv-centerline-top-meta">
          <span>SAVE THE DATE</span>
          <strong>JINWOO AND HAYEONG</strong>
        </div>
        <div className="inv-centerline-stack">
          <div className="inv-cl-day">04</div>
          <div className="inv-cl-month">SEP</div>
          <div className="inv-cl-divider" />
          <div className="inv-cl-year">2027</div>
        </div>
        <div className="inv-centerline-bot-venue">디에이블엣논현 라포레홀</div>
      </div>
    ),
  },
  {
    id: 'cover-a',
    name: '린넨 가든',
    category: 'photo',
    themeId: 'cover-a',
    layoutStyle: 'classic',
    coverClass: 'inv-cover--cover-a',
    tag: 'GARDEN',
    hostNames: '이태헌 · 최지은',
    renderCover: () => (
      <div className="inv-cover-a-container">
        <div className="inv-cover-a-top-bar">
          <div>
            <strong className="inv-ca-names">이태헌 · 최지은</strong>
            <div className="inv-ca-date-sm">2027년 6월 12일 토요일 오후 1시</div>
            <div className="inv-ca-venue-sm">그랜드힐컨벤션 3층 그랜드볼룸</div>
          </div>
          <span className="inv-ca-script-title">The First Day of Us</span>
        </div>
        <div className="inv-cover-a-photo-body" style={{ backgroundImage: `url(${imgStudioPeach})` }} />
      </div>
    ),
  },
  {
    id: 'quiet',
    name: '고요한 산책',
    category: 'typo',
    themeId: 'quiet',
    layoutStyle: 'minimal',
    coverClass: 'inv-cover--quiet',
    tag: 'MINIMAL',
    hostNames: '김도윤 · 송하은',
    renderCover: () => (
      <div className="inv-quiet-container">
        <div className="inv-quiet-top-text">
          <span className="inv-quiet-label">OUR WEDDING DAY</span>
          <div className="inv-quiet-names">김도윤 ♥ 송하은</div>
        </div>
        <div className="inv-quiet-photo-wrap" style={{ backgroundImage: `url(${imgBenchQuiet})` }} />
        <div className="inv-quiet-bot-venue">온기동 가든하우스</div>
      </div>
    ),
  },

  // 4열: 테마 웨딩 컬렉션
  {
    id: 'spring-blossom',
    name: '봄날의 꽃잎',
    category: 'emotional',
    themeId: 'spring-blossom',
    layoutStyle: 'classic',
    coverClass: 'inv-cover--spring-blossom',
    tag: 'FLOWER',
    hostNames: '이서윤 · 박하람',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgCherryBlossom})` }}>
        <div className="inv-real-photo-overlay inv-overlay--cherry" />
        <div className="inv-cherry-top-tag">SPRING BLOSSOM 🌸</div>
        <div className="inv-cherry-center-names">이서윤 · 박하람</div>
        <div className="inv-cherry-bot-date">화사한 봄날, 영원한 서약</div>
      </div>
    ),
  },
  {
    id: 'moonlight-garden',
    name: '달빛 정원',
    category: 'emotional',
    themeId: 'moonlight-garden',
    layoutStyle: 'modern',
    coverClass: 'inv-cover--moonlight-garden',
    tag: 'NIGHT',
    hostNames: '조한결 · 송은우',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgNightGarden})` }}>
        <div className="inv-real-photo-overlay inv-overlay--night" />
        <div className="inv-night-top-tag">MOONLIGHT GARDEN 🌙</div>
        <div className="inv-night-center-names">조한결 · 송은우</div>
        <div className="inv-night-bot-venue">달빛웨딩 야외가든</div>
      </div>
    ),
  },
  {
    id: 'traditional-hanji',
    name: '전통 한지',
    category: 'heritage',
    themeId: 'traditional-hanji',
    layoutStyle: 'classic',
    coverClass: 'inv-cover--traditional-hanji',
    tag: 'TRADITIONAL',
    hostNames: '김구름 · 최별',
    renderCover: () => (
      <div className="inv-hanji-container">
        <div className="inv-hanji-top-banner">백년가약(百年佳約)</div>
        <div className="inv-hanji-photo-wrap" style={{ backgroundImage: `url(${imgHanbok})` }}>
          <div className="inv-hanji-grid-border" />
        </div>
        <div className="inv-hanji-bot-text">
          <div className="inv-hanji-names">김구름 · 최별</div>
          <div className="inv-hanji-loc">한들시 파도마루 전통연회장</div>
        </div>
      </div>
    ),
  },
  {
    id: 'starlight-banquet',
    name: '별빛 연회',
    category: 'heritage',
    themeId: 'starlight-banquet',
    layoutStyle: 'modern',
    coverClass: 'inv-cover--starlight-banquet',
    tag: 'LUXURY',
    hostNames: '유하늘 · 윤바다',
    renderCover: () => (
      <div className="inv-real-photo-cover" style={{ backgroundImage: `url(${imgLuxuryHotel})` }}>
        <div className="inv-real-photo-overlay inv-overlay--luxury" />
        <div className="inv-luxury-top-tag">HOTEL GRAND BALLROOM ✨</div>
        <div className="inv-luxury-center-names">유하늘 · 윤바다</div>
        <div className="inv-luxury-bot-venue">샴페인 골드 럭셔리 웨딩</div>
      </div>
    ),
  },
];

function InvitationsHubContent() {
  const searchParams = useSearchParams();
  const previewParam = searchParams.get('preview');
  const editParam = searchParams.get('edit');

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [previewTarget, setPreviewTarget] = useState<Invitation | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>('all');

  const refresh = () => {
    const state = loadInvitationsDemo();
    setInvitations(state.invitations);
  };

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeInvitationsDemo(refresh);
    return () => unsubscribe();
  }, []);

  // [INV-001] ?preview=<id> 쿼리 파라미터 수신 시 해당 청첩장 미리보기 모달 자동 실행
  useEffect(() => {
    if (previewParam && invitations.length > 0) {
      const found =
        invitations.find((inv) => inv.id === previewParam || inv.sharingToken === previewParam) ||
        invitations[0];
      if (found) {
        setPreviewTarget(found);
      }
    }
  }, [previewParam, invitations]);

  const handleCopyLink = (token: string) => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const url = `${window.location.origin}${base}${invitationGuestHref(token)}`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
    }
    setCopyToast('하객 초대 링크가 복사되었습니다.');
    setTimeout(() => setCopyToast(null), 3000);
  };

  if (editParam) {
    return (
      <div className="inv-hub">
        <InvitationEditor initialId={editParam} />
      </div>
    );
  }

  const handleDelete = (id: string, title: string) => {
    if (confirm(`'${title}' 청첩장을 삭제하시겠습니까? (이 브라우저 데모에서만 삭제됩니다)`)) {
      deleteInvitation(id);
      refresh();
    }
  };

  const handleOpenDesignPreview = (design: DesignCoverItem) => {
    const base = invitations[0] || {
      id: 'demo-sample',
      ownerId: 'user-demo-me',
      title: `${design.name} 모바일 청첩장`,
      hostNames: design.hostNames,
      weddingDate: '2026-11-28T14:00:00+09:00',
      venueLabel: '노을구 달빛웨딩홀 2층 그랜드볼룸',
      greeting:
        '서로 마주 보며 다져온 사랑을 이제 한곳을 바라보며 걸어가고자 합니다.\n소중한 걸음으로 축복해 주시면 더없는 기쁨으로 간직하겠습니다.',
      sharingToken: 'k7Qm2pL9xRt4vNw8aB3cYd6e',
      visibility: 'public',
      expiry: null,
      themeId: design.themeId,
      status: 'published',
      viewerIsOwner: true,
      layoutStyle: design.layoutStyle,
      bgmPreset: 'romantic',
    };

    setPreviewTarget({
      ...base,
      title: `${design.name} 모바일 청첩장`,
      hostNames: design.hostNames,
      themeId: design.themeId,
      layoutStyle: design.layoutStyle,
    });
  };

  const filteredDesigns =
    selectedCategory === 'all'
      ? DESIGN_COLLECTION
      : DESIGN_COLLECTION.filter((d) => d.category === selectedCategory);

  return (
    <div className="inv-hub">
      {/* 1. 상단 데모 뱃지 배너 (작업지시서 표준 문구) */}
      <div className="inv-badge-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="inv-badge-chip">데모 데이터로 동작하는 3차 미리보기</span>
          <span>
            어때? 3차 모바일 청첩장 데모 스튜디오입니다. 실시간 체험 테스트에서 테마 선택, 드래그 순서 변경, 아코디언 편집, 웨딩 애니메이션을 자유롭게 확인하실 수 있습니다.
          </span>
        </div>
      </div>

      {copyToast && (
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--brand)',
            color: '#ffffff',
            borderRadius: 14,
            fontWeight: 600,
            fontSize: 13,
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}
        >
          {copyToast}
        </div>
      )}

      {/* ============================================================
       * 2. 어때? 프리미엄 디자인 쇼케이스 컬렉션 (16개 테마 + 카테고리 탭)
       * ============================================================ */}
      <section>
        <div className="inv-section-header-row">
          <div>
            <h2>프리미엄 청첩장 테마 컬렉션 ({DESIGN_COLLECTION.length}종)</h2>
            <p>
              원하시는 커버 카드를 클릭하면 스마트폰 뷰포트에서 BGM, 드래그 순서 변경, 아코디언 디자인 커스텀, 웨딩 애니메이션을 직접 체험하실 수 있습니다.
            </p>
          </div>
          <Link href="/invitations/new/" className="inv-btn-primary">
            <span>✍️</span>
            <span>새 청첩장 만들기</span>
          </Link>
        </div>

        {/* 카테고리 필터 탭 바 */}
        <div className="inv-category-tabs-bar">
          {[
            { id: 'all' as ThemeCategory, label: '전체 (16)' },
            { id: 'photo' as ThemeCategory, label: '포토·스냅' },
            { id: 'typo' as ThemeCategory, label: '심플·타이포' },
            { id: 'emotional' as ThemeCategory, label: '감성·일러스트' },
            { id: 'heritage' as ThemeCategory, label: '호텔·전통혼례' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`inv-category-tab-btn ${selectedCategory === cat.id ? 'inv-category-tab-btn--active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 4열 세로 9:15 비율 카드 그리드 */}
        <div className="inv-design-gallery-grid">
          {filteredDesigns.map((design) => (
            <div
              key={design.id}
              className="inv-design-cover-card"
              onClick={() => handleOpenDesignPreview(design)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenDesignPreview(design);
                }
              }}
            >
              {/* 세로형 모바일 스마트폰 뷰포트 카드 */}
              <div className={`inv-cover-viewport ${design.coverClass}`}>
                {design.renderCover()}

                {/* 호버 시 나타나는 원클릭 체험 버튼 */}
                <div className="inv-cover-hover-overlay">
                  <span className="inv-cover-hover-btn">실시간 체험하기 ↗</span>
                </div>
              </div>

              {/* 하단 테마 라벨 */}
              <h3 className="inv-cover-label">{design.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
       * 3. 내 청첩장 관리 섹션 (하단 섹션과 시원하게 분리 80px)
       * ============================================================ */}
      <section className="inv-my-list-section" style={{ marginBottom: 80 }}>
        <div className="inv-section-header-row" style={{ marginTop: 24 }}>
          <div>
            <h2>내 청첩장 관리</h2>
            <p>제작 중이거나 발행된 내 청첩장을 확인하고 링크를 공유하세요.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {invitations.map((inv) => {
            const dateStr = inv.weddingDate ? inv.weddingDate.replace('T', ' ').slice(0, 16) : '일시 미정';
            const guestUrl = invitationGuestHref(inv.sharingToken);
            const themeInfo = getThemePreset(inv.themeId);

            return (
              <div key={inv.id} className="inv-my-card-row">
                <div className="inv-my-card-info">
                  <div className="inv-my-card-thumb" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <span>{themeInfo.icon}</span>
                  </div>
                  <div className="inv-my-card-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0 }}>{inv.title}</h3>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'rgba(124, 58, 237, 0.08)',
                          color: 'var(--brand)',
                          border: '1px solid rgba(124, 58, 237, 0.2)',
                        }}
                      >
                        {themeInfo.name} 테마
                      </span>
                    </div>
                    <div className="inv-my-card-meta">
                      <span>💍 {inv.hostNames}</span>
                      <span>📅 {dateStr}</span>
                      <span>📍 {inv.venueLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="inv-my-card-actions">
                  <button
                    type="button"
                    className="inv-btn-primary"
                    style={{ minHeight: 40, fontSize: 13, padding: '0 16px' }}
                    onClick={() => setPreviewTarget(inv)}
                  >
                    <span>📱</span>
                    <span>체험 테스트</span>
                  </button>
                  {inv.viewerIsOwner && (
                    <Link href={`/invitations/?edit=${inv.id}`} className="inv-btn-secondary" style={{ minHeight: 40, fontSize: 13 }}>
                      정보 수정
                    </Link>
                  )}
                  <Link href={guestUrl} className="inv-btn-secondary" style={{ minHeight: 40, fontSize: 13 }} target="_blank">
                    하객 화면
                  </Link>
                  <button
                    type="button"
                    className="inv-btn-secondary"
                    style={{ minHeight: 40, fontSize: 13 }}
                    onClick={() => handleCopyLink(inv.sharingToken)}
                  >
                    링크 복사
                  </button>
                  {inv.viewerIsOwner && (
                    <button
                      type="button"
                      className="inv-btn-secondary"
                      style={{ minHeight: 40, fontSize: 13, color: 'var(--muted)' }}
                      onClick={() => handleDelete(inv.id, inv.title)}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 실시간 미리보기 모달 */}
      {previewTarget && (
        <InvitationPreviewModal
          isOpen={Boolean(previewTarget)}
          onClose={() => setPreviewTarget(null)}
          invitation={previewTarget}
        />
      )}
    </div>
  );
}

export default function InvitationsHub() {
  return (
    <Suspense fallback={<div className="inv-hub" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>청첩장 스튜디오 준비 중...</div>}>
      <InvitationsHubContent />
    </Suspense>
  );
}
