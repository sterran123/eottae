'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { isDemoAdultActive, subscribeDemoAdult } from '@/lib/demo/demo-adult';
import { matchService, type MatchOperatingMode } from '@/lib/match/match-service';
import DemoAdultStep from './DemoAdultStep';
import './demo-flow.css';

type Area = 'onboarding' | 'recommend' | 'chat';

type GateState =
  | { status: 'pending' }
  | { status: 'error' }
  | { status: 'open'; mode: MatchOperatingMode }
  | { status: 'locked' };

const COPY: Record<Exclude<Area, 'onboarding'>, { title: string; reason: string }> = {
  recommend: {
    title: '추천을 열 수 없어요',
    reason:
      '성인 확인(시연)이 끝나기 전에는 추천을 열지 않아요. 로맨스 매칭 추천은 생일 기준 만 19세 이상만 볼 수 있어요.',
  },
  chat: {
    title: '채팅을 열 수 없어요',
    reason:
      '성인 확인(시연)이 끝나기 전에는 채팅을 열지 않아요. 1:1 채팅은 생일 기준 만 19세 이상만 이용할 수 있어요.',
  },
};

function nextGate(mode: MatchOperatingMode): GateState {
  if (mode !== 'demo') return { status: 'open', mode };
  if (isDemoAdultActive()) return { status: 'open', mode };
  return { status: 'locked' };
}

export default function DemoEntryGuard({ area, children }: { area: Area; children: ReactNode }) {
  const [gate, setGate] = useState<GateState>({ status: 'pending' });

  const resolve = useCallback(async () => {
    setGate({ status: 'pending' });
    try {
      const context = await matchService.resolveAccessContext();
      setGate(nextGate(context.mode));
    } catch {
      setGate({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  useEffect(() => {
    return subscribeDemoAdult(() => {
      setGate((current) => {
        if (current.status === 'open' && current.mode !== 'demo') return current;
        if (current.status !== 'open' && current.status !== 'locked') return current;
        // 완료 직후에는 만료 시각 화면을 유지하고, '매칭으로 진행'에서만 연다.
        if (!isDemoAdultActive()) return { status: 'locked' };
        return current;
      });
    });
  }, []);

  if (gate.status === 'pending') {
    return (
      <p className="demo-entry-pending" role="status">
        매칭 이용 조건을 확인하고 있어요.
      </p>
    );
  }

  if (gate.status === 'error') {
    return (
      <div className="demo-adult-block">
        <h2>이용 조건을 확인하지 못했어요</h2>
        <p>잠시 후 다시 시도해 주세요.</p>
        <div className="demo-flow-actions">
          <button type="button" className="btn primary" onClick={() => void resolve()}>
            다시 확인
          </button>
        </div>
      </div>
    );
  }

  if (gate.status === 'open') return children;

  if (area === 'onboarding') {
    return (
      <div>
        <DemoAdultStep
          headingLevel="h1"
          onCompleted={() => setGate({ status: 'open', mode: 'demo' })}
        />
        <div className="demo-flow-actions">
          <Link className="btn outline" href="/match">
            매칭 안내로
          </Link>
        </div>
      </div>
    );
  }

  const copy = COPY[area];
  return (
    <div className="demo-adult-block">
      <h1>{copy.title}</h1>
      <p id={`demo-adult-reason-${area}`}>{copy.reason}</p>
      <aside className="warn">
        <strong>실제 본인 확인이 아닌 시연용</strong>
        <p>아래 확인은 예시를 보여주는 단계예요. 생년월일이나 신분증은 받지 않아요.</p>
      </aside>
      <DemoAdultStep
        headingLevel="h2"
        onCompleted={() => setGate({ status: 'open', mode: 'demo' })}
      />
      <div className="demo-flow-actions">
        <Link className="btn outline" href="/match">
          매칭 안내로
        </Link>
      </div>
    </div>
  );
}
