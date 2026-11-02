'use client';

// ============================================================
//  저장 경로: src/components/match/RecommendList.tsx
//  담당: 오하율 · MATCH-002 (추천 리스트 · 상태 · 백엔드 연동)
//  역할: 추천 카드 리스트 + 로딩/빈/에러/성인게이트 상태 (인수조건).
//        헤더에 도토리 잔액 표시(1차 준비중).
//
//  [백엔드 연동] matchService.fetchRecommendations / sendLikeDecision /
//               blockUser / reportUser를 통해 Supabase RPC·테이블과 통신하며,
//               키 미설정 환경에서는 데모 데이터로 동작한다 (ADR-005).
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DEMO_ACORN,
  DEMO_RECOMMENDATIONS,
} from '@/lib/match/demo-recommendations';
import {
  mapUiReasonToReportCategory,
  matchService,
} from '@/lib/match/match-service';
import type {
  AcornBalance,
  RecommendProfile,
  RecommendStatus,
} from '@/lib/match/types';
import { IconAcorn } from './icons';
import RecommendCard from './RecommendCard';

interface RecommendListProps {
  initialItems?: RecommendProfile[];
  acorn?: AcornBalance;
  /** 상태를 강제로 지정(시연/테스트용). 미지정 시 자동 판정. */
  status?: RecommendStatus;
}

