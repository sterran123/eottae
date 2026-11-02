'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import ActivityCover from '@/components/activities/ActivityCover';
import SubpageHero from '@/components/shared/subpage-hero';
import { MotifIcon } from '@/components/shared/motif-icon';
import { readCoverFile } from '@/lib/activities/cover';
import { buildDemoPoll, formatKoreanDateTime, formatLocalDateTime, parseLocalDateTime } from '@/lib/activities/demo-data';
import { activitiesHref } from '@/lib/activities/href';
import { loadActivitiesDemo, saveActivitiesDemo, stashActivitiesNotice } from '@/lib/activities/demo-storage';
import {
  ACTIVITY_REGIONS,
  GATHERING_CATEGORIES,
  isActivityRegion,
  isGatheringCategory,
  type Gathering,
} from '@/lib/activities/types';

type FormState = {
  title: string;
  category: string;
  region: string;
  when: string;
  capacity: string;
  host: string;
  place: string;
  intro: string;
};

const INITIAL: FormState = {
  title: '',
  category: '취미',
  region: '노을구',
  when: '2026-11-21T15:00',
  capacity: '6',
  host: '',
  place: '',
  intro: '',
};

function validate(form: FormState): string | null {
  const title = form.title.trim();
  if (title.length < 2 || title.length > 40) return '모임 이름은 2자에서 40자 사이로 적어 주세요.';
  if (!isGatheringCategory(form.category)) return '카테고리를 골라 주세요.';
  if (!isActivityRegion(form.region)) return '지역을 골라 주세요.';
  if (!parseLocalDateTime(form.when)) return '날짜와 시간을 골라 주세요.';
  const capacity = Number(form.capacity);
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 12) return '정원은 2명에서 12명 사이의 정수로 적어 주세요.';
  const host = form.host.trim();
  if (host.length < 2 || host.length > 12) return '모임장 닉네임은 2자에서 12자 사이로 적어 주세요.';
  const place = form.place.trim();
  if (place.length < 2 || place.length > 40) return '장소 표시는 2자에서 40자 사이로 적어 주세요.';
  const intro = form.intro.trim();
  if (intro.length < 10 || intro.length > 300) return '소개는 10자에서 300자 사이로 적어 주세요.';
  return null;
}

