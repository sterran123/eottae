# 실행·테스트·배포 단계
1) Node/npm 버전 확인 및 lockfile 생성: `npm install`; 새 버전 패키지 검토. — **2026-10-23 실행 완료**(next 15.5.28 / react 19.3.1, postcss override 적용).
2) `npm run typecheck`, `npm run build`; 실행 로그 기록. — **실행 완료, 둘 다 PASS**.
3) UI·모바일·다크 모드 동작 확인. 2·3번 진입 시 준비중 메시지 확인. — **코드 구성 완료, 실기기 시각 검증 미실행**. 다크 CTA 대비 1.39:1 결함 수정 후 `typecheck`·`build` 재실행 PASS(2026-10-23).
4) API 도입 후 요구사항/테스트 마스터의 보안 시나리오를 자동화해 CI 필수 상태로 설정.
5) 연령 인증·차단·신고·RLS 모두 구현/검증되기 전 실사용자 대상 공개 금지.
6) 이후 staging/production 분리, 비밀키 관리, 백업·관측/사고대응 설정, 최소권한.

## PWA 설치 조건 점검 (CORE-003)
| 항목 | 상태 |
|---|---|
| manifest.webmanifest | 구성 완료(name/scope/display/theme/icons) |
| 설치 아이콘 192·512·maskable | 개발용 임시 아이콘 생성 완료(원본 로고 배치) — 정식 아이콘 디자인 검수 필요 |
| iOS apple-touch-icon·appleWebApp | 메타+아이콘 구성 완료 |
| 서비스워커·오프라인 캐시 | `public/sw.js` 구현 완료 — 문서 network-first→`/offline`, 정적 자산 cache-first. 실기기 검증은 미실행 |
| 푸시·백그라운드 동기화 | **미구현** — 별도 과제 |
| HTTPS 배포(설치 요건) | GitHub Pages 파이프라인 구축 완료 — `.github/workflows/deploy-pages.yml`이 main push 시 `https://sterran123.github.io/eottae/` 로 자동 배포 (최초 1회 Settings→Pages→Source=GitHub Actions 필요). 실사이트 SW·Lighthouse 검증은 배포 후 수행 |

### iOS 설치 가이드(안내 문구 초안)
iPhone·iPad의 Chrome/Edge는 PWA 설치를 지원하지 않는 경우가 많으므로 **Safari**로 접속 → 하단 공유 버튼 → '홈 화면에 추가' 순서로 안내한다. iOS 웹푸시는 홈 화면 앱 + OS 16.4+ + 별도 권한 요청이 필요하며 현재 미구현.
