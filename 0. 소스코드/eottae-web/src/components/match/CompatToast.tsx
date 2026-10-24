'use client';

// ============================================================
//  저장 경로: src/components/match/CompatToast.tsx
//  담당: 오하율 · MATCH-009 (궁합 토스트)
//  역할: 궁합 요약을 상단 토스트로 잠깐 노출 후 자동 사라짐 + X 닫기.
//
//  [규칙] 겹친 '개수'만 표시(사실). 점수·% 금지(브랜드 가이드).
//  [동작] 마운트 후 durationMs 뒤 자동 숨김. X 로 즉시 닫기.
// ============================================================

import { useEffect, useState } from 'react';
import type { CompatibilitySummary } from '@/lib/match/types';
import { IconSparkle, IconX } from './icons';

interface CompatToastProps {
  partnerName: string;
  summary: CompatibilitySummary;
  /** 자동 사라짐까지(ms). 기본 5초. */
  durationMs?: number;
}

export default function CompatToast({
  partnerName,
  summary,
  durationMs = 5000,
}: CompatToastProps) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);

  // 퇴장 애니메이션 후 제거
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setVisible(false), 260);
    return () => clearTimeout(t);
  }, [leaving]);

  if (!visible || summary.sharedCount <= 0) return null;

  return (
    <div
      className={`mt-toast${leaving ? ' is-leaving' : ''}`}
      role="status"
      aria-live="polite"
    >
      <IconSparkle className="mt-toast__ico" />
      <span className="mt-toast__text">
        {partnerName}님과 지금까지{' '}
        <strong>{summary.sharedCount}개</strong> 통했어요
      </span>
      <button
        type="button"
        className="mt-toast__close"
        aria-label="알림 닫기"
        onClick={() => setLeaving(true)}
      >
        <IconX className="mt-ico mt-ico--xs" />
      </button>
    </div>
  );
}
