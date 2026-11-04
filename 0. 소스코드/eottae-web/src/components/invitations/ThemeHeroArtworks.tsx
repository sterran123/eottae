'use client';

import React from 'react';

// ============================================================
// 어때? 프리미엄 테마 시그니처 SVG 아트워크
// ============================================================

// 1. 클래식 3D 실링 왁스 인장 (붉은 왁스 씰 + 골드 각인)
export function WaxSealBadgeSVG({ size = 68 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inv-wax-seal-svg"
      aria-label="클래식 실링 인장 각인"
    >
      <defs>
        <radialGradient id="wax-grad" cx="40%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="45%" stopColor="#b91c1c" />
          <stop offset="85%" stopColor="#7f1d1d" />
          <stop offset="100%" stopColor="#450a0a" />
        </radialGradient>
        <linearGradient id="gold-grad" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <filter id="wax-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#450a0a" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.2" />
        </filter>
        <filter id="wax-inner-bevel">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset dx="1" dy="2" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
          <feFlood floodColor="#ffffff" floodOpacity="0.4" />
          <feComposite in2="shadowDiff" operator="in" />
          <feComposite in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      {/* 비정형 자연스러운 왁스 테두리 풀링 */}
      <path
        d="M 50 6 C 65 5, 78 12, 88 22 C 96 32, 97 48, 93 62 C 89 76, 78 89, 64 94 C 50 99, 34 96, 22 88 C 10 80, 4 64, 5 50 C 6 36, 12 22, 24 13 C 35 4, 42 7, 50 6 Z"
        fill="url(#wax-grad)"
        filter="url(#wax-shadow)"
      />

      {/* 내부 인장 홈 */}
      <circle cx="50" cy="50" r="32" fill="none" stroke="#7f1d1d" strokeWidth="2.5" opacity="0.6" />
      <circle cx="50" cy="50" r="29" fill="none" stroke="url(#gold-grad)" strokeWidth="1" strokeDasharray="3 2" opacity="0.8" />

      {/* 중앙 골드 엠보싱: 결합의 두 반지 & 월계수 */}
      <g filter="url(#wax-inner-bevel)" stroke="url(#gold-grad)" strokeWidth="2" fill="none">
        <circle cx="43" cy="50" r="10" />
        <circle cx="57" cy="50" r="10" />
        {/* 반짝이는 다이아몬드 포인트 */}
        <polygon points="50,38 52,43 57,45 52,47 50,52 48,47 43,45 48,43" fill="url(#gold-grad)" stroke="none" />
      </g>
      <text x="50" y="70" fill="url(#gold-grad)" fontSize="7" fontFamily="serif" textAnchor="middle" letterSpacing="1">
        FOREVER
      </text>
    </svg>
  );
}

// 2. 반투명 마스킹 테이프 (Washi Tape)
export function MaskingTapeSVG({ width = 110, height = 24 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 110 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inv-masking-tape-svg"
    >
      <defs>
        <linearGradient id="tape-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#fef9c3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* 찢어진 테이프 질감 양끝 */}
      <path
        d="M 4 2 L 106 1 L 108 5 L 105 10 L 109 15 L 106 20 L 107 23 L 3 24 L 5 19 L 2 14 L 6 9 L 3 5 Z"
        fill="url(#tape-grad)"
        stroke="rgba(202, 138, 4, 0.2)"
        strokeWidth="0.8"
      />
      {/* 테이프 표면 미세 격자 패턴 */}
      <line x1="15" y1="3" x2="15" y2="22" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
      <line x1="35" y1="3" x2="35" y2="22" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
      <line x1="55" y1="3" x2="55" y2="22" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
      <line x1="75" y1="3" x2="75" y2="22" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
      <line x1="95" y1="3" x2="95" y2="22" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
    </svg>
  );
}

