/** @type {import('next').NextConfig} */
// GitHub Pages 프로젝트 사이트 경로 — https://sterran123.github.io/eottae/
// 저장소 이름이 바뀌면 이 값과 CSS·manifest·sw.js 안의 '/eottae' 경로를 함께 바꾼다.
const BASE_PATH = '/eottae';

const nextConfig = {
  // GitHub Pages는 정적 호스팅만 가능 → next build 시 out/ 정적 파일로 내보낸다.
  output: 'export',
  basePath: BASE_PATH,
  // 정적 호스트마다 확장자 생략 해상도가 달라 디렉터리 인덱스 형태로 내보낸다
  // (/eottae/match/ → match/index.html — Pages·로컬 서버 어디서든 동작)
  trailingSlash: true,
  // 런타임 JS(서비스워커 등록 등)에서 basePath를 읽을 수 있도록 주입
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  // 정적 호스팅에는 next/image 최적화 서버가 없다
  images: { unoptimized: true },
};

export default nextConfig;
