// 같은 브라우저 데모 동기화.
// BroadcastChannel이 있으면 그 채널로 알리고, 없으면 localStorage `storage` 이벤트로 알린다.
// 상태는 호출하는 쪽이 localStorage에 남긴다. 서버로 보내지 않는다.

type StatePacket = { type: 'state'; state: unknown };

const channels = new Map<string, BroadcastChannel>();

function getChannel(name: string): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  const existing = channels.get(name);
  if (existing) return existing;
  const channel = new BroadcastChannel(name);
  channels.set(name, channel);
  return channel;
}

function isStatePacket(value: unknown): value is StatePacket {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as { type?: unknown }).type === 'state' &&
      'state' in (value as object),
  );
}

export function publishDemo(key: string, eventName: string, channelName: string, state: unknown): void {
  if (typeof window === 'undefined') return;
  let saved = false;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
    saved = true;
  } catch {
    saved = false;
  }
  window.dispatchEvent(new Event(eventName));
  try {
    // 저장이 되면 다른 탭은 storage 이벤트만으로도 충분하다.
    // 저장이 안 되면 채널이 있을 때 상태 자체를 넘긴다.
    getChannel(channelName)?.postMessage(saved ? { type: 'ping' } : { type: 'state', state });
  } catch {
    // BroadcastChannel이 없으면 storage 이벤트가 다른 탭에 알린다.
  }
}

export function subscribeDemo(
  key: string,
  eventName: string,
  channelName: string,
  onRemoteState: (state: unknown) => void,
  listener: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (event: StorageEvent) => {
    // 다른 탭의 removeItem은 newValue가 null이다. clear()는 key가 null이다.
    // 같은 탭의 removeItem은 이 이벤트를 만들지 않는다. sessionStorage는 대상이 아니다.
    if (event.storageArea && event.storageArea !== window.localStorage) return;
    if (event.key !== null && event.key !== key) return;
    if (event.key === null || event.newValue === null) onRemoteState(null);
    listener();
  };
  const onMessage = (event: MessageEvent) => {
    if (isStatePacket(event.data)) onRemoteState(event.data.state);
    listener();
  };
  window.addEventListener(eventName, listener);
  window.addEventListener('storage', onStorage);
  const channel = getChannel(channelName);
  channel?.addEventListener('message', onMessage);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener('storage', onStorage);
    channel?.removeEventListener('message', onMessage);
  };
}
