-- 0002_auth_profiles.sql
-- MATCH-003: Supabase Auth 기반 회원가입·로그인 (ADR-005) / MATCH-004 성인 게이트 기반 구조
-- 작성: 주한태
--
-- 0001과 달라진 점
--   1) public.users.id = auth.users.id (FK, ON DELETE CASCADE). auth_id VARCHAR 제거.
--   2) 가입 시 auth.users 트리거가 public.users 행을 자동 생성.
--   3) 열 단위 권한: 클라이언트는 nickname만 UPDATE 가능.
--      account_status · adult_verified · birth_year 등은 security definer 함수/Edge Function만 변경.
--      (0001은 RLS UPDATE 정책만 있어 사용자가 adult_verified=true로 바꿀 수 있었음)
--   4) consents는 클라이언트가 직접 INSERT 불가 — 가입 완료 함수가 기록.
--   5) 생년월일(DOB) 원본은 저장하지 않는다(ADR-002). 만 19세 판정에만 쓰고 birth_year만 남긴다.
--      이메일 가입은 signUp metadata로 받은 생년월일을 BEFORE INSERT 트리거가 검증한 뒤
--      auth.users에 저장되기 전에 출생연도로 바꿔 쓴다.
--
-- 가입 흐름
--   - 이메일: signUp({ options: { data: { signup: {...} } } })
--       → BEFORE 트리거: 검증 + metadata에서 birth_date 제거
--       → AFTER INSERT 트리거: users 행 생성(account_status='PENDING')
--       → AFTER UPDATE 트리거: email_confirmed_at 채워진 후 activate_user 호출(ACTIVE 전환 + 동의 기록)
--   - 소셜(Google): AFTER 트리거가 PENDING 행만 생성 → /auth/complete에서 rpc('complete_signup')
--
-- ⚠ 0001 객체를 DROP 후 재정의한다. 실데이터가 없다는 전제(2026-10-29 기준 실사용자 없음).
--   클라우드에 0001이 이미 적용되어 있어도 이 파일만으로 일관된 상태가 된다.
--
-- 되돌리기(down) — 필요 시 SQL로 수동 실행
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop trigger if exists on_auth_user_before_insert on auth.users;
--   drop function if exists public.handle_new_auth_user();
--   drop function if exists public.sanitize_new_auth_user();
--   drop function if exists public.complete_signup(text, date, text, text, boolean);
--   drop function if exists public.is_active_adult();
--   drop function if exists public.email_is_confirmed();
--   drop function if exists private.validate_signup(text, date, text, text, boolean);
--   drop function if exists private.activate_user(uuid, text, smallint, text, text);
--   drop function if exists private.jsonb_strip_key(jsonb, text);
--   drop function if exists private.set_updated_at();
--   drop table if exists public.consents;
--   drop table if exists public.users;
--   drop schema if exists private;

-- ---------------------------------------------------------------------------
-- 0. 내부 전용 스키마 (PostgREST로 노출되지 않음)
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. 0001 객체 정리
-- ---------------------------------------------------------------------------
drop table if exists public.consents cascade;
drop table if exists public.users cascade;

do $$ begin
  create type public.account_status_type as enum ('ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. 테이블
-- ---------------------------------------------------------------------------
create table public.users (
  id                             uuid primary key references auth.users (id) on delete cascade,
  nickname                       varchar(20),
  full_name                      varchar(50),
  birth_year                     smallint,
  account_status                 public.account_status_type not null default 'PENDING',
  signup_completed_at            timestamptz,
  -- 가입 시 "만 19세 이상입니다" 자기 확인 시각 (성인 인증 아님 — 안내용)
  adult_self_declared_at         timestamptz,
  -- MATCH-004: 정식 성인 인증 결과. Edge Function(service_role)만 기록한다.
  adult_verified                 boolean not null default false,
  adult_verified_at              timestamptz,
  adult_verification_expires_at  timestamptz,
  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now(),
  constraint users_nickname_len check (nickname is null or char_length(btrim(nickname)) between 2 and 20),
  constraint users_full_name_len check (full_name is null or char_length(btrim(full_name)) between 1 and 50),
  constraint users_birth_year_range check (birth_year is null or birth_year between 1900 and 2100),
  constraint users_active_requires_signup check (account_status <> 'ACTIVE' or signup_completed_at is not null)
);

comment on table public.users is 'MATCH-003 회원 계정. id = auth.users.id. 생년월일 원본은 저장하지 않음(ADR-002).';
comment on column public.users.adult_verified is 'MATCH-004 정식 성인 인증 여부. 클라이언트 UPDATE 불가(열 권한), Edge Function만 기록.';

create table public.consents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  kind         varchar(50) not null
               check (kind in ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'ADULT_SELF_DECLARATION')),
  version      varchar(30) not null,
  accepted_at  timestamptz not null default now(),
  revoked_at   timestamptz
);

