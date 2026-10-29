-- supabase/tests/0002_auth_profiles_test.sql
-- MATCH-003 / TC-003·TC-004 기초: 가입 트리거·열 권한·RLS 허용/거부 테스트 (pgTAP)
-- 실행: Docker + 로컬 Supabase에서  npx supabase start  →  npx supabase test db
-- 모든 데이터는 가짜 값이며 트랜잭션 롤백으로 남지 않는다.

begin;
create extension if not exists pgtap with schema extensions;

select plan(21);

-- 테스트용 헬퍼: 특정 사용자로 요청하는 것처럼 role/JWT claim 설정
create or replace function pg_temp.login_as(p_uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

create or replace function pg_temp.logout()
returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- ---------------------------------------------------------------------------
-- 1) 이메일 가입 (정상, 만 19세 이상)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values (
  'aaaaaaaa-0000-4000-8000-000000000001', 'adult@test.local',
  jsonb_build_object('signup', jsonb_build_object(
    'full_name', '홍길동', 'birth_date', '1995-05-05',
    'terms_version', 'terms-test', 'privacy_version', 'privacy-test', 'adult_self_check', true))
);

select is(
  (select account_status::text from public.users where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'PENDING', '이메일 가입 직후: 이메일 확인 전에는 PENDING 유지');

update auth.users
   set email_confirmed_at = now()
 where id = 'aaaaaaaa-0000-4000-8000-000000000001';

select is(
  (select account_status::text from public.users where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'ACTIVE', '이메일 확인 완료 시: ACTIVE로 전환');

select is(
  (select birth_year from public.users where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  1995::smallint, '이메일 가입: birth_year만 저장');

select ok(
  (select raw_user_meta_data -> 'signup' ->> 'birth_date' is null
     from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  '이메일 가입: auth.users metadata에 생년월일 원본이 남지 않음 (ADR-002)');

select is(
  (select count(*)::int from public.consents where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  3, '이메일 가입: 동의 3건 기록');

select is(
  (select adult_verified from public.users where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  false, '자기 확인만으로는 adult_verified=false (정식 인증 아님)');

-- ---------------------------------------------------------------------------
-- 2) 이메일 가입 거부 케이스 (fail-closed)
-- ---------------------------------------------------------------------------
select throws_like(
  $$ insert into auth.users (id, email, raw_user_meta_data) values (
       'aaaaaaaa-0000-4000-8000-000000000002', 'minor@test.local',
       jsonb_build_object('signup', jsonb_build_object(
         'full_name', '미성년', 'birth_date', to_char((now() at time zone 'Asia/Seoul')::date - interval '18 years', 'YYYY-MM-DD'),
         'terms_version', 't', 'privacy_version', 'p', 'adult_self_check', true))) $$,
  '%UNDERAGE%', '만 19세 미만 가입 거부');

select throws_like(
  $$ insert into auth.users (id, email, raw_user_meta_data) values (
       'aaaaaaaa-0000-4000-8000-000000000003', 'nocheck@test.local',
       jsonb_build_object('signup', jsonb_build_object(
         'full_name', '체크없음', 'birth_date', '1990-01-01',
         'terms_version', 't', 'privacy_version', 'p', 'adult_self_check', false))) $$,
  '%ADULT_SELF_CHECK_REQUIRED%', '만 19세 자기 확인 미체크 거부');

select throws_like(
  $$ insert into auth.users (id, email, raw_user_meta_data) values (
       'aaaaaaaa-0000-4000-8000-000000000004', 'noconsent@test.local',
       jsonb_build_object('signup', jsonb_build_object(
         'full_name', '동의없음', 'birth_date', '1990-01-01', 'adult_self_check', true))) $$,
  '%CONSENT_REQUIRED%', '약관 동의 누락 거부');

select throws_like(
  $$ insert into auth.users (id, email, raw_user_meta_data) values (
       'aaaaaaaa-0000-4000-8000-000000000005', 'forged@test.local',
       jsonb_build_object('signup', jsonb_build_object(
         'full_name', '위조', 'birth_year', 1990, 'validated', true,
         'terms_version', 't', 'privacy_version', 'p', 'adult_self_check', true))) $$,
  '%INVALID_BIRTH_DATE%', 'validated/birth_year를 직접 넣어 우회 시도 → 거부');

-- ---------------------------------------------------------------------------
-- 3) 소셜(Google) 로그인 (signup metadata 없음) → PENDING
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data)
values ('bbbbbbbb-0000-4000-8000-000000000001', 'googleuser@test.local', '{"provider":"google"}');

select is(
  (select account_status::text from public.users where id = 'bbbbbbbb-0000-4000-8000-000000000001'),
  'PENDING', 'Google 첫 로그인: PENDING');

-- ---------------------------------------------------------------------------
-- 4) RLS / 열 권한 (authenticated 역할)
-- ---------------------------------------------------------------------------
select pg_temp.login_as('aaaaaaaa-0000-4000-8000-000000000001');

select is((select count(*)::int from public.users), 1, 'RLS: 본인 행만 보임');

select throws_ok(
  $$ update public.users set adult_verified = true where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '42501', null, '열 권한: adult_verified 직접 수정 거부');

select throws_ok(
  $$ update public.users set account_status = 'ACTIVE' $$,
  '42501', null, '열 권한: account_status 직접 수정 거부');

select throws_ok(
  $$ insert into public.consents (user_id, kind, version)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'TERMS_OF_SERVICE', 'x') $$,
  '42501', null, 'consents 직접 INSERT 거부');

select lives_ok(
  $$ update public.users set nickname = '길동이' where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'nickname은 본인이 수정 가능');

select is(public.is_active_adult(), false, 'is_active_adult: 미인증 성인 → false');

-- 다른 사용자 행 수정 시도 → RLS로 0행
update public.users set nickname = '탈취시도' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
select pg_temp.logout();
select is(
  (select nickname from public.users where id = 'bbbbbbbb-0000-4000-8000-000000000001'),
  null, 'RLS: 타인 행 수정 불가');

-- ---------------------------------------------------------------------------
-- 5) complete_signup RPC (Google 소셜 사용자)
-- ---------------------------------------------------------------------------
select pg_temp.login_as('bbbbbbbb-0000-4000-8000-000000000001');

select throws_like(
  $$ select public.complete_signup('구글미성년', '2015-01-01', 't', 'p', true) $$,
  '%UNDERAGE%', 'complete_signup: 미성년 거부');

select lives_ok(
  $$ select public.complete_signup('구글유저', '1992-03-03', 't', 'p', true) $$,
  'complete_signup: 정상 완료');

select throws_like(
  $$ select public.complete_signup('구글유저', '1992-03-03', 't', 'p', true) $$,
  '%SIGNUP_ALREADY_COMPLETED%', 'complete_signup: 중복 호출 거부');

select pg_temp.logout();

select * from finish();
rollback;

