'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SubpageHero from '@/components/shared/subpage-hero';
import { MotifIcon } from '@/components/shared/motif-icon';
import InvitationEditor from '@/components/invitations/InvitationEditor';
import '../invitations.css';

function InvitationEditorContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  return (
    <>
      <SubpageHero
        eyebrow="MODULE 03 · EDITOR"
        status={{ label: editId ? '청첩장 수정' : '새 청첩장 만들기' }}
        title={editId ? '모바일 청첩장 정보 수정' : '나만의 특별한 모바일 청첩장'}
        motif={<MotifIcon name="mail" size={56} />}
      >
        소중한 분들께 전할 예식 정보와 감사의 인사를 담아보세요.
        테마, 레이아웃, BGM, 섹션 순서까지 취향에 맞게 직접 구성할 수 있습니다.
      </SubpageHero>

      <section className="shell subpage">
        <InvitationEditor initialId={editId} />
      </section>
    </>
  );
}

export default function NewInvitationPage() {
  return (
    <Suspense fallback={<div className="shell subpage">청첩장 에디터를 불러오는 중...</div>}>
      <InvitationEditorContent />
    </Suspense>
  );
}

