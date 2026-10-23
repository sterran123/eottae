'use client';

// ============================================================
//  저장 경로: src/components/match/OnboardingForm.tsx
//  담당: 오하율 · MATCH-001 (취향/가치관 입력)
//  역할: 온보딩 입력 폼(클라이언트 컴포넌트). 상태·유효성·접근성.
//
//  [DEMO] 저장은 실제 API 대신 콘솔 출력(onSubmit)으로 대체.
//         주한태 POST /users/me/interests 연동 시 onSubmit만 교체.
//  [색상] 매칭 전용 피치 톤은 globals.css 의 --match-* 토큰 사용.
//         토큰 1곳만 바꾸면 전체 색 전환 (공통 브랜드 보라와 분리).
//  [유효성] 관심사 min 3 / max 7 (INTEREST_RULES) · TC-005 대응.
// ============================================================

import { useMemo, useState } from 'react';
import {
  ALL_MBTI,
  DEMO_IDENTITY,
  INTEREST_CATEGORIES,
  INTEREST_LABELS,
  MBTI_PREVIEW_COUNT,
} from '@/lib/match/demo-data';
import {
  INTEREST_RULES,
  type MatchTargetPreference,
  type MbtiType,
  type MyMbti,
  type OnboardingDraft,
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
  /** 인증된 사용자 정보(읽기 전용). 미지정 시 DEMO 값 사용. */
  identity?: VerifiedIdentity;
  /** 저장 콜백. 미지정 시 DEMO(콘솔) 동작. */
  onSubmit?: (draft: OnboardingDraft) => void;
  /** 취소 콜백. */
  onCancel?: () => void;
}

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

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
  identity = DEMO_IDENTITY,
  onSubmit,
  onCancel,
}: OnboardingFormProps) {
  const [myMbti, setMyMbti] = useState<MyMbti | null>(null);
  const [avoidMbti, setAvoidMbti] = useState<MbtiType[]>([]);
  const [showAllMbti, setShowAllMbti] = useState(false);
  const [showAvoid, setShowAvoid] = useState(false);
  const [target, setTarget] = useState<MatchTargetPreference | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const visibleMbti = showAllMbti
    ? ALL_MBTI
    : ALL_MBTI.slice(0, MBTI_PREVIEW_COUNT);

  // ---- 유효성 (파생 상태) ----
  const errors = useMemo(() => {
    const list: string[] = [];
    if (myMbti === null) list.push('MBTI를 선택해 주세요.');
    if (target === null) list.push('만나고 싶은 상대를 선택해 주세요.');
    if (interests.length < INTEREST_RULES.min) {
      list.push(`관심사를 ${INTEREST_RULES.min}개 이상 골라 주세요.`);
    }
    return list;
  }, [myMbti, target, interests]);

  const isValid = errors.length === 0;
  const interestFull = interests.length >= INTEREST_RULES.max;

  // ---- 핸들러 ----
  function toggleInterest(id: string) {
    setInterests((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= INTEREST_RULES.max) return prev; // 최대치 초과 무시
      return [...prev, id];
    });
  }

  function toggleAvoid(mbti: MbtiType) {
    setAvoidMbti((prev) =>
      prev.includes(mbti) ? prev.filter((x) => x !== mbti) : [...prev, mbti],
    );
  }

  function handleSelectMbti(value: MyMbti) {
    setMyMbti(value);
    // 내 MBTI 로 고른 유형이 비선호에 있으면 제거(모순 방지)
    if (value !== 'unknown') {
      setAvoidMbti((prev) => prev.filter((x) => x !== value));
    }
  }

  function handleSubmit() {
    setSubmitted(true);
    if (!isValid) return;
    const draft: OnboardingDraft = {
      myMbti,
      avoidMbti,
      targetPreference: target,
      interestIds: interests,
    };
    if (onSubmit) onSubmit(draft);
    else console.info('[DEMO] onboarding draft', draft); // eslint-disable-line no-console
  }

  return (
    <section className="mt-onb" aria-labelledby="mt-onb-title">
      {/* 진행 표시 */}
      <div className="mt-onb__progress" aria-hidden="true">
        <span className="mt-onb__eyebrow">MODULE 01 · MATCH</span>
        <div className="mt-onb__bar">
          <div className="mt-onb__bar-fill" style={{ width: '25%' }} />
        </div>
      </div>

      {/* 인증 정보(읽기 전용) */}
      <div className="mt-onb__verified" role="status">
        <IconCircleCheck className="mt-ico" />
        <div className="mt-onb__verified-text">
          <strong>
            {identity.age}세 · {GENDER_LABEL[identity.gender]} · 성인 인증 완료
          </strong>
          <span>인증된 정보예요. 수정하려면 다시 인증이 필요해요.</span>
        </div>
        <span className="mt-onb__demo-tag">DEMO</span>
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

      {/* 만날 상대 */}
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
              onClick={() => setTarget(opt.value)}
            >
              <opt.Icon className="mt-ico" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* 관심사 */}
      <fieldset className="mt-onb__field">
        <legend className="mt-onb__label">
          관심사 <span className="mt-onb__accent">{INTEREST_RULES.min}개 이상</span>
        </legend>
        <p className="mt-onb__hint">
          최소 {INTEREST_RULES.min}개, 최대 {INTEREST_RULES.max}개 · 겹치는 취향으로
          추천해요 ({interests.length}/{INTEREST_RULES.max})
        </p>
        {INTEREST_CATEGORIES.map((cat) => (
          <div key={cat.id} className="mt-onb__cat">
            <div className="mt-onb__cat-label">{cat.label}</div>
            <div className="mt-onb__tags">
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
          </div>
        ))}
      </fieldset>

      {/* 안전 안내 */}
      <div className="mt-onb__safety" role="note">
        <IconShieldHeart className="mt-ico" />
        <span>
          연락처·주소·학교·직장은 받지 않아요. 안전한 만남을 위해 최소한만
          물어봐요.
        </span>
      </div>

      {/* 유효성 오류 (제출 시도 후 노출) */}
      {submitted && !isValid && (
        <ul className="mt-onb__errors" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {/* 액션 */}
      <div className="mt-onb__actions">
        <button
          type="button"
          className="mt-btn mt-btn--ghost"
          onClick={onCancel}
        >
          취소
        </button>
        <button
          type="button"
          className="mt-btn mt-btn--primary"
          onClick={handleSubmit}
        >
          저장하고 다음 →
        </button>
      </div>
      <p className="mt-onb__demo-foot">DEMO · 실제 저장 전 목업 화면</p>
    </section>
  );
}
