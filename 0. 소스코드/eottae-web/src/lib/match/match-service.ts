// ============================================================
//  저장 경로: src/lib/match/match-service.ts
//  담당: 오하율 · MATCH-001/002/009 (매칭 데이터 소스 · Supabase 백엔드 연동)
//  역할: 온보딩(`save_onboarding`, 조회는 `profiles`·`user_interests`),
//        추천(`get_recommendations`), 관심 표현(`record_like_decision`),
//        문답(`save_answers`, 조회는 `profile_answers`)의
//        Supabase 호출과 데모 폴백을 분리하는 데이터 서비스 계층.
//        공통 질문 거절은 `common_question_answers`를 호출하지 않고,
//        데모(키 없음 또는 세션 없음)에서만 localStorage에 둔다.
//
//  [ADR-002 / ADR-005 원칙]
//  1. 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 없을 때는
//     알려진 기본 키로 폴백하지 않고 데모 데이터 모드로만 동작해 정적 배포를 보호한다.
//  2. 로그인된 계정이라도 `account_status = ACTIVE`와 성인 인증(`adult_verified = true`,
//     만료 전)이 함께 확인되지 않으면 실데이터 저장·추천·좋아요를 거부한다
//     (fail-closed, AGE_VERIFICATION_REQUIRED). 계정 조회 실패는 데모 샘플로 두지 않는다.
//  3. 성인 인증이 완료된 로그인 세션에서는 화면의 DEMO 배지/문구를 숨기고
//     실제 Supabase 테이블·RPC와 통신한다.
//  4. 실계정(live/unverified)은 온보딩·문답·공통 질문 거절을 localStorage에 남기지 않는다.
//     데모(키 미설정·세션 없음)만 로컬 초안을 쓴다. 로그인 세션이 있으면 기존 키와
//     시연 성인 확인 키(eottae_demo_adult_v1)를 지운다.
// ============================================================

import { authService } from '@/lib/auth/auth-service';
import type { MyAccount } from '@/lib/auth/types';
import { clearDemoAdult } from '@/lib/demo/demo-adult';
import { DEMO_SELF } from '@/lib/chat/demo-data';
import { saveDemoBlock, saveDemoReport } from '@/lib/safety/demo-store';
import type { BlockRequest, ReportCategory, ReportRequest } from '@/lib/safety/types';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DEMO_IDENTITY, VALID_INTEREST_IDS } from './demo-data';
import { applyDemoMutualState, recordDemoLike } from './demo-mutual';
import { DEMO_MY_ANSWERS } from './demo-qna';
import {
  DEMO_ACORN,
  demoPartnerReturnsInterest,
  demoRecommendationView,
} from './demo-recommendations';
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
  // 0002 is_active_adult(): ACTIVE가 아니면 성인으로 보지 않는다.
  if (account.accountStatus !== 'ACTIVE') return false;
  if (!account.adultVerified) return false;
  if (!account.adultVerificationExpiresAt) return false;
  const expiresMs = Date.parse(account.adultVerificationExpiresAt);
  if (Number.isNaN(expiresMs)) return false;
  return expiresMs > Date.now();
}

function computeVerifiedAge(birthYear: number | null): number | null {
  if (!birthYear || birthYear < 1900) return null;
  return new Date().getFullYear() - birthYear;
}

const UNSIGNED_IDENTITY: VerifiedIdentity = {
  verified: false,
  age: null,
};

function clearSignedInMatchCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_ONBOARDING_KEY);
    window.localStorage.removeItem(STORAGE_QNA_KEY);
    window.localStorage.removeItem(STORAGE_COMMON_DECLINED_KEY);
  } catch {
    // 저장소 접근이 막혀도 실계정 경로는 캐시를 읽지 않는다.
  }
  clearDemoAdult();
  clearDemoSession();
}

function gateError(context: MatchAccessContext): ApiError['error'] | null {
  if (context.mode !== 'unverified') return null;
  if (!context.account) {
    return {
      code: 'UNAUTHORIZED',
      message: context.gateMessage ?? '계정 상태를 확인할 수 없어요.',
    };
  }
  return {
    code: 'AGE_VERIFICATION_REQUIRED',
    message: context.gateMessage ?? '성인 확인 후 이용할 수 있어요.',
  };
}

