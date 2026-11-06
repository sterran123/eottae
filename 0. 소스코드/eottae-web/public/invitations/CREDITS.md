# 청첩장 에셋 출처·라이선스 기록 (Refs #118)

지시서(`3차_작업지시서.md` §2·§5)의 「실존 인물 사진 금지」 기준에 따라, 이 폴더에는 **자체 제작 일러스트(SVG)만** 둡니다.

## 현재 파일 (전부 자체 제작)

| 파일 | 출처 | 라이선스 |
|---|---|---|
| `cover-evening.svg` | PR #93에서 프로젝트용으로 제작한 일러스트 | 팀 자체 제작 — 외부 라이선스 없음 |
| `map-hall.svg` | PR #93 자체 제작 일러스트(가상 예식장 지도) | 팀 자체 제작 |
| `scene-arch.svg` ~ `scene-window.svg` (9종) | PR #93 자체 제작 일러스트 | 팀 자체 제작 |

## 제거된 파일 — `wedding-*.jpg` 11장

PR #97에서 추가된 실사 부부 사진 11장(`wedding-bench-quiet`, `wedding-cherry-blossom`, `wedding-forest-laugh`, `wedding-green-canopy`, `wedding-hanbok`, `wedding-luxury-hotel`, `wedding-night-garden`, `wedding-studio-peach`, `wedding-sunset`, `wedding-tape-bw`, `wedding-wax-envelope`).

- PR #97 본문·커밋·`AI_REPORT_LOG.md`·`captions.csv` 어디에도 출처·이용 허락 기록이 없고, PR 리뷰에서도 「포토리얼 인물 — 출처 미확인」 지적이 두 차례 있었습니다.
- AI 생성 여부도 저장소 자료로 확인할 수 없어, 이슈 #118의 기준(「출처를 확인할 수 없는 사진은 일러스트로 교체」)과 지시서 「실존 인물 사진 금지」에 따라 **2026-11-06 제거**하고 같은 수의 자체 일러스트로 일대일 교체했습니다.
- 하율님이 나중에 출처(AI 생성 도구·프롬프트 또는 스톡 URL·라이선스)를 확인해 주시면 이 표에 기록 후 되돌릴 수 있습니다.

| 제거된 사진 | 대체 일러스트 |
|---|---|
| `wedding-green-canopy.jpg` | `scene-path.svg` (숲길) |
| `wedding-sunset.jpg` | `cover-evening.svg` (저녁빛) |
| `wedding-studio-peach.jpg` | `scene-table.svg` (테이블 세팅) |
| `wedding-cherry-blossom.jpg` | `scene-arch.svg` (꽃 아치) |
| `wedding-wax-envelope.jpg` | `scene-paper.svg` (종이·봉투 질감) |
| `wedding-tape-bw.jpg` | `scene-window.svg` (창가) |
| `wedding-forest-laugh.jpg` | `scene-chairs.svg` (야외 의자) |
| `wedding-bench-quiet.jpg` | `scene-bouquet.svg` (부케) |
| `wedding-night-garden.jpg` | `scene-night.svg` (밤 정원) |
| `wedding-hanbok.jpg` | `scene-door.svg` (전통 문) |
| `wedding-luxury-hotel.jpg` | `map-hall.svg` (예식장 홀 지도) |

## 후속

- `3. 구현 이미지(5장이상)/`의 청첩장 캡처(20~24번, 2026-11-05)는 실사 사진이 보이는 교체 전 화면이라, 최종 제출 전에 같은 도구(`tools/capture_screenshots.mjs` + `tools/serve_pages_preview.mjs`)로 재촬영하면 캡처와 제출물이 일치합니다.
