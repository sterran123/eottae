import type { Metadata } from 'next';
import Link from 'next/link';
import SubpageHero from '@/components/shared/subpage-hero';
import { MotifIcon } from '@/components/shared/motif-icon';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const accountSentence = isSupabaseConfigured
  ? '이메일 가입을 하면 이메일·비밀번호·이름·생년월일을 인증 서버로 보내요. 이메일 확인이 끝나면 계정에는 이메일·이름·출생 연도가 남고, 생년월일 원본은 인증 기록에 남지 않아요. 비밀번호는 이 앱에 남기지 않아요. 닉네임은 가입 때 비어 있고, 지금 화면에는 정하는 곳이 없어요. 약관·개인정보·만 19세 자기 확인 동의는 이메일 확인이 끝나면 계정에 기록돼요. 로그인하지 않은 시연만 성인 확인(시연)과 그 뒤의 프로필·취향·관심·신고·차단을 이 브라우저에 남겨요. 로그인한 계정은 정식 성인 확인(만료 시각이 있음) 전에는 그 항목을 새로 저장하지 않고, 확인이 끝나면 프로필·취향·관심·신고·차단·대화를 서버에 저장해요.'
  : '인증 설정 전에는 이메일 가입·로그인을 하지 않아, 계정을 서버에 만들지 않아요.';

const accountTitle = isSupabaseConfigured
  ? '가입 계정은 서버, 시연 데이터는 이 기기'
  : '데모는 이 기기, 서버 계정은 없음';

export const metadata: Metadata = {
  title: '개인정보·계정 삭제 안내',
  description: [
    '시연용 매칭·채팅·데이트·청첩장 데이터는 이 브라우저에만 남습니다.',
    accountSentence,
    '설정의 회원 탈퇴는 서버에 탈퇴를 요청하지 않습니다. 신고 이력은 사람 연결만 비우고 본문은 남을 수 있습니다.',
  ].join(' '),
};

export default function PrivacyPage() {
  return (
    <>
      <SubpageHero eyebrow="DATA POLICY" title="개인정보·계정 삭제 안내" motif={<MotifIcon name="lock" size={56} />}>
        시연용 매칭·채팅·데이트·청첩장 데이터는 이 브라우저에만 남아요. {accountSentence} 설정의 회원
        탈퇴는 서버에 탈퇴를 요청하지 않아요.
      </SubpageHero>
      <section className="shell subpage">

        <div className="feature-grid">
          <article className="feature">
            <span>회원 탈퇴·데이터 삭제</span>
            <h3>데모 데이터를 지우는 곳</h3>
            <p>
              <b>설정 &gt; 계정 &gt; 회원 탈퇴·데이터 삭제</b>에서 확인 문구를 입력하면 이 브라우저의
              시연 기록을 지울 수 있어요. 화면 테마는 그 화면에서 선택했을 때만 함께 지워요. 이 버튼은
              실제 계정을 삭제하지 않으며, 서버에 탈퇴를 요청하지 않습니다.
            </p>
          </article>
          <article className="feature">
            <span>이 기기</span>
            <h3>지워지는 데모 데이터</h3>
            <p>
              매칭 온보딩·문답·공통 질문 거절, 추천에 남긴 관심·성사 매칭, 성인 확인 시연 표시,
              데이트·소모임에 남긴 참가·투표·만든 모임·후기·좋아요·추천·정보 확인 요청, 청첩장 테마
              데모 영수증, 이 기기의 데모 대화·신고·차단이 이 브라우저에서 지워져요. 채팅 화면을
              다시 열면 예시 문장만 다시 만들어지고, 직접 보낸 말은 돌아오지 않아요.
            </p>
          </article>
          <article className="feature">
            <span>보존 예외</span>
            <h3>익명으로 남는 신고 이력</h3>
            <p>
              아래는 실제 계정 삭제를 붙이기 전의 정책 안내이고, 이 목업은 실행하지 않아요.
              프로필·취향·매칭·대화처럼 계정에 붙은 이용 기록은 지우는 쪽입니다. 정책에서 삭제 뒤에도
              남기는 예외는 신고 이력입니다. 신고 기록은 남기고, 신고한 사람과 신고받은 사람이
              누구인지만 비워 익명으로 둡니다. 신고 본문은 그대로 남습니다. 본문에 이름이 있으면
              사람 연결이 남을 수 있어요. 탈퇴 뒤 다시 가입해 신고를 없애지 못하게 하려는 안전
              정책과 같습니다. 보관 기간은 출시 전에 정하는 항목이라, 이 안내는 기간을 적지 않습니다.
            </p>
          </article>
          <article className="feature">
            <span>수집</span>
            <h3>{accountTitle}</h3>
            <p>
              시연용 매칭·채팅·데이트·청첩장 데이터는 이 브라우저에만 저장돼요. {accountSentence} 안전
              정책은 연락처·주소·학교·직장·실시간
              위치·정밀 좌표를 기본으로 두지 않고, 채팅 본문·비밀번호·토큰·신분 확인 정보를 로그에
              남기지 않는 방향을 적고 있습니다. 신분증 원본은 시연에서도 받지 않습니다.
            </p>
          </article>
        </div>

        <aside className="warn">
          <strong>시연용 목업</strong>
          <p>
            회원 탈퇴는 이 기기의 데모 데이터만 지워요. 운영 데이터베이스의 계정을 지우거나 반영하지
            않습니다. 개인정보 처리방침 본문과 보관 기간은 아직 출시 전 결정 항목입니다.
          </p>
        </aside>

        <div className="settings-actions">
          <Link className="btn outline" href="/settings">
            설정에서 데모 데이터 지우기
          </Link>
          <Link className="btn outline" href="/">
            ← 홈으로
          </Link>
        </div>
      </section>
    </>
  );
}