// 3. 고품격 신랑 신부 스튜디오 웨딩 포트레이트 (Modern Studio Portrait)
export function BridalCoupleStudioSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inv-art-svg ${className}`}
      aria-label="모던 스튜디오 신랑 신부 웨딩 포트레이트"
    >
      <defs>
        <linearGradient id="bg-studio" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8f5f0" />
          <stop offset="60%" stopColor="#ede6db" />
          <stop offset="100%" stopColor="#dfd5c4" />
        </linearGradient>
        <radialGradient id="soft-glow" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="suit-navy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="dress-white" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#fdfbf7" />
          <stop offset="100%" stopColor="#f1ede5" />
        </linearGradient>
        <linearGradient id="skin-tone" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fdba74" />
        </linearGradient>
      </defs>

      {/* 배경 감성 스튜디오 톤 */}
      <rect width="340" height="400" fill="url(#bg-studio)" />
      <circle cx="170" cy="140" r="140" fill="url(#soft-glow)" />

      {/* --- 신부 베일 (은은한 쉬폰 텍스처) --- */}
      <path
        d="M 120 75 Q 80 140 70 280 Q 95 310 135 295 Q 125 180 130 90 Z"
        fill="rgba(255, 255, 255, 0.45)"
      />

      {/* --- 신랑 (우측 뒤에서 살짝 감싸 안는 구도) --- */}
      {/* 신랑 헤어 & 두상 */}
      <ellipse cx="218" cy="88" rx="26" ry="32" fill="#18181b" />
      <path d="M 195 85 Q 215 62 242 76 Q 248 100 236 108 Z" fill="#18181b" />
      {/* 신랑 얼굴 */}
      <ellipse cx="212" cy="100" rx="19" ry="24" fill="url(#skin-tone)" />
      {/* 신랑 미소선 */}
      <path d="M 206 108 Q 212 114 218 108" stroke="#9a3412" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* 신랑 목 */}
      <path d="M 205 120 L 219 120 L 222 142 L 202 142 Z" fill="#fdba74" />
      {/* 셔츠 칼라 & 나비넥타이 */}
      <polygon points="202,140 212,154 222,140" fill="#ffffff" />
      <polygon points="207,144 217,144 212,148" fill="#09090b" />
      <polygon points="208,145 204,142 204,148" fill="#09090b" />
      <polygon points="216,145 220,142 220,148" fill="#09090b" />
      {/* 신랑 수트 재킷 */}
      <path
        d="M 180 148 Q 212 140 245 152 L 275 320 Q 230 330 185 320 Z"
        fill="url(#suit-navy)"
      />
      {/* 라펠 선 & 부토니에 꽃 */}
      <path d="M 198 152 L 210 210 L 224 154" stroke="#334155" strokeWidth="2" fill="none" />
      <circle cx="195" cy="178" r="5" fill="#f43f5e" />
      <path d="M 196 183 L 198 194" stroke="#16a34a" strokeWidth="1.5" />

      {/* --- 신부 (좌측 앞 포지션) --- */}
      {/* 신부 헤어 (단정한 로우번 올림머리) */}
      <ellipse cx="132" cy="104" rx="22" ry="28" fill="#27272a" />
      <ellipse cx="118" cy="112" rx="12" ry="14" fill="#27272a" />
      {/* 헤어 진주 핀 */}
      <circle cx="120" cy="104" r="3" fill="#fef08a" />
      <circle cx="124" cy="99" r="2.5" fill="#ffffff" />
      {/* 신부 얼굴 */}
      <ellipse cx="138" cy="114" rx="17" ry="21" fill="url(#skin-tone)" />
      {/* 신부 눈매와 수줍은 미소 */}
      <path d="M 130 112 Q 134 110 138 112" stroke="#451a03" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 142 112 Q 146 110 150 112" stroke="#451a03" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 136 123 Q 140 128 144 123" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* 핑크빛 볼터치 */}
      <ellipse cx="130" cy="120" rx="4" ry="2.5" fill="#f43f5e" opacity="0.45" />
      <ellipse cx="148" cy="120" rx="4" ry="2.5" fill="#f43f5e" opacity="0.45" />
      {/* 신부 우아한 목선 & 어깨 */}
      <path d="M 132 133 Q 139 146 142 154 L 126 154 Z" fill="#fdba74" />
      {/* 신부 웨딩드레스 (오프숄더 실크 슬립) */}
      <path
        d="M 112 162 Q 140 152 168 162 Q 185 240 190 350 L 80 350 Q 95 240 112 162 Z"
        fill="url(#dress-white)"
      />
      {/* 드레스 허리 실루엣 음영 */}
      <path d="M 116 162 Q 140 170 164 162" stroke="#e2e8f0" strokeWidth="2" fill="none" />
      <path d="M 125 210 Q 140 216 155 210" stroke="#f1f5f9" strokeWidth="2" fill="none" />

      {/* --- 신부의 웨딩 부케 (피오니 & 유칼립투스) --- */}
      <g transform="translate(132, 235)">
        {/* 초록 잎사귀들 */}
        <ellipse cx="-16" cy="-4" rx="14" ry="7" transform="rotate(-30)" fill="#16a34a" />
        <ellipse cx="18" cy="-2" rx="14" ry="7" transform="rotate(35)" fill="#15803d" />
        <ellipse cx="0" cy="14" rx="12" ry="6" fill="#14532d" />
        {/* 화사한 분홍·아이보리 작약 꽃들 */}
        <circle cx="-6" cy="-6" r="13" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="1.5" />
        <circle cx="8" cy="-8" r="11" fill="#fff1f2" stroke="#fb7185" strokeWidth="1.5" />
        <circle cx="2" cy="5" r="12" fill="#ffffff" stroke="#fecdd3" strokeWidth="1.5" />
        <circle cx="-14" cy="4" r="8" fill="#fda4af" />
        <circle cx="16" cy="6" r="9" fill="#fbcfe8" />
        {/* 리본 */}
        <path d="M 0 16 Q -5 32 -10 44" stroke="#ffffff" strokeWidth="3" fill="none" />
        <path d="M 4 16 Q 10 32 8 46" stroke="#ffffff" strokeWidth="3" fill="none" />
      </g>
    </svg>
  );
}

// 4. 노을빛 실루엣 감성 일러스트 (Sunset Horizon Silhouette)
export function BridalCoupleSunsetSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inv-art-svg ${className}`}
      aria-label="노을빛 억새밭 신랑 신부 실루엣"
    >
      <defs>
        <linearGradient id="sunset-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="35%" stopColor="#6366f1" />
          <stop offset="60%" stopColor="#f43f5e" />
          <stop offset="85%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
        <radialGradient id="sun-glow" cx="50%" cy="65%" r="35%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#fef08a" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 노을빛 그라데이션 하늘 */}
      <rect width="340" height="380" fill="url(#sunset-sky)" />
      {/* 붉게 지는 석양 태양 */}
      <circle cx="170" cy="240" r="80" fill="url(#sun-glow)" />

      {/* 억새 풀 언덕 */}
      <path
        d="M 0 320 Q 90 295 180 310 Q 270 325 340 305 L 340 380 L 0 380 Z"
        fill="#1c1917"
      />

      {/* 둘이 손잡고 석양을 바라보는 실루엣 */}
      <g fill="#09090b">
        {/* 신랑 */}
        <circle cx="150" cy="188" r="9" />
        <path d="M 144 200 L 157 200 L 160 270 L 140 270 Z" />
        <path d="M 143 270 L 142 330 L 149 330 L 150 270 Z" />
        <path d="M 152 270 L 154 330 L 161 330 L 158 270 Z" />

        {/* 신부 */}
        <circle cx="180" cy="192" r="8.5" />
        {/* 드레스 자락 바람에 날림 */}
        <path d="M 174 204 L 187 204 Q 192 250 215 330 L 162 330 Q 170 250 174 204 Z" />
        {/* 휘날리는 베일 */}
        <path
          d="M 178 190 Q 200 195 230 220 Q 205 235 182 205 Z"
          fill="rgba(255, 255, 255, 0.4)"
        />

        {/* 맞잡은 두 손 */}
        <circle cx="166" cy="235" r="4" fill="#09090b" />
      </g>
    </svg>
  );
}

