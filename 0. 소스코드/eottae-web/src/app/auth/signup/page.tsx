import type { Metadata } from 'next';
import AuthCard from '@/components/auth/AuthCard';
import SignupForm from '@/components/auth/SignupForm';
import '../auth.css';

export const metadata: Metadata = {
  title: '회원가입',
  description: '「어때?」 이메일 인증(SMTP) 및 Google 회원가입',
};

export default function SignupPage() {
  return (
    <AuthCard
      eyebrow="SIGN UP"
      title="회원가입"
      description="이메일 인증을 완료하면 가입이 마무리돼요. 만 19세 이상만 가입할 수 있어요."
    >
      <SignupForm />
    </AuthCard>
  );
}

