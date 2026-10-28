// ============================================================
//  저장 경로: src/lib/safety/types.ts
//  담당: 손준혁 · MATCH-008 (신고/차단)
//  역할: 신고·차단 UI 및 Supabase `public.reports`·`public.blocks` 연동용 DTO.
//        `ReportCategory` 값은 DB `reports.category` CHECK 제약(`'abuse'|'sexual'|'scam'|'other'`)과
//        1:1로 일치한다 (ADR-005).
//  [경계] 실제 접수·운영 대기열·권한 분리는 Postgres RLS로 강제한다.
// ============================================================

/** Supabase `public.reports.category` CHECK 제약 값과 동일 */
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

/** 상세 사유 최대 길이 (DB `check (char_length(description) <= 200)` 와 동일) */
export const MAX_REPORT_DETAIL_LENGTH = 200;

/** `public.reports` insert 및 신고 제출 요청 DTO */
export interface ReportRequest {
  reportedUserId: string;
  category: ReportCategory;
  description: string;
  /** 신고와 함께 차단(`public.blocks` 동시 insert) 여부 */
  alsoBlock: boolean;
}

/**
 * `public.blocks` insert 및 차단 요청 DTO (MATCH-008).
 * `blocker_id`는 RLS(`blocker_id = auth.uid()`)로 강제하므로 클라이언트는 차단 대상 ID만 지정한다.
 */
export interface BlockRequest {
  blockedUserId: string;
}
