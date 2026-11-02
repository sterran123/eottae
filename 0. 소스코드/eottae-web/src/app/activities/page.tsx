import type { Metadata } from 'next';
import { Suspense } from 'react';
import ActivitiesDemo from '@/components/activities/ActivitiesDemo';
import './activities.css';

export const metadata: Metadata = {
  title: '데이트·소모임',
  description: '데이트 코스와 소모임 예시 화면. 참가, 모임장 관리, 후기는 데모 데이터와 이 브라우저 저장만 사용합니다.',
};

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<p className="shell subpage act-fallback">데모 화면을 준비하고 있어요.</p>}>
      <ActivitiesDemo />
    </Suspense>
  );
}
