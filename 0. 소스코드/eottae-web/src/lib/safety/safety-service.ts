// ============================================================
//  저장 경로: src/lib/safety/safety-service.ts
//  담당: 손준혁 · MATCH-008 (신고/차단 Supabase 연동 및 데모 폴백 서비스)
//  역할:
//    - `src/lib/supabase/client.ts`의 `getSupabase()`를 재사용해 `public.blocks`,
//      `public.reports` INSERT/DELETE/SELECT를 수행한다 (ADR-005, 0003_match_core.sql).
//    - 환경변수가 없거나 데모 상대(`!isUuid`)일 때만 데모 모드(`mode: 'demo', ok: true`)로 동작한다.
//    - 환경변수가 설정되고 상대 ID가 UUID(실계정)인 경우에는 반드시 인증된 세션을 요구하며,
//      미인증 또는 DB 오류 시 `ok: false`를 반환해 화면이 가짜 차단 잠금을 확정하지 않도록 보장한다 (ADR-003, TC-009).
//    - [보안 / DB_논리모델_전체3단계.md:41] 신고 사유 본문(`description`)은
//      어떠한 경우에도 `console.log`/`console.error` 등 로그에 남기지 않는다.
// ============================================================

import { isUuid, type ApiErrorDetail } from '@/lib/chat/types';
import { getSupabase } from '@/lib/supabase/client';
import {
  toBlockInsertRow,
  toReportInsertRow,
  type BlockRequest,
  type ReportRequest,
} from './types';

export interface SafetyActionResult {
  ok: boolean;
  mode: 'demo' | 'supabase';
  reportId?: string;
  error?: ApiErrorDetail;
}

function buildError(code: string, message: string): ApiErrorDetail {
  return { code, message };
}

async function resolveAuthenticatedUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  if (!userError && isUuid(uid)) {
    return uid;
  }
  return null;
}

/**
 * 실계정 상대(`partnerId`가 UUID)가 현재 사용자에 의해 서버(`public.blocks`)에서 차단된 상태인지 조회한다.
 * 새로고침 후にも 서버 차단 잠금 상태를 복원하기 위해 사용한다.
 */
export async function checkIsBlockedOnServer(partnerId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !isUuid(partnerId)) return false;

  const blockerId = await resolveAuthenticatedUserId();
  if (!blockerId) return false;

  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_user_id')
    .eq('blocker_id', blockerId)
    .eq('blocked_user_id', partnerId)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

/**
 * 상대방 차단 요청(`public.blocks` INSERT).
 * - 환경변수 미설정 또는 데모 상대 ID(`!isUuid`)에서는 `{ ok: true, mode: 'demo' }`를 반환한다.
 * - 실제 Supabase 환경 + UUID 상대일 때는 로그인 세션이 없거나 INSERT가 실패하면 `ok: false`를 반환해
 *   호출부(`ChatRoom`)가 차단 잠금을 확정하지 않고 안내 문구를 표시할 수 있게 한다 (TC-009).
 */
export async function submitBlock(req: BlockRequest): Promise<SafetyActionResult> {
  const supabase = getSupabase();
  if (!supabase || !isUuid(req.blockedUserId)) {
    return { ok: true, mode: 'demo' };
  }

  const blockerId = await resolveAuthenticatedUserId();
  if (!blockerId) {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError('UNAUTHENTICATED', '로그인 세션을 확인하지 못했어요. 다시 로그인해 주세요.'),
    };
  }

  if (blockerId === req.blockedUserId) {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError('SELF_BLOCK_FORBIDDEN', '본인 계정은 차단할 수 없어요.'),
    };
  }

  const row = toBlockInsertRow(req, blockerId);
  const { error } = await supabase.from('blocks').insert(row);

  // PostgreSQL unique_violation (23505): 이미 차단된 상태이므로 멱등 성공으로 처리 (API_계약_초안.md:62)
  if (error && error.code !== '23505') {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError(
        error.code || 'BLOCK_INSERT_FAILED',
        '차단 요청을 서버에 반영하지 못했어요. 잠시 후 다시 시도해 주세요.',
      ),
    };
  }

  return { ok: true, mode: 'supabase' };
}

/**
 * 상대방 차단 해제 요청(`public.blocks` DELETE — `0003_match_core.sql:1250` `blocks_delete_own`).
 * - 데모 상대(`!isUuid`)이거나 환경변수 미설정이면 `{ ok: true, mode: 'demo' }`를 반환한다.
 * - UUID 상대일 때는 `public.blocks` DELETE가 성공한 뒤에만 `ok: true`를 반환한다.
 */
export async function removeServerBlock(blockedUserId: string): Promise<SafetyActionResult> {
  const supabase = getSupabase();
  if (!supabase || !isUuid(blockedUserId)) {
    return { ok: true, mode: 'demo' };
  }

  const blockerId = await resolveAuthenticatedUserId();
  if (!blockerId) {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError('UNAUTHENTICATED', '로그인 세션을 확인하지 못했어요. 다시 로그인해 주세요.'),
    };
  }

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_user_id', blockedUserId);

  if (error) {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError(
        error.code || 'BLOCK_DELETE_FAILED',
        '차단 해제를 서버에 반영하지 못했어요. 잠시 후 다시 시도해 주세요.',
      ),
    };
  }

  return { ok: true, mode: 'supabase' };
}

/**
 * 상대방 신고 접수(`public.reports` INSERT).
 * - [중요] 신고 상세 본문(`req.description`)은 콘솔·에러 객체 어디에도 출력하지 않는다 (DB_논리모델_전체3단계.md:41).
 * - `req.alsoBlock`이 true일 때의 차단 처리는 호출부(`ChatRoom`)에서 `applyBlock`으로 이어서 수행한다.
 */
export async function submitReport(req: ReportRequest): Promise<SafetyActionResult> {
  const supabase = getSupabase();
  if (!supabase || !isUuid(req.reportedUserId)) {
    return { ok: true, mode: 'demo' };
  }

  const reporterId = await resolveAuthenticatedUserId();
  if (!reporterId) {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError('UNAUTHENTICATED', '로그인 세션을 확인하지 못했어요. 다시 로그인해 주세요.'),
    };
  }

  if (reporterId === req.reportedUserId) {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError('SELF_REPORT_FORBIDDEN', '본인 계정은 신고할 수 없어요.'),
    };
  }

  const row = toReportInsertRow(req, reporterId);
  const { error } = await supabase.from('reports').insert(row);

  if (error) {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError(
        error.code || 'REPORT_INSERT_FAILED',
        '신고 접수를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
      ),
    };
  }

  return {
    ok: true,
    mode: 'supabase',
  };
}
