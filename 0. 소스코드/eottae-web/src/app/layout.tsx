import type { Metadata, Viewport } from 'next';
import SiteHeader from '@/components/shared/site-header';
import SiteFooter from '@/components/shared/site-footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '어때? | 취향으로 시작되는 인연',
    template: '%s | 어때?',
  },
  description: '매칭 · 데이트·소모임 · 모바일 청첩장, 세 가지 서비스를 하나로 연결하는 「어때?」 PWA 기획용 골격',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7454c4' },
    { media: '(prefers-color-scheme: dark)', color: '#10101b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a className="skip" href="#content">
          본문으로 건너뛰기
        </a>
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
