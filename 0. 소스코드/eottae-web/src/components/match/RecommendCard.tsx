'use client';

// ============================================================
//  저장 경로: src/components/match/RecommendCard.tsx
//  담당: 오하율 · MATCH-002 (추천 카드)
//  역할: 추천 상대 1명 카드. 사진 상태(hidden/preview/revealed)와
//        관계(none/liked_by_me/mutual)에 따라 표시가 달라짐.
//
//  [안전] 사진 공개는 상대 동의 전제. preview 는 상대가 허용한 경우만.
//         차단/신고는 손준혁 MATCH-008 영역 → 여기선 콜백만 노출.
//  [범위] 도토리 미리보기 결제는 1차 미구현(준비중). 흐름만.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import {
  DISTANCE_LABELS,
  RECENCY_LABELS,
  STARTER_QUESTIONS,
} from '@/lib/match/demo-recommendations';
import { INTEREST_LABELS } from '@/lib/match/demo-data';
import type { RecommendProfile } from '@/lib/match/types';
import {
  IconAcorn,
  IconClock,
  IconHeartFill,
  IconPin,
  IconSparkle,
  IconUserSilhouette,
} from './icons';

interface RecommendCardProps {
  profile: RecommendProfile;
  onLike?: (id: string) => void;
  onSkip?: (id: string) => void;
  onBlock?: (id: string) => void;
  onReport?: (id: string) => void;
  /** 도토리 미리보기 요청(1차 준비중). */
  onPreview?: (id: string) => void;
  /** 공통 질문 선택. */
  onAskQuestion?: (id: string, question: string) => void;
}

