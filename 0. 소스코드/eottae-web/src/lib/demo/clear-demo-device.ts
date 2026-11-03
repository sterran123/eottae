// 이 브라우저의 앱 데모 localStorage만 지운다.
// 서버·Supabase·계정 삭제 API는 호출하지 않는다.
// 테마 키(eottae-theme)는 호출하는 쪽이 선택할 때만 지운다.

import { CHAT_DEMO_EVENT, CHAT_DEMO_STORAGE_KEY, releaseChatDemoAppendSuppress, resetChatDemo } from '@/lib/chat/demo-store';
import { DEMO_ADULT_EVENT } from '@/lib/demo/demo-adult';
import { DEMO_THEME_EVENT } from '@/lib/demo/demo-themes';
import { DEMO_MATCH_EVENT } from '@/lib/match/demo-mutual';
import { resetSafetyDemo, SAFETY_DEMO_EVENT, SAFETY_DEMO_STORAGE_KEY } from '@/lib/safety/demo-store';

export const DELETE_CONFIRM_PHRASE = '탈퇴';

/** 이 앱이 데모 상태로 쓰는 localStorage 키. 테마 설정과 데모 로그인 세션은 여기 넣지 않는다. */
export const DEMO_DEVICE_STORAGE_KEYS = [
  'eottae.activities.demo.v1',
  'eottae_demo_adult_v1',
  'eottae_demo_theme_purchases_v1',
  'eottae_demo_match_likes_v1',
  'eottae_demo_matches_v1',
  'eottae_match_onboarding_draft_v1',
  'eottae_match_qna_answers_v1',
  'eottae_match_common_declined_v1',
  CHAT_DEMO_STORAGE_KEY,
  SAFETY_DEMO_STORAGE_KEY,
] as const;

/** 목록의 데모 키가 모두 비었으면 true. 하나라도 남거나 저장소가 막히면 false. 테마 키와 데모 로그인 세션은 지우지 않는다. */
export function clearDemoDeviceData(): boolean {
  if (typeof window === 'undefined') return false;

  // 같은 탭의 removeItem은 storage 이벤트가 없다. 키를 지우기 전에 메모리를 비워야
  // 이어지는 commit이 대화·신고를 다시 쓰지 않는다.
  resetChatDemo();
  resetSafetyDemo();

  let removed = true;
  for (const key of DEMO_DEVICE_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      removed = false;
    }
  }
  if (!removed) {
    releaseChatDemoAppendSuppress();
    return false;
  }

  for (const key of DEMO_DEVICE_STORAGE_KEYS) {
    try {
      if (window.localStorage.getItem(key) !== null) {
        releaseChatDemoAppendSuppress();
        return false;
      }
    } catch {
      releaseChatDemoAppendSuppress();
      return false;
    }
  }

  // 목록의 키가 모두 비워진 뒤에만 같은 탭에 알린다.
  // 다른 탭은 removeItem의 storage(newValue === null 또는 key === null)로 메모리를 비우고 다시 그린다.
  window.dispatchEvent(new Event(DEMO_ADULT_EVENT));
  window.dispatchEvent(new Event(DEMO_THEME_EVENT));
  window.dispatchEvent(new Event(DEMO_MATCH_EVENT));
  window.dispatchEvent(new Event(CHAT_DEMO_EVENT));
  window.dispatchEvent(new Event(SAFETY_DEMO_EVENT));
  return true;
}
