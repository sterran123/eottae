'use client';

// ============================================================
//  저장 경로: src/components/safety/BlockConfirmModal.tsx
//  담당: 손준혁 · MATCH-008
//  역할: 차단/차단 해제 최종 확인 모달. 확정 시 onConfirm — 효력(입력 정지·응답 정지 등)은
//        부모(ChatRoom)가 적용한다.
//  [정직성] 데모에서 실제로 일어나지 않는 효과(추천 목록 제외 등)는 '서버 연동 후'로 명시 (RULES 6).
// ============================================================

import { useId } from 'react';
import SafetyDialog from './SafetyDialog';

interface BlockConfirmModalProps {
  open: boolean;
  mode: 'block' | 'unblock';
  partnerName: string;
  /** 실계정(Supabase) 대화방 여부 — 차단이 서버(`public.blocks`)에 저장된다. 생략 시 데모 문구. */
  liveMode?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function BlockConfirmModal({
  open,
  mode,
  partnerName,
  liveMode = false,
  onConfirm,
  onClose,
}: BlockConfirmModalProps) {
  const isBlock = mode === 'block';
  const titleId = useId();

  return (
    <SafetyDialog open={open} onClose={onClose} titleId={titleId}>
      <form
        method="dialog"
        className="mt-safety-form"
        onSubmit={(e) => {
          // 확인 버튼(value=confirm)으로 제출된 경우에만 적용
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          if (submitter?.value === 'confirm') onConfirm();
        }}
      >
        <h2 id={titleId} className="mt-safety-title">
          {partnerName}님{isBlock ? '을 차단할까요?' : ' 차단을 해제할까요?'}
        </h2>
        <p className="mt-safety-text">
          {isBlock
            ? '차단하면 이 채팅방에서 더 이상 메시지를 주고받을 수 없어요. 나중에 채팅방에서 차단을 해제할 수 있어요.'
            : '차단을 해제하면 이 채팅방에서 다시 메시지를 주고받을 수 있어요.'}
        </p>
        {isBlock && !liveMode && (
          <p className="mt-safety-text">
            서버 연동 후에는 서로의 추천 목록에서도 제외될 예정이에요.
          </p>
        )}
        <p className="mt-safety-demo">
          {liveMode
            ? isBlock
              ? '차단 내용은 서버에 저장돼요. 저장되지 않으면 차단되지 않은 채로 남아요.'
              : '차단 해제는 서버에서도 반영돼요. 반영되지 않으면 차단이 유지돼요.'
            : '데모 · 이 기기의 채팅에서 바로 막혀요. 서버 차단은 아직 없어요.'}
        </p>
        <div className="mt-safety-actions">
          <button type="submit" value="cancel" className="mt-safety-btn">
            취소
          </button>
          <button
            type="submit"
            value="confirm"
            className={`mt-safety-btn ${isBlock ? 'is-danger' : 'is-primary'}`}
          >
            {isBlock ? '차단하기' : '차단 해제하기'}
          </button>
        </div>
      </form>
    </SafetyDialog>
  );
}
