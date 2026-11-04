// ============================================================
//  저장 경로: src/lib/safety/types.ts
//  담당: 손준혁 · MATCH-008 (신고/차단)
//  역할: 신고·차단 화면 DTO. match/types.ts와 같이 화면은 id·nickname·createdAt,
//        행은 snake_case `created_at`. 데모는 이 기기에만 남긴다.
// ============================================================

/** 신고 사유. 화면 값과 행 값이 같다. */
export type ReportCategory = 'abuse' | 'sexual' | 'scam' | 'other';

export const REPORT_CATEGORIES: ReadonlyArray<{
  id: ReportCategory;
  label: string;
  hint: string;
}> = [
  { id: 'abuse', label: '욕설·비하·부적절한 대화', hint: '모욕적이거나 불쾌한 말을 했어요' },
  { id: 'sexual', label: '성적 불쾌감·원치 않는 요구', hint: '성적인 말이나 만남을 강요했어요' },
  { id: 'scam', label: '사기·금전 요구·스팸', hint: '돈을 요구하거나 홍보·사칭을 했어요' },
  { id: 'other', label: '기타', hint: '위에 해당하지 않아요 (직접 적어주세요)' },
];

/** 상세 사유 최대 길이 */
export const MAX_REPORT_DETAIL_LENGTH = 200;

export type ReportStatus = 'open' | 'closed';

/** 신고 제출 값. 대상 id는 match 화면 id와 같은 표기다. */
export interface ReportRequest {
  reportedUserId: string;
  category: ReportCategory;
  description: string;
  /** 신고와 함께 차단할지 */
  alsoBlock: boolean;
}

/**
 * `public.blocks` insert 및 차단 요청 DTO (MATCH-008).
 * `blocker_user_id`는 RLS(`blocker_user_id = auth.uid()`)로 강제하므로 클라이언트는 차단 대상 ID만 지정한다.
 */
export interface BlockRequest {
  blockedUserId: string;
}

/** 신고 처리 상태 (DB_논리모델_전체3단계.md:33 `reports.status`) */
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';

/**
 * Supabase `public.reports` INSERT 행 타입 (DB_논리모델_전체3단계.md:33, API_계약_초안.md:54-58).
 * - `reporter_id`: 신고자 UUID (`auth.uid()` === `public.users.id`)
 * - `reported_user_id`: 피신고자 UUID
 * - `category`: `'abuse' | 'sexual' | 'scam' | 'other'`
 * - `description`: 최대 200자 (로그·콘솔 출력 금지 — DB_논리모델_전체3단계.md:41)
 */
export interface ReportInsertRow {
  reporter_id: string;
  reported_user_id: string;
  category: ReportCategory;
  description: string;
}

export interface ReportRow extends ReportInsertRow {
  id: string;
  status: ReportStatus;
  created_at: string;
}

/** 신고 접수 성공 응답 DTO (`API_계약_초안.md:56` — `201 {reportId}`) */
export interface ReportCreatedResponse {
  reportId: string;
}

/**
 * 화면 `ReportRequest` DTO를 DB `public.reports` INSERT 행으로 변환한다.
 * 본문(`description`)은 앞뒤 공백을 제거하고 `MAX_REPORT_DETAIL_LENGTH`(200자)로 제한한다.
 */
export function toReportInsertRow(req: ReportRequest, reporterId: string): ReportInsertRow {
  return {
    reporter_id: reporterId,
    reported_user_id: req.reportedUserId,
    category: req.category,
    description: req.description.trim().slice(0, MAX_REPORT_DETAIL_LENGTH),
  };
}

/**
 * Supabase `public.blocks` INSERT 행 타입 (DB_논리모델_전체3단계.md:32, API_계약_초안.md:60-63).
 * UNIQUE 제약: `(blocker_user_id, blocked_user_id)` (0003 스키마 확정 시 컬럼명 매핑 일원화 지점)
 */
export interface BlockInsertRow {
  blocker_user_id: string;
  blocked_user_id: string;
}

export interface BlockRow extends BlockInsertRow {
  id?: string;
  blocked_at: string;
}

/**
 * 화면 `BlockRequest` DTO를 DB `public.blocks` INSERT 행으로 변환한다.
 */
export function toBlockInsertRow(req: BlockRequest, blockerUserId: string): BlockInsertRow {
  return {
    blocker_user_id: blockerUserId,
    blocked_user_id: req.blockedUserId,
  };
}
