// ============================================================
//  저장 경로: src/lib/match/match-service.ts
//  담당: 오하율 · MATCH-001/002/009 (매칭 데이터 소스 · Supabase 백엔드 연동)
//  역할: 온보딩(`profiles`·`profile_interests`), 추천(`get_recommendations`),
//        관심 표현(`likes`), 문답·공통 질문(`profile_qna_answers`·`common_question_answers`)의
//        Supabase 호출과 데모 폴백을 분리하는 데이터 서비스 계층.
//
//  [ADR-002 / ADR-005 원칙]
//  1. 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 없을 때는
//     알려진 기본 키로 폴백하지 않고 데모 데이터 모드로만 동작해 정적 배포를 보호한다.
//  2. 로그인된 계정이라도 성인 인증(`adult_verified = true` 및 만료 전)이 확인되지 않으면
//     실데이터 저장·추천·좋아요를 거부(fail-closed, AGE_VERIFICATION_REQUIRED)한다.
//  3. 성인 인증이 완료된 로그인 세션에서는 화면의 DEMO 배지/문구를 숨기고
//     실제 Supabase 테이블·RPC와 통신한다.
// ============================================================

import { authService } from '@/lib/auth/auth-service';
import type { MyAccount } from '@/lib/auth/types';
import type { BlockRequest, ReportCategory, ReportRequest } from '@/lib/safety/types';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DEMO_IDENTITY, VALID_INTEREST_IDS } from './demo-data';
import { DEMO_MY_ANSWERS } from './demo-qna';
import { DEMO_ACORN, DEMO_RECOMMENDATIONS } from './demo-recommendations';
import {
  toOnboardingDraft,
  toQnaAnswer,
  toRecommendProfile,
  toSaveOnboardingRequest,
  validateOnboardingDraft,
  type AcornBalance,
  type ApiError,
  type LikeDecision,
  type LikeResultDto,
  type OnboardingDraft,
  type ProfileInterestRow,
  type ProfileQnaAnswerRow,
  type ProfileRow,
  type QnaAnswer,
  type RecommendationRow,
  type RecommendProfile,
  type RecommendResponse,
  type SaveOnboardingRequest,
  type VerifiedIdentity,
} from './types';

const STORAGE_ONBOARDING_KEY = 'eottae_match_onboarding_draft_v1';
const STORAGE_QNA_KEY = 'eottae_match_qna_answers_v1';
const STORAGE_COMMON_DECLINED_KEY = 'eottae_match_common_declined_v1';

export type MatchOperatingMode = 'demo' | 'live' | 'unverified';

export interface MatchAccessContext {
  mode: MatchOperatingMode;
  /** 화면에 DEMO 안내를 노출할지 여부 (시연/실계정 로그인 시 false) */
  isDemo: boolean;
  identity: VerifiedIdentity;
  account: MyAccount | null;
  gateMessage?: string;
}

export type MatchServiceResult<T> =
  | { ok: true; mode: MatchOperatingMode; data: T }
  | { ok: false; mode: MatchOperatingMode; error: ApiError['error'] };

function isAdultVerificationActive(account: MyAccount): boolean {
  if (!account.adultVerified) return false;
  if (!account.adultVerificationExpiresAt) return false;
  const expiresMs = Date.parse(account.adultVerificationExpiresAt);
  if (Number.isNaN(expiresMs)) return false;
  return expiresMs > Date.now();
}

function computeVerifiedAge(birthYear: number | null): number {
  if (!birthYear || birthYear < 1900) return DEMO_IDENTITY.age;
  const currentYear = new Date().getFullYear();
  return Math.max(19, currentYear - birthYear);
}

function readLocalJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocalJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소 용량·사생활 보호 모드 제한 시 무시
  }
}

/**
 * UI 신고 사유 문구를 DB `public.reports.category` CHECK 제약 값(`ReportCategory`)으로 매핑한다.
 */
