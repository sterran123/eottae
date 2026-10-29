-- 0003_match_safety_rls.sql
-- MATCH-004 (성인 게이트) · MATCH-005 (관심 표시·상호 매칭 경쟁 조건 방지) ·
-- MATCH-006 (추천 필터·RLS) · MATCH-007/008 (채팅·차단·신고 RLS 연동)
-- 작성: 주한태 (ADR-002 · ADR-003 · ADR-005 준수)
--
-- 핵심 보안 원칙:
--   1) 모든 테이블 RLS ENABLE (Default Deny).
--   2) 매칭·관심표시·추천·채팅은 모두 `public.is_active_adult()`(ACTIVE + 정식 성인 인증 + 미만료) 필수(TC-004).
--   3) 쌍방 좋아요 시 `matches`·`match_members`·`conversations` 생성은 `security definer` 트리거만 수행하며,
--      정규화된 쌍 `UNIQUE (user_low_id, user_high_id)` 제약으로 동시 요청 경쟁 조건에도 1건만 생성된다(TC-006).
--   4) 추천 RPC `public.get_recommendations`는 본인·비활성(SUSPENDED/DELETED/PENDING)·미성년/미검증·
--      양방향 차단(`blocks`)·이미 평가한 대상을 모두 제외한다(TC-007).
--   5) 메시지(`messages`) SELECT/INSERT는 활성 match 구성원이면서 양방향 차단이 없는 경우만 허용한다(TC-008, TC-009).
--   6) 신고(`reports`)는 본인 INSERT만 허용하고 일반 사용자(`authenticated`)의 SELECT 권한/정책은 두지 않는다(TC-010).
--
-- 되돌리기(down) — 필요 시 SQL로 수동 실행
--   drop trigger if exists on_like_upserted on public.likes;
--   drop trigger if exists on_block_created on public.blocks;
--   drop function if exists public.get_recommendations(int, timestamptz);
--   drop function if exists public.can_access_conversation(uuid);
--   drop function if exists public.is_blocked_between(uuid, uuid);
--   drop function if exists private.handle_mutual_like();
--   drop function if exists private.handle_new_block();
--   drop table if exists public.messages cascade;
--   drop table if exists public.conversations cascade;
--   drop table if exists public.match_members cascade;
--   drop table if exists public.matches cascade;
--   drop table if exists public.likes cascade;
--   drop table if exists public.reports cascade;
--   drop table if exists public.blocks cascade;
--   drop table if exists public.profile_interests cascade;
--   drop table if exists public.interests cascade;
--   drop table if exists public.profiles cascade;

