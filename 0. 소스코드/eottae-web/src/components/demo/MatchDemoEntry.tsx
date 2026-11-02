'use client';

import { useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isDemoAdultActive } from '@/lib/demo/demo-adult';
import { matchService } from '@/lib/match/match-service';
import DemoAdultStep from './DemoAdultStep';
import DemoSheet from './DemoSheet';
import './demo-flow.css';

export type DemoEntryIntent = 'onboarding' | 'recommend' | 'chat';

type Prompt = {
  href: string;
  intent: DemoEntryIntent;
  phase: 'block' | 'step' | 'error';
};

const BLOCK: Record<'recommend' | 'chat', { title: string; reason: string }> = {
  recommend: {
    title: '추천을 열 수 없어요',
    reason:
      '성인 확인(시연)이 끝나기 전에는 추천을 열지 않아요. 로맨스 매칭 추천은 생일 기준 만 19세 이상만 볼 수 있어요.',
  },
  chat: {
    title: '채팅을 열 수 없어요',
    reason:
      '성인 확인(시연)이 끝나기 전에는 채팅을 열지 않아요. 1:1 채팅은 생일 기준 만 19세 이상만 이용할 수 있어요.',
  },
};

export function DemoGatedLink({
  href,
  intent,
  className,
  style,
  children,
}: {
  href: string;
  intent: DemoEntryIntent;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const context = await matchService.resolveAccessContext();
      if (context.mode !== 'demo' || isDemoAdultActive()) {
        router.push(href);
        return;
      }
      window.dispatchEvent(
        new CustomEvent<Prompt>('eottae-demo-adult-prompt', {
          detail: {
            href,
            intent,
            phase: intent === 'onboarding' ? 'step' : 'block',
          },
        }),
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent<Prompt>('eottae-demo-adult-prompt', {
          detail: { href, intent, phase: 'error' },
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Link
      className={className}
      href={href}
      style={style}
      aria-haspopup="dialog"
      aria-busy={busy}
      onClick={(event) => void onClick(event)}
    >
      {children}
    </Link>
  );
}

export function DemoAdultPrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      const detail = (event as CustomEvent<Prompt>).detail;
      if (!detail?.href || !detail.intent) return;
      setPrompt(detail);
    };
    window.addEventListener('eottae-demo-adult-prompt', onPrompt);
    return () => window.removeEventListener('eottae-demo-adult-prompt', onPrompt);
  }, []);

  useEffect(() => {
    if (!prompt) return;
    const title = document.getElementById('demo-adult-prompt-title');
    const dialog = title?.closest('dialog');
    dialog?.querySelector<HTMLButtonElement>('.btn.primary')?.focus();
  }, [prompt]);

  const block = prompt && prompt.intent !== 'onboarding' ? BLOCK[prompt.intent] : null;
  const titleId = 'demo-adult-prompt-title';

  return (
    <DemoSheet open={prompt !== null} labelledBy={titleId} onClose={() => setPrompt(null)}>
      {prompt && prompt.phase === 'block' && block && (
        <div className="demo-adult-block">
          <h2 id={titleId}>{block.title}</h2>
          <p>{block.reason}</p>
          <aside className="warn">
            <strong>실제 본인 확인이 아닌 시연용</strong>
            <p>확인 전에는 이 화면으로 들어가지 않아요.</p>
          </aside>
          <div className="demo-flow-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => setPrompt({ ...prompt, phase: 'step' })}
            >
              성인 확인(시연)
            </button>
          </div>
        </div>
      )}
      {prompt && prompt.phase === 'error' && (
        <div className="demo-adult-block">
          <h2 id={titleId}>이용 조건을 확인하지 못했어요</h2>
          <p>잠시 후 다시 시도해 주세요.</p>
        </div>
      )}
      {prompt && prompt.phase === 'step' && (
        <div>
          <span id={titleId} className="demo-sr">
            성인 확인(시연)
          </span>
          <DemoAdultStep
            onCancel={() => setPrompt(null)}
            onCompleted={() => {
              const href = prompt.href;
              setPrompt(null);
              router.push(href);
            }}
          />
        </div>
      )}
    </DemoSheet>
  );
}
