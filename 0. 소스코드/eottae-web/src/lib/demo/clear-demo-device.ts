// 이 브라우저의 앱 데모 localStorage만 지운다.
// 서버·Supabase·계정 삭제 API는 호출하지 않는다.
// 테마 키(eottae-theme)는 호출하는 쪽이 선택할 때만 지운다.

import { DEMO_ADULT_EVENT } from '@/lib/demo/demo-adult';
import { DEMO_THEME_EVENT } from '@/lib/demo/demo-themes';

export const DELETE_CONFIRM_PHRASE = '탈퇴';

/** 이 앱이 데모 상태로 쓰는 localStorage 키. 테마 설정은 여기 넣지 않는다. */
export const DEMO_DEVICE_STORAGE_KEYS = [
  'eottae.activities.demo.v1',
  'eottae_demo_adult_v1',
  'eottae_demo_theme_purchases_v1',
  'eottae_match_onboarding_draft_v1',
  'eottae_match_qna_answers_v1',
  'eottae_match_common_declined_v1',
] as const;

/** 데모 키 여섯 개가 모두 비었으면 true. 하나라도 남거나 저장소가 막히면 false. 테마 키는 지우지 않는다. */
export function clearDemoDeviceData(): boolean {
  if (typeof window === 'undefined') return false;

  let removed = true;
  for (const key of DEMO_DEVICE_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      removed = false;
    }
  }
  if (!removed) return false;

  for (const key of DEMO_DEVICE_STORAGE_KEYS) {
    try {
      if (window.localStorage.getItem(key) !== null) return false;
    } catch {
      return false;
    }
  }

  // 여섯 키가 모두 비워진 뒤에만, 같은 탭의 성인 시연·청첩장 영수증이 저장소를 다시 읽게 한다.
  window.dispatchEvent(new Event(DEMO_ADULT_EVENT));
  window.dispatchEvent(new Event(DEMO_THEME_EVENT));
  return true;
}
