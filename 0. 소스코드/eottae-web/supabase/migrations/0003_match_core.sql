-- 0003_match_core.sql
-- MATCH-005 관심·상호 매칭 / MATCH-006 추천 / MATCH-007 메시지 / MATCH-008 신고·차단 / MATCH-009 문답
-- 작성: 주한태
-- 0000·0001·0002는 수정하지 않는다. public.users(id = auth.users.id)는 유지한다.
-- 클라이언트 UPDATE는 0002 그대로 nickname, updated_at만이다.
-- 성별·생년월일 원본·BBaton user_id·토큰 컬럼은 만들지 않는다.
-- MVP2·MVP3 테이블(activities, invitations)은 만들지 않는다.
--
-- 화면 DTO 대응 (src/lib/match/types.ts, demo-data.ts, src/lib/chat/types.ts, src/lib/safety/types.ts)
--   RecommendResponse.items[].id            users.id
--   RecommendProfile.nickname               users.nickname
--   RecommendProfile.age                    반환하지 않음. birth_year만 주고 화면이 나이로 환산한다.
--   RecommendProfile.intro                  profiles.bio
--   RecommendProfile.mbti                   profiles.mbti (16종 또는 unknown)
--   RecommendProfile.sharedInterestIds      응답 shared_interest_ids. 교집합 id만. 상대의 전체 관심사는 주지 않음
--   RecommendProfile.photo                  profiles.photo_visibility (hidden|preview). revealed는 컬럼이 아님
--   RecommendProfile.relation               응답 relation (none|liked_by_me|mutual)
--   RecommendProfile.distance / recency     반환하지 않음. GPS 좌표 컬럼 없음
--   RecommendResponse.nextCursor            응답 next_cursor. 다음 페이지가 없으면 null. limit 20
--   full_name · email · gender              반환하지 않음. 성별 컬럼 없음
--   SaveOnboardingRequest                   save_onboarding(...) → profiles upsert + user_interests 통째 교체
--   PhotoVisibilitySetting                  profiles.photo_visibility. 미지정이면 hidden (fail-closed)
--   MatchTargetPreference                   profiles.target_preference opposite|same|any
--   RelationGoal                            profiles.relation_goal neighbor_friend|casual|serious|open
--   MyMbti / MbtiType[]                     profiles.mbti / profiles.avoid_mbti
--   preferredDistance                       profiles.preferred_distance. 좌표가 아닌 길이 40 이하의 문구
--   QnaAnswer                               save_answers(jsonb) → profile_answers. 문항 본문 40개는 SQL에 넣지 않음
--   CommonQuestionState                     get_common_answers.state = unanswered|waiting|revealed
--   MessageRow                              messages.id, conversation_id, sender_id, body, created_at
--   (MessageRow 밖 컬럼)                    attachment_path, soft_delete_state (visible|deleted)
--   ChatMessage.body / MAX_MESSAGE_LENGTH   messages.body 길이 1–500
--   ReportCategory                          reports.category abuse|sexual|scam|other
--   ReportRequest.description               reports.description varchar(200)
--   BlockRequest.blockedUserId              blocks.blocked_user_id. blocker_id는 auth.uid()
--
-- 되돌리기(down) — 필요 시 SQL로 수동 실행. 0002의 users·consents·가입 트리거는 지우지 않는다.
--   drop policy if exists chat_media_select on storage.objects;
--   drop policy if exists chat_media_insert on storage.objects;
--   drop policy if exists chat_media_update on storage.objects;
--   drop policy if exists chat_media_delete on storage.objects;
--   delete from storage.buckets where id = 'chat-media';
--   alter publication supabase_realtime drop table public.messages;
--   drop trigger if exists likes_ensure_mutual_match on public.likes;
--   drop trigger if exists profiles_guard_mbti on public.profiles;
--   drop function if exists public.list_reports();
--   drop function if exists public.get_common_answers(uuid);
--   drop function if exists public.get_recommendations(text);
--   drop function if exists public.save_answers(jsonb);
--   drop function if exists public.save_onboarding(text, text[], text, text, text[], text, text);
--   drop function if exists private.chat_media_path_allowed(text);
--   drop function if exists private.caller_can_use_conversation(uuid);
--   drop function if exists private.is_match_member(uuid);
--   drop function if exists private.ensure_mutual_match();
--   drop function if exists private.profiles_guard_mbti();
--   drop function if exists private.user_is_active_adult(uuid);
--   drop function if exists private.mbti_16(text);
--   drop table if exists public.messages;
--   drop table if exists public.conversations;
--   drop table if exists public.match_members;
--   drop table if exists public.matches;
--   drop table if exists public.likes;
--   drop table if exists public.profile_answers;
--   drop table if exists public.user_interests;
--   drop table if exists public.profiles;
--   drop table if exists public.interests;
--   drop table if exists public.blocks;
--   drop table if exists public.reports;
--   drop table if exists public.user_roles;
--   revoke select on table public.users from anon;
--   revoke usage on schema private from authenticated;