export default function RecommendCard({
  profile,
  onLike,
  onSkip,
  onBlock,
  onReport,
  onPreview,
  onAskQuestion,
}: RecommendCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusIndex = useRef(0);

  const menuId = `rec-more-menu-${profile.id}`;
  const MORE_ACTIONS = [
    { key: 'report', label: '신고하기', danger: false },
    { key: 'block', label: '차단하기', danger: true },
  ] as const;
  const totalItems = MORE_ACTIONS.length;
  const lastIndex = totalItems - 1;

  useEffect(() => {
    if (!menuOpen) return;
    const index = Math.min(Math.max(focusIndex.current, 0), lastIndex);
    itemRefs.current[index]?.focus();

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const root = menuRef.current;
      if (!root || root.contains(e.target as Node)) return;
      const target = e.target;
      const landedOnControl =
        target instanceof Element &&
        Boolean(
          target.closest(
            'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
          ),
        );
      if (landedOnControl) setMenuOpen(false);
      else closeToButton();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen, lastIndex]);

  const openAt = (index: number) => {
    focusIndex.current = index;
    setMenuOpen(true);
  };

  const closeToButton = () => {
    setMenuOpen(false);
    moreBtnRef.current?.focus();
  };

  const onButtonKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && menuOpen) {
      event.preventDefault();
      closeToButton();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (menuOpen) {
        itemRefs.current[0]?.focus();
      } else {
        openAt(0);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (menuOpen) {
        itemRefs.current[lastIndex]?.focus();
      } else {
        openAt(lastIndex);
      }
    }
  };

  const onItemKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeToButton();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      itemRefs.current[index === lastIndex ? 0 : index + 1]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      itemRefs.current[index === 0 ? lastIndex : index - 1]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      itemRefs.current[lastIndex]?.focus();
    }
  };

  const { photo, relation } = profile;
  const isMutual = relation === 'mutual';
  const shared = profile.sharedInterestIds;
  const visibleShared = shared.slice(0, 2);
  const extraShared = shared.length - visibleShared.length;

  return (
    <article
      className={`mt-rec${isMutual ? ' mt-rec--mutual' : ''}`}
      aria-label={`${profile.nickname} 추천`}
    >
      <div className="mt-rec__top">
        {/* 사진 영역 */}
        <div className={`mt-rec__photo mt-rec__photo--${photo}`}>
          {photo === 'revealed' ? (
            <IconUserSilhouette className="mt-rec__avatar" aria-hidden />
          ) : (
            <>
              <IconUserSilhouette className="mt-rec__avatar" aria-hidden />
              <span className="mt-rec__blur" aria-hidden />
              {photo === 'preview' && (
                <span className="mt-rec__preview-tag">
                  <IconAcorn width={10} height={10} /> 미리보기
                </span>
              )}
            </>
          )}
        </div>

        {/* 본문 */}
        <div className="mt-rec__body">
          <div className="mt-rec__head">
            <div className="mt-rec__ident">
              <span className="mt-rec__name">{profile.nickname}</span>
              <span className="mt-rec__age">{profile.age}</span>
              {profile.mbti !== 'unknown' && (
                <span className="mt-rec__mbti">{profile.mbti}</span>
              )}
              {isMutual && (
                <span className="mt-rec__mutual-tag">서로 관심 ✓</span>
              )}
            </div>
            <div className="mt-rec__more-wrapper" ref={menuRef}>
              <button
                ref={moreBtnRef}
                type="button"
                className="mt-rec__more-btn"
                aria-label={`${profile.nickname} 더보기 메뉴`}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-controls={menuOpen ? menuId : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (menuOpen) closeToButton();
                  else openAt(0);
                }}
                onKeyDown={onButtonKey}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="mt-rec__dropdown-backdrop"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeToButton();
                    }}
                    aria-hidden="true"
                  />
                  <div
                    id={menuId}
                    className="mt-rec__dropdown-menu"
                    role="menu"
                    aria-label="더보기"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      ref={(el) => {
                        itemRefs.current[0] = el;
                      }}
                      type="button"
                      className="mt-rec__dropdown-item"
                      role="menuitem"
                      onKeyDown={(e) => onItemKey(e, 0)}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeToButton();
                        onReport?.(profile.id);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                      <span>신고하기</span>
                    </button>
                    <button
                      ref={(el) => {
                        itemRefs.current[1] = el;
                      }}
                      type="button"
                      className="mt-rec__dropdown-item mt-rec__dropdown-item--danger"
                      role="menuitem"
                      onKeyDown={(e) => onItemKey(e, 1)}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeToButton();
                        onBlock?.(profile.id);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      <span>차단하기</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {(profile.distance || profile.recency) && (
            <div className="mt-rec__meta">
              {profile.distance && (
                <span className="mt-rec__meta-item">
                  <IconPin width={11} height={11} />
                  {DISTANCE_LABELS[profile.distance]}
                </span>
              )}
              {profile.recency && (
                <span className="mt-rec__meta-item">
                  <IconClock width={11} height={11} />
                  {RECENCY_LABELS[profile.recency]}
                </span>
              )}
            </div>
          )}

          <p className="mt-rec__intro">{profile.intro}</p>

          {/* 겹치는 관심사(근거) — 수치 아닌 실제 항목 */}
          {shared.length > 0 && (
            <div className="mt-rec__shared">
              {visibleShared.map((id) => (
                <span key={id} className="mt-rec__tag">
                  {INTEREST_LABELS[id] ?? id}
                </span>
              ))}
              {extraShared > 0 && (
                <span className="mt-rec__tag mt-rec__tag--more">
                  +{extraShared}
                </span>
              )}
            </div>
          )}

          {/* 문답 궁합 — 겹친 개수만(사실). 둘 다 답한 경우에만 표시 */}
          {typeof profile.qnaSharedCount === 'number' &&
            profile.qnaSharedCount > 0 && (
              <div className="mt-rec__compat">
                <IconSparkle className="mt-ico mt-ico--xs" />
                문답 {profile.qnaSharedCount}개 통했어요
              </div>
            )}

          {/* 액션 */}
          {!isMutual && (
            <div className="mt-rec__actions">
              <button
                type="button"
                className="mt-rec__btn mt-rec__btn--later"
                onClick={() => onSkip?.(profile.id)}
              >
                나중에
              </button>
              {photo === 'preview' && (
                <button
                  type="button"
                  className="mt-rec__btn mt-rec__btn--acorn"
                  onClick={() => onPreview?.(profile.id)}
                >
                  <IconAcorn width={15} height={15} /> 사진 미리보기
                </button>
              )}
              <button
                type="button"
                className="mt-rec__btn mt-rec__btn--like"
                onClick={() => onLike?.(profile.id)}
              >
                <IconHeartFill width={15} height={15} /> 관심
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 쌍방 관심 시 공통 질문(맛보기) */}
      {isMutual && (
        <div className="mt-rec__ask">
          <div className="mt-rec__ask-label">가볍게 물어보기</div>
          <div className="mt-rec__ask-chips">
            {STARTER_QUESTIONS.slice(0, 2).map((q) => (
              <button
                key={q}
                type="button"
                className="mt-rec__ask-chip"
                onClick={() => onAskQuestion?.(profile.id, q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
