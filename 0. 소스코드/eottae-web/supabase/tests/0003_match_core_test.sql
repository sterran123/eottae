-- supabase/tests/0003_match_core_test.sql
-- MATCH-005~009 / TC-003(DB)·TC-006~TC-010 기초: 매칭·추천·메시지·신고 RLS (pgTAP)
-- 실행: Docker + 로컬 Supabase에서  npx supabase start  →  npx supabase test db
-- 이 파일은 기대 동작을 적는다. 실행 결과를 테스트_케이스_마스터.md 에 적지 않는다.
-- 모든 데이터는 가짜 UUID·가짜 이름이며 트랜잭션 롤백으로 남지 않는다.
-- login_as 는 0002와 같다. 표준 토큰의 sub/role만 넣고 email_confirmed_at 클레임은 넣지 않는다.

begin;
create extension if not exists pgtap with schema extensions;

select plan(126);

create or replace function pg_temp.login_as(p_uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end $$;

create or replace function pg_temp.logout()
returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', '', true);
end $$;

create or replace function pg_temp.become_anon()
returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', '', true);
end $$;

create or replace function pg_temp.become_nojwt()
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', '', true);
end $$;

-- 11111111-...0001 본인(me)     22222222-...0002 추천 후보(good)
-- 33333333-...0003 내가 차단   44444444-...0004 나를 차단
-- 55555555-...0005 SUSPENDED(휴면·비활성으로 제외)  66666666-...0006 성인 인증 없음
-- 77777777-...0007 인증 만료   88888888-...0008 draft 프로필
-- 99999999-...0009 제3자       bbbbbbbb-...000b operator
-- cccccccc-...000c PENDING
create or replace function pg_temp.make_user(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_nickname text,
  p_adult boolean,
  p_expires interval,
  p_status text
)
returns void
language plpgsql
as $$
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (
    p_id,
    p_email,
    jsonb_build_object(
      'signup', jsonb_build_object(
        'full_name', p_full_name,
        'birth_date', '1990-01-01',
        'terms_version', 'terms-test',
        'privacy_version', 'privacy-test',
        'adult_self_check', true
      )
    )
  );

  update auth.users
     set email_confirmed_at = now()
   where id = p_id;

  update public.users
     set nickname = p_nickname,
         adult_verified = p_adult,
         adult_verification_expires_at = case
           when p_expires is null then null
           else now() + p_expires
         end,
         account_status = p_status::public.account_status_type
   where id = p_id;
end $$;

select pg_temp.make_user('11111111-0000-4000-8000-000000000001', 'me@test.local', '본인이름', '본인닉', true, interval '1 year', 'ACTIVE');
select pg_temp.make_user('22222222-0000-4000-8000-000000000002', 'good@test.local', '비밀이름', '후보닉', true, interval '1 year', 'ACTIVE');
select pg_temp.make_user('33333333-0000-4000-8000-000000000003', 'blocked@test.local', '테스터', '차단대상', true, interval '1 year', 'ACTIVE');
select pg_temp.make_user('44444444-0000-4000-8000-000000000004', 'blocker@test.local', '테스터', '나를차단', true, interval '1 year', 'ACTIVE');
select pg_temp.make_user('55555555-0000-4000-8000-000000000005', 'suspended@test.local', '테스터', '휴면후보', true, interval '1 year', 'SUSPENDED');
select pg_temp.make_user('66666666-0000-4000-8000-000000000006', 'unverified@test.local', '테스터', '미인증', false, null, 'ACTIVE');
select pg_temp.make_user('77777777-0000-4000-8000-000000000007', 'expired@test.local', '테스터', '만료님', true, interval '-1 day', 'ACTIVE');
select pg_temp.make_user('88888888-0000-4000-8000-000000000008', 'draft@test.local', '테스터', '초안님', true, interval '1 year', 'ACTIVE');
select pg_temp.make_user('99999999-0000-4000-8000-000000000009', 'third@test.local', '테스터', '제삼자', true, interval '1 year', 'ACTIVE');
select pg_temp.make_user('bbbbbbbb-0000-4000-8000-00000000000b', 'operator@test.local', '테스터', '운영자', false, null, 'ACTIVE');
select pg_temp.make_user('cccccccc-0000-4000-8000-00000000000c', 'pending@test.local', '테스터', '대기님', true, interval '1 year', 'PENDING');

insert into public.profiles (
  user_id, bio, photo_visibility, profile_status, mbti, avoid_mbti,
  target_preference, relation_goal, preferred_distance
) values
  ('11111111-0000-4000-8000-000000000001', '본인소개', 'hidden', 'active', 'ENFP', '{}', 'any', 'open', 'within_5km'),
  ('22222222-0000-4000-8000-000000000002', '후보소개', 'preview', 'active', 'INFJ', '{}', 'opposite', 'serious', 'within_10km'),
  ('33333333-0000-4000-8000-000000000003', '차단바이오', 'hidden', 'active', 'unknown', '{}', 'any', 'open', '거리 무관'),
  ('44444444-0000-4000-8000-000000000004', '역차단바이오', 'hidden', 'active', 'unknown', '{}', 'any', 'open', '거리 무관'),
  ('55555555-0000-4000-8000-000000000005', '휴면바이오', 'hidden', 'active', 'unknown', '{}', 'any', 'open', '거리 무관'),
  ('66666666-0000-4000-8000-000000000006', '미인증바이오', 'hidden', 'active', 'unknown', '{}', 'any', 'open', '거리 무관'),
  ('77777777-0000-4000-8000-000000000007', '만료바이오', 'hidden', 'active', 'unknown', '{}', 'any', 'open', '거리 무관'),
  ('88888888-0000-4000-8000-000000000008', '초안바이오', 'hidden', 'draft', 'unknown', '{}', 'any', 'open', '거리 무관'),
  ('cccccccc-0000-4000-8000-00000000000c', '대기바이오', 'hidden', 'active', 'unknown', '{}', 'any', 'open', '거리 무관');

insert into public.user_interests (user_id, interest_id) values
  ('11111111-0000-4000-8000-000000000001', 'cafe'),
  ('11111111-0000-4000-8000-000000000001', 'wine'),
  ('11111111-0000-4000-8000-000000000001', 'park'),
  ('22222222-0000-4000-8000-000000000002', 'cafe'),
  ('22222222-0000-4000-8000-000000000002', 'wine'),
  ('22222222-0000-4000-8000-000000000002', 'kpop'),
  ('33333333-0000-4000-8000-000000000003', 'cafe'),
  ('44444444-0000-4000-8000-000000000004', 'cafe'),
  ('55555555-0000-4000-8000-000000000005', 'cafe'),
  ('66666666-0000-4000-8000-000000000006', 'cafe'),
  ('77777777-0000-4000-8000-000000000007', 'cafe'),
  ('88888888-0000-4000-8000-000000000008', 'cafe'),
  ('cccccccc-0000-4000-8000-00000000000c', 'cafe');

insert into public.blocks (blocker_id, blocked_user_id) values
  ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000003'),
  ('44444444-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000001');

insert into public.user_roles (user_id, role)
values ('bbbbbbbb-0000-4000-8000-00000000000b', 'operator');

select is((select count(*)::int from public.interests), 50, '관심사 시드는 demo-data 50개');
select is((select label from public.interests where id = 'cafe'), '감성 카페 투어', 'cafe 라벨은 demo-data 그대로');
select is((select category from public.interests where id = 'cafe'), 'place', 'cafe 카테고리');

select ok(
  position('pg_advisory_xact_lock' in pg_get_functiondef('private.ensure_mutual_match()'::regprocedure)) > 0,
  '쌍 UUID 트랜잭션 잠금(pg_advisory_xact_lock)'
);
select ok(
  exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'messages'
  ),
  'messages가 supabase_realtime publication에 있음'
);
select ok(
  exists (select 1 from storage.buckets b where b.id = 'chat-media' and b.public = false),
  'chat-media 비공개 버킷'
);
select ok(
  (select count(*)::int from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname like 'chat_media_%') >= 4,
  'chat-media 읽기·쓰기 정책'
);
select ok(
  coalesce((
    select position('owner' in qual) > 0
       and position('owner' in with_check) > 0
      from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'chat_media_update'
  ), false),
  'chat-media UPDATE는 업로더(owner)만'
);
select ok(
  coalesce((
    select position('owner' in qual) > 0
       and with_check is null
      from pg_policies
     where schemaname = 'storage'
       and tablename = 'objects'
       and policyname = 'chat_media_delete'
  ), false),
  'chat-media DELETE는 업로더(owner)만'
);