-- ---------------------------------------------------------------------------
-- 0. 내부 헬퍼 (0002의 private 스키마를 그대로 쓴다)
-- ---------------------------------------------------------------------------
create or replace function private.mbti_16(p_value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_value in (
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
  );
$$;

-- 인자 있는 성인 판정. public.is_active_adult()와 같은 조건이고, 트리거가 상대 사용자를 볼 때 쓴다.
-- 클라이언트에 execute를 주지 않는다.
create or replace function private.user_is_active_adult(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select u.account_status = 'ACTIVE'
       and u.adult_verified
       and u.adult_verification_expires_at is not null
       and u.adult_verification_expires_at > now()
      from public.users u
     where u.id = p_user_id
  ), false);
$$;

revoke all on function private.mbti_16(text) from public, anon, authenticated;
revoke all on function private.user_is_active_adult(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. 관심사 카탈로그. id·라벨은 src/lib/match/demo-data.ts 의 50개만. 항목을 새로 짓지 않는다.
-- ---------------------------------------------------------------------------
create table public.interests (
  id        text primary key,
  category  text not null,
  label     text not null,
  constraint interests_category_ok check (category in ('place', 'music', 'food', 'travel', 'style')),
  constraint interests_label_len check (char_length(btrim(label)) between 1 and 80)
);

comment on table public.interests is 'MATCH-001 관심사 카탈로그. demo-data.ts INTEREST_CATEGORIES·INTEREST_LABELS 와 같은 id.';

insert into public.interests (id, category, label) values
  ('cafe', 'place', '감성 카페 투어'),
  ('hotplace', 'place', '성수·연남 핫플'),
  ('exhibition', 'place', '전시 · 미술관'),
  ('park', 'place', '한강 · 피크닉'),
  ('pub', 'place', '와인바 · 이자카야'),
  ('popstore', 'place', '팝업스토어'),
  ('bookcafe', 'place', '조용한 북카페'),
  ('drive', 'place', '드라이브 코스'),
  ('selectshop', 'place', '소품샵 · 편집샵'),
  ('lounge', 'place', 'LP바 · 뮤직펍'),
  ('kpop', 'music', 'K-POP 아이돌'),
  ('indie', 'music', '인디 · 밴드'),
  ('hiphop', 'music', '힙합 · R&B'),
  ('jpop', 'music', 'J-POP'),
  ('trot', 'music', '트로트'),
  ('festival', 'music', '페스티벌 · 콘서트'),
  ('pop', 'music', '팝 · 빌보드'),
  ('citypop', 'music', '시티팝 · 재즈'),
  ('ballad', 'music', '감성 발라드'),
  ('ost', 'music', 'OST · 영화음악'),
  ('dessert', 'food', '디저트 · 베이킹'),
  ('omakase', 'food', '오마카세 · 맛집'),
  ('wine', 'food', '내추럴와인 · 하이볼'),
  ('spicy', 'food', '마라 · 매운맛 러버'),
  ('brunch', 'food', '브런치 · 베이글'),
  ('streetfood', 'food', '야장 · 노포 맛집'),
  ('homecook', 'food', '홈쿡 · 요리'),
  ('vegan', 'food', '샐러드 · 포케'),
  ('delivery', 'food', '야식 · 배달음식'),
  ('coffee', 'food', '커피 · 에스프레소바'),
  ('spontaneous', 'travel', '즉흥 무계획 여행'),
  ('planned', 'travel', '계획형 투어'),
  ('hotel', 'travel', '감성숙소 · 호캉스'),
  ('camping', 'travel', '캠핑 · 글램핑'),
  ('longstay', 'travel', '해외 한달살기'),
  ('walk', 'travel', '뚜벅이 골목투어'),
  ('photospot', 'travel', '인생샷 스팟 투어'),
  ('resort', 'travel', '휴양지 힐링'),
  ('daytrip', 'travel', '드라이브 당일치기'),
  ('seaside', 'travel', '제주 · 바다 여행'),
  ('casual', 'style', '캐주얼 · 데일리룩'),
  ('street', 'style', '고프코어 · 스트릿'),
  ('running', 'style', '러닝 크루 · 오운완'),
  ('crossfit', 'style', '크로스핏 · 필라테스'),
  ('pet', 'style', '반려동물 집사'),
  ('filmcamera', 'style', '필름카메라 · 사진'),
  ('boardgame', 'style', '보드게임 · 방탈출'),
  ('perfume', 'style', '향수 · 디퓨저'),
  ('onedayclass', 'style', '원데이 클래스 · 공방'),
  ('gaming', 'style', '게임 · 애니메이션');

-- ---------------------------------------------------------------------------
-- 2. 프로필 · 관심사 · 문답. 쓰기는 RPC만. 문항 본문은 저장하지 않는다.
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id             uuid primary key references public.users (id) on delete cascade,
  bio                 varchar(200),
  photo_visibility    text not null default 'hidden'
                      check (photo_visibility in ('hidden', 'preview')),
  profile_status      text not null default 'draft'
                      check (profile_status in ('draft', 'active')),
  mbti                text,
  avoid_mbti          text[] not null default '{}',
  target_preference   text
                      check (target_preference is null or target_preference in ('opposite', 'same', 'any')),
  relation_goal       text
                      check (relation_goal is null or relation_goal in ('neighbor_friend', 'casual', 'serious', 'open')),
  preferred_distance  text,
  constraint profiles_bio_len check (bio is null or char_length(bio) between 1 and 200),
  constraint profiles_mbti_ok check (
    mbti is null or mbti = 'unknown' or mbti in (
      'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
      'ISTP', 'ISFP', 'INFP', 'INTP',
      'ESTP', 'ESFP', 'ENFP', 'ENTP',
      'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
    )
  ),
  constraint profiles_preferred_distance_len check (
    preferred_distance is null or char_length(btrim(preferred_distance)) between 1 and 40
  )
);