export default function RecommendList({
  initialItems = DEMO_RECOMMENDATIONS,
  acorn: initialAcorn = DEMO_ACORN,
  status: statusProp,
}: RecommendListProps) {
  const router = useRouter();
  const [sourceItems, setSourceItems] = useState<RecommendProfile[]>(initialItems);
  const [acorn, setAcorn] = useState<AcornBalance>(initialAcorn);
  const [fetchedStatus, setFetchedStatus] = useState<RecommendStatus>('ready');
  const [stateErrorMsg, setStateErrorMsg] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // 패스('나중에') 또는 차단한 카드는 현재 리스트에서 숨김.
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [reportingTarget, setReportingTarget] = useState<RecommendProfile | null>(null);
  const [reportReason, setReportReason] = useState('부적절하거나 불쾌한 프로필');
  const [etcDetail, setEtcDetail] = useState('');
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showNotice(msg: string, ms = 3500) {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice(msg);
    noticeTimerRef.current = setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, ms);
  }

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void matchService.fetchRecommendations().then((res) => {
      if (!active) return;
      setIsDemoMode(res.context.isDemo);
      if (!res.ok) {
        setFetchedStatus('error');
        setStateErrorMsg(res.error.message);
        return;
      }
      if (res.mode === 'live') {
        setSourceItems(res.data.items);
        setAcorn(res.data.acorn);
        setFetchedStatus('ready');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(
    () => sourceItems.filter((p) => !skipped.has(p.id)),
    [sourceItems, skipped],
  );

  const baseStatus = statusProp ?? fetchedStatus;
  const effectiveStatus: RecommendStatus =
    baseStatus === 'ready' && items.length === 0 ? 'empty' : baseStatus;

  async function handleSkip(id: string) {
    setSkipped((prev) => new Set(prev).add(id));
    await matchService.sendLikeDecision(id, 'no');
  }

  async function handleLike(id: string) {
    const res = await matchService.sendLikeDecision(id, 'yes');
    if (!res.ok) {
      showNotice(res.error.message);
      return;
    }

    if (res.data.matched) {
      setSourceItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, relation: 'mutual', photo: 'revealed' }
            : item,
        ),
      );
      showNotice('서로 관심이 통했어요! 이제 1:1 대화가 열렸습니다.');
      return;
    }

    setSourceItems((prev) =>
      prev.map((item) =>
        item.id === id && item.relation === 'none'
          ? { ...item, relation: 'liked_by_me' }
          : item,
      ),
    );
    showNotice(
      isDemoMode
        ? '관심을 보냈어요. 상대도 관심을 누르면 대화가 열려요. (DEMO)'
        : '관심을 보냈어요. 상대도 관심을 누르면 대화가 열려요.',
    );
  }

  function handlePreview() {
    showNotice('사진 미리보기는 준비 중이에요. 결제는 아직 열리지 않았어요.');
  }

  function handleAcornClick() {
    showNotice('🌰 도토리 충전 및 결제 서비스는 준비 중이에요. 정식 오픈 후 이용하실 수 있습니다.');
  }

  async function handleBlock(id: string) {
    const target = sourceItems.find((p) => p.id === id);
    setSkipped((prev) => new Set(prev).add(id));
    await matchService.blockUser({ blockedUserId: id });
    showNotice(`${target?.nickname ?? '해당 상대'} 님을 차단했어요. 추천 목록에서 제외되었습니다.`);
  }

  function handleReport(id: string) {
    const target = sourceItems.find((p) => p.id === id);
    if (target) {
      setReportingTarget(target);
      setReportReason('부적절하거나 불쾌한 프로필');
      setEtcDetail('');
    }
  }

  async function confirmReport() {
    if (!reportingTarget) return;
    const target = reportingTarget;
    const isEtc = reportReason === '기타 사유 (직접 입력)';
    const finalReason = isEtc
      ? (etcDetail.trim() ? `기타: ${etcDetail.trim()}` : '기타 사유')
      : reportReason;

    setSkipped((prev) => new Set(prev).add(target.id));
    setReportingTarget(null);
    setEtcDetail('');

    await matchService.reportUser({
      reportedUserId: target.id,
      category: mapUiReasonToReportCategory(reportReason),
      description: finalReason,
      alsoBlock: true,
    });

    showNotice(
      `'${target.nickname}' 님에 대한 신고(${finalReason})가 안전센터에 접수되었습니다. 상대방은 즉시 차단되었습니다.`,
      4000,
    );
  }

  function handleAskQuestion(id: string, question: string) {
    const target = sourceItems.find((p) => p.id === id);
    showNotice(`'${target?.nickname ?? '상대'}' 님과의 1:1 대화방으로 질문을 전달하여 이동합니다...`);
    setTimeout(() => {
      router.push(`/match/chat?partner=${id}&q=${encodeURIComponent(question)}`);
    }, 400);
  }

  return (
    <section className="mt-rec-list" aria-label="오늘의 추천">
      <header className="mt-rec-list__head">
        <div>
          <h1 className="mt-rec-list__title">오늘의 추천</h1>
          <p className="mt-rec-list__sub">취향이 겹치는 순서로 보여드려요</p>
        </div>
        <button
          type="button"
          className="mt-rec-list__acorn"
          onClick={handleAcornClick}
          aria-label={`보유 도토리 ${acorn.acorn}개 (충전 준비 중)`}
        >
          <IconAcorn width={15} height={15} />
          <span>{acorn.acorn}</span>
        </button>
      </header>

      {notice && (
        <p className="mt-rec-list__notice" role="status">
          {notice}
        </p>
      )}

      <div className="mt-rec-list__body">
        {effectiveStatus === 'loading' && <RecommendSkeleton />}

        {effectiveStatus === 'error' && (
          <div className="mt-rec-state" role="alert">
            <p className="mt-rec-state__title">추천을 불러오지 못했어요</p>
            <p className="mt-rec-state__desc">
              {stateErrorMsg ?? '잠시 후 다시 시도해 주세요.'}
            </p>
          </div>
        )}

        {effectiveStatus === 'empty' && (
          <div className="mt-rec-state">
            <p className="mt-rec-state__title">오늘 추천을 다 봤어요</p>
            <p className="mt-rec-state__desc">
              내일 새로운 추천이 도착해요. 취향을 더 추가하면 추천이 넓어져요.
            </p>
            <Link className="mt-rec-state__link" href="/match/onboarding/">
              취향 수정하기
            </Link>
          </div>
        )}

        {effectiveStatus === 'ready' &&
          items.map((p) => (
            <RecommendCard
              key={p.id}
              profile={p}
              onLike={(id) => void handleLike(id)}
              onSkip={(id) => void handleSkip(id)}
              onBlock={(id) => void handleBlock(id)}
              onReport={handleReport}
              onPreview={handlePreview}
              onAskQuestion={handleAskQuestion}
            />
          ))}
      </div>

      {isDemoMode && (
        <p className="mt-rec-list__demo">
          DEMO · 샘플 추천 · 거리/접속은 대략 표시 · 결제(도토리)는 준비중
        </p>
      )}

      {/* 신고 다이얼로그 모달 */}
      {reportingTarget && (
        <div
          className="mt-report-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mt-report-title"
          onClick={() => setReportingTarget(null)}
        >
          <div className="mt-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mt-report-header">
              <h2 id="mt-report-title" className="mt-report-title">
                사용자 신고하기
              </h2>
              <button
                type="button"
                className="mt-report-close-btn"
                onClick={() => setReportingTarget(null)}
                aria-label="닫기"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="mt-report-desc">
              <strong>{reportingTarget.nickname}</strong> 님의 계정을 신고합니다.<br />
              접수 즉시 해당 사용자는 차단되며 관리자가 검토합니다.
            </p>

            <div className="mt-report-options">
              {[
                '부적절하거나 불쾌한 프로필',
                '사진 도용 또는 허위 프로필',
                '광고/스팸 또는 상업적 유도',
                '기타 사유 (직접 입력)',
              ].map((r) => {
                const isChecked = reportReason === r;
                return (
                  <label key={r} className={`mt-report-opt ${isChecked ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="reportReason"
                      value={r}
                      checked={isChecked}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                    <span className="mt-report-opt__label">{r}</span>
                  </label>
                );
              })}
            </div>

            {reportReason === '기타 사유 (직접 입력)' && (
              <textarea
                className="mt-report-textarea"
                rows={3}
                placeholder="상세한 신고 사유를 입력해 주세요. (예: 외부 메신저 유도, 비매너 언행 등)"
                value={etcDetail}
                onChange={(e) => setEtcDetail(e.target.value)}
                maxLength={200}
                autoFocus
              />
            )}

            <div className="mt-report-actions">
              <button
                type="button"
                className="mt-report-btn mt-report-btn--cancel"
                onClick={() => setReportingTarget(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="mt-report-btn mt-report-btn--submit"
                onClick={() => void confirmReport()}
              >
                신고 접수하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 화면 어디서나 보이는 플로팅 알림 토스트 */}
      {notice && (
        <div className="mt-rec-floating-toast" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="mt-rec-floating-toast__close"
            onClick={() => setNotice(null)}
            aria-label="알림 닫기"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}

// ---- 로딩 스켈레톤 ----
function RecommendSkeleton() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-rec-skel">
          <div className="mt-rec-skel__photo" />
          <div className="mt-rec-skel__lines">
            <span className="mt-rec-skel__line mt-rec-skel__line--title" />
            <span className="mt-rec-skel__line" />
            <span className="mt-rec-skel__line mt-rec-skel__line--short" />
          </div>
        </div>
      ))}
    </div>
  );
}