-- ---------------------------------------------------------------------------
-- 익명·JWT 없음 (TC-003 DB).
-- users·reports·user_roles와 0003 테이블은 anon GRANT가 없어 42501.
-- ---------------------------------------------------------------------------
select pg_temp.become_anon();
select throws_ok(
  $$ select count(*) from public.users $$,
  '42501', null, 'anon은 users SELECT 불가');
select throws_ok(
  $$ select count(*) from public.reports $$,
  '42501', null, 'anon은 reports SELECT 불가');
select throws_ok(
  $$ select count(*) from public.user_roles $$,
  '42501', null, 'anon은 user_roles SELECT 불가');
select throws_ok(
  $$ select count(*) from public.interests $$,
  '42501', null, 'anon은 interests SELECT 불가');
select throws_ok(
  $$ select count(*) from public.profiles $$,
  '42501', null, 'anon은 profiles SELECT 불가');
select throws_ok(
  $$ select count(*) from public.user_interests $$,
  '42501', null, 'anon은 user_interests SELECT 불가');
select throws_ok(
  $$ select count(*) from public.profile_answers $$,
  '42501', null, 'anon은 profile_answers SELECT 불가');
select throws_ok(
  $$ select count(*) from public.likes $$,
  '42501', null, 'anon은 likes SELECT 불가');
