# 제출 패키지 파일 목록/해시 매니페스트 재생성기
# 실행 위치: 프로젝트 루트  →  python tools/update_package_manifest.py
# .git, node_modules, .next 등은 제외하고 FILE_INDEX.csv / MANIFEST.sha256을 갱신한다.

import hashlib
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {".git", "node_modules", ".next", "out", ".vercel"}
SKIP_FILES = {"FILE_INDEX.csv", "MANIFEST.sha256"}


def main() -> None:
    rows = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if name in SKIP_FILES:
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
