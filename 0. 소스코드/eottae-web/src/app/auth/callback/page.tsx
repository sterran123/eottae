import type { Metadata } from 'next';
import AuthCard from '@/components/auth/AuthCard';
import AuthCallback from '@/components/auth/AuthCallback';
import '../auth.css';

export const metadata: Metadata = {
  title: '이메일 인증 확인',
  description: '이메일 인증 및 로그인 처리',
};

export default function AuthCallbackPage() {
  return (
    <AuthCard eyebrow="VERIFY" title="인증 확인">
      <AuthCallback />
    </AuthCard>
  );
}

