'use client';

// src/components/auth/ConsentFields.tsx
// 회원가입·가입 완료 화면 공통: 이름·생년월일 + 필수 동의 3종

import { useId } from 'react';
import { MIN_SIGNUP_AGE } from '@/lib/auth/config';
import { todayInKorea, validateBirthDate, validateFullName } from '@/lib/auth/validation';

export interface ProfileConsentValues {
  fullName: string;
  birthDate: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  adultSelfCheck: boolean;
}

export type ProfileConsentErrors = Partial<Record<keyof ProfileConsentValues, string>>;

export const EMPTY_PROFILE_CONSENT: ProfileConsentValues = {
  fullName: '',
  birthDate: '',
  agreeTerms: false,
  agreePrivacy: false,
  adultSelfCheck: false,
};

interface Props {
  values: ProfileConsentValues;
  errors: ProfileConsentErrors;
  disabled?: boolean;
  onChange: (patch: Partial<ProfileConsentValues>) => void;
}

export default function ConsentFields({ values, errors, disabled, onChange }: Props) {
  const id = useId();
  const allChecked = values.agreeTerms && values.agreePrivacy && values.adultSelfCheck;

  return (
    <>
      <div className="auth-field">
        <label htmlFor={`${id}-name`}>이름</label>
        <input
          id={`${id}-name`}
          type="text"
          autoComplete="name"
          maxLength={50}
          value={values.fullName}
          disabled={disabled}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? `${id}-name-err` : undefined}
          onChange={(e) => onChange({ fullName: e.target.value })}
        />
        {errors.fullName && (
          <p id={`${id}-name-err`} className="auth-field-error" role="alert">
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor={`${id}-birth`}>생년월일</label>
        <input
          id={`${id}-birth`}
          type="date"
          autoComplete="bday"
          min="1900-01-01"
          max={todayInKorea()}
          value={values.birthDate}
          disabled={disabled}
          aria-invalid={Boolean(errors.birthDate)}
          aria-describedby={`${id}-birth-help${errors.birthDate ? ` ${id}-birth-err` : ''}`}
          onChange={(e) => onChange({ birthDate: e.target.value })}
        />
        <p id={`${id}-birth-help`} className="auth-field-help">
          만 {MIN_SIGNUP_AGE}세 확인에만 사용하고, 생년월일 전체는 저장하지 않아요(출생연도만 보관).
        </p>
        {errors.birthDate && (
          <p id={`${id}-birth-err`} className="auth-field-error" role="alert">
            {errors.birthDate}
          </p>
        )}
      </div>

      <fieldset className="auth-consents" disabled={disabled}>
        <legend>약관 동의</legend>

        <label className="auth-check auth-check-all">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) =>
              onChange({
                agreeTerms: e.target.checked,
                agreePrivacy: e.target.checked,
                adultSelfCheck: e.target.checked,
              })
            }
          />
          <span>전체 동의</span>
        </label>

        <label className="auth-check">
          <input
            type="checkbox"
            checked={values.agreeTerms}
            onChange={(e) => onChange({ agreeTerms: e.target.checked })}
          />
          <span>
            <b className="auth-required">[필수]</b> 이용약관 동의
          </span>
        </label>
        <details className="auth-terms">
          <summary>이용약관 보기</summary>
          <p>
            (초안) 「어때?」는 교육 과정 팀 프로젝트로, 정식 서비스 공개 전 법률 검토를 거쳐 약관 본문을
            확정합니다. 회원은 타인을 존중하고 허위 정보·불법 촬영물·괴롭힘 등을 게시하지 않아야 하며, 위반
            시 이용이 제한될 수 있습니다.
          </p>
        </details>

        <label className="auth-check">
          <input
            type="checkbox"
            checked={values.agreePrivacy}
            onChange={(e) => onChange({ agreePrivacy: e.target.checked })}
          />
          <span>
            <b className="auth-required">[필수]</b> 개인정보 수집·이용 동의
          </span>
        </label>
        <details className="auth-terms">
          <summary>수집 항목 보기</summary>
          <p>
            (초안) 수집 항목: 이메일, 이름, 출생연도, 약관 동의 이력. 목적: 회원 식별, 만 19세 이상 이용
            확인, 안전한 서비스 제공. 보관: 회원 탈퇴 시까지(법령상 보존 의무 항목 제외). 생년월일 전체와 신분증
            원본은 저장하지 않습니다.
          </p>
        </details>

        <label className="auth-check">
          <input
            type="checkbox"
            checked={values.adultSelfCheck}
            onChange={(e) => onChange({ adultSelfCheck: e.target.checked })}
          />
          <span>
            <b className="auth-required">[필수]</b> 만 {MIN_SIGNUP_AGE}세 이상입니다
          </span>
        </label>

        {(errors.agreeTerms || errors.agreePrivacy || errors.adultSelfCheck) && (
          <p className="auth-field-error" role="alert">
            {errors.agreeTerms || errors.agreePrivacy || errors.adultSelfCheck}
          </p>
        )}
        <p className="auth-field-help">
          매칭·채팅은 가입 후 별도의 성인 인증을 마쳐야 이용할 수 있어요.
        </p>
      </fieldset>
    </>
  );
}

/** 이름·생년월일·동의 검증 (화면용) */
export function validateProfileConsent(v: ProfileConsentValues): ProfileConsentErrors {
  const errors: ProfileConsentErrors = {};
  const name = validateFullName(v.fullName);
  if (name) errors.fullName = name;
  const birth = validateBirthDate(v.birthDate);
  if (birth) errors.birthDate = birth;
  if (!v.agreeTerms || !v.agreePrivacy || !v.adultSelfCheck) {
    errors.agreeTerms = '필수 항목에 모두 동의해 주세요.';
  }
  return errors;
}
