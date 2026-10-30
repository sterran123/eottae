import type { Metadata } from 'next';
import Link from 'next/link';
import SubpageHero from '@/components/shared/subpage-hero';
import ThemeToggle from '@/components/shared/theme-toggle';
import AccountSettingsCard from '@/components/settings/AccountSettingsCard';
import { MotifIcon } from '@/components/shared/motif-icon';

export const metadata: Metadata = {
  title: '설정',
  description: '테마, 로그인 준비 상태, 안전·개인정보 안내, 앱 정보 — 어때? 설정',
};

export default function SettingsPage() {
  return (
    <>
      <SubpageHero eyebrow="SETTINGS" title="설정" motif={<MotifIcon name="gear" size={56} />}>
        화면 테마와 계정·안전 안내를 한곳에서 볼 수 있어요.
      </SubpageHero>
      <section className="shell subpage">
        <div className="settings-list">
          <article className="feature settings-card">
            <span>01</span>
            <h2>화면</h2>
            <p>고른 테마는 이 브라우저에 저장되고, 헤더의 테마 선택과 같이 바뀌어요.</p>
            <ThemeToggle variant="choices" />
          </article>

          <AccountSettingsCard />

          <article className="feature settings-card">
            <span>03</span>
            <h2>안전·개인정보</h2>
            <p>안전 정책과 계정 삭제 안내를 미리 읽어 볼 수 있어요.</p>
            <div className="settings-actions">
              <Link className="btn outline" href="/safety">
                안전센터
              </Link>
              <Link className="btn outline" href="/privacy">
                개인정보·계정 삭제 안내
              </Link>
            </div>
          </article>

          <article className="feature settings-card">
            <span>04</span>
            <h2>앱 정보</h2>
            <dl className="settings-facts">
              <div>
                <dt>서비스 이름</dt>
                <dd>어때?</dd>
              </div>
              <div>
                <dt>1차 MVP · 매칭</dt>
                <dd>온보딩·추천·문답·채팅을 데모로 체험할 수 있어요.</dd>
              </div>
              <div>
                <dt>2차</dt>
                <dd>데이트·소모임은 준비 중이에요.</dd>
              </div>
              <div>
                <dt>3차</dt>
                <dd>모바일 청첩장은 준비 중이에요.</dd>
              </div>
              <div>
                <dt>오프라인</dt>
                <dd>방문한 화면은 기기에 저장되고, 연결이 없으면 그 화면이나 오프라인 안내가 열려요.</dd>
              </div>
            </dl>
          </article>
        </div>

        <Link className="btn outline" href="/">
          ← 홈으로
        </Link>
      </section>
    </>
  );
}