select throws_ok(
  $$ select count(*) from public.matches $$,
  '42501', null, 'anon은 matches SELECT 불가');
select throws_ok(
  $$ select count(*) from public.match_members $$,
  '42501', null, 'anon은 match_members SELECT 불가');
select throws_ok(
  $$ select count(*) from public.conversations $$,
  '42501', null, 'anon은 conversations SELECT 불가');
select throws_ok(
  $$ select count(*) from public.blocks $$,
  '42501', null, 'anon은 blocks SELECT 불가');
select throws_ok(
  $$ select count(*) from public.messages $$,
  '42501', null, 'anon은 messages SELECT 불가');
select throws_ok(
  $$ select public.get_recommendations(null) $$,
  '42501', null, 'anon은 get_recommendations 실행 불가');
select pg_temp.logout();

select pg_temp.become_nojwt();
select is((select count(*)::int from public.users), 0, 'JWT 없는 authenticated: users 0건');
select is((select count(*)::int from public.interests), 0, 'JWT 없는 authenticated: interests 0건');
select is((select count(*)::int from public.profiles), 0, 'JWT 없는 authenticated: profiles 0건');
select is((select count(*)::int from public.messages), 0, 'JWT 없는 authenticated: messages 0건');
select pg_temp.logout();

-- 미성인 = 정식 성인 인증이 없는 계정. is_active_adult()가 false면 likes INSERT 거부.
select pg_temp.login_as('66666666-0000-4000-8000-000000000006');
select throws_ok(
  $$ insert into public.likes (actor_id, target_id, decision)
     values ('66666666-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000002', 'yes') $$,
  '42501', null, '미성인(성인 인증 없음) likes INSERT 거부');
select pg_temp.logout();

-- 타인 신고가 있어도 authenticated SELECT 는 본인 행만 본다.
insert into public.reports (reporter_id, reported_user_id, category, description)
values (
  '22222222-0000-4000-8000-000000000002',
  '33333333-0000-4000-8000-000000000003',
  'scam',
  '타인 신고 본문'
);

select pg_temp.login_as('11111111-0000-4000-8000-000000000001');
select throws_ok(
  $$ select * from public.user_roles $$,
  '42501', null, 'authenticated는 user_roles SELECT 불가');
select is(
  (select count(*)::int from public.reports where reporter_id = (select auth.uid())),
  0,
  'authenticated reports SELECT는 본인 행 0건');
select is(
  (select count(*)::int from public.reports where reporter_id is distinct from (select auth.uid())),
  0,
  'authenticated reports SELECT는 타인 행 0건');
