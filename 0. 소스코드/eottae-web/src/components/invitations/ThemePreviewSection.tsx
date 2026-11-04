'use client';

import { useEffect, useRef, useState } from 'react';
import { formatDemoWhen } from '@/lib/demo/demo-adult';
import {
  DEMO_THEMES,
  formatKrw,
  readDemoReceipts,
  saveDemoReceipt,
  subscribeDemoThemes,
  type DemoTheme,
  type DemoThemeReceipt,
} from '@/lib/demo/demo-themes';
import ModalCloseButton from '@/components/activities/ModalCloseButton';
import DemoSheet from '@/components/demo/DemoSheet';
import '@/components/demo/demo-flow.css';

type PayPhase = 'review' | 'pay' | 'approve' | 'cancel' | 'receipt';

const STEP_DEFS = [
  { id: 'pay', label: '결제' },
  { id: 'approve', label: '승인' },
  { id: 'cancel', label: '즉시 취소' },
] as const;

function stepState(phase: PayPhase, id: (typeof STEP_DEFS)[number]['id']): 'pending' | 'current' | 'done' {
  const order = ['pay', 'approve', 'cancel'] as const;
  if (phase === 'review') return 'pending';
  if (phase === 'receipt') return 'done';
  const current = phase === 'pay' || phase === 'approve' || phase === 'cancel' ? phase : 'pay';
  const cursor = order.indexOf(current);
  const mine = order.indexOf(id);
  if (mine < cursor) return 'done';
  if (mine === cursor) return 'current';
  return 'pending';
}

function wait(ms: number, signal: { cancelled: boolean }) {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), ms);
  }).then(() => {
    if (signal.cancelled) throw new Error('cancelled');
  });
}

