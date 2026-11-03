type Props = {
  onClick: () => void;
};

export default function ModalCloseButton({ onClick }: Props) {
  return (
    <button type="button" className="act-modal-close" onClick={onClick} aria-label="닫기" title="닫기">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