select lives_ok(
  $$
  do $probe$
  declare
    v_id uuid;
  begin
    insert into public.reports (reporter_id, reported_user_id, category, description)
    values (
      '11111111-0000-4000-8000-000000000001',
      '22222222-0000-4000-8000-000000000002',
      'other',
      'returning 확인'
    )
    returning id into v_id;
    if v_id is null then
      raise exception 'RETURNING id is null';
    end if;
  end
  $probe$;
  $$,
  'reports INSERT RETURNING id 성공');
select throws_ok(
  $$ insert into public.user_roles (user_id, role)
     values ('11111111-0000-4000-8000-000000000001', 'operator') $$,
  '42501', null, 'authenticated는 user_roles INSERT 불가');

select is(jsonb_array_length(public.get_recommendations(null)->'items'), 1, '추천은 조건 통과 후보 1명');
select is(
  (public.get_recommendations(null)->'items'->0->>'user_id'),
  '22222222-0000-4000-8000-000000000002',
  '추천 후보는 검증된 활성 프로필');
select ok(
  position('11111111-0000-4000-8000-000000000001' in (public.get_recommendations(null)->'items')::text) = 0,
  '추천에서 본인 제외');
select ok(
  position('33333333-0000-4000-8000-000000000003' in (public.get_recommendations(null)->'items')::text) = 0,
  '추천에서 내가 차단한 상대 제외');
select ok(
  position('44444444-0000-4000-8000-000000000004' in (public.get_recommendations(null)->'items')::text) = 0,
  '추천에서 나를 차단한 상대 제외');
select ok(
  position('55555555-0000-4000-8000-000000000005' in (public.get_recommendations(null)->'items')::text) = 0,
  '추천에서 SUSPENDED(휴면·비활성) 제외');
select ok(
  position('66666666-0000-4000-8000-000000000006' in (public.get_recommendations(null)->'items')::text) = 0,
  '추천에서 성인 인증 없음 제외');
select ok(
  position('77777777-0000-4000-8000-000000000007' in (public.get_recommendations(null)->'items')::text) = 0,
  '추천에서 성인 인증 만료 제외');
select ok(
  position('88888888-0000-4000-8000-000000000008' in (public.get_recommendations(null)->'items')::text) = 0,
  '추천에서 draft 프로필 제외');
select ok(
  position('cccccccc-0000-4000-8000-00000000000c' in (public.get_recommendations(null)->'items')::text) = 0,
  '추천에서 PENDING(ACTIVE 아님) 제외');
select is(
  (public.get_recommendations(null)->'next_cursor'),
  'null'::jsonb,
  '다음 페이지가 없으면 next_cursor null');
select is(
  (public.get_recommendations(null)->'items'->0->'shared_interest_ids'),
  '["cafe", "wine"]'::jsonb,
  '교집합 관심사 id만');
select ok(
  not ((public.get_recommendations(null)->'items'->0->'shared_interest_ids') ? 'kpop'),
  '상대의 전체 관심사(kpop)는 반환하지 않음');
select ok(
  position('비밀이름' in (public.get_recommendations(null)->'items')::text) = 0,
  'full_name은 반환하지 않음');
select ok(
  position('good@test.local' in public.get_recommendations(null)::text) = 0,
  '이메일은 반환하지 않음');
select ok(
  position('"gender"' in (public.get_recommendations(null)->'items')::text) = 0,
  '성별은 반환하지 않음');
select ok(
  (public.get_recommendations(null)->'items'->0->>'age')
    = (extract(year from (now() at time zone 'Asia/Seoul'))::int - 1990)::text
  and (public.get_recommendations(null)->'items'->0->'birth_year') is null
  and position('birth_year' in (public.get_recommendations(null)->'items')::text) = 0,
  'age는 서울 기준 연도 차이이고 birth_year 원값은 없다');
select is((public.get_recommendations(null)->'items'->0->>'photo_visibility'), 'preview', 'photo_visibility');
select is((public.get_recommendations(null)->'items'->0->>'mbti'), 'INFJ', 'mbti');
select is((public.get_recommendations(null)->'items'->0->>'bio'), '후보소개', 'bio');
select is((public.get_recommendations(null)->'items'->0->>'relation'), 'none', '좋아요 전에는 relation=none');