export default function ThemePreviewSection() {
  const [receipts, setReceipts] = useState<Record<string, DemoThemeReceipt>>({});
  const [theme, setTheme] = useState<DemoTheme | null>(null);
  const [phase, setPhase] = useState<PayPhase>('review');
  const [activeReceipt, setActiveReceipt] = useState<DemoThemeReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const runRef = useRef(0);

  useEffect(() => {
    const sync = () => setReceipts(readDemoReceipts());
    sync();
    return subscribeDemoThemes(sync);
  }, []);

  useEffect(() => {
    if (!theme || phase === 'review') return;
    const dialog = document.getElementById('demo-pay-title')?.closest('dialog');
    dialog?.querySelector<HTMLElement>('.act-modal-close')?.focus();
  }, [theme, phase]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  function closeSheet() {
    runRef.current += 1;
    setTheme(null);
    setPhase('review');
    setActiveReceipt(null);
    setError(null);
  }

  function openTheme(next: DemoTheme) {
    const owned = receipts[next.id];
    setTheme(next);
    setError(null);
    if (owned) {
      setActiveReceipt(owned);
      setPhase('receipt');
      return;
    }
    setActiveReceipt(null);
    setPhase('review');
  }

  async function runPayment() {
    if (!theme || phase !== 'review') return;
    const runId = runRef.current + 1;
    runRef.current = runId;
    const signal = {
      get cancelled() {
        return runRef.current !== runId;
      },
    };
    setError(null);
    const gap = reduced ? 200 : 700;
    try {
      const paidAt = new Date();
      setPhase('pay');
      await wait(gap, signal);
      const approvedAt = new Date();
      setPhase('approve');
      await wait(gap, signal);
      const cancelledAt = new Date();
      setPhase('cancel');
      await wait(gap, signal);
      const receipt: DemoThemeReceipt = {
        themeId: theme.id,
        themeName: theme.name,
        priceKrw: theme.priceKrw,
        receiptNo: `DEMO-${theme.id}-${paidAt.getTime().toString(36)}`,
        paidAt: paidAt.toISOString(),
        approvedAt: approvedAt.toISOString(),
        cancelledAt: cancelledAt.toISOString(),
      };
      if (!saveDemoReceipt(receipt)) {
        setError('이 브라우저에 데모 영수증을 저장하지 못했어요.');
        setPhase('review');
        return;
      }
      setActiveReceipt(receipt);
      setPhase('receipt');
    } catch {
      if (runRef.current === runId) setPhase('review');
    }
  }

  return (
    <section className="demo-theme-section" aria-labelledby="theme-preview-title">
      <h2 id="theme-preview-title">테마 미리보기</h2>
      <p className="demo-theme-lead">
        청첩장 테마 판매를 미리 보는 시연이에요. 가격은 예시이고, 테스트 결제는 이 화면 안에서 결제 후
        승인되고 바로 취소됩니다. 실제 청구와 외부 결제 페이지는 없어요.
      </p>
      <div className="demo-theme-grid">
        {DEMO_THEMES.map((item) => {
          const owned = Boolean(receipts[item.id]);
          return (
            <article
              className={owned ? 'demo-theme-card is-owned' : 'demo-theme-card'}
              key={item.id}
              aria-labelledby={`theme-${item.id}`}
            >
              <div className="demo-theme-swatch" data-swatch={item.swatch} aria-hidden="true" />
              <h3 id={`theme-${item.id}`}>{item.name}</h3>
              <p>{item.blurb}</p>
              <p className="demo-theme-price">
                {formatKrw(item.priceKrw)} <span>(예시)</span>
              </p>
              {owned && <p className="demo-owned-flag">구매한 테마(데모)</p>}
              <button type="button" className={owned ? 'btn outline' : 'btn primary'} onClick={() => openTheme(item)}>
                {owned ? '데모 영수증 보기' : '테스트 결제'}
              </button>
            </article>
          );
        })}
      </div>

      <DemoSheet open={theme !== null} labelledBy="demo-pay-title" onClose={closeSheet} headClose>
        {theme && (
          <>
            <div className="demo-pay-head">
              <h2 id="demo-pay-title">모의 결제(데모) · 실제 청구 없음</h2>
              <ModalCloseButton onClick={closeSheet} />
            </div>
            <p className="demo-theme-lead">
              {theme.name} · {formatKrw(theme.priceKrw)} (예시). 카드번호는 받지 않아요. 결제 페이지로
              이동하지 않아요.
            </p>
            <ol className="demo-pay-steps" aria-label="모의 결제 단계">
              {STEP_DEFS.map((step) => {
                const state = stepState(phase, step.id);
                return (
                  <li key={step.id} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
                    <span>{state === 'done' ? '완료' : state === 'current' ? '진행' : '대기'}</span>
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ol>
            {phase === 'review' && (
              <div className="demo-flow-actions">
                <button type="button" className="btn primary" onClick={() => void runPayment()}>
                  결제
                </button>
              </div>
            )}
            {phase !== 'review' && phase !== 'receipt' && (
              <p className="demo-theme-lead" role="status">
                {phase === 'pay' && '결제를 접수하는 중이에요.'}
                {phase === 'approve' && '승인을 표시하는 중이에요.'}
                {phase === 'cancel' && '승인을 즉시 취소하는 중이에요.'}
              </p>
            )}
            {phase === 'receipt' && activeReceipt && (
              <article className="demo-receipt" aria-label="데모 영수증">
                <h3>데모 영수증</h3>
                <p className="demo-owned-flag">구매한 테마(데모)</p>
                <dl>
                  <div>
                    <dt>테마</dt>
                    <dd>{activeReceipt.themeName}</dd>
                  </div>
                  <div>
                    <dt>예시 금액</dt>
                    <dd>{formatKrw(activeReceipt.priceKrw)} (예시, 실제 청구 없음)</dd>
                  </div>
                  <div>
                    <dt>결제</dt>
                    <dd>{formatDemoWhen(activeReceipt.paidAt)}</dd>
                  </div>
                  <div>
                    <dt>승인</dt>
                    <dd>{formatDemoWhen(activeReceipt.approvedAt)}</dd>
                  </div>
                  <div>
                    <dt>즉시 취소</dt>
                    <dd>{formatDemoWhen(activeReceipt.cancelledAt)}</dd>
                  </div>
                  <div>
                    <dt>시연 영수증 번호</dt>
                    <dd>{activeReceipt.receiptNo}</dd>
                  </div>
                </dl>
                <p className="demo-theme-lead">
                  승인 직후 즉시 취소했습니다. 모의 결제(데모)이며 실제 청구는 없습니다. 이 브라우저에만
                  구매한 테마(데모)로 표시합니다.
                </p>
              </article>
            )}
            {error && (
              <p className="demo-flow-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </DemoSheet>
    </section>
  );
}