create index idx_users_account_status on public.users (account_status);
create index idx_consents_user_id on public.consents (user_id);
create unique index uq_consents_active on public.consents (user_id, kind, version) where revoked_at is null;

-- ---------------------------------------------------------------------------
-- 3. updated_at 자동 갱신
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. 가입 입력 검증 (내부 전용). 오류 message = 코드 문자열 → 클라이언트가 한국어로 매핑.
--    클라이언트 검증(src/lib/auth/validation.ts)과 같은 규칙. 최종 판정은 여기.
-- ---------------------------------------------------------------------------
create or replace function private.validate_signup(
  p_full_name        text,
  p_birth_date       date,
  p_terms_version    text,
  p_privacy_version  text,
  p_adult_self_check boolean
)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  if char_length(btrim(coalesce(p_full_name, ''))) not between 1 and 50 then
    raise exception 'INVALID_NAME';
  end if;

  if p_birth_date is null or p_birth_date < date '1900-01-01' or p_birth_date > v_today then
    raise exception 'INVALID_BIRTH_DATE';
  end if;

  -- 만 나이 (한국 시간 기준). 19세 미만은 가입 불가.
  if extract(year from age(v_today, p_birth_date)) < 19 then
    raise exception 'UNDERAGE';
  end if;

  if coalesce(p_adult_self_check, false) is not true then
    raise exception 'ADULT_SELF_CHECK_REQUIRED';
  end if;

  if nullif(btrim(coalesce(p_terms_version, '')), '') is null
     or nullif(btrim(coalesce(p_privacy_version, '')), '') is null then
    raise exception 'CONSENT_REQUIRED';
  end if;

  -- 허용된 초안 약관 버전만 허용 (임의 문자열 동의 방지)
  if btrim(p_terms_version) not in ('terms-2026-10-draft', 'terms-test')
     or btrim(p_privacy_version) not in ('privacy-2026-10-draft', 'privacy-test') then
    raise exception 'INVALID_CONSENT_VERSION';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. 계정 활성화 (내부 전용) — 검증을 통과한 값만 받는다.
