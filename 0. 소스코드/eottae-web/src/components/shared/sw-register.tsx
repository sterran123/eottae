'use client';

import { useEffect } from 'react';

// 프로덕션에서만 서비스워커 등록 — 개발 서버의 캐시 오염 방지
export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    // basePath(GitHub Pages /eottae) 아래에서도 스코프가 맞도록 경로를 붙인다
    const swUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {
      // 등록 실패는 치명적이지 않으므로 조용히 무시
    });
  }, []);

  return null;
}
