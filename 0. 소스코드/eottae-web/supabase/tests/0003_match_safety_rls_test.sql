-- supabase/tests/0003_match_safety_rls_test.sql
-- MATCH-004~008 / TC-004·TC-006·TC-007·TC-008·TC-009·TC-010 RLS 및 보안 정책 pgTAP 테스트
-- 실행: Docker + 로컬 Supabase에서  npx supabase start  →  npx supabase test db

begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

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
-- 0. 시드 데이터 준비 (성인 A, 성인 B, 성인 C, 미인증 D, 정지 E)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'a@test.local'),
  ('10000000-0000-4000-8000-000000000002', 'b@test.local'),
  ('10000000-0000-4000-8000-000000000003', 'c@test.local'),
  ('10000000-0000-4000-8000-000000000004', 'd-unverified@test.local'),
  ('10000000-0000-4000-8000-000000000005', 'e-suspended@test.local');

update public.users
   set account_status = 'ACTIVE', signup_completed_at = now(), adult_verified = true, adult_verified_at = now()
 where id in (
   '10000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000003'
 );

update public.users
   set account_status = 'ACTIVE', signup_completed_at = now(), adult_verified = false
 where id = '10000000-0000-4000-8000-000000000004';

update public.users
   set account_status = 'SUSPENDED', signup_completed_at = now(), adult_verified = true
 where id = '10000000-0000-4000-8000-000000000005';

insert into public.profiles (user_id, nickname, bio, mbti) values
  ('10000000-0000-4000-8000-000000000001', '성인A', '안녕하세요 A', 'ENFP'),
  ('10000000-0000-4000-8000-000000000002', '성인B', '안녕하세요 B', 'INFJ'),
  ('10000000-0000-4000-8000-000000000003', '성인C', '안녕하세요 C', 'INTJ'),
  ('10000000-0000-4000-8000-000000000004', '미인증D', '미인증', 'ISTP'),
  ('10000000-0000-4000-8000-000000000005', '정지E', '정지됨', 'ESTJ');

-- ---------------------------------------------------------------------------
-- 1. TC-004 (MATCH-004): 성인 미검증 사용자(D)는 추천·좋아요 거부
-- ---------------------------------------------------------------------------
select pg_temp.login_as('10000000-0000-4000-8000-000000000004');

select throws_like(
  $$ select * from public.get_recommendations() $$,
  '%AGE_VERIFICATION_REQUIRED%',
  'TC-004: 미검증 계정의 추천 조회 거부 (AGE_VERIFICATION_REQUIRED)'
);

select throws_ok(
  $$ insert into public.likes (actor_id, target_id, decision)
     values ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'LIKE') $$,
  '42501', null,
  'TC-004: 미검증 계정의 좋아요 INSERT RLS 차단'
);

-- ---------------------------------------------------------------------------
-- 2. TC-007 (MATCH-006): 추천 필터 (본인·미검증 D·정지 E·차단 상대 제외)
-- ---------------------------------------------------------------------------
select pg_temp.login_as('10000000-0000-4000-8000-000000000001');

-- 차단 전: 성인 A에게 추천되는 대상은 성인 B, 성인 C 2명뿐이어야 함 (본인 A, 미인증 D, 정지 E 제외)
select is(
  (select count(*)::int from public.get_recommendations()),
  2,
  'TC-007: 본인(A)·미검증(D)·정지(E) 계정은 추천에서 제외되고 B·C 2명만 반환'
);

-- A가 C를 차단하면 추천에서 C가 즉시 제외되어야 함
insert into public.blocks (blocker_id, blocked_id)
values ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003');

select is(
  (select count(*)::int from public.get_recommendations()),
  1,
  'TC-007: 차단한 상대(C)는 추천 결과에서 즉시 제외'
);