-- ---------------------------------------------------------------------------
-- 1. 프로필 및 취향 테이블 (MATCH-001 · MATCH-004 · MATCH-006)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id           uuid primary key references public.users (id) on delete cascade,
  nickname          varchar(20) not null,
  bio               varchar(300) not null default '',
  mbti              varchar(4),
  photo_visibility  varchar(20) not null default 'BLIND'
                    check (photo_visibility in ('BLIND', 'MATCHED_ONLY', 'PUBLIC')),
  profile_status    varchar(20) not null default 'ACTIVE'
                    check (profile_status in ('ACTIVE', 'HIDDEN')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint profiles_nickname_len check (char_length(btrim(nickname)) between 2 and 20)
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create table if not exists public.interests (
  id          varchar(40) primary key,
  category    varchar(40) not null,
  label       varchar(50) not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.profile_interests (
  user_id      uuid not null references public.users (id) on delete cascade,
  interest_id  varchar(40) not null references public.interests (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create index if not exists idx_profile_interests_interest on public.profile_interests (interest_id);

-- ---------------------------------------------------------------------------
-- 2. 차단(blocks) 및 신고(reports) 테이블 (MATCH-008 · ADR-003)
-- ---------------------------------------------------------------------------
create table if not exists public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references public.users (id) on delete cascade,
  blocked_id  uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint blocks_no_self check (blocker_id <> blocked_id),
  constraint uq_blocks_pair unique (blocker_id, blocked_id)
);

create index if not exists idx_blocks_blocker on public.blocks (blocker_id);
create index if not exists idx_blocks_blocked on public.blocks (blocked_id);

create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid not null references public.users (id) on delete cascade,
  reported_user_id  uuid not null references public.users (id) on delete cascade,
  category          varchar(40) not null
                    check (category in ('SPAM', 'ABUSE', 'UNDERAGE_SUSPECTED', 'IMPERSONATION', 'OTHER')),
  description       varchar(1000) not null default '',
  status            varchar(20) not null default 'PENDING'
                    check (status in ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED')),
  created_at        timestamptz not null default now(),
  constraint reports_no_self check (reporter_id <> reported_user_id)
);

create index if not exists idx_reports_status_created on public.reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. 관심 표시(likes) · 상호 매칭(matches) · 대화방(conversations) · 메시지(messages)
-- ---------------------------------------------------------------------------
create table if not exists public.likes (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references public.users (id) on delete cascade,
  target_id   uuid not null references public.users (id) on delete cascade,
  decision    varchar(10) not null check (decision in ('LIKE', 'PASS')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint likes_no_self check (actor_id <> target_id),
  constraint uq_likes_actor_target unique (actor_id, target_id)
);

create index if not exists idx_likes_target_decision on public.likes (target_id, decision);

create trigger likes_set_updated_at
  before update on public.likes
  for each row execute function private.set_updated_at();

-- user_low_id < user_high_id 정규화로 동시 쌍방 좋아요 경쟁 조건(TC-006)에서도 단 1건만 생성 보장
create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  user_low_id   uuid not null references public.users (id) on delete cascade,
  user_high_id  uuid not null references public.users (id) on delete cascade,
  status        varchar(20) not null default 'ACTIVE'
                check (status in ('ACTIVE', 'UNMATCHED', 'BLOCKED')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint matches_ordered_pair check (user_low_id < user_high_id),
  constraint uq_matches_pair unique (user_low_id, user_high_id)
);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function private.set_updated_at();

create table if not exists public.match_members (
  match_id    uuid not null references public.matches (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index if not exists idx_match_members_user on public.match_members (user_id);

create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null unique references public.matches (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.users (id) on delete cascade,
  body             varchar(500) not null,
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint messages_body_len check (char_length(btrim(body)) between 1 and 500)
);

create index if not exists idx_messages_conv_created on public.messages (conversation_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. 보안 헬퍼 함수 (차단 여부 · 대화방 접근 권한 검사)
-- ---------------------------------------------------------------------------
create or replace function public.is_blocked_between(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.blocks b
     where (b.blocker_id = p_user_a and b.blocked_id = p_user_b)
        or (b.blocker_id = p_user_b and b.blocked_id = p_user_a)
  );
$$;

revoke all on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

-- 대화방 접근 가드: 호출자가 검증된 활성 성인이고, 해당 대화방의 ACTIVE 매칭 구성원이며,
-- 상대방도 ACTIVE 성인이고 양방향 차단이 없어야 true (TC-004, TC-008, TC-009)
create or replace function public.can_access_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select public.is_active_adult()
       and m.status = 'ACTIVE'
       and (m.user_low_id = auth.uid() or m.user_high_id = auth.uid())
       and not public.is_blocked_between(m.user_low_id, m.user_high_id)
       and exists (
         select 1
           from public.users partner
          where partner.id = case when m.user_low_id = auth.uid() then m.user_high_id else m.user_low_id end
            and partner.account_status = 'ACTIVE'
            and partner.adult_verified = true
       )
      from public.conversations c
      join public.matches m on m.id = c.match_id
     where c.id = p_conversation_id
  ), false);
$$;

revoke all on function public.can_access_conversation(uuid) from public, anon;
grant execute on function public.can_access_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. 트리거: 쌍방 좋아요 시 매칭·대화방 1건 원자적 생성 (MATCH-005 · TC-006)
-- ---------------------------------------------------------------------------
create or replace function private.handle_mutual_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_low      uuid := least(new.actor_id, new.target_id);
  v_high     uuid := greatest(new.actor_id, new.target_id);
  v_match_id uuid;
begin
  if new.decision <> 'LIKE' then
    return new;
  end if;

  -- 차단 관계이면 매칭 생성 거부
  if public.is_blocked_between(new.actor_id, new.target_id) then
    return new;
  end if;

  -- 상대방도 나에게 LIKE를 보냈는지 확인
  if exists (
    select 1
      from public.likes l
     where l.actor_id = new.target_id
       and l.target_id = new.actor_id
       and l.decision = 'LIKE'
  ) then
    insert into public.matches (user_low_id, user_high_id, status)
    values (v_low, v_high, 'ACTIVE')
    on conflict (user_low_id, user_high_id) do nothing
    returning id into v_match_id;

    if v_match_id is null then
      select id into v_match_id
        from public.matches
       where user_low_id = v_low and user_high_id = v_high;
    end if;

    if v_match_id is not null then
      insert into public.match_members (match_id, user_id)
      values (v_match_id, v_low), (v_match_id, v_high)
      on conflict do nothing;

      insert into public.conversations (match_id)
      values (v_match_id)
      on conflict (match_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_mutual_like() from public, anon, authenticated;

drop trigger if exists on_like_upserted on public.likes;
create trigger on_like_upserted
  after insert or update on public.likes
  for each row execute function private.handle_mutual_like();

-- ---------------------------------------------------------------------------
-- 6. 트리거: 차단 등록 즉시 기존 매칭을 BLOCKED 상태로 전환 (ADR-003 · TC-009)
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.matches
     set status = 'BLOCKED'
   where user_low_id = least(new.blocker_id, new.blocked_id)
     and user_high_id = greatest(new.blocker_id, new.blocked_id)
     and status = 'ACTIVE';
  return new;
end;
$$;

revoke all on function private.handle_new_block() from public, anon, authenticated;

drop trigger if exists on_block_created on public.blocks;
create trigger on_block_created
  after insert on public.blocks
  for each row execute function private.handle_new_block();

-- ---------------------------------------------------------------------------
-- 7. 추천 RPC: get_recommendations (MATCH-006 · TC-004 · TC-007)
--    - 호출자가 검증된 활성 성인이 아니면 즉시 예외(AGE_VERIFICATION_REQUIRED)
--    - 본인, 비활성(SUSPENDED/DELETED/PENDING), 성인 미검증/만료, 양방향 차단, 이미 평가한 대상 제외
-- ---------------------------------------------------------------------------
create or replace function public.get_recommendations(
  p_limit  int default 20,
  p_cursor timestamptz default null
)
returns table (
  user_id           uuid,
  nickname          varchar(20),
  bio               varchar(300),
  mbti              varchar(4),
  photo_visibility  varchar(20),
  created_at        timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_active_adult() then
    raise exception 'AGE_VERIFICATION_REQUIRED';
  end if;

  return query
  select
    p.user_id,
    p.nickname,
    p.bio,
    p.mbti,
    p.photo_visibility,
    p.created_at
  from public.profiles p
  join public.users u on u.id = p.user_id
  where p.user_id <> v_me
    and p.profile_status = 'ACTIVE'
    and u.account_status = 'ACTIVE'
    and u.adult_verified = true
    and (u.adult_verification_expires_at is null or u.adult_verification_expires_at > now())
    and not public.is_blocked_between(v_me, p.user_id)
    and not exists (
      select 1
        from public.likes l
       where l.actor_id = v_me
         and l.target_id = p.user_id
    )
    and (p_cursor is null or p.created_at < p_cursor)
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
end;
$$;

revoke all on function public.get_recommendations(int, timestamptz) from public, anon;
grant execute on function public.get_recommendations(int, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. 테이블 권한 및 RLS 정책 (Default Deny)
-- ---------------------------------------------------------------------------
revoke all on public.profiles          from public, anon, authenticated;
revoke all on public.interests         from public, anon, authenticated;
revoke all on public.profile_interests from public, anon, authenticated;
revoke all on public.blocks            from public, anon, authenticated;
revoke all on public.reports           from public, anon, authenticated;
revoke all on public.likes             from public, anon, authenticated;
revoke all on public.matches           from public, anon, authenticated;
revoke all on public.match_members     from public, anon, authenticated;
revoke all on public.conversations     from public, anon, authenticated;
revoke all on public.messages          from public, anon, authenticated;

grant select, insert, update on public.profiles          to authenticated;
grant select                 on public.interests         to authenticated;
grant select, insert, delete on public.profile_interests to authenticated;
grant select, insert, delete on public.blocks            to authenticated;
grant insert                 on public.reports           to authenticated; -- TC-010: 일반 계정은 SELECT 권한 자체가 없음
grant select, insert         on public.likes             to authenticated;
grant select                 on public.matches           to authenticated; -- INSERT/UPDATE는 트리거 전용
grant select                 on public.match_members     to authenticated;
grant select                 on public.conversations     to authenticated;
grant select, insert         on public.messages          to authenticated;

alter table public.profiles          enable row level security;
alter table public.interests         enable row level security;
alter table public.profile_interests enable row level security;
alter table public.blocks            enable row level security;
alter table public.reports           enable row level security;
alter table public.likes             enable row level security;
alter table public.matches           enable row level security;
alter table public.match_members     enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;

-- [profiles] 본인 프로필 또는(검증 성인인 경우) 차단되지 않은 활성 성인 프로필만 조회 가능
create policy profiles_select_policy on public.profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.is_active_adult()
      and profile_status = 'ACTIVE'
      and not public.is_blocked_between((select auth.uid()), user_id)
      and exists (
        select 1 from public.users u
         where u.id = profiles.user_id
           and u.account_status = 'ACTIVE'
           and u.adult_verified = true
      )
    )
  );

create policy profiles_insert_own_adult on public.profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_adult());

create policy profiles_update_own_adult on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()) and public.is_active_adult())
  with check (user_id = (select auth.uid()) and public.is_active_adult());

-- [interests] 활성 관심사 마스터 조회
create policy interests_select_active on public.interests
  for select to authenticated
  using (is_active = true);

-- [profile_interests] 검증된 성인만 본인 관심사 조회·추가·삭제 (API 계약 POST /users/me/interests)
create policy profile_interests_select_own on public.profile_interests
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy profile_interests_insert_adult on public.profile_interests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_adult());

create policy profile_interests_delete_adult on public.profile_interests
  for delete to authenticated
  using (user_id = (select auth.uid()) and public.is_active_adult());

-- [blocks] 본인이 차단한 목록만 조회·추가·해제
create policy blocks_select_own on public.blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy blocks_insert_own on public.blocks
  for insert to authenticated
  with check (
    blocker_id = (select auth.uid())
    and blocker_id <> blocked_id
    and exists (
      select 1 from public.users u
       where u.id = (select auth.uid()) and u.account_status = 'ACTIVE'
    )
  );

create policy blocks_delete_own on public.blocks
  for delete to authenticated
  using (blocker_id = (select auth.uid()));

-- [reports] 활성 회원의 본인 신고 접수만 허용, SELECT 정책 없음 (TC-010: 일반 계정 조회 차단)
create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and reporter_id <> reported_user_id
    and exists (
      select 1 from public.users u
       where u.id = (select auth.uid()) and u.account_status = 'ACTIVE'
    )
  );

-- [likes] 검증된 성인만 본인 좋아요 조회·등록 (차단 상대·미검증 상대에게는 불가, TC-004)
create policy likes_select_own on public.likes
  for select to authenticated
  using (actor_id = (select auth.uid()) and public.is_active_adult());

create policy likes_insert_adult on public.likes
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and actor_id <> target_id
    and public.is_active_adult()
    and not public.is_blocked_between(actor_id, target_id)
    and exists (
      select 1 from public.users target
       where target.id = target_id
         and target.account_status = 'ACTIVE'
         and target.adult_verified = true
    )
  );