select lives_ok(
  $$ insert into public.likes (actor_id, target_id, decision)
     values ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000002', 'yes') $$,
  '활성 성인 likes yes INSERT');
select pg_temp.logout();

select pg_temp.login_as('22222222-0000-4000-8000-000000000002');
select lives_ok(
  $$ insert into public.likes (actor_id, target_id, decision)
     values ('22222222-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000001', 'no') $$,
  'decision=no INSERT');
select pg_temp.logout();
select is((select count(*)::int from public.matches), 0, 'decision=no 이면 match를 만들지 않음');

select pg_temp.login_as('11111111-0000-4000-8000-000000000001');
select is(
  (public.get_recommendations(null)->'items'->0->>'relation'),
  'liked_by_me',
  '내가 yes이고 쌍방이 아니면 liked_by_me');
select pg_temp.logout();

select pg_temp.login_as('22222222-0000-4000-8000-000000000002');
select lives_ok(
  $$ update public.likes set decision = 'yes'
      where actor_id = '22222222-0000-4000-8000-000000000002'
        and target_id = '11111111-0000-4000-8000-000000000001' $$,
  'no → yes 갱신으로 쌍방 성립');
select lives_ok(
  $$ update public.likes set decision = 'yes'
      where actor_id = '22222222-0000-4000-8000-000000000002'
        and target_id = '11111111-0000-4000-8000-000000000001' $$,
  '같은 yes를 다시 써도 오류 없음');
select pg_temp.logout();

select is((select count(*)::int from public.matches), 1, '쌍방 yes에 match 1건');
select is((select count(*)::int from public.match_members), 2, 'member 2명');
select is((select count(*)::int from public.conversations), 1, 'conversation 1건');
select ok((select bool_and(user_low < user_high) from public.matches), 'user_low < user_high');
select set_config('eottae.match_id', (select id::text from public.matches limit 1), true);
select set_config('eottae.conversation_id', (select id::text from public.conversations limit 1), true);
select throws_ok(
  $$ insert into public.matches (user_low, user_high)
     select user_low, user_high from public.matches limit 1 $$,
  '23505', null, 'matches UNIQUE(user_low, user_high) 중복 거부');
select throws_ok(
  $$ insert into public.match_members (match_id, user_id, slot)
     select id, '99999999-0000-4000-8000-000000000009', 3
       from public.matches limit 1 $$,
  '23514', null, '한 match당 slot은 1·2뿐이라 3명째 거부');

select pg_temp.login_as('11111111-0000-4000-8000-000000000001');
select throws_ok(
  $$ insert into public.likes (actor_id, target_id, decision)
     values ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000002', 'yes') $$,
  '23505', null, 'likes PK 중복 거부');
select is(
  (public.get_recommendations(null)->'items'->0->>'relation'),
  'mutual',
  '쌍방 매칭 후 relation=mutual');
select lives_ok(
  $$ insert into public.messages (conversation_id, sender_id, body)
     values (current_setting('eottae.conversation_id')::uuid,
             '11111111-0000-4000-8000-000000000001', '안녕하세요') $$,
  '활성 구성원 메시지 INSERT');
select pg_temp.logout();

select pg_temp.login_as('22222222-0000-4000-8000-000000000002');
select is((select count(*)::int from public.messages), 1, '상대 구성원은 메시지를 본다');
select lives_ok(
  $$ select public.save_answers('[
       {"questionId":"q1","optionId":"c","declined":false},
       {"questionId":"q2","declined":true},
       {"questionId":"q3","optionId":"only-good","declined":false},
       {"questionId":"q4","optionId":"secret-e","declined":false}
     ]'::jsonb) $$,
  '상대 문답 저장');
select pg_temp.logout();

select pg_temp.login_as('99999999-0000-4000-8000-000000000009');
select is((select count(*)::int from public.messages), 0, '제3자 messages 0건');
select throws_ok(
  $$ select public.get_common_answers(current_setting('eottae.match_id')::uuid) $$,
  '42501', null, '구성원이 아니면 get_common_answers 거부');
select pg_temp.logout();

