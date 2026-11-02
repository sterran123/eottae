'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MIN_SIGNUP_AGE } from '@/lib/auth/config';
import { isDemoAdultActive, subscribeDemoAdult } from '@/lib/demo/demo-adult';
import {
  DEMO_SELF_NICKNAME,
  isDemoLoggedIn,
  subscribeDemoSession,
} from '@/lib/demo/demo-session';
import { DEMO_IDENTITY } from '@/lib/match/demo-data';
import { matchService, type MatchAccessContext } from '@/lib/match/match-service';
import DemoLoginNotice from './DemoLoginNotice';
import './demo-flow.css';

type Screen =
  | { status: 'pending' }
  | { status: 'error' }
  | { status: 'login' }
  | { status: 'ready'; context: MatchAccessContext };

export default function DemoProfileScreen() {
  const [screen, setScreen] = useState<Screen>({ status: 'pending' });
  const [adultOn, setAdultOn] = useState(false);

  const resolve = useCallback(async () => {
    setScreen({ status: 'pending' });
    try {
      const context = await matchService.resolveAccessContext();
      if (context.mode === 'demo' && !isDemoLoggedIn()) {
        setScreen({ status: 'login' });
        return;
      }
      setAdultOn(isDemoAdultActive());
      setScreen({ status: 'ready', context });
    } catch {
      setScreen({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  useEffect(() => subscribeDemoSession(() => { void resolve(); }), [resolve]);

  useEffect(
    () =>
      subscribeDemoAdult(() => {
        setAdultOn(isDemoAdultActive());
      }),
    [],
  );

  if (screen.status === 'pending') {
    return (
      <p className="demo-entry-pending" role="status">
        프로필 이용 조건을 확인하고 있어요.
      </p>
    );
  }

  if (screen.status === 'error') {
    return (
      <div className="demo-adult-block">
        <h1>프로필을 확인하지 못했어요</h1>
        <p>잠시 후 다시 시도해 주세요.</p>
        <div className="demo-flow-actions">
          <button type="button" className="btn primary" onClick={() => void resolve()}>
            다시 확인
          </button>
        </div>
      </div>
    );
  }

  if (screen.status === 'login') {
    return (
      <DemoLoginNotice
        heading="로그인이 필요해요"
        body="데모 로그아웃 상태에서는 내 프로필을 열지 않아요. 이름이나 계정 정보는 보여 주지 않아요."
        nextPath="/profile"
      />
    );
  }

  const { context } = screen;
  if (context.mode === 'demo') {
    const age = DEMO_IDENTITY.age;
    return (
      <div className="demo-adult-block">
        <h1>내 프로필</h1>
        <p>이 브라우저에만 있는 데모 계정이에요. 생년월일·신분증은 저장하지 않아요.</p>
        <dl className="demo-adult-meta">
          <div>
            <dt>표시 이름</dt>
            <dd>{DEMO_SELF_NICKNAME} (데모)</dd>
          </div>
          <div>
            <dt>만 나이</dt>
            <dd>{age == null ? '표시하지 않음' : `만 ${age}세`}</dd>
          </div>
          <div>
            <dt>연령 기준</dt>
            <dd>매칭·채팅은 생일 기준 만 {MIN_SIGNUP_AGE}세 이상</dd>
          </div>
          <div>
            <dt>성인 확인(시연)</dt>
            <dd>{adultOn ? '완료' : '미완료'}</dd>
          </div>
        </dl>
        <div className="demo-flow-actions">
          <Link className="btn primary" href="/match">
            매칭으로
          </Link>
        </div>
      </div>
    );
  }

  const name = context.account?.nickname || context.identity.nickname || '내 계정';
  return (
    <div className="demo-adult-block">
      <h1>내 프로필</h1>
      <p>로그인 세션에서 확인한 내 계정이에요.</p>
      <dl className="demo-adult-meta">
        <div>
          <dt>표시 이름</dt>
          <dd>{name}</dd>
        </div>
        <div>
          <dt>계정 상태</dt>
          <dd>{context.account?.accountStatus ?? '확인 전'}</dd>
        </div>
        {context.identity.age != null && (
          <div>
            <dt>만 나이</dt>
            <dd>만 {context.identity.age}세</dd>
          </div>
        )}
        <div>
          <dt>연령 기준</dt>
          <dd>매칭·채팅은 생일 기준 만 {MIN_SIGNUP_AGE}세 이상</dd>
        </div>
      </dl>
      {context.gateMessage && <p>{context.gateMessage}</p>}
      <div className="demo-flow-actions">
        <Link className="btn outline" href="/match">
          매칭으로
        </Link>
      </div>
    </div>
  );
}
