'use client';

import { useState } from 'react';
import DemoDialog from '@/components/activities/DemoDialog';
import type { MyJoinStatus } from '@/lib/activities/demo-storage';
import type { VirtualPerson } from '@/lib/activities/demo-roster';

type Props = {
  hostNickname: string;
  people: readonly VirtualPerson[];
  selfStatus: MyJoinStatus | null;
  recruitmentLabel: '모집 마감' | '모집 재개';
  canTakeSeat: boolean;
  onDecision: (personId: string, status: 'accepted' | 'rejected' | 'kicked') => void;
  onToggleRecruitment: () => void;
};

export default function GatheringManage({
  hostNickname,
  people,
  selfStatus,
  recruitmentLabel,
  canTakeSeat,
  onDecision,
  onToggleRecruitment,
}: Props) {
  const [kick, setKick] = useState<VirtualPerson | null>(null);
  const pending = people.filter(
    (person) => person.bucket === 'pending' && person.status !== 'accepted' && person.status !== 'kicked'
  );
  const confirmed = people.filter(
    (person) =>
      (person.bucket === 'confirmed' && person.status !== 'kicked') ||
      (person.bucket === 'pending' && person.status === 'accepted')
  );
  const kicked = people.filter((person) => person.status === 'kicked');
  const selfCounted = selfStatus === 'requested' || selfStatus === 'accepted';

  return (
    <div className="act-stack">
      <div className="act-subhead">
        <h3 id="act-manage-title">관리</h3>
        <span className="act-demo-mark">데모 · 이 브라우저만</span>
      </div>
      <p className="act-note">
        수락하면 위 모집 뱃지의 인원이 바로 늘어나고, 강퇴하면 빠집니다. 가상 대기 요청을 거절해도 인원은 그대로이고, 이미
        인원에 들어간 내 요청을 거절하면 빠집니다. 가상 닉네임이라 연락처는 없습니다.
      </p>
      <div className="act-actions">
        <button type="button" className="btn outline" onClick={onToggleRecruitment}>
          {recruitmentLabel}
        </button>
        <span className="act-demo-mark">데모</span>
      </div>
      <p className="act-note">모집을 마감해도 이미 들어온 요청은 수락하거나 거절할 수 있어요. 정원이 차면 새 수락은 멈춥니다.</p>

      <section aria-labelledby="act-pending-title">
        <h4 id="act-pending-title">참가 요청</h4>
        {(selfStatus && selfStatus !== 'accepted') || pending.length > 0 ? (
          <ul className="act-stack">
            {selfStatus && selfStatus !== 'accepted' && (
              <li className="act-person">
                <p className="act-person-name">나 (이 브라우저)</p>
                <p>데모 참가 요청입니다. 실명과 연락처는 없어요.</p>
                <p className="act-meta">요청 시각 · 방금 · 데모 · {selfStatus === 'rejected' ? '거절됨' : '요청됨'}</p>
                <div className="act-actions">
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!selfCounted && !canTakeSeat}
                    onClick={() => onDecision('self', 'accepted')}
                  >
                    수락
                  </button>
                  {selfStatus !== 'rejected' && (
                    <button type="button" className="btn outline" onClick={() => onDecision('self', 'rejected')}>
                      거절
                    </button>
                  )}
                </div>
              </li>
            )}
            {pending.map((person) => (
              <li className="act-person" key={person.id}>
                <p className="act-person-name">{person.nickname}</p>
                <p>{person.intro}</p>
                <p className="act-meta">
                  요청 시각 · {person.requestedAtLabel} · 데모
                  {person.status === 'rejected' ? ' · 거절됨' : ' · 요청됨'}
                </p>
                <div className="act-actions">
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!canTakeSeat}
                    onClick={() => onDecision(person.id, 'accepted')}
                  >
                    수락
                  </button>
                  {person.status !== 'rejected' && (
                    <button type="button" className="btn outline" onClick={() => onDecision(person.id, 'rejected')}>
                      거절
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="act-empty" role="status">
            대기 중인 참가 요청이 없어요.
          </p>
        )}
        {!canTakeSeat && <p className="act-note">정원이 차 있어 새 수락은 멈춰 있어요. 강퇴하면 빈자리가 생깁니다.</p>}
      </section>

      <section aria-labelledby="act-confirmed-title">
        <h4 id="act-confirmed-title">참가 확정</h4>
        <ul className="act-stack">
          <li className="act-person">
            <p className="act-person-name">{hostNickname}</p>
            <p className="act-meta">모임장 · 데모 · 강퇴할 수 없음</p>
          </li>
          {selfStatus === 'accepted' && (
            <li className="act-person">
              <p className="act-person-name">나 (이 브라우저)</p>
              <p className="act-meta">수락됨 · 데모 · 참가 취소는 안내 탭에서</p>
            </li>
          )}
          {confirmed.map((person) => (
            <li className="act-person" key={person.id}>
              <p className="act-person-name">{person.nickname}</p>
              <p className="act-meta">{person.status === 'accepted' ? '수락됨 · 데모' : '확정 · 데모'}</p>
              <div className="act-actions">
                <button type="button" className="btn outline" onClick={() => setKick(person)}>
                  강퇴
                </button>
              </div>
            </li>
          ))}
        </ul>
        {kicked.length > 0 && (
          <ul className="act-stack" aria-label="강퇴한 예시 참가자">
            {kicked.map((person) => (
              <li className="act-person" key={person.id}>
                <p className="act-person-name">{person.nickname}</p>
                <p className="act-meta">강퇴됨 · 데모 · 인원에서 빠짐</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {kick && (
        <DemoDialog titleId="act-kick-title" title="강퇴 확인 (데모)" onClose={() => setKick(null)}>
          <p>
            <span className="act-demo-mark">데모</span> {kick.nickname} 님을 참가 확정 인원에서 빼는 척만 합니다. 알림은 보내지 않아요.
          </p>
          <div className="act-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                const person = kick;
                setKick(null);
                onDecision(person.id, 'kicked');
              }}
            >
              데모로 강퇴
            </button>
            <button type="button" className="btn outline" onClick={() => setKick(null)}>
              닫기
            </button>
          </div>
        </DemoDialog>
      )}
    </div>
  );
}