select pg_temp.login_as('11111111-0000-4000-8000-000000000001');
select lives_ok(
  $$ select public.save_answers('[
       {"questionId":"q1","optionId":"a","declined":false},
       {"questionId":"q2","optionId":"b","declined":false},
       {"questionId":"q4","declined":true}
     ]'::jsonb) $$,
  '본인 문답 저장');
select is(
  (select elem->>'state'
     from jsonb_array_elements(public.get_common_answers(current_setting('eottae.match_id')::uuid)) elem
    where elem->>'question_id' = 'q1'),
  'revealed',
  '둘 다 답하고 거절하지 않으면 revealed');
select is(
  (select elem->>'partner_option_id'
     from jsonb_array_elements(public.get_common_answers(current_setting('eottae.match_id')::uuid)) elem
    where elem->>'question_id' = 'q1'),
  'c',
  'revealed일 때만 상대 선택지');
select is(
  (select elem->>'state'
     from jsonb_array_elements(public.get_common_answers(current_setting('eottae.match_id')::uuid)) elem
    where elem->>'question_id' = 'q2'),
  'waiting',
  '상대가 거절하면 waiting');
select is(
  (select elem->'partner_option_id'
     from jsonb_array_elements(public.get_common_answers(current_setting('eottae.match_id')::uuid)) elem
    where elem->>'question_id' = 'q2')::text,
  'null',
  '거절한 문항은 상대 답이 없다');
select is(
  (select elem->>'state'
     from jsonb_array_elements(public.get_common_answers(current_setting('eottae.match_id')::uuid)) elem
    where elem->>'question_id' = 'q3'),
  'unanswered',
  '내가 안 답한 문항은 unanswered');
select ok(
  position('only-good' in public.get_common_answers(current_setting('eottae.match_id')::uuid)::text) = 0,
  '내가 안 답한 문항의 상대 본문은 없다');
select is(
  (select elem->>'state'
     from jsonb_array_elements(public.get_common_answers(current_setting('eottae.match_id')::uuid)) elem
    where elem->>'question_id' = 'q4'),
  'waiting',
  '내가 거절한 문항은 상대 답 없이 waiting');
select ok(
  position('secret-e' in public.get_common_answers(current_setting('eottae.match_id')::uuid)::text) = 0,
  '거절한 문항의 상대 본문은 없다');
select throws_like(
  $$ select public.save_answers('[{"questionId":"q4","optionId":"z","declined":true}]'::jsonb) $$,
  '%VALIDATION_ERROR%',
  'declined=true 인데 선택지가 있으면 거부');
select is(
  (select option_id from public.profile_answers where question_id = 'q1'),
  'a',
  '실패한 save_answers는 기존 답을 유지');
select ok(
  (select declined and option_id is null and custom_text is null
     from public.profile_answers where question_id = 'q4'),
  'declined=true이면 선택지 없음');
select lives_ok(
  $$ select public.save_answers('[{"questionId":"q9","optionId":"a","declined":false}]'::jsonb) $$,
  '일부 문항 저장');
select is(
  (select option_id from public.profile_answers where question_id = 'q1'),
  'a',
  '일부 저장은 기존 답을 지우지 않는다');
select is(
  (select count(*)::int from public.profile_answers where question_id = 'q9'),
  1,
  '일부 저장은 그 문항을 넣는다');
select lives_ok(
  $$ select public.save_answers('[{"questionId":"q9","removed":true}]'::jsonb) $$,
  'removed는 그 문항만 지운다');
select is(
  (select count(*)::int from public.profile_answers where question_id = 'q9'),
  0,
  'removed 문항은 없다');
select is(
  (select option_id from public.profile_answers where question_id = 'q1'),
  'a',
  'removed는 다른 답을 지우지 않는다');

select lives_ok(
  $$ insert into public.blocks (blocker_id, blocked_user_id)
     values ('11111111-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000002') $$,
  '본인 차단 INSERT');
select throws_ok(
  $$ select public.get_common_answers(current_setting('eottae.match_id')::uuid) $$,
  '42501', null,
  '차단 후 get_common_answers는 42501이고 상대 본문을 반환하지 않음');
