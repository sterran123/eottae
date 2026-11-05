'use client';

// 내 신고 내역과 신고 관리 큐 데모/실계정.
// - 데모 계정: 이 기기 로컬 스토리지에만 저장/표시.
// - 실계정 (로그인 세션 또는 UUID): `public.reports` 조회(내 신고) 및 `public.list_reports()` RPC(신고 큐: operator 권한 검사 및 42501 거부).

import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDemoWhen } from '@/lib/demo/demo-adult';
import { nicknameForDemoId } from '@/lib/chat/demo-data';
import { listDemoReports, subscribeSafetyDemo } from '@/lib/safety/demo-store';
import { REPORT_CATEGORIES, type ReportHistoryItem } from '@/lib/safety/types';
import { isUuid } from '@/lib/chat/types';
import { fetchMyReports, fetchReportQueue, type ReportQueueResult } from '@/lib/safety/safety-service';

function categoryLabel(item: ReportHistoryItem): string {
  return REPORT_CATEGORIES.find((category) => category.id === item.category)?.label ?? '기타';
}

function ReportItem({ item, showReporter }: { item: ReportHistoryItem; showReporter: boolean }) {
  const isDemo = !isUuid(item.id);
  const reporterLabel = isUuid(item.reporterId)
    ? `회원 (${item.reporterId.slice(0, 8)})`
    : nicknameForDemoId(item.reporterId);

  return (
    <li className="mt-report-item">
      <strong>{item.nickname}</strong>
      <span>{categoryLabel(item)}</span>
      {showReporter && <span>신고자 {reporterLabel}</span>}
      <span>{item.description || '상세 내용 없음'}</span>
      <time dateTime={item.createdAt}>{formatDemoWhen(item.createdAt)}</time>
      <span className={isDemo ? 'mt-chat-demo' : ''}>
        {isDemo ? '데모 · ' : ''}
        {item.status === 'closed' ? '닫힘' : '접수됨'}
      </span>
    </li>
  );
}

export default function SafetyDemoPanels({
  actorId,
  isDemoOverride = false,
}: {
  actorId: string;
  isDemoOverride?: boolean;
}) {
  const hintId = useId();
  const auth = useAuth();
  const sessionUserId =
    auth.status === 'signed-in' && isUuid(auth.user?.id) ? auth.user.id : null;
  const effectiveActorId = isDemoOverride
    ? actorId
    : isUuid(actorId)
      ? actorId
      : sessionUserId ?? actorId;
  const isLive = !isDemoOverride && Boolean(sessionUserId || isUuid(actorId));

  const [ready, setReady] = useState(false);
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [myReportsFailed, setMyReportsFailed] = useState(false);
  const [adminActor, setAdminActor] = useState<string | null>(null);
  const admin = adminActor === effectiveActorId;

  // 실계정 신고 큐 상태 (RPC list_reports) 및 취소 가드 세대 번호
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueResult, setQueueResult] = useState<ReportQueueResult | null>(null);
  const queueReqIdRef = useRef(0);

  useEffect(() => {
    queueReqIdRef.current += 1;
    setAdminActor(null);
    setQueueLoading(false);
    setQueueResult(null);
  }, [effectiveActorId, isLive]);

  useEffect(() => {
    return () => {
      queueReqIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (isLive) {
      setReady(false);
      setMyReportsFailed(false);
      fetchMyReports().then((items) => {
        if (cancelled) return;
        if (items === null) {
          setMyReportsFailed(true);
          setReports([]);
        } else {
          setMyReportsFailed(false);
          setReports(items);
        }
        setReady(true);
      });
      return () => {
        cancelled = true;
      };
    } else {
      setMyReportsFailed(false);
      const load = () => setReports(listDemoReports());
      load();
      setReady(true);
      return subscribeSafetyDemo(load);
    }
  }, [isLive, effectiveActorId]);

  // 관리자 시점으로 보기 토글 시 실계정은 RPC 호출 (세대 번호로 이전 응답 무시)
  const handleToggleAdmin = () => {
    if (admin) {
      queueReqIdRef.current += 1;
      setAdminActor(null);
      setQueueLoading(false);
      setQueueResult(null);
    } else {
      setAdminActor(effectiveActorId);
      setQueueResult(null);
      if (isLive) {
        const reqId = ++queueReqIdRef.current;
        setQueueLoading(true);
        fetchReportQueue().then((res) => {
          if (queueReqIdRef.current !== reqId) return;
          setQueueResult(res);
          setQueueLoading(false);
        });
      }
    }
  };

  const mine = isLive
    ? reports
    : reports.filter((item) => item.reporterId === effectiveActorId);

  const adminStatusText = !admin
    ? '일반 계정은 볼 수 없어요'
    : isLive
      ? queueLoading
        ? '운영자 권한을 확인하는 중...'
        : queueResult?.status === 403
          ? '일반 계정은 볼 수 없어요 (403 FORBIDDEN · 운영자 전용)'
          : queueResult?.ok
            ? '운영자 시점이에요. 전체 신고 큐가 조회되었습니다.'
            : '신고 큐를 조회할 수 없어요.'
      : '데모 관리자 시점이에요. 이 기기의 신고만 보여요.';

  return (
    <div className="mt-report-wrap">
      <section className="mt-report-panel" aria-labelledby="my-reports-title">
        <h2 id="my-reports-title" className="mt-report-title">내 신고 내역</h2>
        <p className="mt-chat-demo">
          {isLive ? '실계정 · 내가 접수한 신고 내역이에요.' : '데모 · 이 기기에만 저장돼요.'}
        </p>
        {!ready ? null : isLive && myReportsFailed ? (
          <p className="mt-report-empty">내 신고 내역을 불러오지 못했어요.</p>
        ) : mine.length === 0 ? (
          <p className="mt-report-empty">
            {isLive ? '접수한 신고 내역이 없어요.' : '아직 이 기기에 남긴 신고가 없어요.'}
          </p>
        ) : (
          <ul className="mt-report-list" aria-label="내 신고 내역">
            {mine.map((item) => (
              <ReportItem key={item.id} item={item} showReporter={false} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-report-panel" aria-labelledby="report-queue-title">
        <h2 id="report-queue-title" className="mt-report-title">신고 관리 큐</h2>
        <button
          type="button"
          className="mt-safety-btn mt-report-admin"
          aria-pressed={admin}
          aria-describedby={hintId}
          onClick={handleToggleAdmin}
        >
          관리자 시점으로 보기
        </button>
        <p id={hintId} className="mt-report-empty" role="status">
          {adminStatusText}
        </p>
        {admin && (
          isLive ? (
            queueResult?.ok ? (
              queueResult.items.length === 0 ? (
                <p className="mt-report-empty">대기 중인 신고가 없어요.</p>
              ) : (
                <ul className="mt-report-list" aria-label="신고 관리 큐">
                  {queueResult.items.map((item) => (
                    <ReportItem key={item.id} item={item} showReporter />
                  ))}
                </ul>
              )
            ) : null
          ) : ready && (
            reports.length === 0 ? (
              <p className="mt-report-empty">대기 중인 신고가 없어요.</p>
            ) : (
              <ul className="mt-report-list" aria-label="신고 관리 큐">
                {reports.map((item) => (
                  <ReportItem key={item.id} item={item} showReporter />
                ))}
              </ul>
            )
          )
        )}
      </section>
    </div>
  );
}
