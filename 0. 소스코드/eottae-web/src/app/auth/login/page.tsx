import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import LoginForm from '@/components/auth/LoginForm';
import '../auth.css';

export const metadata: Metadata = {
  title: '로그인',
  description: '「어때?」 이메일 및 Google 로그인',
};

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="SIGN IN"
      title="로그인"
      description="가입한 이메일 또는 Google 계정으로 로그인해 주세요."
    >
      <Suspense fallback={<p className="auth-desc">불러오는 중…</p>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