select is((select count(*)::int from public.messages), 0, '차단 후 본인 messages 0건');
select throws_ok(
  $$ insert into public.messages (conversation_id, sender_id, body)
     values (current_setting('eottae.conversation_id')::uuid,
             '11111111-0000-4000-8000-000000000001', '또 보내기') $$,
  '42501', null, '차단 후 메시지 INSERT 실패');
select throws_ok(
  $$ insert into public.matches (user_low, user_high)
     values ('11111111-0000-4000-8000-000000000001', '99999999-0000-4000-8000-000000000009') $$,
  '42501', null, '클라이언트 matches INSERT 거부');
select throws_ok(
  $$ insert into public.match_members (match_id, user_id, slot)
     values (current_setting('eottae.match_id')::uuid, '11111111-0000-4000-8000-000000000001', 1) $$,
  '42501', null, '클라이언트 match_members INSERT 거부');
select throws_ok(
  $$ update public.users set adult_verified = false where id = '11111111-0000-4000-8000-000000000001' $$,
  '42501', null, 'adult_verified 직접 UPDATE 거부');
select throws_ok(
  $$ insert into public.blocks (blocker_id, blocked_user_id)
     values ('11111111-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001') $$,
  '23514', null, '자기 차단 금지');
select lives_ok(
  $$
  do $probe$
  declare
    v_id uuid;
  begin
    insert into public.reports (reporter_id, reported_user_id, category, description)
    values (
      '11111111-0000-4000-8000-000000000001',
      '22222222-0000-4000-8000-000000000002',
      'abuse',
      '불쾌한 말'
    )
    returning id into v_id;
    if v_id is null then
      raise exception 'RETURNING id is null';
    end if;
  end
  $probe$;
  $$,
  '본인 신고 INSERT RETURNING id');
select throws_ok(
  $$ insert into public.reports (reporter_id, reported_user_id, category, description)
     values ('22222222-0000-4000-8000-000000000002',
             '11111111-0000-4000-8000-000000000001', 'scam', '위조 신고') $$,
  '42501', null, 'reporter_id가 본인이 아니면 거부');
select throws_ok(
  $$ select public.list_reports() $$,
  '42501', null, '일반 계정 list_reports()는 42501 (빈 SELECT가 아님)');
select pg_temp.logout();

select pg_temp.login_as('22222222-0000-4000-8000-000000000002');
select is((select count(*)::int from public.messages), 0, '차단 후 상대 messages 0건');
select throws_ok(
  $$ insert into public.messages (conversation_id, sender_id, body)
     values (current_setting('eottae.conversation_id')::uuid,
             '22222222-0000-4000-8000-000000000002', '답장') $$,
  '42501', null, '차단당한 쪽 메시지 INSERT도 실패');
select pg_temp.logout();

select pg_temp.login_as('bbbbbbbb-0000-4000-8000-00000000000b');
select is((select count(*)::int from public.list_reports()), 3, 'operator는 신고 3건을 읽음');
select ok(
  exists (select 1 from public.list_reports() r where r.description = '불쾌한 말')
  and exists (select 1 from public.list_reports() r where r.description = '타인 신고 본문')
  and exists (select 1 from public.list_reports() r where r.description = 'returning 확인'),
  'operator는 신고 본문을 읽음');
select pg_temp.logout();

select pg_temp.login_as('11111111-0000-4000-8000-000000000001');
select throws_like(
  $$ select public.save_onboarding(
       'ENFP', '{}'::text[], 'any', 'open',
       array['cafe', 'no-such-interest', 'wine'], null, null) $$,
  '%VALIDATION_ERROR%',
  '없는 관심사 id는 거부');
select is(
  (select count(*)::int from public.user_interests where interest_id = 'park'),
  1,
  '실패한 save_onboarding은 관심사를 롤백');
select lives_ok(
  $$ select public.save_onboarding(
       'ENFP', array['ISTJ']::text[], 'any', 'open',
       array['cafe', 'indie', 'camping'], '5km 이내', 'hidden') $$,
  'save_onboarding 정상');
select is(
  (select count(*)::int from public.user_interests where interest_id = 'indie'),
  1,
  '관심사 통째 교체');
select is(
  (select count(*)::int from public.user_interests where interest_id = 'park'),
  0,
  '빠뜨린 관심사는 삭제');
