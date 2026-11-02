'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DEMO_ADULT_BYPASS,
  DEMO_ADULT_UNAVAILABLE_MESSAGE,
  completeDemoAdult,
  formatDemoWhen,
  type DemoAdultRecord,
} from '@/lib/demo/demo-adult';
import './demo-flow.css';

type Props = {
  headingLevel?: 'h1' | 'h2' | 'h3';
  onCompleted: (record: DemoAdultRecord) => void;
  onCancel?: () => void;
};

export default function DemoAdultStep({ headingLevel = 'h2', onCompleted, onCancel }: Props) {
  const [done, setDone] = useState<DemoAdultRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const proceedRef = useRef<HTMLButtonElement>(null);
  const Heading = headingLevel;

  useEffect(() => {
    if (done) proceedRef.current?.focus();
  }, [done]);

  function confirm() {
    if (!DEMO_ADULT_BYPASS) {
      setError(DEMO_ADULT_UNAVAILABLE_MESSAGE);
      return;
    }
    const record = completeDemoAdult();
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
        <strong>실제 본인 확인이 아닌 시연용</strong>
        <p>BBaton·신분증·주민등록번호 확인은 하지 않아요. 생년월일도 받지 않아요.</p>
      </aside>
      <p>
        로맨스 매칭과 1:1 채팅은 생일 기준 만 19세 이상만 이용할 수 있어요. 만 19세는 출생일로부터
        19년이 지난 날(생일 당일 포함)부터입니다. 올해 생일이 아직이면 만 19세가 아니에요.
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
        <div className="demo-flow-actions">
          <button type="button" className="btn primary" onClick={confirm}>
            BBaton으로 확인(시연)
          </button>
          {onCancel && (
            <button type="button" className="btn outline" onClick={onCancel}>
              나중에
            </button>
          )}
        </div>
      )}
      {error && (
        <p className="demo-flow-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