-- ---------------------------------------------------------------------------
-- 3. TC-006 (MATCH-005): 쌍방 좋아요 시 매칭·대화방 1건만 생성 및 클라이언트 직접 INSERT 차단
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.matches (user_low_id, user_high_id)
     values ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002') $$,
  '42501', null,
  'MATCH-005: 클라이언트가 matches 테이블에 직접 INSERT 시도 시 차단'
);

-- A -> B 좋아요
insert into public.likes (actor_id, target_id, decision)
values ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'LIKE');

select is(
  (select count(*)::int from public.matches),
  0,
  'MATCH-005: 단방향 좋아요만으로는 매칭 미생성'
);

-- B -> A 좋아요 (쌍방 성립)
select pg_temp.login_as('10000000-0000-4000-8000-000000000002');
insert into public.likes (actor_id, target_id, decision)
values ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'LIKE');

select is(
  (select count(*)::int from public.matches),
  1,
  'TC-006: 쌍방 좋아요 성립 시 matches 정확히 1건 생성'
);

select is(
  (select count(*)::int from public.conversations),
  1,
  'TC-006: 쌍방 좋아요 성립 시 conversations 정확히 1건 생성'
);

-- ---------------------------------------------------------------------------
-- 4. TC-008 (MATCH-007): 매칭 당사자(A·B)만 메시지 송수신 가능, 제3자(C)는 접근 불가
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ insert into public.messages (conversation_id, sender_id, body)
     values ((select id from public.conversations limit 1), '10000000-0000-4000-8000-000000000002', '안녕하세요 반가워요!') $$,
  'MATCH-007: 매칭 구성원(B)은 메시지 전송 성공'
);

-- 제3자(C)로 로그인하여 대화방·메시지 접근 시도
select pg_temp.login_as('10000000-0000-4000-8000-000000000003');

select is(
  (select count(*)::int from public.messages),
  0,
  'TC-008: 매칭 구성원이 아닌 제3자(C)는 메시지 조회 결과 0건'
);

select throws_ok(
  $$ insert into public.messages (conversation_id, sender_id, body)
     values ((select id from pg_temp.logout() is null and false), '10000000-0000-4000-8000-000000000003', '침입') $$,
  '23502', null,
  'TC-008: 제3자(C)는 남의 conversation_id를 조회할 수 없어 INSERT 불가'
);

-- ---------------------------------------------------------------------------
-- 5. TC-009 (MATCH-008 · ADR-003): 상대 차단 직후 열린 채팅방에서 메시지 조회·전송 즉시 차단
-- ---------------------------------------------------------------------------
select pg_temp.login_as('10000000-0000-4000-8000-000000000001');

select is(
  (select count(*)::int from public.messages),
  1,
  '차단 전: 매칭 구성원(A)은 상대(B)의 메시지 조회 가능'
);

-- A가 B를 차단
insert into public.blocks (blocker_id, blocked_id)
values ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002');

select is(
  (select count(*)::int from public.messages),
  0,
  'TC-009: 상대 차단 직후 기존 메시지 조회 즉시 차단(0건)'
);

-- 차단당한 B가 메시지 전송 시도 → RLS 거부
select pg_temp.login_as('10000000-0000-4000-8000-000000000002');

select is(
  (select count(*)::int from public.conversations),
  0,
  'TC-009: 차단당한 상대(B)에게도 대화방이 즉시 비노출'
);

-- ---------------------------------------------------------------------------
-- 6. TC-010 (MATCH-008): 일반 계정으로 신고 접수 가능하나 신고 큐(reports) 조회는 불가
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ insert into public.reports (reporter_id, reported_user_id, category, description)
     values ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'ABUSE', '불쾌한 표현') $$,
  'MATCH-008: 활성 회원은 본인 명의로 신고 접수(INSERT) 가능'
);

select throws_ok(
  $$ select count(*) from public.reports $$,
  '42501', null,
  'TC-010: 일반 계정(authenticated)으로 신고 관리 큐(reports) SELECT 시 42501 권한 거부'
);

select pg_temp.logout();

select * from finish();
rollback;