-- ---------------------------------------------------------------------------
create or replace function private.activate_user(
  p_user_id         uuid,
  p_full_name       text,
  p_birth_year      smallint,
  p_terms_version   text,
  p_privacy_version text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.account_status_type;
begin
  select account_status into v_status from public.users where id = p_user_id for update;

  if v_status is null then
    raise exception 'ACCOUNT_NOT_FOUND';
  elsif v_status in ('SUSPENDED', 'DELETED') then
    raise exception 'ACCOUNT_%', v_status;
  elsif v_status = 'ACTIVE' then
    raise exception 'SIGNUP_ALREADY_COMPLETED';
  end if;

  insert into public.consents (user_id, kind, version) values
    (p_user_id, 'TERMS_OF_SERVICE',       btrim(p_terms_version)),
    (p_user_id, 'PRIVACY_POLICY',         btrim(p_privacy_version)),
    (p_user_id, 'ADULT_SELF_DECLARATION', 'self-check-v1')
  on conflict do nothing;

  update public.users
     set full_name              = btrim(p_full_name),
         birth_year             = p_birth_year,
         adult_self_declared_at = now(),
         signup_completed_at    = now(),
         account_status         = 'ACTIVE'
   where id = p_user_id;
end;
$$;

revoke all on function private.validate_signup(text, date, text, text, boolean) from public, anon, authenticated;
revoke all on function private.activate_user(uuid, text, smallint, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5.1. jsonb 내 특정 키 및 생년월일 변종 키 재귀적 제거 헬퍼 (ADR-002: 생년월일 원본 저장 절대 금지)
-- ---------------------------------------------------------------------------
create or replace function private.jsonb_strip_key(p_value jsonb, p_key text)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case jsonb_typeof(p_value)
    when 'object' then (
      select coalesce(jsonb_object_agg(e.key, private.jsonb_strip_key(e.value, p_key)), '{}'::jsonb)
      from jsonb_each(coalesce(p_value, '{}'::jsonb)) as e
      where lower(e.key) <> lower(p_key)
    )
    when 'array' then (
      select coalesce(jsonb_agg(private.jsonb_strip_key(e.value, p_key)), '[]'::jsonb)
      from jsonb_array_elements(coalesce(p_value, '[]'::jsonb)) as e
    )
    else p_value
  end;
$$;

create or replace function private.jsonb_strip_sensitive_birth_keys(p_value jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case jsonb_typeof(p_value)
    when 'object' then (
      select coalesce(jsonb_object_agg(e.key, private.jsonb_strip_sensitive_birth_keys(e.value)), '{}'::jsonb)
      from jsonb_each(coalesce(p_value, '{}'::jsonb)) as e
      where lower(e.key) not in ('birth_date', 'birthdate', 'date_of_birth', 'dob', 'birthday')
    )
    when 'array' then (
      select coalesce(jsonb_agg(private.jsonb_strip_sensitive_birth_keys(e.value)), '[]'::jsonb)
      from jsonb_array_elements(coalesce(p_value, '[]'::jsonb)) as e
    )
    else p_value
  end;
$$;

revoke all on function private.jsonb_strip_key(jsonb, text) from public, anon, authenticated;
revoke all on function private.jsonb_strip_sensitive_birth_keys(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. auth.users BEFORE INSERT OR UPDATE — 이메일 가입 입력 검증 + 생년월일 전역 제거
--    raw_user_meta_data.signup 이 있으면 검증하고, 저장 전에 허용된 필드만 남긴다.
--      { signup: { full_name, birth_year, terms_version, privacy_version, validated: true } }
--    검증 실패 → 예외 → 가입 자체가 실패한다(fail-closed).
--    생년월일(birth_date 및 관련 변종) 원본은 문서 전체에서 재귀적으로 완전 제거한다(ADR-002).
-- ---------------------------------------------------------------------------
create or replace function public.sanitize_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signup     jsonb := new.raw_user_meta_data -> 'signup';
  v_birth_date date;
begin
  -- 1) UPDATE: auth.updateUser 등으로 생년월일을 다시 넣거나 validated 값을 조작하는 시도 차단
  if TG_OP = 'UPDATE' then
    new.raw_user_meta_data :=
      private.jsonb_strip_sensitive_birth_keys(coalesce(new.raw_user_meta_data, '{}'::jsonb));

    if old.raw_user_meta_data ? 'signup' then
      new.raw_user_meta_data := jsonb_set(
        new.raw_user_meta_data,
        '{signup}',
        private.jsonb_strip_sensitive_birth_keys(old.raw_user_meta_data -> 'signup')
      );
    elsif new.raw_user_meta_data ? 'signup' then
      new.raw_user_meta_data := new.raw_user_meta_data - 'signup';
    end if;

    return new;
  end if;

  -- 2) INSERT: signup 객체가 없으면 (소셜 가입 등) 전체 문서에서 생년월일 관련 키 재귀 제거 후 반환
  if v_signup is null then
    new.raw_user_meta_data :=
      private.jsonb_strip_sensitive_birth_keys(coalesce(new.raw_user_meta_data, '{}'::jsonb));
    return new;
  end if;

  if jsonb_typeof(v_signup) <> 'object' then
    raise exception 'INVALID_SIGNUP_PAYLOAD';
  end if;

  begin
    v_birth_date := (v_signup ->> 'birth_date')::date;
  exception when others then
    raise exception 'INVALID_BIRTH_DATE';
  end;

  perform private.validate_signup(
    v_signup ->> 'full_name',
    v_birth_date,
    v_signup ->> 'terms_version',
    v_signup ->> 'privacy_version',
    (v_signup ->> 'adult_self_check')::boolean
  );

  -- 공식 이메일 가입 경로: 허용 키(signup)만 남기고 생년월일 대신 birth_year만 안전하게 작성 (ADR-002 화이트리스트)
  new.raw_user_meta_data := jsonb_build_object(
    'signup',
    jsonb_build_object(
      'full_name',       btrim(v_signup ->> 'full_name'),
      'birth_year',      extract(year from v_birth_date)::int,
      'terms_version',   btrim(v_signup ->> 'terms_version'),
      'privacy_version', btrim(v_signup ->> 'privacy_version'),
      'validated',       true
    )
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. auth.users AFTER INSERT OR UPDATE — users 행 생성 및 이메일 확인 후 ACTIVE 활성화
--    INSERT 시에는 항상 PENDING 상태로 생성한다.
--    이메일 확인(email_confirmed_at 채워짐)이 완료된 후에만 activate_user를 호출하여 ACTIVE로 전환한다.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signup jsonb := new.raw_user_meta_data -> 'signup';
begin
  if TG_OP = 'INSERT' then
    insert into public.users (id, account_status) values (new.id, 'PENDING')
    on conflict (id) do nothing;
  end if;

  -- email_confirmed_at 이 채워진 시점에 검증된 가입 정보가 있으면 계정 활성화
  -- 1) INSERT 시 이미 확인된 경우
  -- 2) UPDATE 시 email_confirmed_at 이 null에서 실제 값으로 변경된 경우
  if ((TG_OP = 'INSERT' and new.email_confirmed_at is not null)
      or (TG_OP = 'UPDATE' and old.email_confirmed_at is null and new.email_confirmed_at is not null))
     and v_signup is not null
     and (v_signup ->> 'validated')::boolean is true then
    perform private.activate_user(
      new.id,
      v_signup ->> 'full_name',
      (v_signup ->> 'birth_year')::smallint,
      v_signup ->> 'terms_version',
      v_signup ->> 'privacy_version'
    );
  end if;

  return new;
end;
$$;

revoke all on function public.sanitize_new_auth_user() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
-- anon/authenticated 에는 주지 않는다. security definer 로 auth.users 를 고친다.
grant execute on function public.sanitize_new_auth_user() to supabase_auth_admin;
grant execute on function public.handle_new_auth_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_before_insert on auth.users;
create trigger on_auth_user_before_insert
  before insert or update on auth.users
  for each row execute function public.sanitize_new_auth_user();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- 8. RPC: 소셜 로그인 사용자의 가입 완료 (/auth/complete)
-- ---------------------------------------------------------------------------
create or replace function public.complete_signup(
  p_full_name        text,
  p_birth_date       date,
  p_terms_version    text,
  p_privacy_version  text,
  p_adult_self_check boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email_confirmed boolean;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  -- email_confirmed_at 확인 (이메일 미확인 세션은 가입 완료 불가)
  select (email_confirmed_at is not null) into v_email_confirmed
  from auth.users
  where id = auth.uid();

  if coalesce(v_email_confirmed, false) is false then
    raise exception 'EMAIL_NOT_CONFIRMED';
  end if;

  perform private.validate_signup(
    p_full_name, p_birth_date, p_terms_version, p_privacy_version, p_adult_self_check
  );

  perform private.activate_user(
    auth.uid(),
    p_full_name,
    extract(year from p_birth_date)::smallint,
    p_terms_version,
    p_privacy_version
  );
end;
$$;

revoke all on function public.complete_signup(text, date, text, text, boolean) from public, anon;
grant execute on function public.complete_signup(text, date, text, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. MATCH-004 대비 헬퍼: "ACTIVE + 정식 성인 인증 + 미만료"
--    매칭·채팅 테이블 RLS에서 `using (public.is_active_adult())` 형태로 재사용한다.
--    다른 사용자 상태를 캐묻는 용도로 쓰지 못하게 인자 없이 본인만 판정한다.
-- ---------------------------------------------------------------------------
create or replace function public.is_active_adult()
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
     where u.id = auth.uid()
  ), false);
$$;

revoke all on function public.is_active_adult() from public, anon;
grant execute on function public.is_active_adult() to authenticated;

-- ---------------------------------------------------------------------------
-- 9.1. 이메일 확인 여부 판정 헬퍼 (ADR-005: RLS 경계에서 사용)
--      Supabase Auth 기본 액세스 토큰에는 email_confirmed_at 클레임이 없으므로,
--      auth.users 테이블의 실제 확인 시각 유무를 security definer 로 안전하게 조회한다.
-- ---------------------------------------------------------------------------
create or replace function public.email_is_confirmed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
     where id = auth.uid()
       and email_confirmed_at is not null
  );
