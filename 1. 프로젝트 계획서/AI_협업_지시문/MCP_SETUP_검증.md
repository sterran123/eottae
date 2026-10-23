# MCP 연결 지침 — 최소 권한 원칙
**MCP는 AI 코딩 개발 도구 연결**이며 웹앱의 핵심 기능이 아님. 현재 `mcp.example.json`은 **예시**, 자동 활성/운영 서버 연동 없음.

- 로컬 파일시스템 MCP가 필요하다면 개발용 리포지터리 **1개 디렉터리**로 제한. `PROJECT_ROOT_ABSOLUTE_PATH_REPLACE_ME`는 각 팀원 실제 경로로 바꾸어 적용.
- 예시 서버 패키지 `@modelcontextprotocol/server-filesystem`은 사용할 클라이언트·패키지 설치/서명/버전 기준을 **공식 문서에서 검증 후** 팀 승인. `npx -y`는 최초 코드 실행을 수반할 수 있으므로 무심코 실행 금지.
- `.env`, 개인 데이터·DB dump, 인증 서류, 운영 비밀키는 MCP 마운트 경로/AI 기록으로 보내지 않음. 민감한 작업일수록 코드 에이전트 권한 축소.
- Github/Supabase/브라우저/외부 결제 MCP는 현재 **필요없음**. 이후 최소 권한·읽기 위주·테스트 프로젝트 기준으로 별도 승인.
- 도구 설정은 Codex/Claude Code/VS Code 등 클라이언트마다 schema가 다르므로 설정 파일을 무작정 전용 포맷으로 복사하지 말 것.

참고: https://modelcontextprotocol.io/docs ; https://github.com/modelcontextprotocol/servers
