import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import LoginForm from '@/components/auth/LoginForm';
import { OAUTH_PROVIDERS_ENABLED } from '@/lib/auth/config';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import '../auth.css';

const loginDescription = [
  isSupabaseConfigured
    ? '이메일로 로그인해 주세요. 계정이 없으면 이메일 인증으로 가입할 수 있어요.'
    : '이메일 가입·로그인은 인증 설정 전에는 쓸 수 없어요.',
  OAUTH_PROVIDERS_ENABLED.google && isSupabaseConfigured
    ? 'Google 계정으로도 로그인할 수 있어요.'
    : OAUTH_PROVIDERS_ENABLED.google
      ? 'Google 로그인은 인증 설정 전에는 쓸 수 없어요.'
      : 'Google 로그인은 준비 중이에요.',
  '데모 로그인은 서버에 접속하지 않고, 이 브라우저에만 남아요.',
].join(' ');

export const metadata: Metadata = {
  title: '로그인',
  description: loginDescription,
};

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="SIGN IN"
      title="로그인"
      description={loginDescription}
    >
      <Suspense fallback={<p className="auth-desc">불러오는 중…</p>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

