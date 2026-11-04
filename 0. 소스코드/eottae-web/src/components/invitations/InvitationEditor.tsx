'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  Invitation,
  InvitationBgmpreset,
  InvitationLayoutStyle,
  InvitationSectionKey,
  InvitationStatus,
  InvitationThemeId,
  InvitationVisibility,
} from '@/lib/invitations/types';
import { getInvitationById, saveInvitation } from '@/lib/invitations/demo-storage';
import InvitationCardRenderer from './InvitationCardRenderer';
import InvitationPreviewModal from './InvitationPreviewModal';

interface InvitationEditorProps {
  initialId?: string | null;
}

const THEMES: { id: InvitationThemeId; label: string; icon: string }[] = [
  { id: 'spring-card', label: '봄날의 꽃잎', icon: '🌸' },
  { id: 'moon-garden', label: '달빛 정원', icon: '🌙' },
  { id: 'hanji', label: '전통 한지', icon: '📜' },
  { id: 'star-table', label: '별빛 연회', icon: '✨' },
];

const LAYOUTS: { id: InvitationLayoutStyle; label: string }[] = [
  { id: 'classic', label: '클래식 스크롤' },
  { id: 'modern', label: '모던 카드' },
  { id: 'minimal', label: '미니멀 매거진' },
];

const BGMS: { id: InvitationBgmpreset; label: string }[] = [
  { id: 'none', label: '무음' },
  { id: 'romantic', label: '웨딩 마치' },
  { id: 'piano', label: '피아노 선율' },
  { id: 'acoustic', label: '어쿠스틱' },
];

