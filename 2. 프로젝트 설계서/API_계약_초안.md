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
