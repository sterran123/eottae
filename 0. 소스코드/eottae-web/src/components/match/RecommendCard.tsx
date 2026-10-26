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

import {
  DISTANCE_LABELS,
  RECENCY_LABELS,
  STARTER_QUESTIONS,
} from '@/lib/match/demo-recommendations';
import { INTEREST_LABELS } from '@/lib/match/demo-data';
import type { RecommendProfile } from '@/lib/match/types';
import {
  IconAcorn,
  IconBlock,
  IconClock,
  IconHeartFill,
  IconPin,
  IconSparkle,
  IconUserSilhouette,
  IconX,
} from './icons';

interface RecommendCardProps {
  profile: RecommendProfile;
  onLike?: (id: string) => void;
  onSkip?: (id: string) => void;
  onBlock?: (id: string) => void;
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
  onPreview,
  onAskQuestion,
}: RecommendCardProps) {
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
            {isMutual && (
              <button
                type="button"
                className="mt-rec__block"
                aria-label={`${profile.nickname} 차단`}
                title="상대방 차단"
                onClick={() => onBlock?.(profile.id)}
              >
                <IconBlock width={16} height={16} />
              </button>
            )}
          </div>

          <div className="mt-rec__meta">
            <span className="mt-rec__meta-item">
              <IconPin width={11} height={11} />
              {DISTANCE_LABELS[profile.distance]}
            </span>
            <span className="mt-rec__meta-item">
              <IconClock width={11} height={11} />
              {RECENCY_LABELS[profile.recency]}
            </span>
          </div>

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
