'use client';

// src/lib/auth/use-auth.ts
// MATCH-003: 로그인·세션 상태 React 훅 (ADR-005 Supabase Auth 실시간 연동)

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../supabase/client';
import { authService } from './auth-service';
import type { MyAccount, UserSession } from './types';

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  /** 호환용 세션 객체 */
  session: UserSession | null;
  /** 내 계정 DTO */
  account: MyAccount | null;
  /** 추가 가입 정보 입력이 필요한 상태 (PENDING) */
  needsSignupCompletion: boolean;
  refresh: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [account, setAccount] = useState<MyAccount | null>(null);

  const loadAccount = useCallback(async (): Promise<MyAccount | null> => {
    const supabase = getSupabase();
    if (!supabase) {
      setAccount(null);
      setSession(null);
      setStatus('signed-out');
      return null;
    }

    const check = await authService.assertAccountAccess();
    if (!check.ok) {
      setAccount(null);
      setUser(null);
      setStatus('signed-out');
      return null;
    }

    const { data: authData } = await supabase.auth.getUser();
    setUser(authData.user ?? null);
    setAccount(check.data);
    setStatus('signed-in');
    return check.data;
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus('signed-out');
      return;
    }

    let active = true;

    const apply = async (nextUser: User | null) => {
      if (!active) return;
      if (!nextUser) {
        setUser(null);
        setAccount(null);
        setStatus('signed-out');
        return;
      }

      const acc = await loadAccount();
      if (!active) return;

      if (!acc) {
        setUser(null);
        setAccount(null);
        setStatus('signed-out');
      } else {
        setUser(nextUser);
        setStatus('signed-in');
      }
    };

    void supabase.auth.getSession().then(({ data }) => void apply(data.session?.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, supaSession) => {
      if (event === 'INITIAL_SESSION') return;
      if (event === 'TOKEN_REFRESHED') return;
      void apply(supaSession?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAccount]);

  return {
    status,
    user,
    session,
    account,
    needsSignupCompletion: status === 'signed-in' && account?.accountStatus === 'PENDING',
    refresh: async () => {
      await loadAccount();
    },
  };
}
