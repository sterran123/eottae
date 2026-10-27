// ============================================================
//  저장 경로: src/lib/safety/types.ts
//  담당: 손준혁 · MATCH-008 (신고/차단)
//  역할: 신고·차단 UI 전용 DTO. API_계약_초안의
//        `POST /safety/reports`, `POST /safety/blocks` 요청 형태에 맞춰
//        추후 서버 연동 시 그대로 교체할 수 있게 둔다.
//  [경계] 실제 접수·운영 대기열·권한은 주한태 서버/RLS 영역. 여기는 DEMO 상태만 다룬다.
// ============================================================

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

/** `POST /safety/reports` 요청 본문 (DEMO에서는 서버로 전송하지 않는다) */
export interface ReportRequest {
  reportedUserId: string;
  category: ReportCategory;
  description: string;
  /** 신고와 함께 차단할지 */
  alsoBlock: boolean;
}

/** 차단 상태 — 'blocked'면 송수신·자동응답 모두 정지 */
export type BlockState = 'none' | 'blocked';