/** 조회가 끝난 모드와 저장 시점의 모드가 다르면 쓰기 전에 실패시킨다. */
function modeChangedError(
  context: MatchAccessContext,
  expectedMode: MatchOperatingMode,
): ApiError['error'] | null {
  if (context.mode === expectedMode) return null;
  return {
    code: 'UNAUTHORIZED',
    message: '로그인 상태가 바뀌었어요. 화면을 다시 연 뒤 저장해 주세요.',
  };
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
  if (reason.includes('광고') || reason.includes('스팸') || reason.includes('사기')) {
    return 'scam';
  }
  if (reason.includes('기타')) return 'other';
  return 'abuse';
}

type MatchSupabase = NonNullable<ReturnType<typeof getSupabase>>;

/**
 * `save_answers`는 넘긴 문항만 덮어쓰고, 배열에 없는 기존 답은 지우지 않는다.
 * 지울 문항만 `removed: true`로 보낸다.
 * 조회가 일부만 성공한 뒤 한 문항을 저장하거나 지워도 나머지 답은 남는다.
 * 서버 행이 0건인 첫 저장은 그 문항만 들어간다.
 */
async function replaceProfileAnswers(
  supabase: MatchSupabase,
  next: Record<string, QnaAnswer>,
  failMessage: string,
  removeQuestionIds: readonly string[] = [],
): Promise<string | null> {
  const remove = new Set(removeQuestionIds);
  const payload: Array<{
    questionId: string;
    optionId: string | null;
    customText: string | null;
    declined: boolean;
    removed?: boolean;
  }> = [];

  for (const answer of Object.values(next)) {
    if (remove.has(answer.questionId)) continue;
    payload.push({
      questionId: answer.questionId,
      optionId: answer.optionId,
      customText: answer.customText ?? null,
      declined: false,
    });
  }
  for (const questionId of remove) {
    payload.push({
      questionId,
      optionId: null,
      customText: null,
      declined: false,
      removed: true,
    });
  }

  const { error: rpcError } = await supabase.rpc('save_answers', { p_answers: payload });
  return rpcError ? failMessage : null;
}