$$;

revoke all on function public.email_is_confirmed() from public, anon;
grant execute on function public.email_is_confirmed() to authenticated;

-- ---------------------------------------------------------------------------
-- 10. 테이블 권한 (열 단위) + RLS default deny
-- ---------------------------------------------------------------------------
revoke all on public.users    from public, anon, authenticated;
revoke all on public.consents from public, anon, authenticated;

grant select on public.users to authenticated;
grant update (nickname, updated_at) on public.users to authenticated;   -- 그 외 열은 UPDATE 권한 자체가 없음 (ADR-002)
grant select on public.consents to authenticated;            -- INSERT는 activate_user만

alter table public.users    enable row level security;
alter table public.consents enable row level security;

-- 본인 행 조회: ACTIVE 사용자 또는 이메일 확인이 완료된 PENDING 사용자만 조회 가능 (ADR-005)
-- 정지/탈퇴 사용자 및 이메일 미확인 세션의 개인정보(full_name, birth_year) 조회를 RLS 레벨에서 차단
create policy users_select_own on public.users
  for select to authenticated
  using (
    id = (select auth.uid())
    and account_status in ('ACTIVE', 'PENDING')
    and (
      account_status = 'ACTIVE'
      or (account_status = 'PENDING' and (select public.email_is_confirmed()))
    )
  );

-- 본인 + ACTIVE만 수정 (열 권한으로 nickname만 가능)
create policy users_update_own_active on public.users
  for update to authenticated
  using (id = (select auth.uid()) and account_status = 'ACTIVE')
  with check (id = (select auth.uid()) and account_status = 'ACTIVE');

-- 본인 동의 내역 조회 (ACTIVE/PENDING 사용자만 조회 가능)
create policy consents_select_own on public.consents
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.account_status in ('ACTIVE', 'PENDING')
    )
  );
