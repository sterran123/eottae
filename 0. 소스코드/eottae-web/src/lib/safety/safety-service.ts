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
  toReportHistoryItem,
  toReportInsertRow,
  type BlockRequest,
  type ReportCreatedResponse,
  type ReportHistoryItem,
  type ReportRequest,
  type ReportRow,
} from './types';

/**
 * 서버 차단 조회 결과.
 * - 'blocked': 내가 상대를 차단한 행이 있다.
 * - 'clear'  : 조회에 성공했고 내가 건 차단이 없다 (데모 상대·환경변수 없음 포함).
 * - 'unknown': 세션 없음·네트워크·RLS 오류 등으로 확인하지 못했다. 미차단으로 간주하면 안 된다.
 */
export type ServerBlockStatus = 'blocked' | 'clear' | 'unknown';

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
 * 실계정 상대(`partnerId`가 UUID)를 현재 사용자가 서버(`public.blocks`)에서 차단했는지 조회한다.
 * 새로고침 후에도 서버 차단 잠금 상태를 복원하기 위해 사용한다.
 * - 조회 실패와 미차단을 구분한다 (`'unknown'` vs `'clear'`).
 * - `blocks_select_own` RLS 때문에 `blocker_id = 나`인 행만 보인다. 상대가 나를 차단한 경우는 여기서 알 수 없고,
 *   그때의 송수신 거부는 `messages` RLS(`caller_can_use_conversation`, 양방향 blocks)가 맡는다.
 */
export async function checkIsBlockedOnServer(partnerId: string): Promise<ServerBlockStatus> {
  const supabase = getSupabase();
  if (!supabase || !isUuid(partnerId)) return 'clear';

  const blockerId = await resolveAuthenticatedUserId();
  if (!blockerId) return 'unknown';

  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_user_id')
    .eq('blocker_id', blockerId)
    .eq('blocked_user_id', partnerId)
    .maybeSingle();

  if (error) return 'unknown';
  return data ? 'blocked' : 'clear';
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

  const { data, error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_user_id', blockedUserId)
    .select('blocked_user_id');

  const failure: SafetyActionResult = {
    ok: false,
    mode: 'supabase',
    error: buildError(
      error?.code || 'BLOCK_DELETE_FAILED',
      '차단 해제를 서버에 반영하지 못했어요. 잠시 후 다시 시도해 주세요.',
    ),
  };
  if (error) return failure;

  // RLS 등으로 삭제 건수가 0이면 해제됐다고 단정하지 않는다. 서버에 이미 차단이 없을 때만 멱등 성공으로 본다.
  if (!data || data.length === 0) {
    const status = await checkIsBlockedOnServer(blockedUserId);
    if (status !== 'clear') return failure;
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
  const { data, error } = await supabase.from('reports').insert(row).select('id').single();

  if (error || !data) {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError(
        error?.code || 'REPORT_INSERT_FAILED',
        '신고 접수를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',
      ),
    };
  }

  // API_계약_초안.md: 201 { reportId }
  const created: ReportCreatedResponse = { reportId: String((data as { id: unknown }).id) };
  return {
    ok: true,
    mode: 'supabase',
    reportId: created.reportId,
  };
}

/**
 * 실계정 내 신고 내역 조회 (`public.reports` SELECT).
 * RLS 정책 `reports_select_own`(0003_match_core.sql:1261)에 의해 본인이 접수한 행만 반환된다.
 */
export async function fetchMyReports(): Promise<ReportHistoryItem[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const reporterId = await resolveAuthenticatedUserId();
  if (!reporterId) return null;

  const { data, error } = await supabase
    .from('reports')
    .select('id, reporter_id, reported_user_id, category, description, status, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) return null;

  return (data as ReportRow[]).map((row) =>
    toReportHistoryItem(
      row,
      row.reported_user_id ? `회원 (${row.reported_user_id.slice(0, 8)})` : '회원',
      row.reporter_id || reporterId,
    ),
  );
}

export interface ReportQueueResult {
  ok: boolean;
  status: number;
  items: ReportHistoryItem[];
  error?: string;
}

/**
 * 실계정 신고 관리 큐 조회 (`public.list_reports()` RPC).
 * operator 역할이 없는 일반 계정은 SQLSTATE 42501 (403 FORBIDDEN)로 거부된다 (TC-010).
 */
export async function fetchReportQueue(): Promise<ReportQueueResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, status: 0, items: [] };

  const { data, error } = await supabase.rpc('list_reports');
  if (error) {
    const errCode = (error as { code?: string }).code;
    const status = (error as { status?: number }).status ?? 403;
    return {
      ok: false,
      status: errCode === '42501' || status === 403 ? 403 : status,
      items: [],
      error: 'INSUFFICIENT_PRIVILEGE',
    };
  }

  const items = ((data as ReportRow[]) || []).map((row) =>
    toReportHistoryItem(
      row,
      row.reported_user_id ? `회원 (${row.reported_user_id.slice(0, 8)})` : '회원',
      row.reporter_id || '알 수 없음',
    ),
  );

  return { ok: true, status: 200, items };
}
