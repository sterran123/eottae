# API 계약 초안 (미구현, 팀 협의 기준)
모든 인증 필요 엔드포인트는 **서버에서 세션·성인 검증·계정 상태**를 확인. 결과가 불확실하면 deny. 예시 API prefix `/api/v1`.

| 단계 | 메서드 | 경로 | 인증/인가 | 주요 응답·예외 |
|---|---|---|---|---|
| 1 | GET | `/health` | 공개 | 헬스 신호만(개인정보 없음) |
| 1 | GET | `/users/me` | 로그인 | 내 최소 프로필; 401 |
| 1 | POST | `/users/me/interests` | 성인 확인 후 | interestIds[] 유효성, 422/403 |
| 1 | GET | `/match/recommendations?cursor=...` | 검증 성인 | 나/차단/휴면 제외, cursor |
| 1 | POST | `/match/likes` | 검증 성인 | targetId, decision; 409 중복 처리 |
| 1 | GET | `/match/mutual` | 검증 성인 | 상호 매칭 목록만 |
| 1 | GET | `/conversations/:id/messages?cursor=...` | 활성 match 참가자 | paged messages, 403 |
| 1 | POST | `/conversations/:id/messages` | 활성 match 참가자 | body length 검증, 신고된 정지계정 deny |
| 1 | POST | `/safety/blocks` | 로그인 | 상대 추천·송수신 즉시 중지 |
| 1 | POST | `/safety/reports` | 로그인 | reportId, 내용 검증, 201 |
| 1 | DELETE | `/users/me` | 재인증 | 삭제 접수/상태; 보존 예외 정책 검토 |
| 2 | GET | `/activities` | 정책별 | 공개 일정만 필터·페이지 |
| 2 | POST | `/activities/:id/attendees` | 성인 및 모임 정책 | 신청/탈퇴, 409 중복 |
| 2 | POST | `/activities/:id/polls` | 운영자 | 일정 투표 생성/권한 |
| 3 | POST | `/invitations` | 로그인/호스트 | 행사 draft 생성 |
| 3 | GET | `/invitations/:token` | 공개정책·만료토큰 | 공개 행사 정보, 게스트 명단 미포함 |
| 3 | POST | `/invitations/:token/rsvp` | 초대 정책, 봇 차단 | 회신, 중복 처리, 개인정보 최소화 |

## 에러 형식
```
{"error":{"code":"AGE_VERIFICATION_REQUIRED","message":"성인 확인 후 이용할 수 있어요.","requestId":"..."}}
```
429 제한 초과, 403 권한 부족, 422 입력 오류, 409 중복, 401 미인증, 500 서버 예외. 외부 노출 에러 본문에 타인 식별자/민감정보 포함 금지.

## 팀 간 계약
오하율: UI state + DTO 타입, 주한태: Auth/매칭 API·RLS, 손준혁: 메시지·신고 요청·실시간 구독, 김민기: 공통 layout/health/deploy. 변경 시 이슈·버전·PR 리뷰 후 통합.

## ADR-005 구현 대응표 (Supabase + GitHub Pages)
위 경로는 **논리 계약**이다. GitHub Pages에서는 서버 라우트가 실행되지 않으므로, 실제 구현은 브라우저의 `supabase-js` 호출 + RLS / RPC / Edge Function으로 대응한다. 응답 형태(DTO)와 오류 코드 의미는 위 계약을 따른다.

| 논리 계약 | Supabase 구현 | 권한 판정 위치 |
|---|---|---|
| `GET /users/me` | `auth.getUser()` + `public.users` select + `public.profiles` select | RLS: `users.id = auth.uid()`, `profiles.user_id = auth.uid()`. 클라이언트 UPDATE는 `users.nickname`, `users.updated_at`만 |
| `POST /users/me/interests` | RPC `public.save_onboarding(p_my_mbti, p_avoid_mbti, p_target_preference, p_relation_goal, p_interest_ids, p_preferred_distance, p_photo_visibility)` — `public.profiles` upsert + `public.user_interests` 통째 교체. 카탈로그 `public.interests` | `auth.uid()` + `is_active_adult()`. 관심사 3–7개, id는 `interests`에 있는 것만. `user_interests` 직접 INSERT 없음 |
| `GET /match/recommendations` | RPC `public.get_recommendations(p_cursor text)` limit 20. 다음 페이지가 없으면 `next_cursor` null | 본인·어느 방향이든 차단·`account_status <> 'ACTIVE'`(휴면 enum 없음. `SUSPENDED`를 휴면·비활성 제외)·성인 인증 없음/만료·`profile_status <> 'active'` 제외. `full_name`·이메일·성별·좌표·상대 관심사 전체는 반환하지 않음 |
| `POST /match/likes` | `public.likes` INSERT/UPDATE(`decision`). 트리거 `private.ensure_mutual_match`가 쌍방 `yes`이고 둘 다 활성 성인이며 서로 차단이 아니면 `public.matches`·`public.match_members` 2명·`public.conversations` 1건. `decision=no`이면 match 없음 | RLS: `actor_id = auth.uid()` 이고 `is_active_adult()`. PK·UNIQUE(`actor_id`,`target_id`). 클라이언트 `matches` INSERT 금지 |
| `GET /match/mutual` | `public.matches` select (`public.match_members` 조인, `public.conversations.match_id`) | RLS: 구성원만. 클라이언트 INSERT 금지 |
| `GET/POST /conversations/:id/messages` | `public.messages` select/insert + publication `supabase_realtime`. 행은 `MessageRow`(`id`,`conversation_id`,`sender_id`,`body`,`created_at`) + `attachment_path` + `soft_delete_state`. 첨부 버킷 `chat-media`, 경로 `{conversation_id}/{object}` | RLS: 활성 match 구성원 · 서로 미차단 · `is_active_adult()` · INSERT는 `sender_id = auth.uid()` |
| `POST /safety/blocks` | `public.blocks` insert/delete | RLS: INSERT·DELETE `blocker_id = auth.uid()`. SELECT는 본인이 blocker인 행만 |
| `POST /safety/reports` | `public.reports` insert. 조회는 RPC `public.list_reports()` (`public.user_roles.role = 'operator'`만. 아니면 SQLSTATE `42501`) | INSERT: `reporter_id = auth.uid()`. `authenticated` SELECT·UPDATE 없음 |
| 프로필 문답 (MATCH-009) | RPC `public.save_answers(p_answers jsonb)`, `public.get_common_answers(p_match_id uuid)`, 테이블 `public.profile_answers` | 본인 답만 교체. `declined=true`이면 선택지 없음. 공통 답은 구성원만, 호출자가 그 문항에 답했고 거절하지 않았을 때만 상대 본문 |
| `DELETE /users/me` | Edge Function `delete-account` (service_role) | 재인증 후 함수 내부 검증 |
| 성인 인증 결과 기록 | Edge Function `verify-adult` (service_role) | 클라이언트 update 금지 (`adult_verified` 직접 UPDATE 거부) |
