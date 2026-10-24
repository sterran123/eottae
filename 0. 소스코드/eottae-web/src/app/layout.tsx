import type { Metadata, Viewport } from 'next';
import SiteHeader from '@/components/shared/site-header';
import SiteFooter from '@/components/shared/site-footer';
import SwRegister from '@/components/shared/sw-register';
import ScrollReveal from '@/components/shared/scroll-reveal';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '어때? | 취향으로 시작되는 인연',
    template: '%s | 어때?',
  },
  description: '매칭 · 데이트·소모임 · 모바일 청첩장, 세 가지 서비스를 하나로 연결하는 「어때?」 PWA 기획용 골격',
  manifest: '/eottae/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/eottae/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/eottae/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/eottae/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '어때?',
  },
  openGraph: {
    title: '어때? | 취향으로 시작되는 인연',
    description: '매칭 · 데이트·소모임 · 모바일 청첩장 — 하나의 PWA',
    locale: 'ko_KR',
    type: 'website',
    siteName: '어때?',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 단일 theme-color — 선택된 테마에 맞춰 인라인 스크립트·ThemeToggle이 content를 동기화한다
  // (기본 라이트 브랜드 #7454c4)
  themeColor: '#7454c4',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        {/* 저장된 테마(data-theme)를 첫 페인트 전에 적용해 깜빡임(FOUC) 방지.
            'system'만 OS 설정을 따르고 미저장·잘못된 값은 기본 'light'로 동작한다 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('eottae-theme');if('light cupcake cyberpunk disney dark system'.split(' ').indexOf(t)>=0){document.documentElement.dataset.theme=t;var C={light:'#7454c4',cupcake:'#c2578e',cyberpunk:'#0a0a14',disney:'#2f62b1',dark:'#10101b'},c=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?C.dark:C.light):C[t],m=document.querySelector('meta[name=theme-color]');if(m)m.content=c}}catch(e){}",
          }}
        />
        {/* JS 비활성 시 스크롤 리빌이 없으므로 [data-reveal] 숨김을 해제한다 */}
        <noscript>
          <style>{`[data-reveal]{opacity:1;transform:none}`}</style>
        </noscript>
        <a className="skip" href="#content">
          본문으로 건너뛰기
        </a>
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
        <SwRegister />
        <ScrollReveal />
      </body>
    </html>
  );
}