comment on table public.profiles is 'MATCH-001 프로필. 성별 컬럼 없음. 생년월일 원본 없음. 좌표 없음.';
comment on column public.profiles.photo_visibility is 'hidden|preview. revealed는 쌍방 관심으로 화면이 계산하며 컬럼이 아니다.';
comment on column public.profiles.preferred_distance is 'GPS 좌표가 아니다. 길이 40 이하의 거리 문구(예: 5km 이내, within_5km).';
comment on column public.profiles.profile_status is 'draft|active. 추천은 active만 포함한다.';

create table public.user_interests (
  user_id      uuid not null references public.users (id) on delete cascade,
  interest_id  text not null references public.interests (id) on delete cascade,
  primary key (user_id, interest_id)
);

create index idx_user_interests_interest on public.user_interests (interest_id);

create table public.profile_answers (
  user_id      uuid not null references public.users (id) on delete cascade,
  question_id  text not null,
  option_id    text,
  custom_text  varchar(200),
  declined     boolean not null default false,
  primary key (user_id, question_id),
  constraint profile_answers_question_len check (char_length(btrim(question_id)) between 1 and 80),
  constraint profile_answers_option_len check (option_id is null or char_length(btrim(option_id)) between 1 and 80),
  constraint profile_answers_custom_len check (custom_text is null or char_length(custom_text) between 1 and 200),
  constraint profile_answers_declined_empty check (
    declined = false or (option_id is null and custom_text is null)
  )
);

comment on table public.profile_answers is 'MATCH-009 문답 답. 문항 본문 40개는 저장하지 않는다. declined이면 선택지·자유입력이 없다.';

-- ---------------------------------------------------------------------------
-- 3. 좋아요 · 매칭 · 대화방. 클라이언트는 matches / match_members / conversations 에 INSERT 하지 못한다.
-- ---------------------------------------------------------------------------
create table public.likes (
  actor_id    uuid not null references public.users (id) on delete cascade,
  target_id   uuid not null references public.users (id) on delete cascade,
  decision    text not null check (decision in ('yes', 'no')),
  created_at  timestamptz not null default now(),
  primary key (actor_id, target_id),
  constraint likes_not_self check (actor_id <> target_id)
);

create index idx_likes_target on public.likes (target_id);

create table public.matches (
  id         uuid primary key default gen_random_uuid(),
  user_low   uuid not null references public.users (id) on delete cascade,
  user_high  uuid not null references public.users (id) on delete cascade,
  status     text not null default 'active' check (status in ('active', 'closed')),
  constraint matches_ordered check (user_low < user_high),
  constraint matches_pair_unique unique (user_low, user_high)
);

comment on table public.matches is 'MATCH-005. 클라이언트 INSERT 금지. 쌍은 user_low < user_high 한 행만.';

-- slot 1|2 의 unique가 한 match당 최대 2명이다. PK는 (match_id, user_id). 화면 DTO에는 slot이 없다.
create table public.match_members (
  match_id  uuid not null references public.matches (id) on delete cascade,
  user_id   uuid not null references public.users (id) on delete cascade,
  slot      smallint not null check (slot in (1, 2)),
  primary key (match_id, user_id),
  constraint match_members_slot_unique unique (match_id, slot)
);

create index idx_match_members_user on public.match_members (user_id);

create table public.conversations (
  id        uuid primary key default gen_random_uuid(),
  match_id  uuid not null unique references public.matches (id) on delete cascade
);

comment on table public.conversations is 'MATCH-007. match 1건당 conversation 1건. 클라이언트 INSERT 금지.';

-- ---------------------------------------------------------------------------
-- 4. 차단 · 신고 · 운영 역할. 신고 조회는 authenticated SELECT가 아니라 list_reports()다.
-- ---------------------------------------------------------------------------
create table public.blocks (
  blocker_id       uuid not null references public.users (id) on delete cascade,
  blocked_user_id  uuid not null references public.users (id) on delete cascade,
  created_at       timestamptz not null default now(),
  primary key (blocker_id, blocked_user_id),
  constraint blocks_not_self check (blocker_id <> blocked_user_id)
);

create index idx_blocks_blocked on public.blocks (blocked_user_id);

create table public.reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid references public.users (id) on delete set null,
  reported_user_id  uuid references public.users (id) on delete set null,
  category          text not null check (category in ('abuse', 'sexual', 'scam', 'other')),
  description       varchar(200),
  status            text not null default 'open' check (status in ('open', 'closed')),
  created_at        timestamptz not null default now(),
  constraint reports_description_len check (
    description is null or char_length(description) between 1 and 200
  )
);

