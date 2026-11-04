import type { Metadata } from 'next';
import AuthCard from '@/components/auth/AuthCard';
import SignupForm from '@/components/auth/SignupForm';
import { OAUTH_PROVIDERS_ENABLED } from '@/lib/auth/config';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import '../auth.css';

const signupDescription = [
  isSupabaseConfigured
    ? '이메일 인증을 완료하면 가입이 마무리돼요.'
    : '이메일 가입은 인증 설정 전에는 쓸 수 없어요.',
  OAUTH_PROVIDERS_ENABLED.google && isSupabaseConfigured
    ? 'Google 계정으로도 가입할 수 있어요.'
    : OAUTH_PROVIDERS_ENABLED.google
      ? 'Google 가입은 인증 설정 전에는 쓸 수 없어요.'
      : 'Google 가입은 준비 중이에요.',
  '만 19세 이상만 가입할 수 있어요.',
].join(' ');

export const metadata: Metadata = {
  title: '회원가입',
  description: signupDescription,
};

export default function SignupPage() {
  return (
    <AuthCard
      eyebrow="SIGN UP"
      title="회원가입"
      description={signupDescription}
    >
      <SignupForm />
    </AuthCard>
  );
}

