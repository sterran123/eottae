# 제출 패키지 파일 목록/해시 매니페스트 재생성기
# 실행 위치: 프로젝트 루트  →  python tools/update_package_manifest.py
# .git, node_modules, .next 등은 제외하고 FILE_INDEX.csv / MANIFEST.sha256을 갱신한다.
# 실행할 때마다 내용이 바뀌는 빌드 산출물·로그·OS 파일·비밀 파일은 해시 대상에서 제외한다
# (포함하면 누구든 typecheck 한 번에 MANIFEST 검증이 깨지고, .env 존재가 파일 목록에 노출된다).

import hashlib
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# .temp·.branches: Supabase CLI 로컬 상태(link 정보·버전 캐시, gitignore) — 사람마다 달라 깨끗한 클론에서 검증이 깨진다
SKIP_DIRS = {".git", "node_modules", ".next", "out", ".vercel", ".temp", ".branches"}
SKIP_FILES = {"FILE_INDEX.csv", "MANIFEST.sha256", "Thumbs.db", ".DS_Store"}
# gitignore와 동일 규칙: .env, .env.* (단 .env.example은 허용), *.tsbuildinfo, *.log
SKIP_SUFFIXES = (".tsbuildinfo", ".log")


def is_skippable(name: str) -> bool:
    if name in SKIP_FILES or name.endswith(SKIP_SUFFIXES):
        return True
    if name == ".env" or (name.startswith(".env.") and name != ".env.example"):
        return True
    return False


def main() -> None:
    rows = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if is_skippable(name):
                continue
            path = Path(dirpath) / name
            rel = path.relative_to(ROOT).as_posix()
            data = path.read_bytes()
            rows.append((rel, len(data), hashlib.sha256(data).hexdigest()))
    rows.sort()

    with open(ROOT / "FILE_INDEX.csv", "w", encoding="utf-8-sig", newline="") as f:
        f.write("relative_path,bytes,sha256\n")
        for rel, size, digest in rows:
            f.write(f"{rel},{size},{digest}\n")

    with open(ROOT / "MANIFEST.sha256", "w", encoding="utf-8", newline="") as f:
        for rel, _, digest in rows:
            f.write(f"{digest}  {rel}\n")

    print(f"manifest updated: {len(rows)} files")


if __name__ == "__main__":
    main()
