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

/** 차단 제출 값. `blockedUserId`는 상대 id다. */
export interface BlockRequest {
  blockedUserId: string;
}

/** 신고 행. 화면으로 바꿀 때는 `toReportHistoryItem`. */
export interface ReportRow {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  category: ReportCategory;
  description: string | null;
  status: ReportStatus;
  /** ISO 8601 */
  created_at: string;
}

/**
 * 내 신고 내역·관리 큐에 보이는 신고.
 * 대상은 id·nickname, 시각은 `createdAt` (행의 `created_at`).
 */
export interface ReportHistoryItem {
  id: string;
  reporterId: string;
  targetId: string;
  nickname: string;
  category: ReportCategory;
  description: string;
  /** ISO 8601 */
  createdAt: string;
  status: ReportStatus;
}

/** 차단 행. */
export interface BlockRow {
  blocker_id: string;
  blocked_user_id: string;
  /** ISO 8601 */
  created_at: string;
}

/** 화면용 차단. */
export interface BlockView {
  blockerId: string;
  blockedId: string;
  /** ISO 8601 */
  createdAt: string;
}

/** 신고 행을 화면 항목으로 바꾼다. 닉네임은 행에 없으므로 화면 데이터에서 붙인다. */
export function toReportHistoryItem(
  row: ReportRow,
  nickname: string,
  reporterId: string,
): ReportHistoryItem {
  return {
    id: row.id,
    reporterId,
    targetId: row.reported_user_id ?? '',
    nickname,
    category: row.category,
    description: row.description ?? '',
    createdAt: row.created_at,
    status: row.status,
  };
}

/** 차단 행을 화면 값으로 바꾼다. */
export function toBlockView(row: BlockRow): BlockView {
  return {
    blockerId: row.blocker_id,
    blockedId: row.blocked_user_id,
    createdAt: row.created_at,
  };
}
