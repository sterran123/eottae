'use client';

// ============================================================
//  저장 경로: src/components/match/RecommendList.tsx
//  담당: 오하율 · MATCH-002 (추천 리스트 · 상태)
//  역할: 추천 카드 리스트 + 로딩/빈/에러 상태 (인수조건).
//        헤더에 도토리 잔액 표시(1차 준비중).
//
//  [DEMO] 데이터는 DEMO_RECOMMENDATIONS. 실제는 주한태 추천 API 연동.
//  [상태] status prop 으로 로딩/빈/에러를 시연할 수 있게 열어둠.
// ============================================================

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEMO_ACORN,
  DEMO_RECOMMENDATIONS,
} from '@/lib/match/demo-recommendations';
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
  /** 상태를 강제로 지정(시연/테스트용). 미지정 시 ready. */
  status?: RecommendStatus;
}

export default function RecommendList({
  initialItems = DEMO_RECOMMENDATIONS,
  acorn = DEMO_ACORN,
  status = 'ready',
}: RecommendListProps) {
  const router = useRouter();
  // 패스('나중에') 또는 차단한 카드는 현재 리스트에서 숨김.
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [reportingTarget, setReportingTarget] = useState<RecommendProfile | null>(null);
  const [reportReason, setReportReason] = useState('부적절하거나 불쾌한 프로필');

  const items = useMemo(
    () => initialItems.filter((p) => !skipped.has(p.id)),
    [initialItems, skipped],
  );

  const effectiveStatus: RecommendStatus =
    status === 'ready' && items.length === 0 ? 'empty' : status;

  function handleSkip(id: string) {
    setSkipped((prev) => new Set(prev).add(id));
  }
  function handleLike(_id: string) {
    // DEMO: 실제로는 POST /match/likes (주한태). 여기선 안내만.
    setNotice('관심을 보냈어요. 상대도 관심을 누르면 대화가 열려요. (DEMO)');
    setTimeout(() => setNotice(null), 3500);
  }
  function handlePreview() {
    setNotice('사진 미리보기는 준비 중이에요. 결제는 아직 열리지 않았어요.');
    setTimeout(() => setNotice(null), 3500);
  }
  function handleBlock(id: string) {
    const target = initialItems.find((p) => p.id === id);
    setSkipped((prev) => new Set(prev).add(id));
    setNotice(`${target?.nickname ?? '해당 상대'} 님을 차단했어요. 추천 목록에서 제외되었습니다.`);
    setTimeout(() => setNotice(null), 3500);
  }
  function handleReport(id: string) {
    const target = initialItems.find((p) => p.id === id);
    if (target) {
      setReportingTarget(target);
    }
  }
  function confirmReport() {
    if (!reportingTarget) return;
    const target = reportingTarget;
    setSkipped((prev) => new Set(prev).add(target.id));
    setReportingTarget(null);
    setNotice(`'${target.nickname}' 님에 대한 신고(${reportReason})가 안전센터에 접수되었습니다. 상대방은 즉시 차단되었습니다.`);
    setTimeout(() => setNotice(null), 4000);
  }
  function handleAskQuestion(id: string, question: string) {
    const target = initialItems.find((p) => p.id === id);
    setNotice(`'${target?.nickname ?? '상대'}' 님과의 1:1 대화방으로 질문을 전달하여 이동합니다...`);
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
        <div
          className="mt-rec-list__acorn"
          aria-label={`보유 도토리 ${acorn.acorn}개 (준비 중)`}
        >
          <IconAcorn width={15} height={15} />
          <span>{acorn.acorn}</span>
        </div>
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
              잠시 후 다시 시도해 주세요.
            </p>
          </div>
        )}

        {effectiveStatus === 'empty' && (
          <div className="mt-rec-state">
            <p className="mt-rec-state__title">오늘 추천을 다 봤어요</p>
            <p className="mt-rec-state__desc">
              내일 새로운 추천이 도착해요. 취향을 더 추가하면 추천이 넓어져요.
            </p>
            <a className="mt-rec-state__link" href="/match/onboarding/">
              취향 수정하기
            </a>
          </div>
        )}

        {effectiveStatus === 'ready' &&
          items.map((p) => (
            <RecommendCard
              key={p.id}
              profile={p}
              onLike={handleLike}
              onSkip={handleSkip}
              onBlock={handleBlock}
              onReport={handleReport}
              onPreview={handlePreview}
              onAskQuestion={handleAskQuestion}
            />
          ))}
      </div>

      <p className="mt-rec-list__demo">
        DEMO · 샘플 추천 · 거리/접속은 대략 표시 · 결제(도토리)는 준비중
      </p>

      {/* 신고 다이얼로그 모달 */}
      {reportingTarget && (
        <div
          className="mt-report-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setReportingTarget(null)}
        >
          <div className="mt-report-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="mt-report-title">🚨 상대방 신고하기</h2>
            <p className="mt-report-desc">
              <strong>{reportingTarget.nickname}</strong> 님을 신고합니다.<br />
              신고 사유를 선택해 주세요.
            </p>
            <div className="mt-report-options">
              {[
                '부적절하거나 불쾌한 프로필',
                '사진 도용 또는 허위 프로필',
                '광고/스팸 또는 상업적 유도',
                '기타 불쾌감 조성',
              ].map((r) => (
                <label key={r} className="mt-report-opt">
                  <input
                    type="radio"
                    name="reportReason"
                    value={r}
                    checked={reportReason === r}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
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
                onClick={confirmReport}
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
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 6px', fontSize: '14px' }}
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
