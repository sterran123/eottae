'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { clearSavedTheme } from '@/components/shared/theme-toggle';
import { clearDemoDeviceData, DELETE_CONFIRM_PHRASE } from '@/lib/demo/clear-demo-device';

type Phase = 'idle' | 'confirm' | 'done';

export default function DeleteAccountDemo() {
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const titleId = `${baseId}-title`;
  const helpId = `${baseId}-help`;
  const noteId = `${baseId}-note`;
  const errorId = `${baseId}-error`;
  const phraseId = `${baseId}-phrase`;
  const panelRef = useRef<HTMLHeadingElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const restoreOpenFocusRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [phrase, setPhrase] = useState('');
  const [phraseTouched, setPhraseTouched] = useState(false);
  const [includeTheme, setIncludeTheme] = useState(false);
  const [clearedTheme, setClearedTheme] = useState(false);
  const [error, setError] = useState('');

  const ready = phrase.trim() === DELETE_CONFIRM_PHRASE;
  const phraseInvalid = phraseTouched && phrase.length > 0 && !ready;

  const closeConfirm = () => {
    restoreOpenFocusRef.current = true;
    setPhase('idle');
    setPhrase('');
    setPhraseTouched(false);
    setError('');
  };

  useEffect(() => {
    if (phase === 'confirm') {
      panelRef.current?.focus();
      return;
    }
    if (phase === 'done') {
      doneRef.current?.focus();
      return;
    }
    if (restoreOpenFocusRef.current) {
      restoreOpenFocusRef.current = false;
      openButtonRef.current?.focus();
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'confirm') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeConfirm();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phrase.trim() !== DELETE_CONFIRM_PHRASE) {
      setPhraseTouched(true);
      setError(`계속하려면 ${DELETE_CONFIRM_PHRASE} 라고 입력해 주세요.`);
      return;
    }
    const ok = clearDemoDeviceData();
    if (!ok) {
      setError('이 브라우저 저장소를 지우지 못했어요. 데모 데이터는 그대로일 수 있어요. 서버에는 요청하지 않았어요.');
      return;
    }
    setError('');
    setClearedTheme(includeTheme ? clearSavedTheme() : false);
    setPhase('done');
  };

  return (
    <div className="settings-delete">
      {phase !== 'done' ? (
        <>
          <div className="settings-actions">
            <button
              ref={openButtonRef}
              type="button"
              className="btn outline"
              aria-expanded={phase === 'confirm'}
              aria-controls={phase === 'confirm' ? panelId : undefined}
              aria-describedby={noteId}
              onClick={() => {
                if (phase === 'confirm') {
                  setPhrase('');
                  setPhraseTouched(false);
                  setError('');
                  setPhase('idle');
                  return;
                }
                setError('');
                setPhraseTouched(false);
                setPhase('confirm');
              }}
            >
              회원 탈퇴·데이터 삭제
            </button>
          </div>
          <p className="settings-note" id={noteId}>
            데모 · 실제 계정은 삭제하지 않아요. 이 브라우저에 남은 시연 데이터만 지울 수 있어요.
          </p>
        </>
      ) : null}

      {phase === 'confirm' ? (
        <form id={panelId} className="settings-delete-form" onSubmit={onSubmit}>
          <p className="settings-demo-flag">데모</p>
          <h3 id={titleId} ref={panelRef} tabIndex={-1}>
            이 기기의 데모 데이터 삭제
          </h3>
          <p>
            로그인되어 있어도 서버에 탈퇴를 요청하지 않아요. 실제 계정·운영 데이터는 그대로예요.
          </p>

          <h3>이 브라우저에서 지워지는 것</h3>
          <ul className="settings-delete-list">
            <li>매칭에 적어 둔 온보딩, 문답, 공통 질문 거절</li>
            <li>추천에 남긴 관심, 성사된 매칭</li>
            <li>성인 확인 시연 표시</li>
            <li>데이트·소모임에 남긴 참가, 투표, 만든 모임, 후기, 좋아요·추천, 정보 확인 요청</li>
            <li>청첩장 테마 데모 영수증</li>
          </ul>

          <h3>정책상 실제 삭제라면</h3>
          <p>아래는 안내예요. 이 화면은 서버의 계정을 지우지 않아요.</p>
          <ul className="settings-delete-list">
            <li>지워지는 쪽: 프로필, 취향, 매칭, 대화처럼 계정에 붙은 이용 기록</li>
            <li>
              익명화되어 남는 쪽: 신고 이력. 신고 기록은 남기고, 신고한 사람과 신고받은 사람이
              누구인지만 비워요. 신고 본문은 그대로 남아요. 본문에 이름이 있으면 사람 연결이 남을 수
              있어요. 탈퇴 뒤 다시 가입해 신고를 없애지 못하게 하려는 안전 정책과 같아요.
            </li>
            <li>보관 기간은 출시 전에 정하는 항목이라, 여기서 기간을 말하지 않아요.</li>
          </ul>

          <label className="settings-check">
            <input
              type="checkbox"
              checked={includeTheme}
              onChange={(event) => setIncludeTheme(event.target.checked)}
            />
            <span>화면 테마 설정도 지우기 (선택). 체크하지 않으면 고른 테마는 이 브라우저에 남아요.</span>
          </label>

          <label className="settings-phrase" htmlFor={phraseId}>
            확인 문구
            <input
              id={phraseId}
              value={phrase}
              onChange={(event) => {
                setPhrase(event.target.value);
                if (error) setError('');
              }}
              onBlur={() => setPhraseTouched(true)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-describedby={phraseInvalid || error ? `${helpId} ${errorId}` : helpId}
              aria-invalid={phraseInvalid || error.length > 0}
              placeholder={DELETE_CONFIRM_PHRASE}
            />
          </label>
          <p className="settings-note" id={helpId}>
            계속하려면 <b>{DELETE_CONFIRM_PHRASE}</b> 라고 입력하세요.
          </p>
          {phraseInvalid || error ? (
            <p className="settings-delete-error" id={errorId} role="alert">
              {error || '문구가 일치하지 않아요.'}
            </p>
          ) : null}

          <div className="settings-actions">
            <button type="submit" className={ready ? 'btn primary' : 'btn outline'} disabled={!ready}>
              이 기기 데모 데이터 삭제
            </button>
            <button
              type="button"
              className="btn outline"
              onClick={closeConfirm}
            >
              취소
            </button>
          </div>
        </form>
      ) : null}

      {phase === 'done' ? (
        <div ref={doneRef} className="settings-delete-done" tabIndex={-1} role="status" aria-live="polite">
          <p className="settings-demo-flag">데모</p>
          <h3>이 브라우저의 데모 데이터를 지웠어요</h3>
          <p>서버에는 요청하지 않았고, 실제 계정은 삭제하지 않았어요. 데모 로그인(시연 회원)과 실계정 로그인 세션은 그대로 두었어요.</p>
          <p>
            {includeTheme && clearedTheme
              ? '화면 테마 설정도 지우고 기본 라이트로 되돌렸어요.'
              : includeTheme
                ? '데모 데이터는 지웠지만, 화면 테마 설정은 지우지 못해 그대로 두었어요.'
                : '화면 테마는 그대로 두었어요.'}
          </p>
          <div className="settings-actions">
            <Link className="btn primary" href="/">
              홈으로
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
