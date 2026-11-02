'use client';

// 내 신고 내역과 신고 관리 큐 데모. 기록은 이 기기에만 있다.

import { useEffect, useId, useState } from 'react';
import { formatDemoWhen } from '@/lib/demo/demo-adult';
import { nicknameForDemoId } from '@/lib/chat/demo-data';
import { listDemoReports, subscribeSafetyDemo } from '@/lib/safety/demo-store';
import { REPORT_CATEGORIES, type ReportHistoryItem } from '@/lib/safety/types';

function categoryLabel(item: ReportHistoryItem): string {
  return REPORT_CATEGORIES.find((category) => category.id === item.category)?.label ?? '기타';
}

function ReportItem({ item, showReporter }: { item: ReportHistoryItem; showReporter: boolean }) {
  return (
    <li className="mt-report-item">
      <strong>{item.nickname}</strong>
      <span>{categoryLabel(item)}</span>
      {showReporter && <span>신고자 {nicknameForDemoId(item.reporterId)}</span>}
      <span>{item.description || '상세 내용 없음'}</span>
      <time dateTime={item.createdAt}>{formatDemoWhen(item.createdAt)}</time>
      <span className="mt-chat-demo">데모 · {item.status === 'closed' ? '닫힘' : '접수됨'}</span>
    </li>
  );
}

export default function SafetyDemoPanels({ actorId }: { actorId: string }) {
  const hintId = useId();
  const [ready, setReady] = useState(false);
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [adminActor, setAdminActor] = useState<string | null>(null);
  const admin = adminActor === actorId;

  useEffect(() => {
    const load = () => setReports(listDemoReports());
    load();
    setReady(true);
    return subscribeSafetyDemo(load);
  }, []);

  const mine = reports.filter((item) => item.reporterId === actorId);

  return (
    <div className="mt-report-wrap">
      <section className="mt-report-panel" aria-labelledby="my-reports-title">
        <h2 id="my-reports-title" className="mt-report-title">내 신고 내역</h2>
        <p className="mt-chat-demo">데모 · 이 기기에만 저장돼요.</p>
        {!ready ? null : mine.length === 0 ? (
          <p className="mt-report-empty">아직 이 기기에 남긴 신고가 없어요.</p>
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
          onClick={() => setAdminActor((current) => (current === actorId ? null : actorId))}
        >
          관리자 시점으로 보기
        </button>
        <p id={hintId} className="mt-report-empty" role="status">
          {admin ? '데모 관리자 시점이에요. 이 기기의 신고만 보여요.' : '일반 계정은 볼 수 없어요'}
        </p>
        {admin && ready && (
          reports.length === 0 ? (
            <p className="mt-report-empty">대기 중인 신고가 없어요.</p>
          ) : (
            <ul className="mt-report-list" aria-label="신고 관리 큐">
              {reports.map((item) => (
                <ReportItem key={item.id} item={item} showReporter />
              ))}
            </ul>
          )
        )}
      </section>
    </div>
  );
}