-- [matches] 검증된 성인이면서 본인이 속한 ACTIVE 매칭만 조회 (차단 시 즉시 비노출)
create policy matches_select_member on public.matches
  for select to authenticated
  using (
    public.is_active_adult()
    and status = 'ACTIVE'
    and (user_low_id = (select auth.uid()) or user_high_id = (select auth.uid()))
    and not public.is_blocked_between(user_low_id, user_high_id)
  );

-- [match_members] 본인이 속한 활성 매칭의 멤버 행만 조회
create policy match_members_select_member on public.match_members
  for select to authenticated
  using (
    public.is_active_adult()
    and exists (
      select 1 from public.matches m
       where m.id = match_members.match_id
         and m.status = 'ACTIVE'
         and (m.user_low_id = (select auth.uid()) or m.user_high_id = (select auth.uid()))
         and not public.is_blocked_between(m.user_low_id, m.user_high_id)
    )
  );

-- [conversations] can_access_conversation 통과 시에만 조회
create policy conversations_select_member on public.conversations
  for select to authenticated
  using (public.can_access_conversation(id));

-- [messages] 활성 match 구성원 + 성인 인증 + 미차단인 경우에만 조회·전송 (TC-004, TC-008, TC-009)
create policy messages_select_member on public.messages
  for select to authenticated
  using (
    deleted_at is null
    and public.can_access_conversation(conversation_id)
  );

create policy messages_insert_member on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.can_access_conversation(conversation_id)
  );
