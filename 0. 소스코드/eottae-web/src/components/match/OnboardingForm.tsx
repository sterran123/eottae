'use client';

// ============================================================
//  저장 경로: src/components/match/OnboardingForm.tsx
//  담당: 오하율 · MATCH-001 (취향/가치관 입력)
//  역할: 온보딩 입력 폼(클라이언트 컴포넌트). 상태·유효성·접근성·백엔드 연동.
//
//  [백엔드 연동] matchService.loadOnboarding / saveOnboarding을 통해
//               Supabase `public.profiles`·`public.profile_interests`에 저장·수정하며,
//               키 미설정 환경에서는 데모 폴백으로 동작한다 (ADR-005).
//  [색상] 매칭 전용 피치 톤은 match-tokens.css 의 --match-* 토큰 사용.
//  [유효성] 관심사 min 3 / max 7 (INTEREST_RULES) · TC-005 대응.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ALL_MBTI,
  DEMO_IDENTITY,
  DISTANCE_PREFERENCE_OPTIONS,
  INTEREST_CATEGORIES,
  INTEREST_LABELS,
  MBTI_PREVIEW_COUNT,
  RELATION_OPTIONS,
  type DistanceIconType,
  type DistancePreference,
} from '@/lib/match/demo-data';
import { matchService } from '@/lib/match/match-service';
import {
  INTEREST_RULES,
  validateOnboardingDraft,
  type InterestCategoryId,
  type MatchTargetPreference,
  type MbtiType,
  type MyMbti,
  type OnboardingDraft,
  type PhotoVisibilitySetting,
  type RelationGoal,
  type VerifiedIdentity,
} from '@/lib/match/types';
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconDots,
  IconFriends,
  IconGenderFemale,
  IconGenderMale,
  IconMoodOff,
  IconShieldHeart,
} from './icons';
import type { ComponentType, SVGProps } from 'react';

interface OnboardingFormProps {
  /** 인증된 사용자 정보(읽기 전용). 미지정 시 세션/DEMO 자동 판정. */
  identity?: VerifiedIdentity;
  /** 저장 콜백. 미지정 시 matchService.saveOnboarding 호출 후 추천 화면 이동. */
  onSubmit?: (draft: OnboardingDraft) => void;
  /** 취소 콜백. */
  onCancel?: () => void;
}

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

