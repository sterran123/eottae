'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DEMO_THEMES } from '@/lib/demo/demo-themes';
import { DEMO_INVITATIONS } from '@/lib/invitations/demo-data';
import { INVITATION_THEME_IDS, type InvitationThemeId } from '@/lib/invitations/types';
import InvitePreview from './InvitePreview';
import { INVITE_PRESET_OPTIONS, type InvitePresetId } from './presets';
import './invite-preview.css';

const THEME_TONE: Record<InvitationThemeId, string> = {
  'spring-card': '블러시',
  'moon-garden': '세이지',
  hanji: '크림',
  'star-table': '잉크',
};

export default function InviteSampleStudio() {
  const base = DEMO_INVITATIONS.find((item) => item.id === 'demo-inv-1') ?? DEMO_INVITATIONS[0];
  const [preset, setPreset] = useState<InvitePresetId>('full');
  const [themeId, setThemeId] = useState<InvitationThemeId>(base.themeId);
  const invitation = useMemo(() => ({ ...base, themeId }), [base, themeId]);

  return (
    <div className="shell subpage invite-sample">
      <p className="invite-demo-flag">데모 · 예시 데이터</p>
      <h1>청첩장 샘플 미리보기</h1>
      <p className="invite-sample-lead">
        {base.title}. 틀 안 색은 고른 청첩장 테마로 고정돼요. 앱 테마를 바꿔도 속지는 그대로예요. 서버로는
        보내지 않아요.
      </p>
      <fieldset className="invite-sample-set">
        <legend>구성 프리셋</legend>
        <div className="invite-choices">
          {INVITE_PRESET_OPTIONS.map((option) => (
            <label className="invite-choice" key={option.id}>
              <input
                type="radio"
                name="invite-sample-preset"
                value={option.id}
                checked={preset === option.id}
                onChange={() => setPreset(option.id)}
              />
              <span>
                <span className="invite-choice-label">{option.label}</span>
                <span className="invite-choice-hint">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="invite-sample-set">
        <legend>청첩장 테마</legend>
        <div className="invite-choices">
          {DEMO_THEMES.map(({ id, name }) => {
            return (
              <label className="invite-choice" key={id}>
                <input
                  type="radio"
                  name="invite-sample-theme"
                  value={id}
                  checked={themeId === id}
                  onChange={() => setThemeId(id as InvitationThemeId)}
                />
                <span className="invite-tone" data-invite-theme={id} aria-hidden="true" />
                <span>
                  <span className="invite-choice-label">
                    {name} · {THEME_TONE[id as InvitationThemeId] ?? '내추럴'}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <InvitePreview invitation={invitation} preset={preset} />
      <p>
        <Link
          className="invite-back"
          href="/invitations/rsvp/?t=k7Qm2pL9xRt4vNw8aB3cYd6e&g=gt-x8k2m9p1"
        >
          하객 전용 RSVP 회신 데모로
        </Link>
      </p>
      <p>
        <Link className="invite-back" href="/invitations/">
          청첩장 입구로
        </Link>
      </p>
    </div>
  );
}