// 5. 에디토리얼 프레임 웨딩 (Editorial Forest Wedding)
export function BridalCoupleForestSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inv-art-svg ${className}`}
      aria-label="숲속 야외 웨딩 신랑 신부"
    >
      <defs>
        <linearGradient id="forest-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14210d" />
          <stop offset="50%" stopColor="#1c2e13" />
          <stop offset="100%" stopColor="#2b471c" />
        </linearGradient>
      </defs>

      <rect width="340" height="380" fill="url(#forest-grad)" />

      {/* 배경 피톤치드 침엽수 실루엣 */}
      <polygon points="50,60 10,180 90,180" fill="#0d1708" opacity="0.8" />
      <polygon points="290,50 250,170 330,170" fill="#0d1708" opacity="0.8" />
      <polygon points="110,80 75,200 145,200" fill="#13240d" opacity="0.9" />
      <polygon points="230,70 195,190 265,190" fill="#13240d" opacity="0.9" />

      {/* 숲속 나뭇잎 사이로 내리는 축복의 빛줄기 */}
      <polygon points="170,0 120,380 140,380" fill="rgba(254, 240, 138, 0.12)" />
      <polygon points="190,0 210,380 235,380" fill="rgba(254, 240, 138, 0.09)" />

      {/* 신랑 신부 */}
      <g transform="translate(110, 150)">
        {/* 신랑 */}
        <circle cx="40" cy="40" r="13" fill="#fde047" opacity="0.8" />
        <path d="M 30 55 L 52 55 L 56 160 L 26 160 Z" fill="#0b1207" />

        {/* 신부 (순백 드레스) */}
        <circle cx="78" cy="46" r="12" fill="#ffffff" />
        <path d="M 68 60 Q 86 60 90 170 L 52 170 Q 64 80 68 60 Z" fill="#ffffff" />
        {/* 신부 부케 화이트 */}
        <circle cx="60" cy="98" r="10" fill="#fef08a" />
      </g>
    </svg>
  );
}

// 6. 린넨 가든 스타일: 밀짚모자 & 가든 웨딩 (Linen Garden Couple)
export function BridalCoupleGardenHatSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inv-art-svg ${className}`}
      aria-label="밀짚모자와 리넨 가든 웨딩"
    >
      <defs>
        <linearGradient id="garden-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </linearGradient>
      </defs>

      <rect width="340" height="320" fill="url(#garden-bg)" />

      {/* 가든 아치 식물 리스 */}
      <path
        d="M 40 320 Q 50 40 170 30 Q 290 40 300 320"
        stroke="#15803d"
        strokeWidth="3"
        strokeDasharray="6 8"
        fill="none"
      />
      {/* 잎사귀 포인트 */}
      <circle cx="90" cy="90" r="8" fill="#86efac" />
      <circle cx="170" cy="30" r="10" fill="#4ade80" />
      <circle cx="250" cy="90" r="8" fill="#86efac" />

      {/* 신부의 로맨틱 밀짚모자 */}
      <ellipse cx="145" cy="110" rx="34" ry="12" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
      <circle cx="145" cy="106" r="14" fill="#fde047" />
      {/* 모자 리본 */}
      <path d="M 135 110 Q 130 140 126 160" stroke="#16a34a" strokeWidth="2.5" />
      <path d="M 155 110 Q 158 140 162 158" stroke="#16a34a" strokeWidth="2.5" />

      {/* 신랑 (베이지 린넨 셔츠) */}
      <circle cx="205" cy="115" r="16" fill="#1c1917" />
      <path d="M 188 135 L 226 135 L 230 250 L 182 250 Z" fill="#d6d3d1" />

      {/* 신부 (화이트 린넨 드레스) */}
      <path d="M 130 135 Q 160 135 168 250 L 115 250 Z" fill="#ffffff" stroke="#f1f5f9" />

      {/* 피크닉 꽃바구니 */}
      <g transform="translate(156, 195)">
        <ellipse cx="14" cy="16" rx="14" ry="10" fill="#b45309" />
        <path d="M 2 14 Q 14 0 26 14" stroke="#78350f" strokeWidth="2" fill="none" />
        <circle cx="8" cy="10" r="5" fill="#f43f5e" />
        <circle cx="16" cy="8" r="6" fill="#fef08a" />
        <circle cx="22" cy="12" r="5" fill="#a855f7" />
      </g>
    </svg>
  );
}