select throws_like(
  $$ select public.save_onboarding(
       'ENFP', array['ISTJ']::text[], 'any', 'open',
       array['cafe', 'indie', 'camping'], '37.5, 127.0', 'hidden') $$,
  '%VALIDATION_ERROR%',
  'preferred_distance에 GPS 좌표 거부');
select is(
  (select count(*)::int from public.user_interests where interest_id = 'indie'),
  1,
  '좌표 거부 후에도 이전 관심사 유지');
select throws_like(
  $$ select public.save_onboarding(
       'ENFP', array['ISTJ']::text[], 'any', 'open',
       array['cafe', 'indie', 'camping'], '37.5, 127.0 extra', 'hidden') $$,
  '%VALIDATION_ERROR%',
  'preferred_distance 좌표 뒤에 글자가 있어도 거부');
select throws_like(
  $$ select public.save_onboarding(
       'ENFP', array['ISTJ']::text[], 'any', 'open',
       array['cafe', 'indie', 'camping'], '37.5 127.0', 'hidden') $$,
  '%VALIDATION_ERROR%',
  'preferred_distance 공백으로 구분한 좌표 쌍은 거부');
select throws_like(
  $$ select public.save_onboarding(
       'ENFP', array['ENFP']::text[], 'any', 'open',
       array['cafe', 'indie', 'camping'], '5km 이내', 'hidden') $$,
  '%VALIDATION_ERROR%',
  '내 MBTI와 같은 비선호는 거부');
select pg_temp.logout();

-- 호출자가 만료됐거나 SUSPENDED면 멤버십·본인 좋아요 SELECT는 0건.
-- 행은 남기고 상태만 바꿨다가 되돌린다.
update public.users
   set account_status = 'SUSPENDED'
 where id = '22222222-0000-4000-8000-000000000002';
select pg_temp.login_as('22222222-0000-4000-8000-000000000002');
select is((select count(*)::int from public.matches), 0, 'SUSPENDED 구성원 matches SELECT 0건');
select is((select count(*)::int from public.match_members), 0, 'SUSPENDED 구성원 match_members SELECT 0건');
select is((select count(*)::int from public.conversations), 0, 'SUSPENDED 구성원 conversations SELECT 0건');
select is((select count(*)::int from public.likes), 0, 'SUSPENDED 구성원 likes SELECT 0건');
select pg_temp.logout();
update public.users
   set account_status = 'ACTIVE'
 where id = '22222222-0000-4000-8000-000000000002';

update public.users
   set adult_verification_expires_at = now() - interval '1 day'
 where id = '11111111-0000-4000-8000-000000000001';
select pg_temp.login_as('11111111-0000-4000-8000-000000000001');
select is((select count(*)::int from public.matches), 0, '인증 만료 구성원 matches SELECT 0건');
select is((select count(*)::int from public.match_members), 0, '인증 만료 구성원 match_members SELECT 0건');
select is((select count(*)::int from public.conversations), 0, '인증 만료 구성원 conversations SELECT 0건');
select is((select count(*)::int from public.likes), 0, '인증 만료 구성원 likes SELECT 0건');
select pg_temp.logout();
update public.users
   set adult_verification_expires_at = now() + interval '1 year'
 where id = '11111111-0000-4000-8000-000000000001';

select pg_temp.login_as('11111111-0000-4000-8000-000000000001');
select is(
  public.record_like_decision('99999999-0000-4000-8000-000000000009', 'yes'),
  jsonb_build_object('matched', false, 'match_id', null, 'conversation_id', null),
  '한쪽 yes는 matched false와 빈 id');
select pg_temp.logout();
select pg_temp.login_as('99999999-0000-4000-8000-000000000009');
select ok(
  (public.record_like_decision('11111111-0000-4000-8000-000000000001', 'yes')->>'matched') = 'true'
  and (public.record_like_decision('11111111-0000-4000-8000-000000000001', 'yes')->>'match_id')
      ~ '^[0-9a-f-]{36}$'
  and (public.record_like_decision('11111111-0000-4000-8000-000000000001', 'yes')->>'conversation_id')
      ~ '^[0-9a-f-]{36}$',
  '쌍방 yes는 match_id·conversation_id');
select pg_temp.logout();

select * from finish();
rollback;
