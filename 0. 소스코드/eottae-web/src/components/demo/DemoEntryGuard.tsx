'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  DEMO_ADULT_BYPASS,
  DEMO_ADULT_UNAVAILABLE_MESSAGE,
  isDemoAdultActive,
  subscribeDemoAdult,
} from '@/lib/demo/demo-adult';
import { isDemoLoggedIn, subscribeDemoSession } from '@/lib/demo/demo-session';
import { matchService, type MatchAccessContext, type MatchOperatingMode } from '@/lib/match/match-service';
import DemoAdultStep from './DemoAdultStep';
import DemoLoginNotice from './DemoLoginNotice';
import './demo-flow.css';

type Area = 'onboarding' | 'recommend' | 'chat' | 'qna' | 'common';

type GateState =
  | { status: 'pending' }
  | { status: 'error' }
  | { status: 'login' }
  | { status: 'open'; mode: 'live' | 'demo' }
  | { status: 'locked'; mode: MatchOperatingMode; message?: string };

const AREA_PATH: Record<Area, string> = {
  onboarding: '/match/onboarding',
  recommend: '/match/recommend',
  chat: '/match/chat',
  qna: '/match/qna',
  common: '/match/common',
};

const AREA_NAME: Record<Area, string> = {
  onboarding: '취향 온보딩',
  recommend: '추천',
  chat: '채팅',
  qna: '프로필 문답',
  common: '공통 질문',
};

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
  qna: {
    title: '문답을 열 수 없어요',
    reason:
      '성인 확인(시연)이 끝나기 전에는 프로필 문답을 열지 않아요. 문답은 생일 기준 만 19세 이상만 이용할 수 있어요.',
  },
  common: {
    title: '공통 질문을 열 수 없어요',
    reason:
      '성인 확인(시연)이 끝나기 전에는 공통 질문을 열지 않아요. 공통 질문은 생일 기준 만 19세 이상만 이용할 수 있어요.',
  },
};

function nextGate(context: MatchAccessContext): GateState {
  if (context.mode === 'demo' && !isDemoLoggedIn()) return { status: 'login' };
  if (context.mode === 'live') return { status: 'open', mode: 'live' };
  if (context.mode === 'demo' && isDemoAdultActive()) return { status: 'open', mode: 'demo' };
  return { status: 'locked', mode: context.mode, message: context.gateMessage };
}

function LockedMessage({ message }: { message: string }) {
  return (
    <div className="demo-adult-block">
      <h1>{message}</h1>
      <div className="demo-flow-actions">
        <Link className="btn outline" href="/match">
          매칭 안내로
        </Link>
      </div>
    </div>
  );
}

export default function DemoEntryGuard({ area, children }: { area: Area; children: ReactNode }) {
  const [gate, setGate] = useState<GateState>({ status: 'pending' });

  const resolve = useCallback(async () => {
    setGate({ status: 'pending' });
    try {
      const context = await matchService.resolveAccessContext();
      setGate(nextGate(context));
    } catch {
      setGate({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  useEffect(() => subscribeDemoSession(() => { void resolve(); }), [resolve]);

  useEffect(() => {
    return subscribeDemoAdult(() => {
      setGate((current) => {
        if (current.status === 'open' && current.mode === 'live') return current;
        if (current.status === 'login') return current;
        if (current.status !== 'open' && current.status !== 'locked') return current;
        // 완료 직후에는 만료 시각 화면을 유지하고, '매칭으로 진행'에서만 연다.
        if (current.status === 'open' && current.mode === 'demo' && !isDemoAdultActive()) {
          return { status: 'locked', mode: 'demo' };
        }
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

  if (gate.status === 'login') {
    return (
      <DemoLoginNotice
        heading="로그인이 필요해요"
        body={`${AREA_NAME[area]} 화면은 데모 로그아웃 상태에서 열리지 않아요. 회원 정보와 대화 내용은 보여 주지 않아요.`}
        nextPath={AREA_PATH[area]}
      />
    );
  }

  if (gate.status === 'open') return children;

  if (gate.mode !== 'demo') {
    return <LockedMessage message={gate.message ?? '성인 확인 후 이용할 수 있어요.'} />;
  }

  if (!DEMO_ADULT_BYPASS) {
    return <LockedMessage message={DEMO_ADULT_UNAVAILABLE_MESSAGE} />;
  }

  if (area === 'onboarding') {
    return (
      <div>
        <DemoAdultStep
          headingLevel="h1"
          onCompleted={() => {
            void resolve();
          }}
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
        <p>아래 확인은 생일 기준 만 19세 판정이에요. 생년월일 원본은 저장하지 않고, 신분증은 받지 않아요.</p>
      </aside>
      <DemoAdultStep
        headingLevel="h2"
        onCompleted={() => {
          void resolve();
        }}
      />
      <div className="demo-flow-actions">
        <Link className="btn outline" href="/match">
          매칭 안내로
        </Link>
      </div>
    </div>
  );
}