// 7. 콰이어트 스타일: 원목 벤치에 나란히 앉은 부부 (Quiet Seated Bench)
export function BridalCoupleBenchSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inv-art-svg ${className}`}
      aria-label="원목 벤치에 나란히 앉은 신랑 신부"
    >
      <defs>
        <linearGradient id="quiet-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#faf8f5" />
          <stop offset="100%" stopColor="#ede7de" />
        </linearGradient>
      </defs>

      <rect width="340" height="320" fill="url(#quiet-bg)" />

      {/* 따스한 오후 햇살 그림자 */}
      <ellipse cx="170" cy="265" rx="100" ry="20" fill="rgba(0, 0, 0, 0.08)" />

      {/* 클래식 원목 벤치 */}
      <rect x="70" y="210" width="200" height="12" rx="4" fill="#a16207" />
      <rect x="85" y="222" width="10" height="42" fill="#78350f" />
      <rect x="245" y="222" width="10" height="42" fill="#78350f" />
      <rect x="165" y="222" width="10" height="42" fill="#78350f" />

      {/* 나란히 앉은 신랑 신부 */}
      {/* 신랑 (좌측, 베이지 수트) */}
      <circle cx="140" cy="128" r="16" fill="#292524" />
      <path d="M 124 148 L 158 148 L 154 220 L 128 220 Z" fill="#d7cbbe" />
      <rect x="130" y="220" width="9" height="44" fill="#44403c" />
      <rect x="144" y="220" width="9" height="44" fill="#44403c" />

      {/* 신부 (우측, 정갈한 실크 드레스) */}
      <circle cx="190" cy="132" r="15" fill="#1c1917" />
      <path d="M 176 150 L 206 150 Q 212 210 216 250 L 170 250 Z" fill="#ffffff" stroke="#e7e5e4" />

      {/* 두 사람 사이에 놓인 작은 부케 */}
      <circle cx="166" cy="195" r="8" fill="#fecdd3" />
      <circle cx="168" cy="192" r="6" fill="#f43f5e" />
    </svg>
  );
}

// 8. 전통 한옥 격자 창호문 & 한복 신랑 신부 (Traditional Hanok & Hanbok)
export function BridalCoupleHanbokSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inv-art-svg ${className}`}
      aria-label="한옥 격자문과 전통 혼례 한복 부부"
    >
      <defs>
        <linearGradient id="hanji-paper" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fdfbf7" />
          <stop offset="100%" stopColor="#f4eee1" />
        </linearGradient>
      </defs>

      <rect width="340" height="360" fill="url(#hanji-paper)" />

      {/* 한옥 격자 창호문 프레임 */}
      <rect x="25" y="25" width="290" height="310" rx="6" fill="none" stroke="#78350f" strokeWidth="6" />
      <rect x="35" y="35" width="270" height="290" rx="3" fill="none" stroke="#b45309" strokeWidth="1.5" />
      {/* 가로/세로 격자 살 */}
      <line x1="35" y1="100" x2="305" y2="100" stroke="#b45309" strokeWidth="1.5" opacity="0.6" />
      <line x1="35" y1="260" x2="305" y2="260" stroke="#b45309" strokeWidth="1.5" opacity="0.6" />
      <line x1="100" y1="35" x2="100" y2="325" stroke="#b45309" strokeWidth="1.5" opacity="0.6" />
      <line x1="240" y1="35" x2="240" y2="325" stroke="#b45309" strokeWidth="1.5" opacity="0.6" />

      {/* 청홍 전통 매듭 노리개 */}
      <g transform="translate(170, 40)">
        <circle cx="-8" cy="10" r="7" fill="#dc2626" />
        <circle cx="8" cy="10" r="7" fill="#2563eb" />
        <path d="M -8 17 L -10 38" stroke="#dc2626" strokeWidth="2" />
        <path d="M 8 17 L 10 38" stroke="#2563eb" strokeWidth="2" />
      </g>

      {/* 전통 한복 차림의 신랑 신부 */}
      {/* 신랑: 감색 도포 & 갓 */}
      <ellipse cx="130" cy="130" rx="20" ry="4" fill="#0f172a" />
      <polygon points="120,130 140,130 136,112 124,112" fill="#0f172a" />
      <circle cx="130" cy="144" r="14" fill="#fdba74" />
      {/* 남색 도포 */}
      <path d="M 108 162 L 152 162 L 158 280 L 100 280 Z" fill="#1e3a8a" />
      {/* 붉은 세조대 (허리끈) */}
      <line x1="106" y1="202" x2="154" y2="202" stroke="#dc2626" strokeWidth="3.5" />

      {/* 신부: 족두리 & 연지곤지 & 홍원삼 */}
      <polygon points="204,130 216,130 213,122 207,122" fill="#b91c1c" />
      <circle cx="210" cy="120" r="3" fill="#fbbf24" />
      <circle cx="210" cy="145" r="14" fill="#fed7aa" />
      {/* 연지곤지 */}
      <circle cx="203" cy="147" r="2.5" fill="#ef4444" />
      <circle cx="217" cy="147" r="2.5" fill="#ef4444" />
      <circle cx="210" cy="138" r="2" fill="#ef4444" />
      {/* 붉은 활옷 / 원삼 */}
      <path d="M 186 164 L 232 164 Q 242 220 248 280 L 175 280 Z" fill="#dc2626" />
      {/* 한삼 흰 소매 */}
      <ellipse cx="178" cy="214" rx="8" ry="18" fill="#ffffff" />
      <ellipse cx="238" cy="214" rx="8" ry="18" fill="#ffffff" />
    </svg>
  );
}