const DEFAULT_SECTIONS: InvitationSectionKey[] = [
  'greeting',
  'schedule',
  'gallery',
  'location',
  'guestbook',
  'guest_snap',
  'account',
  'rsvp_preview',
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

export default function InvitationEditor({ initialId }: InvitationEditorProps) {
  const router = useRouter();
  const isEditing = Boolean(initialId);

  const [id, setId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [hostNames, setHostNames] = useState<string>('');
  const [weddingDate, setWeddingDate] = useState<string>('2026-11-28T14:00');
  const [venueLabel, setVenueLabel] = useState<string>('');
  const [notice, setNotice] = useState<string>('');
  const [contactNote, setContactNote] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');
  const [themeId, setThemeId] = useState<InvitationThemeId>('spring-card');
  const [layoutStyle, setLayoutStyle] = useState<InvitationLayoutStyle>('classic');
  const [bgmPreset, setBgmPreset] = useState<InvitationBgmpreset>('romantic');
  const [sectionOrder, setSectionOrder] = useState<InvitationSectionKey[]>(DEFAULT_SECTIONS);
  const [visibility, setVisibility] = useState<InvitationVisibility>('public');
  const [sharingToken, setSharingToken] = useState<string>('');
  const [status, setStatus] = useState<InvitationStatus>('published');
  const [expiry, setExpiry] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string>('user-demo-me');
  const [createdAt, setCreatedAt] = useState<string>('');

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [notOwner, setNotOwner] = useState<boolean>(false);

  useEffect(() => {
    if (initialId) {
      const existing = getInvitationById(initialId);
      if (existing) {
        if (existing.viewerIsOwner !== true) {
          setNotOwner(true);
          return;
        }
        setId(existing.id);
        setTitle(existing.title);
        setHostNames(existing.hostNames);
        setWeddingDate(existing.weddingDate.slice(0, 16));
        setVenueLabel(existing.venueLabel);
        setNotice(existing.notice || '');
        setContactNote(existing.contactNote || '가상 문의 안내: 모바일 청첩장 데모 환경입니다.');
        setGreeting(existing.greeting);
        setThemeId(existing.themeId);
        setLayoutStyle(existing.layoutStyle || 'classic');
        setBgmPreset(existing.bgmPreset || 'none');
        setSectionOrder(existing.sectionOrder || DEFAULT_SECTIONS);
        setVisibility(existing.visibility);
        setSharingToken(existing.sharingToken);
        setStatus(existing.status);
        setExpiry(existing.expiry);
        setOwnerId(existing.ownerId);
        setCreatedAt(existing.createdAt || '');
      }
    } else {
      // 신규 생성 기본값
      setId(`inv-${Date.now()}`);
      setTitle('우리 결혼합니다');
      setHostNames('신랑 이서윤 · 신부 박하람');
      setVenueLabel('노을구 달빛웨딩홀 2층 그랜드볼룸');
      setNotice('식사는 연회장에 준비되어 있습니다. 건물 내 3시간 무료 주차 가능합니다.');
      setContactNote('가상 문의 안내: 모바일 청첩장 데모 환경입니다.');
      setGreeting(
        '서로 마주 보며 다져온 사랑을 이제 한곳을 바라보며 걸어가고자 합니다.\n소중한 걸음으로 축복해 주시면 더없는 기쁨으로 간직하겠습니다.'
      );
      setSharingToken(`sh-${Math.random().toString(36).substring(2, 12)}`);
      setStatus('published');
      setExpiry(null);
      setOwnerId('user-demo-me');
      setCreatedAt(new Date().toISOString());
    }
  }, [initialId]);

  // 미리보기를 위한 가상 엔티티 구성
  const previewInvitation: Invitation = {
    id: id || 'preview-temp',
    ownerId,
    title: title || '청첩장 제목',
    hostNames: hostNames || '신랑 & 신부',
    weddingDate,
    venueLabel: venueLabel || '예식 장소',
    greeting: greeting || '초대 인사말을 입력해 주세요.',
    sharingToken: sharingToken || 'token-preview',
    visibility,
    expiry,
    themeId,
    layoutStyle,
    bgmPreset,
    sectionOrder,
    status,
    viewerIsOwner: true,
    notice,
    contactNote,
  };

  const moveSectionUp = (idx: number) => {
    if (idx <= 0) return;
    setSectionOrder((prev) => {
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  const moveSectionDown = (idx: number) => {
    if (idx >= sectionOrder.length - 1) return;
    setSectionOrder((prev) => {
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (title.trim().length < 2) {
      setFormError('청첩장 제목을 2자 이상 입력해 주세요.');
      return;
    }
    if (hostNames.trim().length < 2) {
      setFormError('신랑·신부 성함을 입력해 주세요 (예: 신랑 이서윤 · 신부 박하람).');
      return;
    }
    if (!weddingDate) {
      setFormError('예식 일시를 선택해 주세요.');
      return;
    }
    if (venueLabel.trim().length < 2) {
      setFormError('예식 장소를 입력해 주세요.');
      return;
    }

    if (initialId) {
      const existing = getInvitationById(initialId);
      if (existing && existing.viewerIsOwner !== true) {
        setFormError('소유자만 고칠 수 있어요 (TC-015 목업)');
        return;
      }
    }

    const existing = initialId ? getInvitationById(initialId) : null;
    const payload: Invitation = {
      ...previewInvitation,
      id: existing ? existing.id : id,
      ownerId: existing ? existing.ownerId : ownerId,
      sharingToken: existing ? existing.sharingToken : sharingToken,
      status: existing ? existing.status : status,
      expiry: existing ? existing.expiry : expiry,
      createdAt: existing ? (existing.createdAt || createdAt) : createdAt,
      viewerIsOwner: true,
      title: title.trim(),
      hostNames: hostNames.trim(),
      weddingDate,
      venueLabel: venueLabel.trim(),
      greeting: greeting.trim(),
      themeId,
      layoutStyle,
      bgmPreset,
      sectionOrder,
      visibility,
      notice: notice.trim(),
      contactNote: contactNote.trim() || existing?.contactNote || '가상 문의 안내: 모바일 청첩장 데모 환경입니다.',
      updatedAt: new Date().toISOString(),
    };

    const ok = saveInvitation(payload);
    if (!ok) {
      setFormError('저장 중 오류가 발생했습니다. 입력값을 확인해 주세요.');
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => {
      router.push('/invitations/');
    }, 1200);
  };

  if (notOwner) {
    return (
      <div className="shell subpage" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>
          소유자만 고칠 수 있어요
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          이 청첩장의 작성자 본인 계정으로만 내용을 수정하거나 설정을 변경할 수 있습니다 (TC-015 목업).
        </p>
        <Link href="/invitations/" className="inv-btn-primary">
          청첩장 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="inv-editor-shell">
      {/* 상단 액션 바 */}
      <div className="inv-actions-bar">
        <div>
          <h2>{isEditing ? '청첩장 정보 수정' : '새 모바일 청첩장 만들기'}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            예식 정보와 테마를 설정하고 실시간으로 미리 확인해 보세요.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="inv-btn-secondary"
            onClick={() => setIsPreviewOpen(true)}
          >
            <span>📱</span>
            <span>전체 화면 체험 테스트</span>
          </button>
          <Link href="/invitations/" className="inv-btn-secondary">
            취소
          </Link>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(34, 197, 94, 0.15)',
          color: '#16a34a',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          fontSize: 14,
        }}>
          청첩장이 성공적으로 저장되었습니다! 목록으로 이동합니다...
        </div>
      )}

      {formError && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#dc2626',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          fontSize: 14,
        }}>
          {formError}
        </div>
      )}

      {/* 에디터 폼 & 우측 실시간 미니 뷰포트 그리드 */}
      <div className="inv-editor-grid">
        <form className="inv-editor-form" onSubmit={handleSubmit}>
          {/* 섹션 1: 기본 정보 */}
          <section className="inv-form-section">
            <h3 className="inv-form-section-title">1. 예식 기본 정보</h3>
            <div className="inv-field">
              <label htmlFor="inv-title">청첩장 제목 *</label>
              <input
                id="inv-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 이서윤과 박하람의 결혼식에 초대합니다"
                required
              />
            </div>
            <div className="inv-field">
              <label htmlFor="inv-hosts">신랑 · 신부 성함 *</label>
              <input
                id="inv-hosts"
                type="text"
                value={hostNames}
                onChange={(e) => setHostNames(e.target.value)}
                placeholder="예: 신랑 이서윤 · 신부 박하람"
                required
              />
              <span className="inv-field-desc">실존 인물 대신 가상 성함을 사용해 주세요.</span>
            </div>
            <div className="inv-field">
              <label htmlFor="inv-date">예식 일시 *</label>
              <input
                id="inv-date"
                type="datetime-local"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                required
              />
            </div>
            <div className="inv-field">
              <label htmlFor="inv-venue">예식 장소 *</label>
              <input
                id="inv-venue"
                type="text"
                value={venueLabel}
                onChange={(e) => setVenueLabel(e.target.value)}
                placeholder="예: 노을구 달빛웨딩홀 2층 그랜드볼룸"
                required
              />
              <span className="inv-field-desc">노을구·달동네·한들시 등 가상 지역을 권장합니다.</span>
            </div>
            <div className="inv-field">
              <label htmlFor="inv-notice">교통편 & 식사 안내</label>
              <input
                id="inv-notice"
                type="text"
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
                placeholder="예: 식사는 연회장에 준비되어 있습니다. 지하 1~3층 무료 주차 가능합니다."
              />
            </div>
            <div className="inv-field">
              <label htmlFor="inv-contact-note">가상 문의 및 연락 안내 (contactNote)</label>
              <input
                id="inv-contact-note"
                type="text"
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                placeholder="예: 가상 문의 안내: 모바일 청첩장 데모 환경입니다."
              />
              <span className="inv-field-desc">개인정보 보호를 위해 실제 연락처 대신 데모 안내 문구를 권장합니다.</span>
            </div>
            <div className="inv-field">
              <label htmlFor="inv-greeting">모시는 글 (인사말)</label>
              <textarea
                id="inv-greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="초대 인사말을 정성껏 작성해 보세요."
              />
            </div>
          </section>

          {/* 섹션 2: 디자인 테마 & 레이아웃 */}
          <section className="inv-form-section">
            <h3 className="inv-form-section-title">2. 디자인 테마 & 레이아웃 선택</h3>
            <div className="inv-field">
              <label>디자인 테마</label>
              <div className="inv-chip-options">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={`inv-chip-btn ${themeId === theme.id ? 'inv-chip-btn--active' : ''}`}
                    onClick={() => setThemeId(theme.id)}
                  >
                    <span>{theme.icon}</span>
                    <span>{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="inv-field">
              <label>레이아웃 형태</label>
              <div className="inv-chip-options">
                {LAYOUTS.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    className={`inv-chip-btn ${layoutStyle === layout.id ? 'inv-chip-btn--active' : ''}`}
                    onClick={() => setLayoutStyle(layout.id)}
                  >
                    {layout.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 섹션 3: BGM & 섹션 순서 커스텀 */}
          <section className="inv-form-section">
            <h3 className="inv-form-section-title">3. 배경음악(BGM) & 섹션 순서 배치</h3>
            <div className="inv-field">
              <label>배경음악 (BGM) 프리셋</label>
              <div className="inv-chip-options">
                {BGMS.map((bgm) => (
                  <button
                    key={bgm.id}
                    type="button"
                    className={`inv-chip-btn ${bgmPreset === bgm.id ? 'inv-chip-btn--active' : ''}`}
                    onClick={() => setBgmPreset(bgm.id)}
                  >
                    {bgm.label}
                  </button>
                ))}
              </div>
              <span className="inv-field-desc">실제 Web Audio API를 통해 감미로운 멜로디가 시연됩니다.</span>
            </div>
            <div className="inv-field">
              <label>섹션 순서 커스텀 (위/아래 이동)</label>
              <div className="inv-section-order-list">
                {sectionOrder.map((secKey, idx) => (
                  <div key={secKey} className="inv-section-order-item">
                    <span className="inv-section-name">
                      {SECTION_LABELS[secKey]}
                    </span>
                    <div className="inv-section-order-btns">
                      <button
                        type="button"
                        className="inv-order-btn"
                        onClick={() => moveSectionUp(idx)}
                        disabled={idx === 0}
                        title="위로 이동"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="inv-order-btn"
                        onClick={() => moveSectionDown(idx)}
                        disabled={idx === sectionOrder.length - 1}
                        title="아래로 이동"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 섹션 4: 공개 범위 */}
          <section className="inv-form-section">
            <h3 className="inv-form-section-title">4. 공유 및 공개 범위</h3>
            <div className="inv-field">
              <label htmlFor="inv-visibility">공개 설정</label>
              <select
                id="inv-visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as InvitationVisibility)}
              >
                <option value="public">전체 공개 (링크를 가진 누구나 열람)</option>
                <option value="unlisted">일부 공개 (초대받은 사람만 열람)</option>
                <option value="private">비공개 (작성자 본인만 열람)</option>
              </select>
            </div>
          </section>

          {/* 제출 버튼 */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="submit" className="inv-btn-primary" style={{ flex: 1 }}>
              {isEditing ? '청첩장 수정 완료' : '청첩장 저장 및 발행'}
            </button>
            <Link href="/invitations/" className="inv-btn-secondary">
              목록으로
            </Link>
          </div>
        </form>

        {/* 우측 실시간 미니 프리뷰 스티키 패널 */}
        <aside className="inv-editor-preview-panel">
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
              📱 실시간 모바일 뷰
            </span>
            <button
              type="button"
              className="inv-btn-secondary"
              style={{ minHeight: 36, fontSize: 12, padding: '0 10px' }}
              onClick={() => setIsPreviewOpen(true)}
            >
              전체 화면으로 보기 ↗
            </button>
          </div>
          <div className="inv-phone-mockup" style={{ height: 600, width: 340 }}>
            <div className="inv-phone-notch">
              <div className="inv-phone-notch__bar" />
            </div>
            <div className="inv-phone-screen">
              <InvitationCardRenderer
                invitation={previewInvitation}
                previewMode={true}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* 전체 화면 체험 테스트 모달 */}
      <InvitationPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        invitation={previewInvitation}
        onSaveSettings={(updated) => {
          setThemeId(updated.themeId);
          if (updated.layoutStyle) setLayoutStyle(updated.layoutStyle);
          if (updated.bgmPreset) setBgmPreset(updated.bgmPreset);
          if (updated.sectionOrder) setSectionOrder(updated.sectionOrder);
        }}
      />
    </div>
  );
}