comment on table public.reports is 'MATCH-008. 사용자 삭제 후에도 행은 남고 FK만 NULL. authenticated SELECT·UPDATE 없음.';

create table public.user_roles (
  user_id  uuid primary key references public.users (id) on delete cascade,
  role     text not null check (role = 'operator')
);

comment on table public.user_roles is '운영자 역할. 시드 사용자 없음. authenticated 권한 없음.';

-- ---------------------------------------------------------------------------
-- 5. 메시지. MessageRow + attachment_path + soft_delete_state.
-- ---------------------------------------------------------------------------
create table public.messages (
  id                 uuid primary key default gen_random_uuid(),
  conversation_id    uuid not null references public.conversations (id) on delete cascade,
  sender_id          uuid not null references public.users (id) on delete cascade,
  body               varchar(500) not null,
  created_at         timestamptz not null default now(),
  attachment_path    text,
  soft_delete_state  text not null default 'visible' check (soft_delete_state in ('visible', 'deleted')),
  constraint messages_body_len check (
    char_length(body) between 1 and 500
    and char_length(btrim(body)) >= 1
  ),
  constraint messages_attachment_path_ok check (
    attachment_path is null
    or (
      lower(split_part(attachment_path, '/', 1)) = conversation_id::text
      and split_part(attachment_path, '/', 2) <> ''
      and split_part(attachment_path, '/', 3) = ''
      and attachment_path not like '%..%'
    )
  )
);

create index idx_messages_conversation_created on public.messages (conversation_id, created_at);

comment on table public.messages is 'MATCH-007 MessageRow. 추가는 attachment_path, soft_delete_state. Realtime publication supabase_realtime.';

-- ---------------------------------------------------------------------------
-- 6. 멤버십·대화 가능 여부. match_members 정책을 자기 테이블 조회로 쓰면 RLS가 무한 재귀한다.
--    security definer 로 RLS를 우회해 호출자 여부만 boolean으로 돌려준다.
--    PostgREST db-schemas 는 public 이라 private 함수는 RPC로 노출되지 않는다.
--    정책 식이 함수를 부르려면 authenticated 에 schema usage와 execute가 필요하다.
-- ---------------------------------------------------------------------------
create or replace function private.is_match_member(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.match_members mm
     where mm.match_id = p_match_id
       and mm.user_id = (select auth.uid())
  );
$$;

create or replace function private.caller_can_use_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select
      m.status = 'active'
      and private.user_is_active_adult((select auth.uid()))
      and exists (
        select 1
          from public.match_members me
         where me.match_id = m.id
           and me.user_id = (select auth.uid())
      )
      and not exists (
        select 1
          from public.match_members a
          join public.match_members b
            on b.match_id = a.match_id
           and b.user_id <> a.user_id
          join public.blocks blk
            on blk.blocker_id = a.user_id
           and blk.blocked_user_id = b.user_id
         where a.match_id = m.id
      )
      from public.conversations c
      join public.matches m on m.id = c.match_id
     where c.id = p_conversation_id
  ), false);
$$;

