'use client';

type Props = {
  likes: number;
  recommends: number;
  liked: boolean;
  recommended: boolean;
  disabled?: boolean;
  onLike: () => void;
  onRecommend: () => void;
};

export default function ActivityReactions({
  likes,
  recommends,
  liked,
  recommended,
  disabled,
  onLike,
  onRecommend,
}: Props) {
  return (
    <div className="act-react" role="group" aria-label="좋아요와 추천">
      <button type="button" className="act-react-btn" aria-pressed={liked} disabled={disabled} onClick={onLike}>
        <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
        좋아요
        <span className="act-react-count">{likes}</span>
      </button>
      <button
        type="button"
        className="act-react-btn"
        aria-pressed={recommended}
        disabled={disabled}
        onClick={onRecommend}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M6.2 7.2V15H3.4c-.5 0-.9-.4-.9-.9V8.1c0-.5.4-.9.9-.9h2.8zm1.2-.4 2.1-3.3c.2-.3.6-.4.9-.2.2.1.3.3.3.5l-.4 2.8h3.4c.7 0 1.2.7 1 1.4l-1.1 4.6c-.2.7-.8 1.2-1.5 1.2H7.4V6.8z"
          />
        </svg>
        추천
        <span className="act-react-count">{recommends}</span>
      </button>
    </div>
  );
}
