'use client';

import { useEffect, useState } from 'react';
import {
  clearDemoAdult,
  formatDemoWhen,
  isDemoAdultActive,
  readDemoAdult,
  subscribeDemoAdult,
  type DemoAdultRecord,
} from '@/lib/demo/demo-adult';
import '@/components/demo/demo-flow.css';

export default function DemoAdultSettingsStatus() {
  const [ready, setReady] = useState(false);
  const [record, setRecord] = useState<DemoAdultRecord | null>(null);

  useEffect(() => {
    const sync = () => {
      setRecord(readDemoAdult());
      setReady(true);
    };
    sync();
    return subscribeDemoAdult(sync);
  }, []);

  const active = ready && record !== null && isDemoAdultActive();
  const label = !ready ? '확인 중' : active ? '완료' : '미완료';

  return (
    <div className="demo-adult-settings-row">
      <p className="settings-status" id="demo-adult-status">
        성인 확인(시연): <b>{label}</b>
        {active && record ? ` · ${formatDemoWhen(record.expiresAt)} 만료` : ''}
      </p>
      <button
        type="button"
        className="btn outline"
        onClick={() => clearDemoAdult()}
        disabled={!ready || record === null}
        aria-describedby="demo-adult-status demo-adult-reset-note"
      >
        초기화
      </button>
      <p className="settings-note" id="demo-adult-reset-note">
        실제 본인 확인이 아닌 시연용이에요. 초기화는 이 브라우저의 시연 표시만 지워요.
      </p>
    </div>
  );
}
