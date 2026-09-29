import type { ApprovalHistoryItem } from '../dia-phuong/api/localityApi';
import type { SubmissionResultFile } from './api/specialistApi';

export type RevisionRequestStage = 'LocalSubmitted' | 'ScorerSubmitted' | 'ScorerRevisionRequested' | 'ReviewerApproved' | 'ReviewerRevisionRequested' | 'SpecialistApproved' | 'LeaderApproved' | 'CouncilApproved';

export interface RevisionNote {
  reason: string;
  createdAt: string;
  /** null = request không chỉ định submissionResultIds → áp dụng cho toàn bộ tiêu chí. */
  resultIds: string[] | null;
  criteriaIds: string[] | null;
  /** Tệp đính kèm của yêu cầu chỉnh sửa (gắn vào ApprovalHistory). */
  files: SubmissionResultFile[];
}

// Dữ liệu cũ: action RequestRevision + reason tiếng Anh "Added supplementary criteria: ..."
export function resolveHistoryAction(action: string | null, reason: string | null): string {
  const key = action ?? '';
  const isLegacySupplementary = key === 'RequestRevision'
    && (reason?.startsWith('Added supplementary criteria:') || reason?.startsWith('Thêm tiêu chí bổ sung:'));
  if (isLegacySupplementary) return 'AddSupplementaryCriteria';
  return key;
}

export function translateLegacyReason(reason: string | null): string | null {
  if (reason?.startsWith('Added supplementary criteria:')) {
    return `Thêm tiêu chí bổ sung: ${reason.slice('Added supplementary criteria:'.length).trim()}`;
  }
  return reason;
}

export function parseRevisionResultIds(changedData: string | null): string[] | null {
  if (!changedData) return null;
  try {
    const parsed = JSON.parse(changedData) as { submissionResultIds?: unknown };
    return Array.isArray(parsed.submissionResultIds)
      ? parsed.submissionResultIds.filter((id): id is string => typeof id === 'string')
      : null;
  } catch {
    return null;
  }
}

export function parseRevisionCriteriaIds(changedData: string | null): string[] | null {
  if (!changedData) return null;
  try {
    const parsed = JSON.parse(changedData) as { criteriaIds?: unknown };
    return Array.isArray(parsed.criteriaIds)
      ? parsed.criteriaIds.filter((id): id is string => typeof id === 'string')
      : null;
  } catch {
    return null;
  }
}

export function getRevisionNotes(histories: ApprovalHistoryItem[], stageLevels?: readonly RevisionRequestStage[]): RevisionNote[] {
  const allowedStageLevels = stageLevels ? new Set<string>(stageLevels) : null;
  return histories.flatMap((item) => {
    const reason = translateLegacyReason(item.reason);
    if ((allowedStageLevels && !allowedStageLevels.has(item.stageLevel))
      || resolveHistoryAction(item.action, item.reason) !== 'RequestRevision'
      || !reason?.trim()) return [];
    return [{
      reason,
      createdAt: item.createdAt,
      resultIds: parseRevisionResultIds(item.changedData),
      criteriaIds: parseRevisionCriteriaIds(item.changedData),
      files: item.files ?? [],
    }];
  }).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/** Chỉ trả note khi kết quả tiêu chí thuộc phạm vi được yêu cầu chỉnh sửa. */
export function revisionNoteForResult(
  note: RevisionNote | null,
  result: string | { id: string; criteriaId: string } | undefined,
): RevisionNote | null {
  if (!note) return null;
  const resultId = typeof result === 'string' ? result : result?.id;
  if (note.criteriaIds !== null) {
    return typeof result === 'object' && result && note.criteriaIds.includes(result.criteriaId) ? note : null;
  }
  if (note.resultIds === null) return note;
  return resultId && note.resultIds.includes(resultId) ? note : null;
}

export function leaderRevisionNotesForResult(
  notes: RevisionNote[],
  resultId: string | undefined,
  criteriaId?: string,
): RevisionNote[] {
  return notes
    .filter((note) => revisionNoteForResult(note, criteriaId ? { id: resultId ?? '', criteriaId } : resultId) !== null)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}
