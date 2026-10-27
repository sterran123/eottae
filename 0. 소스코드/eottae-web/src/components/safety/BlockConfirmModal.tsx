'use client';

// ============================================================
//  저장 경로: src/components/safety/BlockConfirmModal.tsx
//  담당: 손준혁 · MATCH-008
//  역할: 차단 최종 확인 모달. 확정 시 onConfirm — 차단 효력(입력 정지·응답 정지)은
//        부모(ChatRoom)가 적용한다.
// ============================================================

import SafetyDialog from './SafetyDialog';

interface BlockConfirmModalProps {
  open: boolean;
  partnerName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function BlockConfirmModal({
  open,
  partnerName,
  onConfirm,
  onClose,
}: BlockConfirmModalProps) {
  return (
    <SafetyDialog open={open} onClose={onClose} titleId="mt-block-title">
      <form
        method="dialog"
        className="mt-safety-form"
        onSubmit={(e) => {
          // 확인 버튼(value=confirm)으로 제출된 경우에만 차단
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          if (submitter?.value === 'confirm') onConfirm();
        }}
      >
        <h2 id="mt-block-title" className="mt-safety-title">
          {partnerName}님을 차단할까요?
        </h2>
        <p className="mt-safety-text">
          차단하면 더 이상 메시지를 주고받을 수 없고, 서로의 추천 목록에서도 제외돼요. 나중에
          채팅방에서 차단을 해제할 수 있어요.
        </p>
        <p className="mt-safety-demo">DEMO · 실제 차단 처리는 서버 연동 후 적용돼요.</p>
        <div className="mt-safety-actions">
          <button type="submit" value="cancel" className="mt-safety-btn">
            취소
          </button>
          <button type="submit" value="confirm" className="mt-safety-btn is-danger">
            차단하기
          </button>
        </div>
      </form>
    </SafetyDialog>
  );
}