// 9. 별빛 연회 럭셔리 호텔 샹들리에 & 이브닝 파티 (Luxury Grand Ballroom)
export function BridalCoupleBallroomSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inv-art-svg ${className}`}
      aria-label="별빛 연회 호텔 그랜드볼룸"
    >
      <defs>
        <linearGradient id="ballroom-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#030712" />
          <stop offset="60%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>

      <rect width="340" height="380" fill="url(#ballroom-bg)" />

      {/* 샹들리에 크리스탈 골드 빛 */}
      <g stroke="#fbbf24" strokeWidth="1.5" opacity="0.8">
        <path d="M 170 0 L 170 45" />
        <ellipse cx="170" cy="55" rx="55" ry="12" fill="none" />
        <ellipse cx="170" cy="75" rx="35" ry="8" fill="none" />
        <line x1="120" y1="58" x2="135" y2="80" />
        <line x1="220" y1="58" x2="205" y2="80" />
        <circle cx="170" cy="95" r="4" fill="#fde047" />
        <circle cx="135" cy="80" r="3" fill="#fde047" />
        <circle cx="205" cy="80" r="3" fill="#fde047" />
      </g>

      {/* 반짝이는 별빛 파티클 */}
      <circle cx="70" cy="140" r="2" fill="#fde047" />
      <circle cx="270" cy="120" r="2.5" fill="#fde047" />
      <circle cx="95" cy="220" r="2" fill="#ffffff" />
      <circle cx="250" cy="240" r="2" fill="#ffffff" />

      {/* 실루엣 이브닝 턱시도 & 머메이드 드레스 */}
      <g transform="translate(115, 170)">
        {/* 신랑 */}
        <circle cx="35" cy="30" r="13" fill="#18181b" />
        <path d="M 22 45 L 48 45 L 50 160 L 20 160 Z" fill="#020617" />
        {/* 화이트 셔츠 & 보타이 */}
        <polygon points="32,46 38,46 35,58" fill="#ffffff" />
        <circle cx="35" cy="48" r="2.5" fill="#eab308" />

        {/* 신부 머메이드 드레스 */}
        <circle cx="75" cy="36" r="12" fill="#18181b" />
        <path d="M 64 50 Q 82 50 86 115 Q 96 160 108 170 L 52 170 Q 64 160 70 115 Z" fill="#ffffff" />
        {/* 골드 목걸이 */}
        <path d="M 70 52 Q 75 58 80 52" stroke="#eab308" strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  );
}