create or replace function private.chat_media_path_allowed(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_conv uuid;
begin
  if p_name is null
     or p_name like '%..%'
     or split_part(p_name, '/', 1) = ''
     or split_part(p_name, '/', 2) = ''
     or split_part(p_name, '/', 3) <> '' then
    return false;
  end if;

  begin
    v_conv := split_part(p_name, '/', 1)::uuid;
  exception
    when invalid_text_representation then
      return false;
  end;

  return private.caller_can_use_conversation(v_conv);
end;
$$;

revoke all on function private.is_match_member(uuid) from public, anon;
revoke all on function private.caller_can_use_conversation(uuid) from public, anon;
revoke all on function private.chat_media_path_allowed(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_match_member(uuid) to authenticated;
grant execute on function private.caller_can_use_conversation(uuid) to authenticated;
grant execute on function private.chat_media_path_allowed(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. 쌍방 yes → match·member 2명·conversation 1건.
--    쌍 UUID를 (user_low, user_high) 순서로 pg_advisory_xact_lock 해 동시 삽입도 1건이 된다.
--    decision=no 이거나, 한쪽이라도 활성 성인이 아니거나, 어느 방향이든 차단이면 match를 만들지 않는다.
-- ---------------------------------------------------------------------------
create or replace function private.ensure_mutual_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_low      uuid;
  v_high     uuid;
  v_other    text;
  v_match_id uuid;
begin
  if new.decision is distinct from 'yes' then
    return new;
  end if;

  if new.actor_id < new.target_id then
    v_low := new.actor_id;
    v_high := new.target_id;
  else
    v_low := new.target_id;
    v_high := new.actor_id;
  end if;

  -- 같은 쌍은 어느 쪽에서 INSERT/UPDATE 해도 같은 잠금이다. 다른 쌍은 막지 않는다.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_low::text),
    pg_catalog.hashtext(v_high::text)
  );

  select l.decision
    into v_other
    from public.likes l
   where l.actor_id = new.target_id
     and l.target_id = new.actor_id;

  if v_other is distinct from 'yes' then
    return new;
  end if;

  if not private.user_is_active_adult(new.actor_id)
     or not private.user_is_active_adult(new.target_id) then
    return new;
  end if;

  if exists (
    select 1
      from public.blocks b
     where (b.blocker_id = new.actor_id and b.blocked_user_id = new.target_id)
        or (b.blocker_id = new.target_id and b.blocked_user_id = new.actor_id)
  ) then
    return new;
  end if;

  insert into public.matches (user_low, user_high)
  values (v_low, v_high)
  on conflict (user_low, user_high) do nothing
  returning id into v_match_id;

  if v_match_id is null then
    return new;
  end if;

  insert into public.match_members (match_id, user_id, slot)
  values (v_match_id, v_low, 1), (v_match_id, v_high, 2);

  insert into public.conversations (match_id)
  values (v_match_id);

  return new;
end;
$$;

revoke all on function private.ensure_mutual_match() from public, anon;
grant execute on function private.ensure_mutual_match() to authenticated;

create trigger likes_ensure_mutual_match
  after insert or update of decision on public.likes
  for each row execute function private.ensure_mutual_match();

create or replace function private.profiles_guard_mbti()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item text;
begin
  if new.avoid_mbti is null then
    new.avoid_mbti := '{}';
  end if;

  foreach v_item in array new.avoid_mbti loop
    if v_item is null or not private.mbti_16(v_item) then
      raise exception 'VALIDATION_ERROR';
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function private.profiles_guard_mbti() from public, anon, authenticated;

create trigger profiles_guard_mbti
  before insert or update of avoid_mbti on public.profiles
  for each row execute function private.profiles_guard_mbti();

-- ---------------------------------------------------------------------------
-- 8. RPC
-- ---------------------------------------------------------------------------
create or replace function public.save_onboarding(
  p_my_mbti             text,
  p_avoid_mbti          text[],
  p_target_preference   text,
  p_relation_goal       text,
  p_interest_ids        text[],
  p_preferred_distance  text default null,
  p_photo_visibility    text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me       uuid := (select auth.uid());
  v_photo    text;
  v_distance text;
  v_avoid    text[];
  v_count    int;
begin
  if v_me is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if not public.is_active_adult() then
    raise exception 'AGE_VERIFICATION_REQUIRED';
  end if;

  if p_my_mbti is null or (p_my_mbti <> 'unknown' and not private.mbti_16(p_my_mbti)) then
    raise exception 'VALIDATION_ERROR';
  end if;

  v_avoid := coalesce(p_avoid_mbti, '{}'::text[]);
  if exists (
    select 1
      from unnest(v_avoid) as x
     group by x
    having count(*) > 1
  ) or exists (
    select 1
      from unnest(v_avoid) as x
     where x is null or not private.mbti_16(x)
  ) then
    raise exception 'VALIDATION_ERROR';
  end if;

  if p_target_preference is null
     or p_relation_goal is null
     or p_target_preference not in ('opposite', 'same', 'any')
     or p_relation_goal not in ('neighbor_friend', 'casual', 'serious', 'open') then
    raise exception 'VALIDATION_ERROR';
  end if;

  if p_interest_ids is null then
    raise exception 'VALIDATION_ERROR';
  end if;
  v_count := cardinality(p_interest_ids);
  if v_count < 3 or v_count > 7 then
    raise exception 'VALIDATION_ERROR';
  end if;
  if (select count(distinct x) from unnest(p_interest_ids) as x) <> v_count then
    raise exception 'VALIDATION_ERROR';
  end if;
  if exists (
    select 1
      from unnest(p_interest_ids) as x
     where not exists (select 1 from public.interests i where i.id = x)
  ) then
    raise exception 'VALIDATION_ERROR';
  end if;

  v_photo := nullif(btrim(coalesce(p_photo_visibility, '')), '');
  if v_photo is null then
    v_photo := 'hidden';
  elsif v_photo not in ('hidden', 'preview') then
    raise exception 'VALIDATION_ERROR';
  end if;

  v_distance := nullif(btrim(coalesce(p_preferred_distance, '')), '');
  if v_distance is not null then
    if char_length(v_distance) > 40
       or v_distance ~ '^-?[0-9]+([.][0-9]+)?[[:space:]]*,[[:space:]]*-?[0-9]+([.][0-9]+)?$' then
      raise exception 'VALIDATION_ERROR';
    end if;
  end if;

  -- 검증이 끝난 뒤에만 쓴다. 아래 실패는 이 함수 트랜잭션 전체 롤백이다.
  insert into public.profiles (
    user_id, photo_visibility, profile_status, mbti, avoid_mbti,
    target_preference, relation_goal, preferred_distance
  ) values (
    v_me, v_photo, 'active', p_my_mbti, v_avoid,
    p_target_preference, p_relation_goal, v_distance
  )
  on conflict (user_id) do update set
    photo_visibility   = excluded.photo_visibility,
    profile_status     = 'active',
    mbti               = excluded.mbti,
    avoid_mbti         = excluded.avoid_mbti,
    target_preference  = excluded.target_preference,
    relation_goal      = excluded.relation_goal,
    preferred_distance = excluded.preferred_distance;

  delete from public.user_interests where user_id = v_me;

  insert into public.user_interests (user_id, interest_id)
  select v_me, x from unnest(p_interest_ids) as x;
end;
$$;

create or replace function public.save_answers(p_answers jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me       uuid := (select auth.uid());
  v_elem     jsonb;
  v_qid      text;
  v_option   text;
  v_custom   text;
  v_declined boolean;
  v_seen     text[] := '{}';
  v_clean    jsonb := '[]'::jsonb;
begin
  if v_me is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if not public.is_active_adult() then
    raise exception 'AGE_VERIFICATION_REQUIRED';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > 40 then
    raise exception 'VALIDATION_ERROR';
  end if;

  for v_elem in select value from jsonb_array_elements(p_answers) as t(value) loop
    if jsonb_typeof(v_elem) <> 'object' then
      raise exception 'VALIDATION_ERROR';
    end if;

    v_qid := nullif(btrim(coalesce(v_elem->>'questionId', v_elem->>'question_id')), '');
    v_option := nullif(btrim(coalesce(v_elem->>'optionId', v_elem->>'option_id')), '');
    v_custom := nullif(btrim(coalesce(v_elem->>'customText', v_elem->>'custom_text')), '');

    begin
      v_declined := coalesce((v_elem->>'declined')::boolean, false);
    exception
      when others then
        raise exception 'VALIDATION_ERROR';
    end;

    if v_qid is null or char_length(v_qid) > 80 or v_qid = any(v_seen) then
      raise exception 'VALIDATION_ERROR';
    end if;
    if v_option is not null and char_length(v_option) > 80 then
      raise exception 'VALIDATION_ERROR';
    end if;
    if v_custom is not null and char_length(v_custom) > 200 then
      raise exception 'VALIDATION_ERROR';
    end if;

    -- declined=true 이면 선택지도 자유입력도 없어야 한다.
    if v_declined then
      if v_option is not null or v_custom is not null then
        raise exception 'VALIDATION_ERROR';
      end if;
    elsif v_option is null and v_custom is null then
      raise exception 'VALIDATION_ERROR';
    end if;

    v_seen := v_seen || v_qid;
    v_clean := v_clean || jsonb_build_array(jsonb_build_object(
      'question_id', v_qid,
      'option_id', case when v_declined then null else v_option end,
      'custom_text', case when v_declined then null else v_custom end,
      'declined', v_declined
    ));
  end loop;

  delete from public.profile_answers where user_id = v_me;

  insert into public.profile_answers (user_id, question_id, option_id, custom_text, declined)
  select
    v_me,
    e->>'question_id',
    e->>'option_id',
    e->>'custom_text',
    (e->>'declined')::boolean
  from jsonb_array_elements(v_clean) as e;
end;
$$;

create or replace function public.get_recommendations(p_cursor text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me     uuid := (select auth.uid());
  v_after  uuid;
  v_items  jsonb := '[]'::jsonb;
  v_next   text;
  v_last   uuid;
  v_count  int := 0;
  v_shared jsonb;
  v_rel    text;
  rec      record;
begin
  if v_me is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if not public.is_active_adult() then
    raise exception 'AGE_VERIFICATION_REQUIRED';
  end if;

  if p_cursor is null or btrim(p_cursor) = '' then
    v_after := null;
  else
    begin
      v_after := btrim(p_cursor)::uuid;
    exception
      when invalid_text_representation then
        raise exception 'VALIDATION_ERROR';
    end;
  end if;

  -- 제외 조건 (MATCH-006, ADR-005):
  --   본인
  --   어느 방향이든 차단
  --   account_status <> 'ACTIVE'
  --   성인 인증이 없거나 adult_verification_expires_at 이 없거나 지남
  --   profile_status <> 'active'
  -- 휴면 enum은 없다. 0002 account_status_type 은 ACTIVE, SUSPENDED, DELETED, PENDING 뿐이다.
  -- 새 enum 값을 추가하지 않는다.
  -- SUSPENDED(이용 정지)를 휴면·비활성 제외로 쓴다. PENDING(가입 미완료)·DELETED(탈퇴)도
  -- ACTIVE 가 아니므로 같은 조건으로 빠진다.
  -- 내가 decision=no 로 넘긴 상대는 다시 보여 주지 않는다.
  -- 반환은 id, nickname, birth_year, bio, mbti, photo_visibility, 교집합 관심사 id, relation.
  -- full_name·이메일·성별·좌표·상대의 전체 관심사 목록은 넣지 않는다.
  for rec in
    select u.id, u.nickname, u.birth_year, p.bio, p.mbti, p.photo_visibility
      from public.users u
      join public.profiles p on p.user_id = u.id
     where u.id <> v_me
       and (v_after is null or u.id > v_after)
       and u.account_status = 'ACTIVE'
       and u.adult_verified
       and u.adult_verification_expires_at is not null
       and u.adult_verification_expires_at > now()
       and p.profile_status = 'active'
       and not exists (
         select 1
           from public.blocks b
          where (b.blocker_id = v_me and b.blocked_user_id = u.id)
             or (b.blocker_id = u.id and b.blocked_user_id = v_me)
       )
       and not exists (
         select 1
           from public.likes l
          where l.actor_id = v_me
            and l.target_id = u.id
            and l.decision = 'no'
       )
     order by u.id
     limit 21
  loop
    v_count := v_count + 1;
    if v_count > 20 then
      v_next := v_last::text;
      exit;
    end if;
    v_last := rec.id;

    select coalesce(jsonb_agg(s.interest_id order by s.interest_id), '[]'::jsonb)
      into v_shared
      from (
        select ui.interest_id
          from public.user_interests ui
         where ui.user_id = rec.id
           and exists (
             select 1
               from public.user_interests mine
              where mine.user_id = v_me
                and mine.interest_id = ui.interest_id
           )
      ) s;

    select case
             when exists (
               select 1
                 from public.matches m
                where m.user_low = least(v_me, rec.id)
                  and m.user_high = greatest(v_me, rec.id)
                  and m.status = 'active'
             ) then 'mutual'
             when exists (
               select 1
                 from public.likes l
                where l.actor_id = v_me
                  and l.target_id = rec.id
                  and l.decision = 'yes'
             ) then 'liked_by_me'
             else 'none'
           end
      into v_rel;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', rec.id,
      'nickname', rec.nickname,
      'birth_year', rec.birth_year,
      'bio', rec.bio,
      'mbti', rec.mbti,
      'photo_visibility', rec.photo_visibility,
      'shared_interest_ids', v_shared,
      'relation', v_rel
    ));
  end loop;

  return jsonb_build_object(
    'items', v_items,
    'next_cursor', v_next
  );
end;
$$;

comment on function public.get_recommendations(text) is
  'MATCH-006. 휴면 enum은 없다. SUSPENDED를 휴면·비활성 제외로 쓴다. 0002 enum은 ACTIVE|SUSPENDED|DELETED|PENDING 뿐이며 새 값은 추가하지 않는다. 다음 페이지가 없으면 next_cursor는 null. limit 20.';

create or replace function public.get_common_answers(p_match_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me      uuid := (select auth.uid());
  v_partner uuid;
  v_items   jsonb := '[]'::jsonb;
  v_qid     text;
  v_my_opt  text;
  v_my_txt  text;
  v_my_dec  boolean;
  v_th_opt  text;
  v_th_txt  text;
  v_th_dec  boolean;
  v_my_has  boolean;
  v_th_has  boolean;
  v_state   text;
  v_show    boolean;
begin
  if v_me is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if not public.is_active_adult() then
    raise exception 'AGE_VERIFICATION_REQUIRED';
  end if;
  if p_match_id is null or not exists (
    select 1
      from public.match_members mm
     where mm.match_id = p_match_id
       and mm.user_id = v_me
  ) then
    raise exception 'INSUFFICIENT_PRIVILEGE' using errcode = '42501';
  end if;

  select mm.user_id
    into v_partner
    from public.match_members mm
   where mm.match_id = p_match_id
     and mm.user_id <> v_me
   limit 1;

  for v_qid in
    select distinct a.question_id
      from public.profile_answers a
     where a.user_id in (v_me, v_partner)
     order by a.question_id
  loop
    v_my_has := false;
    v_th_has := false;
    v_my_opt := null;
    v_my_txt := null;
    v_my_dec := false;
    v_th_opt := null;
    v_th_txt := null;
    v_th_dec := false;

    select true, a.option_id, a.custom_text, a.declined
      into v_my_has, v_my_opt, v_my_txt, v_my_dec
      from public.profile_answers a
     where a.user_id = v_me
       and a.question_id = v_qid;

    select true, a.option_id, a.custom_text, a.declined
      into v_th_has, v_th_opt, v_th_txt, v_th_dec
      from public.profile_answers a
     where a.user_id = v_partner
       and a.question_id = v_qid;

    v_my_has := coalesce(v_my_has, false);
    v_th_has := coalesce(v_th_has, false);

    -- 호출자가 그 문항에 답했고 거절하지 않았을 때만 상대 본문. 아니면 상대 답 없이 대기.
    v_show := v_my_has and not coalesce(v_my_dec, false) and v_th_has and not coalesce(v_th_dec, false);

    if not v_my_has then
      v_state := 'unanswered';
    elsif v_show then
      v_state := 'revealed';
    else
      v_state := 'waiting';
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'question_id', v_qid,
      'state', v_state,
      'my_option_id', v_my_opt,
      'my_custom_text', v_my_txt,
      'partner_option_id', case when v_show then v_th_opt else null end,
      'partner_custom_text', case when v_show then v_th_txt else null end
    ));
  end loop;

  return v_items;
end;
$$;

create or replace function public.list_reports()
returns setof public.reports
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 일반 계정은 빈 SELECT가 아니다. operator가 아니면 42501로 거부한다 (TC-010).
  if not exists (
    select 1
      from public.user_roles r
     where r.user_id = (select auth.uid())
       and r.role = 'operator'
  ) then
    raise exception 'INSUFFICIENT_PRIVILEGE' using errcode = '42501';
  end if;

  return query
  select *
    from public.reports
   order by created_at, id;
end;
$$;

revoke all on function public.save_onboarding(text, text[], text, text, text[], text, text) from public, anon;
revoke all on function public.save_answers(jsonb) from public, anon;
revoke all on function public.get_recommendations(text) from public, anon;
revoke all on function public.get_common_answers(uuid) from public, anon;
revoke all on function public.list_reports() from public, anon;

grant execute on function public.save_onboarding(text, text[], text, text, text[], text, text) to authenticated;
grant execute on function public.save_answers(jsonb) to authenticated;
grant execute on function public.get_recommendations(text) to authenticated;
grant execute on function public.get_common_answers(uuid) to authenticated;
grant execute on function public.list_reports() to authenticated;

-- ---------------------------------------------------------------------------
-- 9. 권한 + RLS default deny
--    Supabase 기본 권한이 anon/authenticated 에 열려 있을 수 있어 먼저 revoke 한다.
--    anon SELECT 는 정책이 없어 0건이다 (TC-003의 DB 쪽). 행 내용은 나가지 않는다.
-- ---------------------------------------------------------------------------
revoke all on public.interests from public, anon, authenticated;
revoke all on public.profiles from public, anon, authenticated;
revoke all on public.user_interests from public, anon, authenticated;
revoke all on public.profile_answers from public, anon, authenticated;
revoke all on public.likes from public, anon, authenticated;
revoke all on public.matches from public, anon, authenticated;
revoke all on public.match_members from public, anon, authenticated;
revoke all on public.conversations from public, anon, authenticated;
revoke all on public.blocks from public, anon, authenticated;
revoke all on public.reports from public, anon, authenticated;
revoke all on public.user_roles from public, anon, authenticated;
revoke all on public.messages from public, anon, authenticated;

grant select on public.users to anon;

grant select on public.interests to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.user_interests to anon, authenticated;
grant select on public.profile_answers to anon, authenticated;
grant select on public.likes to anon, authenticated;
grant select on public.matches to anon, authenticated;
grant select on public.match_members to anon, authenticated;
grant select on public.conversations to anon, authenticated;
grant select on public.blocks to anon, authenticated;
grant select on public.messages to anon, authenticated;
grant select on public.reports to anon;
grant select on public.user_roles to anon;

grant insert (actor_id, target_id, decision) on public.likes to authenticated;
grant update (decision) on public.likes to authenticated;

grant insert (blocker_id, blocked_user_id) on public.blocks to authenticated;
grant delete on public.blocks to authenticated;

grant insert (id, reporter_id, reported_user_id, category, description) on public.reports to authenticated;

grant insert (conversation_id, sender_id, body, attachment_path) on public.messages to authenticated;

alter table public.interests enable row level security;
alter table public.profiles enable row level security;
alter table public.user_interests enable row level security;
alter table public.profile_answers enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.match_members enable row level security;
alter table public.conversations enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.user_roles enable row level security;
alter table public.messages enable row level security;

create policy interests_select_known_user on public.interests
  for select to authenticated
  using ((select auth.uid()) is not null);

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy user_interests_select_own on public.user_interests
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy profile_answers_select_own on public.profile_answers
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy likes_select_own on public.likes
  for select to authenticated
  using (actor_id = (select auth.uid()));

create policy likes_insert_own_adult on public.likes
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and public.is_active_adult()
  );