export function mapUiReasonToReportCategory(reason: string): ReportCategory {
  if (reason.includes('성적')) return 'sexual';
  if (reason.includes('광고') || reason.includes('스팸') || reason.includes('사기') || reason.includes('도용')) {
    return 'scam';
  }
  if (reason.includes('기타')) return 'other';
  return 'abuse';
}

export const matchService = {
  /**
   * 현재 매칭 모듈의 동작 모드(데모 폴백 vs 성인 인증 완료 실데이터 vs 성인 미인증 차단)를 판정한다.
   */
  async resolveAccessContext(): Promise<MatchAccessContext> {
    const supabase = getSupabase();
    if (!isSupabaseConfigured || !supabase) {
      return {
        mode: 'demo',
        isDemo: true,
        identity: DEMO_IDENTITY,
        account: null,
      };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      return {
        mode: 'demo',
        isDemo: true,
        identity: DEMO_IDENTITY,
        account: null,
      };
    }

    const access = await authService.assertAccountAccess();
    if (!access.ok) {
      return {
        mode: 'demo',
        isDemo: true,
        identity: DEMO_IDENTITY,
        account: null,
        gateMessage: access.error.message,
      };
    }

    const account = access.data;
    const age = computeVerifiedAge(account.birthYear);
    const verified = isAdultVerificationActive(account);

    if (!verified) {
      return {
        mode: 'unverified',
        isDemo: false,
        identity: {
          verified: false,
          age,
          gender: 'female',
          nickname: account.nickname,
        },
        account,
        gateMessage: '성인 확인 후 매칭·온보딩 저장을 이용할 수 있어요.',
      };
    }

    return {
      mode: 'live',
      isDemo: false,
      identity: {
        verified: true,
        age,
        gender: 'female',
        nickname: account.nickname,
      },
      account,
    };
  },

  /**
   * 저장된 온보딩 설정(`profiles` + `profile_interests` 또는 데모 로컬 저장본)을 불러온다.
   */
  async loadOnboarding(): Promise<{
    context: MatchAccessContext;
    draft: OnboardingDraft | null;
  }> {
    const context = await this.resolveAccessContext();
    const supabase = getSupabase();

    if (context.mode === 'live' && context.account && supabase) {
      const userId = context.account.id;
      const [profileRes, interestsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'user_id, nickname, bio, mbti, avoid_mbti, target_preference, relation_goal, preferred_distance, photo_visibility, profile_status, updated_at',
          )
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('profile_interests')
          .select('user_id, interest_id')
          .eq('user_id', userId),
      ]);

      if (!profileRes.error && profileRes.data) {
        const draft = toOnboardingDraft(
          profileRes.data as Partial<ProfileRow>,
          (interestsRes.data ?? []) as ProfileInterestRow[],
        );
        writeLocalJson(STORAGE_ONBOARDING_KEY, draft);
        return { context, draft };
      }
    }

    const cached = readLocalJson<OnboardingDraft>(STORAGE_ONBOARDING_KEY);
    return { context, draft: cached };
  },

  /**
   * 온보딩 취향·공개범위를 검증하고 저장한다 (MATCH-001, TC-005).
   * - 성인 미인증 로그인 상태(`unverified`)에서는 fail-closed로 거부한다.
   * - `live` 모드에서는 `public.profiles` upsert 및 `public.profile_interests` 동기화를 수행한다.
   */
  async saveOnboarding(
    draft: OnboardingDraft,
  ): Promise<MatchServiceResult<SaveOnboardingRequest>> {
    const validationErrors = validateOnboardingDraft(draft);
    const invalidInterest = draft.interestIds.find(
      (id) => !VALID_INTEREST_IDS.has(id),
    );
    if (invalidInterest) {
      validationErrors.push('유효하지 않은 관심사 항목이 포함되어 있어요.');
    }

    const req = toSaveOnboardingRequest(draft);
    if (validationErrors.length > 0 || !req) {
      return {
        ok: false,
        mode: 'demo',
        error: {
          code: 'VALIDATION_ERROR',
          message: validationErrors[0] ?? '입력값을 다시 확인해 주세요.',
        },
      };
    }

    const context = await this.resolveAccessContext();
    if (context.mode === 'unverified') {
      return {
        ok: false,
        mode: 'unverified',
        error: {
          code: 'AGE_VERIFICATION_REQUIRED',
          message: '성인 확인 후 이용할 수 있어요.',
        },
      };
    }

    const supabase = getSupabase();
    if (context.mode === 'live' && context.account && supabase) {
      const userId = context.account.id;
      const { error: profileErr } = await supabase.from('profiles').upsert(
        {
          user_id: userId,
          nickname: context.account.nickname,
          mbti: req.myMbti,
          avoid_mbti: req.avoidMbti,
          target_preference: req.targetPreference,
          relation_goal: req.relationGoal,
          preferred_distance: req.preferredDistance,
          photo_visibility: req.photoVisibility,
          profile_status: 'ACTIVE',
        },
        { onConflict: 'user_id' },
      );

      if (profileErr) {
        return {
          ok: false,
          mode: 'live',
          error: {
            code: 'NETWORK_ERROR',
            message: '프로필 저장 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
          },
        };
      }

      const { error: delErr } = await supabase
        .from('profile_interests')
        .delete()
        .eq('user_id', userId);

      if (!delErr && req.interestIds.length > 0) {
        const rows: ProfileInterestRow[] = req.interestIds.map((interestId) => ({
          user_id: userId,
          interest_id: interestId,
        }));
        const { error: insErr } = await supabase
          .from('profile_interests')
          .insert(rows);
        if (insErr) {
          return {
            ok: false,
            mode: 'live',
            error: {
              code: 'NETWORK_ERROR',
              message: '관심사 저장 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
            },
          };
        }
      }

      writeLocalJson(STORAGE_ONBOARDING_KEY, req);
      return { ok: true, mode: 'live', data: req };
    }

    writeLocalJson(STORAGE_ONBOARDING_KEY, req);
    return { ok: true, mode: 'demo', data: req };
  },

  /**
   * 추천 카드 목록을 조회한다 (MATCH-002, MATCH-006).
   * - `live` 모드에서는 RPC `get_recommendations(p_cursor)` 결과를 `toRecommendProfile`로 변환한다.
   * - `unverified` 모드에서는 fail-closed로 거부한다.
   */
  async fetchRecommendations(
    cursor: string | null = null,
  ): Promise<
    MatchServiceResult<RecommendResponse & { acorn: AcornBalance }> & {
      context: MatchAccessContext;
    }
  > {
    const context = await this.resolveAccessContext();

    if (context.mode === 'unverified') {
      return {
        ok: false,
        mode: 'unverified',
        context,
        error: {
          code: 'AGE_VERIFICATION_REQUIRED',
          message: '성인 확인 후 추천을 이용할 수 있어요.',
        },
      };
    }

    const supabase = getSupabase();
    if (context.mode === 'live' && context.account && supabase) {
      const { data, error } = await supabase.rpc('get_recommendations', {
        p_cursor: cursor,
      });

      if (!error && Array.isArray(data)) {
        const items = (data as RecommendationRow[]).map((row) =>
          toRecommendProfile(row),
        );
        return {
          ok: true,
          mode: 'live',
          context,
          data: {
            items,
            nextCursor: null,
            acorn: DEMO_ACORN,
          },
        };
      }

      return {
        ok: false,
        mode: 'live',
        context,
        error: {
          code: 'NETWORK_ERROR',
          message: '추천 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
        },
      };
    }

    return {
      ok: true,
      mode: 'demo',
      context,
      data: {
        items: DEMO_RECOMMENDATIONS,
        nextCursor: null,
        acorn: DEMO_ACORN,
      },
    };
  },

  /**
   * 추천 상대에게 관심(`yes`) 또는 패스(`no`)를 기록한다 (MATCH-005, TC-006).
   * 쌍방 관심 시 서버 트리거/RPC가 `matches`·`conversations`를 1건만 생성한다.
   */
  async sendLikeDecision(
    targetId: string,
    decision: LikeDecision,
  ): Promise<MatchServiceResult<LikeResultDto>> {
    const context = await this.resolveAccessContext();
    if (context.mode === 'unverified') {
      return {
        ok: false,
        mode: 'unverified',
        error: {
          code: 'AGE_VERIFICATION_REQUIRED',
          message: '성인 확인 후 이용할 수 있어요.',
        },
      };
    }

    const supabase = getSupabase();
    if (context.mode === 'live' && context.account && supabase) {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'record_like_decision',
        {
          p_target_id: targetId,
          p_decision: decision,
        },
      );

      if (!rpcError && rpcData && typeof rpcData === 'object') {
        const row = rpcData as {
          matched?: boolean;
          match_id?: string | null;
          conversation_id?: string | null;
        };
        return {
          ok: true,
          mode: 'live',
          data: {
            targetId,
            decision,
            matched: Boolean(row.matched),
            matchId: row.match_id ?? null,
            conversationId: row.conversation_id ?? null,
          },
        };
      }

      const { error: insertErr } = await supabase.from('likes').upsert(
        {
          actor_id: context.account.id,
          target_id: targetId,
          decision,
        },
        { onConflict: 'actor_id,target_id' },
      );

      if (insertErr) {
        return {
          ok: false,
          mode: 'live',
          error: {
            code: 'NETWORK_ERROR',
            message: '관심 표현을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
          },
        };
      }

      return {
        ok: true,
        mode: 'live',
        data: {
          targetId,
          decision,
          matched: false,
          matchId: null,
          conversationId: null,
        },
      };
    }

    return {
      ok: true,
      mode: 'demo',
      data: {
        targetId,
        decision,
        matched: false,
        matchId: null,
        conversationId: null,
      },
    };
  },

  /**
   * 추천 카드에서 사용자를 차단한다 (`public.blocks` insert · MATCH-008 연계).
   */
  async blockUser(req: BlockRequest): Promise<MatchServiceResult<void>> {
    const context = await this.resolveAccessContext();
    const supabase = getSupabase();

    if (context.mode === 'live' && context.account && supabase) {
      const { error } = await supabase.from('blocks').upsert(
        {
          blocker_id: context.account.id,
          blocked_id: req.blockedUserId,
        },
        { onConflict: 'blocker_id,blocked_id' },
      );
      if (error) {
        return {
          ok: false,
          mode: 'live',
          error: {
            code: 'NETWORK_ERROR',
            message: '차단 처리 중 오류가 발생했어요.',
          },
        };
      }
      return { ok: true, mode: 'live', data: undefined };
    }

    return { ok: true, mode: 'demo', data: undefined };
  },

  /**
   * 추천 카드에서 사용자를 신고 및 즉시 차단한다 (`public.reports` + `public.blocks` insert · MATCH-008 연계).
   */
  async reportUser(req: ReportRequest): Promise<MatchServiceResult<void>> {
    const context = await this.resolveAccessContext();
    const supabase = getSupabase();

    if (context.mode === 'live' && context.account && supabase) {
      const { error: reportErr } = await supabase.from('reports').insert({
        reporter_id: context.account.id,
        reported_user_id: req.reportedUserId,
        category: req.category,
        description: req.description.slice(0, 200),
      });

      if (req.alsoBlock) {
        await supabase.from('blocks').upsert(
          {
            blocker_id: context.account.id,
            blocked_id: req.reportedUserId,
          },
          { onConflict: 'blocker_id,blocked_id' },
        );
      }

      if (reportErr) {
        return {
          ok: false,
          mode: 'live',
          error: {
            code: 'NETWORK_ERROR',
            message: '신고 접수 중 오류가 발생했어요.',
          },
        };
      }
      return { ok: true, mode: 'live', data: undefined };
    }

    return { ok: true, mode: 'demo', data: undefined };
  },

  /**
   * 내 프로필 문답 답변 목록을 조회한다 (MATCH-009).
   */
  async loadMyQnaAnswers(): Promise<{
    context: MatchAccessContext;
    answers: Record<string, QnaAnswer>;
  }> {
    const context = await this.resolveAccessContext();
    const supabase = getSupabase();

    if (context.mode === 'live' && context.account && supabase) {
      const { data, error } = await supabase
        .from('profile_qna_answers')
        .select('user_id, question_id, option_id, custom_text, updated_at')
        .eq('user_id', context.account.id);

      if (!error && Array.isArray(data)) {
        const map: Record<string, QnaAnswer> = {};
        for (const row of data as ProfileQnaAnswerRow[]) {
          const parsed = toQnaAnswer(row);
          map[parsed.questionId] = parsed;
        }
        writeLocalJson(STORAGE_QNA_KEY, map);
        return { context, answers: map };
      }
    }

    const cached = readLocalJson<Record<string, QnaAnswer>>(STORAGE_QNA_KEY);
    if (cached) {
      return { context, answers: cached };
    }

    const initial: Record<string, QnaAnswer> = {};
    for (const [qid, a] of Object.entries(DEMO_MY_ANSWERS)) {
      initial[qid] = {
        questionId: qid,
        optionId: a.optionId,
        ...(a.customText ? { customText: a.customText } : {}),
      };
    }
    return { context, answers: initial };
  },

  /**
   * 프로필 문답 답변 1건을 저장한다 (MATCH-009).
   */
  async saveMyQnaAnswer(
    answer: QnaAnswer,
    currentAnswers: Record<string, QnaAnswer>,
  ): Promise<MatchServiceResult<Record<string, QnaAnswer>>> {
    const next = { ...currentAnswers, [answer.questionId]: answer };
    writeLocalJson(STORAGE_QNA_KEY, next);

    const context = await this.resolveAccessContext();
    if (context.mode === 'unverified') {
      return {
        ok: false,
        mode: 'unverified',
        error: {
          code: 'AGE_VERIFICATION_REQUIRED',
          message: '성인 확인 후 이용할 수 있어요.',
        },
      };
    }

    const supabase = getSupabase();
    if (context.mode === 'live' && context.account && supabase) {
      await supabase.from('profile_qna_answers').upsert(
        {
          user_id: context.account.id,
          question_id: answer.questionId,
          option_id: answer.optionId,
          custom_text: answer.customText ?? null,
        },
        { onConflict: 'user_id,question_id' },
      );
      return { ok: true, mode: 'live', data: next };
    }

    return { ok: true, mode: 'demo', data: next };
  },

  /**
   * 프로필 문답 답변 1건을 삭제한다 (MATCH-009).
   */
  async deleteMyQnaAnswer(
    questionId: string,
    currentAnswers: Record<string, QnaAnswer>,
  ): Promise<MatchServiceResult<Record<string, QnaAnswer>>> {
    const next = { ...currentAnswers };
    delete next[questionId];
    writeLocalJson(STORAGE_QNA_KEY, next);

    const context = await this.resolveAccessContext();
    const supabase = getSupabase();
    if (context.mode === 'live' && context.account && supabase) {
      await supabase
        .from('profile_qna_answers')
        .delete()
        .eq('user_id', context.account.id)
        .eq('question_id', questionId);
      return { ok: true, mode: 'live', data: next };
    }

    return { ok: true, mode: 'demo', data: next };
  },

  /**
   * 공통 질문 거절 목록을 불러온다 (MATCH-009).
   */
  loadDeclinedCommonQuestions(): string[] {
    return readLocalJson<string[]>(STORAGE_COMMON_DECLINED_KEY) ?? [];
  },

  /**
   * 공통 질문 거절 목록을 저장한다 (MATCH-009).
   */
  saveDeclinedCommonQuestions(questionIds: string[]): void {
    writeLocalJson(STORAGE_COMMON_DECLINED_KEY, Array.from(new Set(questionIds)));
  },
};