export default function ActivitiesNewForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const coverHintId = useId();

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const onCoverPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setCoverBusy(true);
    setCoverNote(null);
    void readCoverFile(file).then((result) => {
      setCoverBusy(false);
      if (!result.ok) {
        setCoverNote(result.message);
        return;
      }
      setCover(result.dataUrl);
      setCoverNote(null);
    });
  };

  const clearCover = () => {
    setCover(null);
    setCoverNote(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (coverBusy) {
      setError('이미지를 아직 읽고 있어요. 잠시 후 다시 눌러 주세요.');
      return;
    }
    const message = validate(form);
    if (message) {
      setError(message);
      return;
    }
    const when = parseLocalDateTime(form.when);
    const category = form.category;
    const region = form.region;
    if (!when || !isGatheringCategory(category) || !isActivityRegion(region)) {
      setError('입력값을 다시 확인해 주세요.');
      return;
    }
    const id = `mine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const poll = buildDemoPoll(id, formatLocalDateTime(when));
    if (!poll) {
      setError('날짜와 시간을 다시 골라 주세요.');
      return;
    }
    const capacity = Number(form.capacity);
    const gathering: Gathering = {
      id,
      title: form.title.trim(),
      category,
      region,
      startsAtLabel: formatKoreanDateTime(when),
      startsAtIso: formatLocalDateTime(when),
      capacity,
      currentCount: 1,
      hostNickname: form.host.trim(),
      intro: form.intro.trim(),
      placeLabel: form.place.trim(),
      safetyFlags: ['공개 장소', '첫 만남 안내', '데모 모임'],
      poll,
      mine: true,
      coverImage: cover ?? undefined,
      demoLikes: 0,
      demoRecommends: 0,
      listedAt: formatLocalDateTime(new Date()),
    };
    const current = loadActivitiesDemo();
    let saved = saveActivitiesDemo({
      ...current,
      created: [gathering, ...current.created].slice(0, 20),
    });
    if (!saved && gathering.coverImage) {
      const withoutCover: Gathering = { ...gathering, coverImage: undefined };
      saved = saveActivitiesDemo({
        ...current,
        created: [withoutCover, ...current.created].slice(0, 20),
      });
      if (saved) {
        stashActivitiesNotice('데모 저장 공간이 부족해 첨부 이미지는 넣지 않았어요. 카테고리 기본 커버를 씁니다.');
        router.push(activitiesHref({ tab: 'gatherings', gathering: id }));
        return;
      }
    }
    if (!saved) {
      setError('데모 · 이 브라우저에 저장하지 못했어요. 목록에 넣지 않았습니다.');
      return;
    }
    router.push(activitiesHref({ tab: 'gatherings', gathering: id }));
  };

  const previewCategory = isGatheringCategory(form.category) ? form.category : '취미';

  return (
    <>
      <SubpageHero
        eyebrow="MODULE 02 · ACTIVITIES"
        status={{ label: '2차 · 데모 체험', dev: true }}
        title="소모임 만들기"
        motif={<MotifIcon name="spark" size={56} />}
      >
        제출하면 이 브라우저의 데모 목록에만 추가됩니다. 서버로는 보내지 않아요.
      </SubpageHero>
      <section className="shell subpage act-page">
        <p className="act-preview-badge">데모 데이터로 동작하는 2차 미리보기</p>
        <p className="act-lead">실존하는 가게 이름과 사람 이름은 넣지 마세요. 장소는 공개된 곳이라는 예시로 적으면 됩니다.</p>
        <form className="act-form" onSubmit={onSubmit} noValidate aria-describedby={error ? titleId : undefined}>
          {error && (
            <p id={titleId} ref={errorRef} className="act-form-error" role="alert" tabIndex={-1}>
              {error}
            </p>
          )}
          <label className="act-field">
            <span>모임 이름</span>
            <input type="text" value={form.title} onChange={set('title')} maxLength={40} required placeholder="예: 노을 스케치" />
          </label>
          <label className="act-field">
            <span>카테고리</span>
            <select value={form.category} onChange={set('category')}>
              {GATHERING_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="act-field">
            <span>지역</span>
            <select value={form.region} onChange={set('region')}>
              {ACTIVITY_REGIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="act-field">
            <span>안내 일정</span>
            <input type="datetime-local" value={form.when} onChange={set('when')} required />
          </label>
          <label className="act-field">
            <span>정원 (2–12명, 모임장 포함)</span>
            <input
              type="number"
              inputMode="numeric"
              min={2}
              max={12}
              step={1}
              value={form.capacity}
              onChange={set('capacity')}
              required
            />
          </label>
          <label className="act-field">
            <span>모임장 닉네임</span>
            <input type="text" value={form.host} onChange={set('host')} maxLength={12} required placeholder="예: 데모나" />
          </label>
          <label className="act-field">
            <span>장소 표시</span>
            <input
              type="text"
              value={form.place}
              onChange={set('place')}
              maxLength={40}
              required
              placeholder="예: 예시 장소 · 노을 벤치"
            />
          </label>
          <label className="act-field">
            <span>소개</span>
            <textarea
              value={form.intro}
              onChange={set('intro')}
              maxLength={300}
              required
              placeholder="처음 오는 사람에게 모임이 어떤 자리인지 10자 이상 적어 주세요."
            />
          </label>
          <div className="act-field">
            <span>커버 이미지 (선택)</span>
            <input
              ref={fileRef}
              className="act-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              tabIndex={-1}
              aria-hidden="true"
              onChange={onCoverPick}
            />
            <div className="act-actions">
              <button
                type="button"
                className="btn outline"
                aria-describedby={coverHintId}
                disabled={coverBusy}
                onClick={() => fileRef.current?.click()}
              >
                {coverBusy ? '이미지 읽는 중' : '이미지 첨부'}
              </button>
              {cover ? (
                <button type="button" className="btn outline" onClick={clearCover}>
                  첨부 삭제
                </button>
              ) : null}
            </div>
            <p id={coverHintId} className="act-note">
              jpg, png, webp, gif · 2MB 이하. 첨부하지 않으면 선택한 카테고리의 기본 커버가 자동으로 붙어요.
            </p>
            <p className="act-note">
              <span className="act-demo-mark">데모: 이 기기에만 저장</span> 서버로 올리지 않아요. 움직이는 gif는 한 장면으로 줄여 저장해요.
            </p>
            {coverNote ? (
              <p className="act-warn" role="status">
                {coverNote}
              </p>
            ) : null}
            <ActivityCover
              large
              lazy={false}
              item={{
                title: form.title.trim() || '새 소모임',
                category: previewCategory,
                coverImage: cover ?? undefined,
              }}
            />
          </div>
          <p className="act-note">
            <span className="act-demo-mark">데모</span> 일정 투표 후보 3개는 고른 시간, 두 시간 뒤, 다음 날로 자동으로 붙습니다. 참가 인원은
            모임장 1명으로 시작합니다.
          </p>
          <div className="act-actions">
            <button type="submit" className="btn primary">
              데모 목록에 추가
            </button>
            <Link className="btn outline" href="/activities/?tab=gatherings">
              모임 목록으로
            </Link>
          </div>
        </form>
      </section>
    </>
  );
}