create policy likes_update_own_adult on public.likes
  for update to authenticated
  using (
    actor_id = (select auth.uid())
    and public.is_active_adult()
  )
  with check (
    actor_id = (select auth.uid())
    and public.is_active_adult()
  );

create policy matches_select_member on public.matches
  for select to authenticated
  using (private.is_match_member(id));

create policy match_members_select_member on public.match_members
  for select to authenticated
  using (private.is_match_member(match_id));

create policy conversations_select_member on public.conversations
  for select to authenticated
  using (private.is_match_member(match_id));

create policy blocks_select_own on public.blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy blocks_insert_own on public.blocks
  for insert to authenticated
  with check (blocker_id = (select auth.uid()));

create policy blocks_delete_own on public.blocks
  for delete to authenticated
  using (blocker_id = (select auth.uid()));

create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (select auth.uid()) is not null
  );

create policy messages_select_participant on public.messages
  for select to authenticated
  using (private.caller_can_use_conversation(conversation_id));

create policy messages_insert_participant on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.caller_can_use_conversation(conversation_id)
  );

-- ---------------------------------------------------------------------------
-- 10. Realtime. 구독 권한은 messages RLS(활성 match·미차단·is_active_adult)를 탄다 (ADR-003).
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 11. 비공개 채팅 첨부. 경로 {conversation_id}/{object}. 읽기·쓰기는 그 대화의 활성 구성원·미차단.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', false)
on conflict (id) do update set public = false;

drop policy if exists chat_media_select on storage.objects;
drop policy if exists chat_media_insert on storage.objects;
drop policy if exists chat_media_update on storage.objects;
drop policy if exists chat_media_delete on storage.objects;

create policy chat_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'chat-media'
    and private.chat_media_path_allowed(name)
  );

create policy chat_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-media'
    and private.chat_media_path_allowed(name)
  );

create policy chat_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'chat-media'
    and private.chat_media_path_allowed(name)
  )
  with check (
    bucket_id = 'chat-media'
    and private.chat_media_path_allowed(name)
  );

create policy chat_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'chat-media'
    and private.chat_media_path_allowed(name)
  );
