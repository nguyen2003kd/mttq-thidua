import { describe, expect, it } from 'vitest';
import { getSpecialistSubmissionPermissions } from '../api/specialistApi';
import { getSpecialistGroupProgress } from '../utils/specialistGroupProgress';
import { filterSubmissionsByStage } from '../utils/submissionStageFilter';
import { LOCALITY_STATUS_LABELS, sortLocalityRows, toggleLocalitySort } from '../utils/localitySorting';

describe('getSpecialistGroupProgress', () => {
  const groups = [
    { periodId: 'period-a', status: 'DA_CHAM', hasModificationRequest: false },
    { periodId: 'period-a', status: 'CHO_CHAM', hasModificationRequest: true },
    { periodId: 'period-a', status: 'CHO_DUYET', hasModificationRequest: false },
    { periodId: 'period-a', status: 'CHUA_NOP', hasModificationRequest: false },
    { periodId: 'period-a', status: 'YEU_CAU_SUA', hasModificationRequest: false },
    { periodId: 'period-a', status: 'DA_CHAM', hasModificationRequest: true },
    { periodId: 'period-b', status: 'DA_CHAM', hasModificationRequest: false },
  ];

  it('counts each group status without overlap for the selected period', () => {
    expect(getSpecialistGroupProgress(groups, 'period-a')).toEqual({
      completedGroups: 1,
      pendingGroups: 1,
      revisionGroups: 3,
      unsubmittedGroups: 1,
      totalCount: 6,
    });
  });

  it('includes all periods when no period is selected', () => {
    expect(getSpecialistGroupProgress(groups, '')).toEqual({
      completedGroups: 2,
      pendingGroups: 1,
      revisionGroups: 3,
      unsubmittedGroups: 1,
      totalCount: 7,
    });
  });
});

describe('getSpecialistSubmissionPermissions', () => {
  it('uses direct approval without a forwarding dialog for the Specialist role', () => {
    expect(getSpecialistSubmissionPermissions('ReviewerApproved', 'SPECIALIST')).toMatchObject({
      canApprove: true,
      usesForwardingDialog: false,
      forwardLabel: 'Duyệt hồ sơ',
    });
  });

  it('keeps the forwarding dialog for Scorer and Reviewer roles', () => {
    expect(getSpecialistSubmissionPermissions('LocalSubmitted', 'SCORER').usesForwardingDialog).toBe(true);
    expect(getSpecialistSubmissionPermissions('ScorerSubmitted', 'REVIEWER').usesForwardingDialog).toBe(true);
  });
});

describe('filterSubmissionsByStage', () => {
  const submissions = [
    { id: 'waiting', currentStage: 'LocalSubmitted', hasSubmission: true },
    { id: 'approved', currentStage: 'SpecialistApproved', hasSubmission: true },
    { id: 'not-submitted', currentStage: 'LocalSubmitted', hasSubmission: false },
  ];

  it('filters submitted records by the selected stage', () => {
    expect(filterSubmissionsByStage(submissions, 'LocalSubmitted')).toEqual([submissions[0]]);
  });

  it('keeps every record visible for the all tab', () => {
    expect(filterSubmissionsByStage(submissions, '')).toEqual(submissions);
  });
});

describe('locality sorting', () => {
  const rows = [
    { localityId: 'two', completedGroupCount: 2, overallStatus: 'CHO_DUYET' },
    { localityId: 'ten', completedGroupCount: 10, overallStatus: 'DA_DUYET' },
    { localityId: 'one', completedGroupCount: 1, overallStatus: 'CHUA_NOP' },
    { localityId: 'three', completedGroupCount: 3, overallStatus: 'YEU_CAU_SUA' },
  ] as const;

  it('sorts completed group counts numerically in both directions', () => {
    expect(sortLocalityRows(rows, 'completion-desc').map((row) => row.localityId)).toEqual(['ten', 'three', 'two', 'one']);
    expect(sortLocalityRows(rows, 'completion-asc').map((row) => row.localityId)).toEqual(['one', 'two', 'three', 'ten']);
  });

  it('sorts status using its displayed Vietnamese label', () => {
    expect(sortLocalityRows(rows, 'status-asc').map((row) => row.localityId)).toEqual(['one', 'ten', 'two', 'three']);
    expect(sortLocalityRows(rows, 'status-desc').map((row) => row.localityId)).toEqual(['three', 'two', 'ten', 'one']);
    expect(LOCALITY_STATUS_LABELS.CHUA_NOP).toBe('Chưa nộp');
  });

  it('cycles a sortable column through default direction, reverse direction, and original order', () => {
    expect(toggleLocalitySort('', 'completion')).toBe('completion-desc');
    expect(toggleLocalitySort('completion-desc', 'completion')).toBe('completion-asc');
    expect(toggleLocalitySort('completion-asc', 'completion')).toBe('');
    expect(toggleLocalitySort('status-desc', 'completion')).toBe('completion-desc');
    expect(toggleLocalitySort('', 'status')).toBe('status-asc');
    expect(toggleLocalitySort('status-asc', 'status')).toBe('status-desc');
    expect(toggleLocalitySort('status-desc', 'status')).toBe('');
  });
});