function renderDistanceIcon(type: DistanceIconType) {
  switch (type) {
    case 'pin':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'coffee':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    case 'subway':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="15" rx="3" />
          <line x1="3" y1="11" x2="21" y2="11" />
          <circle cx="8" cy="15" r="1" />
          <circle cx="16" cy="15" r="1" />
          <path d="m5 21 2-3" />
          <path d="m19 21-2-3" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
}

const TARGET_OPTIONS: ReadonlyArray<{
  value: MatchTargetPreference;
  label: string;
  Icon: SvgIcon;
}> = [
  { value: 'opposite', label: '이성', Icon: IconGenderMale },
  { value: 'same', label: '동성', Icon: IconGenderFemale },
  { value: 'any', label: '상관없음', Icon: IconFriends },
];

const GENDER_LABEL: Record<VerifiedIdentity['gender'], string> = {
  male: '남성',
  female: '여성',
};

export default function OnboardingForm({
  identity: identityProp,
  onSubmit,
  onCancel,
}: OnboardingFormProps) {
  const [resolvedIdentity, setResolvedIdentity] = useState<VerifiedIdentity>(
    identityProp ?? DEMO_IDENTITY,
  );
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [savedSnapshot, setSavedSnapshot] = useState<OnboardingDraft | null>(null);

  const [myMbti, setMyMbti] = useState<MyMbti | null>(null);
  const [avoidMbti, setAvoidMbti] = useState<MbtiType[]>([]);
  const [showAllMbti, setShowAllMbti] = useState(false);
  const [showAvoid, setShowAvoid] = useState(false);
  const [target, setTarget] = useState<MatchTargetPreference | null>(null);
  const [relationGoal, setRelationGoal] = useState<RelationGoal | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredDistance, setPreferredDistance] =
    useState<DistancePreference>('within_10km');
  const [photoVisibility, setPhotoVisibility] =
    useState<PhotoVisibilitySetting>('hidden');
  // 펼쳐진 관심사 카테고리(아코디언). 기본은 첫 카테고리 열림.
  const [openCats, setOpenCats] = useState<Set<InterestCategoryId>>(
    () => new Set([INTEREST_CATEGORIES[0]?.id].filter(Boolean) as InterestCategoryId[]),
  );
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function applyDraftToState(draft: OnboardingDraft) {
    setMyMbti(draft.myMbti);
    setAvoidMbti(draft.avoidMbti ?? []);
    setTarget(draft.targetPreference);
    setRelationGoal(draft.relationGoal);
    setInterests(draft.interestIds ?? []);
    setPreferredDistance(draft.preferredDistance ?? 'within_10km');
    setPhotoVisibility(draft.photoVisibility ?? 'hidden');

    if (draft.myMbti && draft.myMbti !== 'unknown') {
      const idx = ALL_MBTI.indexOf(draft.myMbti);
      if (idx >= MBTI_PREVIEW_COUNT) {
        setShowAllMbti(true);
      }
    }
    if (draft.avoidMbti && draft.avoidMbti.length > 0) {
      setShowAvoid(true);
    }
    if (draft.interestIds && draft.interestIds.length > 0) {
      const activeCats = new Set<InterestCategoryId>();
      for (const cat of INTEREST_CATEGORIES) {
        if (cat.interestIds.some((id) => draft.interestIds.includes(id))) {
          activeCats.add(cat.id);
        }
      }
      if (activeCats.size > 0) {
        setOpenCats(activeCats);
      }
    }
  }

  // 마운트 시 세션·저장된 온보딩 설정(Supabase 또는 로컬 저장본) 불러오기
  useEffect(() => {
    let active = true;
    void matchService.loadOnboarding().then(({ context, draft }) => {
      if (!active) return;
      if (!identityProp) {
        setResolvedIdentity(context.identity);
      }
      setIsDemoMode(context.isDemo);
      if (draft) {
        setSavedSnapshot(draft);
        applyDraftToState(draft);
      }
    });
    return () => {
      active = false;
    };
  }, [identityProp]);

  const identity = identityProp ?? resolvedIdentity;

  const visibleMbti = showAllMbti
    ? ALL_MBTI
    : ALL_MBTI.slice(0, MBTI_PREVIEW_COUNT);

  const currentDraft: OnboardingDraft = useMemo(
    () => ({
      myMbti,
      avoidMbti,
      targetPreference: target,
      relationGoal,
      interestIds: interests,
      preferredDistance,
      photoVisibility,
    }),
    [
      myMbti,
      avoidMbti,
      target,
      relationGoal,
      interests,
      preferredDistance,
      photoVisibility,
    ],
  );

  // ---- 유효성 (UI·서버 공통 규칙 · TC-005) ----
  const errors = useMemo(
    () => validateOnboardingDraft(currentDraft),
    [currentDraft],
  );

  const isValid = errors.length === 0;
  const interestFull = interests.length >= INTEREST_RULES.max;

  // 진행률 계산 (4개 필수 단계 + 공개범위 기본 충족)
  const completedSteps =
    (myMbti !== null ? 1 : 0) +
    (target !== null ? 1 : 0) +
    (relationGoal !== null ? 1 : 0) +
    (interests.length >= INTEREST_RULES.min ? 1 : 0);
  const progressPercent = Math.max(25, completedSteps * 25);

  // 카테고리별 선택 개수(아코디언 헤더 표시용).
  const countByCat = useMemo(() => {
    const map = new Map<InterestCategoryId, number>();
    for (const cat of INTEREST_CATEGORIES) {
      map.set(cat.id, cat.interestIds.filter((id) => interests.includes(id)).length);
    }
    return map;
  }, [interests]);

  // 선호 거리 게이지바 파생 상태
  const distIndex = Math.max(
    0,
    DISTANCE_PREFERENCE_OPTIONS.findIndex((o) => o.value === preferredDistance),
  );
  const currentDistOption =
    DISTANCE_PREFERENCE_OPTIONS[distIndex] ?? DISTANCE_PREFERENCE_OPTIONS[1];
  const distPercent =
    (distIndex / (DISTANCE_PREFERENCE_OPTIONS.length - 1)) * 100;

  // ---- 핸들러 ----
  function toggleInterest(id: string) {
    setServerError(null);
    setInterests((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= INTEREST_RULES.max) return prev; // 최대치 초과 무시
      return [...prev, id];
    });
  }

  function toggleCat(id: InterestCategoryId) {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAvoid(mbti: MbtiType) {
    setServerError(null);
    setAvoidMbti((prev) =>
      prev.includes(mbti) ? prev.filter((x) => x !== mbti) : [...prev, mbti],
    );
  }

  function handleSelectMbti(value: MyMbti) {
    setServerError(null);
    setMyMbti(value);
    // 내 MBTI 로 고른 유형이 비선호에 있으면 제거(모순 방지)
    if (value !== 'unknown') {
      setAvoidMbti((prev) => prev.filter((x) => x !== value));
    }
  }

  async function handleSubmit() {
    setSubmitted(true);
    setServerError(null);
    if (!isValid) {
      const errEl = document.getElementById('mt-onb-errors');
      if (errEl) {
        errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (onSubmit) {
      onSubmit(currentDraft);
      return;
    }

    setSaving(true);
    const res = await matchService.saveOnboarding(currentDraft);
    setSaving(false);

    if (!res.ok) {
      setServerError(res.error.message);
      const errEl = document.getElementById('mt-onb-errors');
      if (errEl) {
        errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSavedSnapshot(currentDraft);
    router.push('/match/recommend');
  }

  function handleCancel() {
    setServerError(null);
    setSubmitted(false);
    if (savedSnapshot) {
      applyDraftToState(savedSnapshot);
    }
    if (onCancel) {
      onCancel();
    } else {
      router.push('/match');
    }
  }

  return (
    <section className="mt-onb" aria-labelledby="mt-onb-title">
      {/* 진행 표시 */}
      <div className="mt-onb__progress" aria-hidden="true">
        <span className="mt-onb__eyebrow">MODULE 01 · MATCH</span>
        <div className="mt-onb__bar">
          <div className="mt-onb__bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* 인증 정보(읽기 전용) */}
      <div className="mt-onb__verified" role="status">
        <IconCircleCheck className="mt-ico" />
        <div className="mt-onb__verified-text">
          <strong>
            {identity.age}세 · {GENDER_LABEL[identity.gender]} ·{' '}
            {identity.verified ? '성인 인증 완료' : '성인 인증 필요'}
          </strong>
          <span>
            {identity.verified
              ? '인증된 정보예요. 수정하려면 다시 인증이 필요해요.'
              : '성인 확인 완료 후 취향 설정을 실제 프로필에 저장할 수 있어요.'}
          </span>
        </div>
        {isDemoMode && <span className="mt-onb__demo-tag">DEMO</span>}
      </div>

      <h1 id="mt-onb-title" className="mt-onb__title">
        나를 먼저 알려주세요
      </h1>
      <p className="mt-onb__lead">
        얼굴보다 나를 설명하는 것부터. 고른 취향으로 겹치는 상대를 추천해요.
      </p>

      {/* 내 MBTI */}
      <fieldset className="mt-onb__field">
        <legend className="mt-onb__label">내 MBTI</legend>
        <p className="mt-onb__hint">하나만 골라주세요</p>
        <div className="mt-onb__mbti-grid" role="radiogroup" aria-label="내 MBTI">
          {visibleMbti.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={myMbti === m}
              className={`mt-chip mt-chip--square${myMbti === m ? ' is-on' : ''}`}
              onClick={() => handleSelectMbti(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-onb__mbti-actions">
          {!showAllMbti && (
            <button
              type="button"
              className="mt-pill"
              onClick={() => setShowAllMbti(true)}
            >
              <IconDots className="mt-ico mt-ico--sm" /> 더보기 (16개 전체)
            </button>
          )}
          <button
            type="button"
            className={`mt-pill mt-pill--soft${myMbti === 'unknown' ? ' is-on' : ''}`}
            aria-pressed={myMbti === 'unknown'}
            onClick={() => handleSelectMbti('unknown')}
          >
            잘 몰라요
          </button>
        </div>

        {/* 피하고 싶은 MBTI (선택) */}
        <div className="mt-onb__avoid">
          <button
            type="button"
            className="mt-onb__avoid-toggle"
            aria-expanded={showAvoid}
            onClick={() => setShowAvoid((v) => !v)}
          >
            <span>
              <IconMoodOff className="mt-ico mt-ico--sm" /> 피하고 싶은 MBTI가
              있나요 <span className="mt-onb__opt">선택</span>
            </span>
            {showAvoid ? (
              <IconChevronUp className="mt-ico mt-ico--sm" />
            ) : (
              <IconChevronDown className="mt-ico mt-ico--sm" />
            )}
          </button>
          <p className="mt-onb__avoid-note">
            기본은 없음. 꼭 피하고 싶은 유형만 골라요. 추천이 줄 수 있어요.
          </p>
          {showAvoid && (
            <div
              className="mt-onb__mbti-grid mt-onb__mbti-grid--avoid"
              role="group"
              aria-label="피하고 싶은 MBTI"
            >
              {ALL_MBTI.map((m) => {
                const disabled = myMbti === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={avoidMbti.includes(m)}
                    disabled={disabled}
                    className={`mt-chip mt-chip--square mt-chip--avoid${
                      avoidMbti.includes(m) ? ' is-on' : ''
                    }`}
                    onClick={() => toggleAvoid(m)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </fieldset>

      {/* 만날 상대 및 찾는 관계 */}
      <fieldset className="mt-onb__field">
        <legend className="mt-onb__label">누구를 만나고 싶나요</legend>
        <p className="mt-onb__hint">매칭 상대를 정해요</p>
        <div
          className="mt-onb__target"
          role="radiogroup"
          aria-label="만나고 싶은 상대"
        >
          {TARGET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={target === opt.value}
              className={`mt-onb__target-opt${target === opt.value ? ' is-on' : ''}`}
              onClick={() => {
                setServerError(null);
                setTarget(opt.value);
              }}
            >
              <opt.Icon className="mt-ico" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-onb__relation">
          <div className="mt-onb__label mt-onb__label--sub">
            어떤 관계를 찾나요 <span className="mt-onb__new">필수</span>
          </div>
          <p className="mt-onb__hint">맞춤 질문을 추천해 드려요</p>
          <div role="radiogroup" aria-label="찾는 관계">
            {RELATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={relationGoal === opt.value}
                className={`mt-onb__relation-opt${
                  relationGoal === opt.value ? ' is-on' : ''
                }`}
                onClick={() => {
                  setServerError(null);
                  setRelationGoal(opt.value);
                }}
              >
                <span className="mt-onb__relation-emoji" aria-hidden="true">
                  {opt.emoji}
                </span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {/* 관심사 — 카테고리 아코디언 상시 개방 (즉시 선택·수정 가능, TC-005 검증) */}
      <fieldset className="mt-onb__field">
        <legend className="mt-onb__label">
          관심사 <span className="mt-onb__accent">{INTEREST_RULES.min}개 이상</span>
        </legend>
        <p className="mt-onb__hint">
          최소 {INTEREST_RULES.min}개, 최대 {INTEREST_RULES.max}개 · 겹치는
          취향으로 추천해요 ({interests.length}/{INTEREST_RULES.max})
        </p>
        <div className="mt-onb__accordion">
          {INTEREST_CATEGORIES.map((cat) => {
            const open = openCats.has(cat.id);
            const count = countByCat.get(cat.id) ?? 0;
            return (
              <div key={cat.id} className="mt-acc">
                <button
                  type="button"
                  className="mt-acc__head"
                  aria-expanded={open}
                  onClick={() => toggleCat(cat.id)}
                >
                  <span className="mt-acc__title">
                    {cat.label}
                    {count > 0 && (
                      <span className="mt-acc__count">{count}</span>
                    )}
                  </span>
                  {open ? (
                    <IconChevronUp className="mt-ico mt-ico--sm" />
                  ) : (
                    <IconChevronDown className="mt-ico mt-ico--sm" />
                  )}
                </button>
                {open && (
                  <div className="mt-acc__body">
                    {cat.interestIds.map((id) => {
                      const on = interests.includes(id);
                      const blocked = !on && interestFull;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={on}
                          disabled={blocked}
                          className={`mt-chip${on ? ' is-on' : ''}${
                            blocked ? ' is-blocked' : ''
                          }`}
                          onClick={() => toggleInterest(id)}
                        >
                          {INTEREST_LABELS[id] ?? id}
                          {on && <IconCheck className="mt-ico mt-ico--xs" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* 선호하는 거리 유형 — 상시 조작 가능 */}
      <fieldset className="mt-onb__field">
        <legend className="mt-onb__label">
          선호하는 거리 <span className="mt-onb__accent">만남 범위</span>
        </legend>
        <p className="mt-onb__hint">
          게이지 바를 움직여 만남 희망 거리를 조절해 보세요.
        </p>

        <div className="mt-dist-gauge">
          {/* 캐릭터 말풍선 & 움직이는 마스코트 핀 */}
          <div
            className={`mt-dist-gauge__char-wrapper step-${distIndex}`}
            style={{ left: `calc(28px + (100% - 56px) * (${distIndex} / 3))` }}
          >
            <div className="mt-dist-gauge__speech" role="status">
              <span className="mt-dist-gauge__speech-icon">
                {renderDistanceIcon(currentDistOption.iconType)}
              </span>
              <span>{currentDistOption.speech}</span>
            </div>
            <div className="mt-dist-gauge__char-pin">
              <img
                src="/eottae/brand/hero-visual.webp"
                alt="어때? 캐릭터"
                className="mt-dist-gauge__char-img"
              />
            </div>
          </div>

          {/* 게이지 트랙 및 슬라이더 */}
          <div className="mt-dist-gauge__track-area">
            <div className="mt-dist-gauge__track-bg" />
            <div
              className="mt-dist-gauge__track-fill"
              style={{ width: `${distPercent}%` }}
            />

            {/* 단계별 눈금 점 (Step Dots) */}
            <div className="mt-dist-gauge__dots">
              {DISTANCE_PREFERENCE_OPTIONS.map((opt, idx) => {
                const isActive = idx <= distIndex;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`mt-dist-gauge__dot${isActive ? ' is-active' : ''}`}
                    onClick={() => setPreferredDistance(opt.value)}
                    aria-label={`${opt.label} 선택`}
                  />
                );
              })}
            </div>

            {/* 네이티브 투명 레인지 인풋 (드래그/터치/키보드 완벽 연동) */}
            <input
              type="range"
              min={0}
              max={DISTANCE_PREFERENCE_OPTIONS.length - 1}
              step={1}
              value={distIndex}
              onChange={(e) => {
                const idx = Number(e.target.value);
                const chosen = DISTANCE_PREFERENCE_OPTIONS[idx];
                if (chosen) setPreferredDistance(chosen.value);
              }}
              className="mt-dist-gauge__input"
              aria-label="선호 거리 조절 슬라이더"
            />
          </div>

          {/* 눈금 하단 라벨 (클릭 시 해당 위치로 점프) */}
          <div className="mt-dist-gauge__labels">
            {DISTANCE_PREFERENCE_OPTIONS.map((opt, idx) => {
              const isCurrent = idx === distIndex;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`mt-dist-gauge__label-btn${isCurrent ? ' is-current' : ''}`}
                  onClick={() => setPreferredDistance(opt.value)}
                >
                  <span className="mt-dist-gauge__label-txt">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* 현재 선택된 거리 정보 요약 카드 */}
          <div className="mt-dist-gauge__summary">
            <div className="mt-dist-gauge__summary-head">
              <strong className="mt-dist-gauge__summary-title">
                {currentDistOption.label}
              </strong>
              <span className="mt-dist-gauge__summary-badge">
                {currentDistOption.badge}
              </span>
            </div>
            <p className="mt-dist-gauge__summary-desc">
              {currentDistOption.desc}
            </p>
          </div>
        </div>
      </fieldset>

      {/* 사진 및 프로필 공개범위 설정 (MATCH-001 · profiles.photo_visibility) */}
      <fieldset className="mt-onb__field">
        <legend className="mt-onb__label">
          프로필 및 사진 공개범위 <span className="mt-onb__accent">공개 설정</span>
        </legend>
        <p className="mt-onb__hint">
          상대방에게 내 사진과 프로필이 어떻게 보일지 설정해요.
        </p>

        <div className="mt-onb__privacy-options" role="radiogroup" aria-label="프로필 및 사진 공개범위">
          <button
            type="button"
            role="radio"
            aria-checked={photoVisibility === 'hidden'}
            className={`mt-onb__privacy-opt${photoVisibility === 'hidden' ? ' is-on' : ''}`}
            onClick={() => setPhotoVisibility('hidden')}
          >
            <div className="mt-onb__privacy-head">
              <span className="mt-onb__privacy-title">실루엣 기본 (권장)</span>
              <span className="mt-onb__privacy-badge">안전 블라인드</span>
            </div>
            <p className="mt-onb__privacy-desc">
              서로 호감을 표현하기 전까지는 실루엣으로 보여요. 쌍방 호감 시 자동으로 무료 공개돼요.
            </p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={photoVisibility === 'preview'}
            className={`mt-onb__privacy-opt${photoVisibility === 'preview' ? ' is-on' : ''}`}
            onClick={() => setPhotoVisibility('preview')}
          >
            <div className="mt-onb__privacy-head">
              <span className="mt-onb__privacy-title">사진 미리보기 허용</span>
              <span className="mt-onb__privacy-badge mt-onb__privacy-badge--acorn">도토리 미리보기 가능</span>
            </div>
            <p className="mt-onb__privacy-desc">
              상대방이 도토리를 사용하여 내 사진을 먼저 열어보는 것을 허용해요.
            </p>
          </button>
        </div>
      </fieldset>

      {/* 안전 안내 */}
      <div className="mt-onb__safety" role="note">
        <IconShieldHeart className="mt-ico" />
        <span>
          연락처·주소·학교·직장은 받지 않아요. 안전한 만남을 위해 최소한만
          물어봐요.
        </span>
      </div>

      {/* 유효성 및 서버 오류 (제출 시도 후 노출) */}
      {((submitted && !isValid) || serverError) && (
        <ul id="mt-onb-errors" className="mt-onb__errors" role="alert">
          {serverError && <li>{serverError}</li>}
          {submitted &&
            errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
        </ul>
      )}

      {/* 액션 */}
      <div className="mt-onb__actions">
        <button
          type="button"
          className="mt-btn mt-btn--ghost"
          onClick={handleCancel}
          disabled={saving}
        >
          취소
        </button>
        <button
          type="button"
          className="mt-btn mt-btn--primary"
          onClick={() => void handleSubmit()}
          disabled={saving}
        >
          {saving ? '저장 중…' : '저장하고 다음 →'}
        </button>
      </div>
      {isDemoMode && (
        <p className="mt-onb__demo-foot">DEMO · 실제 저장 전 목업 화면</p>
      )}
    </section>
  );
}
