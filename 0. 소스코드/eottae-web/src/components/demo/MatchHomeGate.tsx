'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { isDemoLoggedIn, subscribeDemoSession } from '@/lib/demo/demo-session';
import { matchService } from '@/lib/match/match-service';
import DemoLoginNotice from './DemoLoginNotice';
import './demo-flow.css';

export default function MatchHomeGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'pending' | 'login' | 'open' | 'error'>('pending');

  const resolve = useCallback(async () => {
    setState('pending');
    try {
      const context = await matchService.resolveAccessContext();
      setState(context.mode === 'demo' && !isDemoLoggedIn() ? 'login' : 'open');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  useEffect(() => subscribeDemoSession(() => { void resolve(); }), [resolve]);

  if (state === 'pending') {
    return (
      <p className="shell subpage demo-entry-pending" role="status">
        매칭 이용 조건을 확인하고 있어요.
      </p>
    );
  }

  if (state === 'error') {
    return (
      <section className="shell subpage">
        <div className="demo-adult-block">
          <h1>이용 조건을 확인하지 못했어요</h1>
          <p>잠시 후 다시 시도해 주세요.</p>
          <div className="demo-flow-actions">
            <button type="button" className="btn primary" onClick={() => void resolve()}>
              다시 확인
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (state === 'login') {
    return (
      <section className="shell subpage">
        <DemoLoginNotice
          heading="로그인이 필요해요"
          body="데모 로그아웃 상태에서는 매칭 화면을 열지 않아요. 추천·채팅·내 프로필도 로그인 안내만 보여요."
          nextPath="/match"
        />
      </section>
    );
  }

  return children;
}