function readRecommendationPage(data: unknown): {
  items: RecommendationRow[];
  nextCursor: string | null;
} | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const payload = data as { items?: unknown; next_cursor?: unknown };
  if (!Array.isArray(payload.items)) return null;

  const items: RecommendationRow[] = [];
  for (const raw of payload.items) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const record = raw as { user_id?: unknown; age?: unknown };
    if (typeof record.user_id !== 'string' || record.user_id.length === 0) return null;
    // 출생연도가 없으면 서버가 age: null을 준다. 그 행만 건너뛰고 페이지는 유지한다.
    if (record.age === null) continue;
    if (typeof record.age !== 'number' || !Number.isFinite(record.age)) return null;
    items.push(raw as RecommendationRow);
  }

  const nextCursor =
    typeof payload.next_cursor === 'string' && payload.next_cursor.length > 0
      ? payload.next_cursor
      : null;
  return { items, nextCursor };
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

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    // 조회 실패는 세션 없음(데모)과 같은 성공으로 두지 않는다.
    if (sessionError) {
      return {
        mode: 'unverified',
        isDemo: false,
        identity: UNSIGNED_IDENTITY,
        account: null,
        gateMessage: '계정 상태를 확인할 수 없어요. 다시 로그인해 주세요.',
      };
    }
    if (!sessionData?.session?.user) {
      return {
        mode: 'demo',
        isDemo: true,
        identity: DEMO_IDENTITY,
        account: null,
      };
    }

    clearSignedInMatchCache();

    const access = await authService.assertAccountAccess();
    if (!access.ok) {
      return {
        mode: 'unverified',
        isDemo: false,
        identity: UNSIGNED_IDENTITY,
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
        nickname: account.nickname,
      },
      account,
    };
  },

  /**
   * 저장된 온보딩 설정(`profiles` + `user_interests` 또는 데모 로컬 저장본)을 불러온다.
   */
  async loadOnboarding(): Promise<{
    context: MatchAccessContext;
    draft: OnboardingDraft | null;
    loadError?: string;
  }> {
    const context = await this.resolveAccessContext();
    const supabase = getSupabase();

    if (context.mode !== 'demo') {
      if (!(context.mode === 'live' && context.account && supabase)) {
        return { context, draft: null };
      }
      const userId = context.account.id;
      const [profileRes, interestsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'user_id, bio, mbti, avoid_mbti, target_preference, relation_goal, preferred_distance, photo_visibility, profile_status',
          )
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_interests')
          .select('user_id, interest_id')
          .eq('user_id', userId),
      ]);

      if (profileRes.error) {
        return {
          context,
          draft: null,
          loadError: '프로필을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
        };
      }
      if (!profileRes.data) {
        return { context, draft: null };
      }
      if (interestsRes.error) {
        return {
          context,
          draft: null,
          loadError: '관심사를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
        };
      }
      return {
        context,
        draft: toOnboardingDraft(
          profileRes.data as Partial<ProfileRow>,
          (interestsRes.data ?? []) as ProfileInterestRow[],
        ),
      };
    }

    const cached = readLocalJson<OnboardingDraft>(STORAGE_ONBOARDING_KEY);
    return { context, draft: cached };
  },

  /**
   * 온보딩 취향·공개범위를 검증하고 저장한다 (MATCH-001, TC-005).
   * - 성인 미인증 로그인 상태(`unverified`)에서는 fail-closed로 거부한다.
   * - `live` 모드에서는 RPC `save_onboarding`만 호출한다. profiles·user_interests 직접 쓰기는 없다.
   */
  async saveOnboarding(
    draft: OnboardingDraft,
    expectedMode: MatchOperatingMode,
  ): Promise<MatchServiceResult<SaveOnboardingRequest>> {
    const context = await this.resolveAccessContext();
    const changed = modeChangedError(context, expectedMode);
    if (changed) {
      return { ok: false, mode: context.mode, error: changed };
    }

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
        mode: context.mode,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationErrors[0] ?? '입력값을 다시 확인해 주세요.',
        },
      };
    }

    const blocked = gateError(context);
    if (blocked) {
      return { ok: false, mode: context.mode, error: blocked };
    }

    const supabase = getSupabase();
    if (context.mode === 'live' && context.account && supabase) {
      const { error: profileErr } = await supabase.rpc('save_onboarding', {
        p_my_mbti: req.myMbti,
        p_avoid_mbti: req.avoidMbti,
        p_target_preference: req.targetPreference,
        p_relation_goal: req.relationGoal,
        p_interest_ids: req.interestIds,
        p_preferred_distance: req.preferredDistance,
        p_photo_visibility: req.photoVisibility,
      });

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

      return { ok: true, mode: 'live', data: req };
    }

    if (context.mode === 'demo') {
      writeLocalJson(STORAGE_ONBOARDING_KEY, req);
      return { ok: true, mode: 'demo', data: req };
    }

    return {
      ok: false,
      mode: context.mode,
      error: {
        code: 'NETWORK_ERROR',
        message: '프로필 저장 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
      },
    };
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

    const blocked = gateError(context);
    if (blocked) {
      return {
        ok: false,
        mode: context.mode,
        context,
        error: context.account
          ? {
              code: 'AGE_VERIFICATION_REQUIRED',
              message: '성인 확인 후 추천을 이용할 수 있어요.',
            }
          : blocked,
      };
    }

    const supabase = getSupabase();
    if (context.mode === 'live' && context.account && supabase) {
      const { data, error } = await supabase.rpc('get_recommendations', {
        p_cursor: cursor,
      });
      const page = !error ? readRecommendationPage(data) : null;

      if (page) {
        const items = page.items.map((row) => toRecommendProfile(row));
        return {
          ok: true,
          mode: 'live',
          context,
          data: {
            items,
            nextCursor: page.nextCursor,
            acorn: { acorn: null },
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

    if (context.mode !== 'demo') {
      return {
        ok: false,
        mode: context.mode,
        context,
        error: {
          code: 'NETWORK_ERROR',
          message: '추천 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
        },
      };
    }

    const visible = demoRecommendationView().items;
    return {
      ok: true,
      mode: 'demo',
      context,
      data: {
        items: applyDemoMutualState(visible),
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
    expectedMode: MatchOperatingMode,
  ): Promise<MatchServiceResult<LikeResultDto>> {
    const context = await this.resolveAccessContext();
    const changed = modeChangedError(context, expectedMode);
    if (changed) {
      return { ok: false, mode: context.mode, error: changed };
    }
    const blocked = gateError(context);
    if (blocked) {
      return { ok: false, mode: context.mode, error: blocked };
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

      if (rpcError || rpcData == null || typeof rpcData !== 'object' || Array.isArray(rpcData)) {
        return {
          ok: false,
          mode: 'live',
          error: {
            code: 'NETWORK_ERROR',
            message: '관심 표현을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
          },
        };
      }

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
          matched: row.matched === true,
          matchId: typeof row.match_id === 'string' ? row.match_id : null,
          conversationId: typeof row.conversation_id === 'string' ? row.conversation_id : null,
        },
      };
    }

    if (context.mode === 'demo') {
      const recorded = recordDemoLike(
        targetId,
        decision,
        demoPartnerReturnsInterest(targetId),
      );
      return {
        ok: true,
        mode: 'demo',
        data: {
          targetId,
          decision,
          matched: recorded.matched,
          matchId: recorded.matchId,
          conversationId: recorded.conversationId,
        },
      };
    }

    return {
      ok: false,
      mode: context.mode,
      error: {
        code: 'NETWORK_ERROR',
        message: '관심 표현을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
      },
    };
  },

  /**
   * 추천 카드에서 사용자를 차단한다 (`public.blocks` insert · MATCH-008 연계).
   */
  async blockUser(
    req: BlockRequest,
    expectedMode: MatchOperatingMode,
  ): Promise<MatchServiceResult<void>> {
    const context = await this.resolveAccessContext();
    const changed = modeChangedError(context, expectedMode);
    if (changed) {
      return { ok: false, mode: context.mode, error: changed };
    }
    const blocked = gateError(context);
    if (blocked) {
      return { ok: false, mode: context.mode, error: blocked };
    }
    const supabase = getSupabase();

    if (context.mode === 'live' && context.account && supabase) {
      const { error } = await supabase.from('blocks').upsert(
        {
          blocker_id: context.account.id,
          blocked_user_id: req.blockedUserId,
        },
        { onConflict: 'blocker_id,blocked_user_id', ignoreDuplicates: true },
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

    if (context.mode === 'demo') {
      saveDemoBlock(DEMO_SELF.id, req.blockedUserId);
      return { ok: true, mode: 'demo', data: undefined };
    }
    return {
      ok: false,
      mode: context.mode,
      error: { code: 'NETWORK_ERROR', message: '차단 처리 중 오류가 발생했어요.' },
    };
  },

  /**
   * 추천 카드에서 사용자를 신고 및 즉시 차단한다 (`public.reports` + `public.blocks` insert · MATCH-008 연계).
   */
  async reportUser(
    req: ReportRequest,
    expectedMode: MatchOperatingMode,
  ): Promise<MatchServiceResult<void>> {
    const context = await this.resolveAccessContext();
    const changed = modeChangedError(context, expectedMode);
    if (changed) {
      return { ok: false, mode: context.mode, error: changed };
    }
    const blocked = gateError(context);
    if (blocked) {
      return { ok: false, mode: context.mode, error: blocked };
    }
    const supabase = getSupabase();

    if (context.mode === 'live' && context.account && supabase) {
      const detail = req.description.trim();
      const { error: reportErr } = await supabase.from('reports').insert({
        reporter_id: context.account.id,
        reported_user_id: req.reportedUserId,
        category: req.category,
        description: detail.length > 0 ? detail.slice(0, 200) : null,
      });

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

      if (req.alsoBlock) {
        const { error: blockErr } = await supabase.from('blocks').upsert(
          {
            blocker_id: context.account.id,
            blocked_user_id: req.reportedUserId,
          },
          { onConflict: 'blocker_id,blocked_user_id', ignoreDuplicates: true },
        );
        if (blockErr) {
          return {
            ok: false,
            mode: 'live',
            error: {
              code: 'NETWORK_ERROR',
              message: '신고는 접수됐지만 차단 처리 중 오류가 발생했어요.',
            },
          };
        }
      }
      return { ok: true, mode: 'live', data: undefined };
    }

    if (context.mode === 'demo') {
      const nickname = DEMO_RECOMMENDATIONS.find((item) => item.id === req.reportedUserId)?.nickname ?? '상대';
      saveDemoReport({
        reporterId: DEMO_SELF.id,
        targetId: req.reportedUserId,
        nickname,
        category: req.category,
        description: req.description,
      });
      if (req.alsoBlock) saveDemoBlock(DEMO_SELF.id, req.reportedUserId);
      return { ok: true, mode: 'demo', data: undefined };
    }
    return {
      ok: false,
      mode: context.mode,
      error: { code: 'NETWORK_ERROR', message: '신고 접수 중 오류가 발생했어요.' },
    };
  },

  /**
   * 내 프로필 문답 답변 목록을 조회한다 (MATCH-009).
   */
  async loadMyQnaAnswers(): Promise<{
    context: MatchAccessContext;
    answers: Record<string, QnaAnswer>;
    errorMessage?: string;
  }> {
    const context = await this.resolveAccessContext();
    const supabase = getSupabase();

    if (context.mode !== 'demo') {
      if (!(context.mode === 'live' && context.account && supabase)) {
        return { context, answers: {} };
      }
      const { data, error } = await supabase
        .from('profile_answers')
        .select('user_id, question_id, option_id, custom_text, declined')
        .eq('user_id', context.account.id);

      if (error || !Array.isArray(data)) {
        return {
          context,
          answers: {},
          errorMessage: '문답을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
        };
      }
      const map: Record<string, QnaAnswer> = {};
      for (const row of data as (ProfileQnaAnswerRow & { declined?: boolean })[]) {
        if (row.declined) continue;
        const parsed = toQnaAnswer(row);
        map[parsed.questionId] = parsed;
      }
      return { context, answers: map };
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
    expectedMode: MatchOperatingMode,
  ): Promise<MatchServiceResult<Record<string, QnaAnswer>>> {
    const next = { ...currentAnswers, [answer.questionId]: answer };
    const context = await this.resolveAccessContext();
    const changed = modeChangedError(context, expectedMode);
    if (changed) {
      return { ok: false, mode: context.mode, error: changed };
    }
    const blocked = gateError(context);
    if (blocked) {
      return { ok: false, mode: context.mode, error: blocked };
    }

    const supabase = getSupabase();
    if (context.mode === 'live' && context.account && supabase) {
      const saveError = await replaceProfileAnswers(
        supabase,
        next,
        '문답 저장 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
      );
      if (saveError) {
        return {
          ok: false,
          mode: 'live',
          error: { code: 'NETWORK_ERROR', message: saveError },
        };
      }
      return { ok: true, mode: 'live', data: next };
    }

    if (context.mode === 'demo') {
      writeLocalJson(STORAGE_QNA_KEY, next);
      return { ok: true, mode: 'demo', data: next };
    }

    return {
      ok: false,
      mode: context.mode,
      error: {
        code: 'NETWORK_ERROR',
        message: '문답 저장 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
      },
    };
  },

  /**
   * 프로필 문답 답변 1건을 삭제한다 (MATCH-009).
   */
  async deleteMyQnaAnswer(
    questionId: string,
    currentAnswers: Record<string, QnaAnswer>,
    expectedMode: MatchOperatingMode,
  ): Promise<MatchServiceResult<Record<string, QnaAnswer>>> {
    const next = { ...currentAnswers };
    delete next[questionId];

    const context = await this.resolveAccessContext();
    const changed = modeChangedError(context, expectedMode);
    if (changed) {
      return { ok: false, mode: context.mode, error: changed };
    }
    const blocked = gateError(context);
    if (blocked) {
      return { ok: false, mode: context.mode, error: blocked };
    }

    const supabase = getSupabase();
    if (context.mode === 'live' && context.account && supabase) {
      const deleteError = await replaceProfileAnswers(
        supabase,
        next,
        '문답 삭제 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
        [questionId],
      );
      if (deleteError) {
        return {
          ok: false,
          mode: 'live',
          error: { code: 'NETWORK_ERROR', message: deleteError },
        };
      }
      return { ok: true, mode: 'live', data: next };
    }

    if (context.mode === 'demo') {
      writeLocalJson(STORAGE_QNA_KEY, next);
      return { ok: true, mode: 'demo', data: next };
    }

    return {
      ok: false,
      mode: context.mode,
      error: {
        code: 'NETWORK_ERROR',
        message: '문답 삭제 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
      },
    };
  },

  /**
   * 공통 질문 거절 목록을 불러온다 (MATCH-009). 데모가 아니면 읽지 않는다.
   */
  loadDeclinedCommonQuestions(mode: MatchOperatingMode): string[] {
    if (mode !== 'demo') return [];
    return readLocalJson<string[]>(STORAGE_COMMON_DECLINED_KEY) ?? [];
  },

  /**
   * 공통 질문 거절 목록을 저장한다 (MATCH-009). 데모가 아니면 쓰지 않는다.
   */
  saveDeclinedCommonQuestions(questionIds: string[], mode: MatchOperatingMode): void {
    if (mode !== 'demo') return;
    writeLocalJson(STORAGE_COMMON_DECLINED_KEY, Array.from(new Set(questionIds)));
  },
};

