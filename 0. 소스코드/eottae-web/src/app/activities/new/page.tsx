import type { Metadata } from 'next';
import ActivitiesNewForm from '@/components/activities/ActivitiesNewForm';
import '../activities.css';

export const metadata: Metadata = {
  title: '소모임 만들기',
  description: '데모 소모임을 이 브라우저 목록에만 추가하는 화면입니다. 서버로 보내지 않습니다.',
};

export default function ActivitiesNewPage() {
  return <ActivitiesNewForm />;
}
