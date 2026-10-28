// ============================================================
//  저장 경로: src/components/chat/ChatList.tsx
//  담당: 손준혁 · MATCH-007
//  역할: 카카오톡식 대화방 목록. 상대 이니셜 프로필·이름·마지막 메시지·시각·안 읽은 수.
//  [보안] 본문은 텍스트 노드로만 렌더링. 프로필은 실제 사진 없이 이니셜만 사용(RULES 7).
// ============================================================

import type { ChatRoomInfo } from '@/lib/chat/types';

export interface ChatRoomPreview {
  lastMessage: string;
  timeLabel: string;
  unread: number;
}

interface ChatListProps {
  rooms: ChatRoomInfo[];
  previews: Record<string, ChatRoomPreview>;
  activeId: string | null;
  onOpen: (roomId: string) => void;
}

export default function ChatList({ rooms, previews, activeId, onOpen }: ChatListProps) {
  return (
    <ul className="mt-chatlist" aria-label="대화방 목록">
      {rooms.map((room) => {
        const p = previews[room.id];
        return (
          <li key={room.id}>
            <button
              type="button"
              id={`mt-chatlist-item-${room.id}`}
              className="mt-chatlist-item"
              aria-current={activeId === room.id ? 'true' : undefined}
              onClick={() => onOpen(room.id)}
            >
              <span className="mt-chat-avatar mt-chatlist-avatar" aria-hidden="true">
                {room.partner.nickname.slice(0, 1)}
              </span>
              <span className="mt-chatlist-body">
                <span className="mt-chatlist-top">
                  <span className="mt-chatlist-name">{room.partner.nickname}</span>
                  <span className="mt-chatlist-time">{p.timeLabel}</span>
                </span>
                <span className="mt-chatlist-bottom">
                  <span className="mt-chatlist-last">{p.lastMessage}</span>
                  {p.unread > 0 && (
                    <>
                      <span className="mt-chatlist-badge" aria-hidden="true">
                        {p.unread > 99 ? '99+' : p.unread}
                      </span>
                      <span className="mt-chat-sr">{`안 읽은 메시지 ${p.unread}개`}</span>
                    </>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
