// ============================================================
//  저장 경로: src/lib/safety/safety-service.ts
//  담당: 손준혁 · MATCH-008 (신고/차단 Supabase 연동 및 데모 폴백 서비스)
//  역할:
//    - `src/lib/supabase/client.ts`의 `getSupabase()`를 재사용해 `public.blocks`,
//      `public.reports` INSERT를 수행한다 (ADR-005).
//    - 환경변수가 없거나 데모 상대(`demo-partner-*`)이거나 미로그인 상태일 때는
//      데모 모드(`mode: 'demo', ok: true`)로 동작해 GitHub Pages 정적 배포와
//      데모 시연이 깨지지 않도록 보장한다.
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

/**
 * 상대방 차단 요청(`public.blocks` INSERT).
 * - 환경변수 미설정·데모 상대 ID(`!isUuid`)·미로그인 상태에서는 `{ ok: true, mode: 'demo' }`를 반환한다.
 * - 실제 Supabase 세션 + UUID 상대일 때는 `public.blocks` INSERT가 성공(또는 이미 차단된 23505 멱등)해야만
 *   `ok: true`를 반환하며, 실패 시 `ok: false`와 에러 정보를 반환해 호출부(`ChatRoom`)가 차단 잠금을
 *   확정하지 않고 안내 문구를 표시할 수 있게 한다 (TC-009).
 */
export async function submitBlock(req: BlockRequest): Promise<SafetyActionResult> {
  const supabase = getSupabase();
  if (!supabase || !isUuid(req.blockedUserId)) {
    return { ok: true, mode: 'demo' };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const blockerId = sessionData.session?.user?.id;
  if (sessionError || !blockerId || !isUuid(blockerId)) {
    return { ok: true, mode: 'demo' };
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
 * 상대방 신고 접수(`public.reports` INSERT).
 * - [중요] 신고 상세 본문(`req.description`)은 콘솔·에러 객체 어디에도 출력하지 않는다 (DB_논리모델_전체3단계.md:41).
 * - `req.alsoBlock`이 true일 때의 차단 처리는 호출부(`ChatRoom`)에서 `submitBlock`/`applyBlock`으로 이어서 수행한다.
 */
export async function submitReport(req: ReportRequest): Promise<SafetyActionResult> {
  const supabase = getSupabase();
  if (!supabase || !isUuid(req.reportedUserId)) {
    return { ok: true, mode: 'demo' };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const reporterId = sessionData.session?.user?.id;
  if (sessionError || !reporterId || !isUuid(reporterId)) {
    return { ok: true, mode: 'demo' };
  }

  if (reporterId === req.reportedUserId) {
    return {
      ok: false,
      mode: 'supabase',
      error: buildError('SELF_REPORT_FORBIDDEN', '본인 계정은 신고할 수 없어요.'),
    };
  }

  const row = toReportInsertRow(req, reporterId);
  const { data, error } = await supabase
    .from('reports')
    .insert(row)
    .select('id')
    .maybeSingle();

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
    reportId: typeof data?.id === 'string' ? data.id : undefined,
  };
}

