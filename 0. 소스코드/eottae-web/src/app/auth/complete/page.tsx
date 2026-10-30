import type { Metadata } from 'next';
import AuthCard from '@/components/auth/AuthCard';
import CompleteSignupForm from '@/components/auth/CompleteSignupForm';
import '../auth.css';

export const metadata: Metadata = {
  title: '추가 정보 입력',
  description: 'Google 첫 로그인 후 필수 약관 동의 및 기본 정보 입력',
};

export default function CompleteSignupPage() {
  return (
    <AuthCard
      eyebrow="COMPLETE SIGN UP"
      title="가입 마무리"
      description="서비스를 시작하기 전에 약관 동의와 기본 정보를 입력해 주세요."
    >
      <CompleteSignupForm />
    </AuthCard>
  );
}

