# BRAND-004: 어때? 다크 로고 투명·파스텔 변형 생성기
# 원본: public/eottae-logo-dark.png (검정 불투명 배경, 제공 에셋)
# 결과: public/eottae-logo-dark-transparent.png (투명 배경, 차분한 파스텔)
# 실행: python tools/make_dark_logo.py  (Pillow 필요)
# 원칙: 로고 모양·의미 변경 없이 배경만 알파로 변환. 원본은 리포지터리에 보존.

from pathlib import Path

from PIL import Image, ImageChops

SRC = Path(__file__).resolve().parent.parent / "public" / "eottae-logo-dark.png"
DST = SRC.with_name("eottae-logo-dark-transparent.png")

# 어두운 노이즈 점 제거 임계값 / 파스텔 감쇠 계수
ALPHA_CUTOFF = 12
DESATURATION = 0.15
BRIGHTEN = 1.06


def unmultiply_black(im: Image.Image) -> Image.Image:
    """검정 배경에 프리멀티플라이된 로고를 스트레이트 알파로 복원한다."""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            a = max(r, g, b)
            if a < ALPHA_CUTOFF:
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (
                    min(255, r * 255 // a),
                    min(255, g * 255 // a),
                    min(255, b * 255 // a),
                    a,
                )
    return im


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    out = unmultiply_black(src)

    # 차분한 파스텔: 휘도 방향으로 살짝 탈채도 + 미세한 밝기 보정
    rgb = out.convert("RGB")
    gray = rgb.convert("L").convert("RGB")
    soft = ImageChops.blend(rgb, gray, DESATURATION)
    soft = soft.point(lambda v: min(255, int(v * BRIGHTEN)))
    out = Image.merge("RGBA", (*soft.split(), out.getchannel("A")))

    out.save(DST, optimize=True)
    print(f"saved {DST} {out.size}")


if __name__ == "__main__":
    main()
