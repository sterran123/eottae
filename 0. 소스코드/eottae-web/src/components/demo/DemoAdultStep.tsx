'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MIN_SIGNUP_AGE } from '@/lib/auth/config';
import { todayInKorea } from '@/lib/auth/validation';
import {
  DEMO_ADULT_BYPASS,
  DEMO_ADULT_UNAVAILABLE_MESSAGE,
  completeDemoAdult,
  formatDemoWhen,
  judgeDemoAdultBirth,
  type DemoAdultRecord,
} from '@/lib/demo/demo-adult';
import './demo-flow.css';

type Props = {
  headingLevel?: 'h1' | 'h2' | 'h3';
  onCompleted: (record: DemoAdultRecord) => void;
  onCancel?: () => void;
};

export default function DemoAdultStep({ headingLevel = 'h2', onCompleted, onCancel }: Props) {
  const id = useId();
  const [birthDate, setBirthDate] = useState('');
  const [done, setDone] = useState<DemoAdultRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const birthRef = useRef<HTMLInputElement>(null);
  const proceedRef = useRef<HTMLButtonElement>(null);
  const Heading = headingLevel;
  const today = todayInKorea();
  const helpId = `${id}-birth-help`;
  const errorId = `${id}-birth-err`;

  useEffect(() => {
    if (done) proceedRef.current?.focus();
  }, [done]);

  function confirm() {
    const judgment = judgeDemoAdultBirth(birthDate);
    if (!judgment.ok) {
      setError(judgment.message);
      birthRef.current?.focus();
      return;
    }
    setBirthDate('');
    if (!DEMO_ADULT_BYPASS) {
      setError(DEMO_ADULT_UNAVAILABLE_MESSAGE);
      return;
    }
    const record = completeDemoAdult(judgment.age);
    if (!record) {
      setError('이 브라우저에 시연 결과를 저장하지 못했어요. 저장소를 허용한 뒤 다시 시도해 주세요.');
      return;
    }
    setError(null);
    setDone(record);
  }

  return (
    <div className="demo-adult-step">
      <Heading>성인 확인(시연)</Heading>
      <aside className="warn">
        <strong>시연용 — 실제 본인 확인이 아니에요(실데이터 단계에서 BBaton 연동)</strong>
        <p>
          생년월일은 만 {MIN_SIGNUP_AGE}세 판정에만 쓰여요. 확인이 끝나면 입력은 지우고, 생년월일 원본·신분증·주민등록번호는
          저장하지 않아요.
        </p>
      </aside>
      <p>
        로맨스 매칭과 1:1 채팅은 생일 기준 만 {MIN_SIGNUP_AGE}세 이상만 이용할 수 있어요. 만 {MIN_SIGNUP_AGE}세는
        출생일로부터 {MIN_SIGNUP_AGE}년이 지난 날(생일 당일 포함)부터입니다. 올해 생일이 아직이면 만 {MIN_SIGNUP_AGE}세가
        아니에요.
      </p>
      <p>시연 확인은 이 브라우저에 24시간만 남고, 그 시각이 지나면 다시 미완료가 돼요.</p>

      {done ? (
        <>
          <dl className="demo-adult-meta">
            <div>
              <dt>상태</dt>
              <dd>시연용 확인 완료</dd>
            </div>
            <div>
              <dt>만료 시각</dt>
              <dd>{formatDemoWhen(done.expiresAt)}</dd>
            </div>
          </dl>
          <div className="demo-flow-actions">
            <button ref={proceedRef} type="button" className="btn primary" onClick={() => onCompleted(done)}>
              매칭으로 진행
            </button>
          </div>
        </>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            confirm();
          }}
        >
          <div className="demo-adult-birth">
            <label htmlFor={`${id}-birth`}>생년월일</label>
            <input
              ref={birthRef}
              id={`${id}-birth`}
              type="date"
              autoComplete="bday"
              required
              min="1900-01-01"
              max={today}
              value={birthDate}
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${helpId} ${errorId}` : helpId}
              onChange={(event) => {
                setBirthDate(event.target.value);
                setError(null);
              }}
            />
            <p id={helpId} className="demo-adult-birth-help">
              만 {MIN_SIGNUP_AGE}세 확인에만 사용해요. 이 값은 저장하지 않아요.
            </p>
          </div>
          <div className="demo-flow-actions">
            <button type="submit" className="btn primary">
              만 {MIN_SIGNUP_AGE}세 이상 확인(시연)
            </button>
            {onCancel && (
              <button type="button" className="btn outline" onClick={onCancel}>
                나중에
              </button>
            )}
          </div>
        </form>
      )}
      {error && (
        <p id={errorId} className="demo-flow-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
