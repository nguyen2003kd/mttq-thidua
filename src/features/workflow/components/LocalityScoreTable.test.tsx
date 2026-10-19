import { createRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CriteriaItem, Evidence, ScoreRecord } from '@/types/domain';
import { LocalityScoreTable, type LocalityScoreTableHandle } from './LocalityScoreTable';

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

const overdueCriterion: CriteriaItem = {
  id: 'criterion-overdue',
  name: 'Tiêu chí cần chỉnh sửa',
  maxScore: 10,
  deadline: '2020-01-01T00:00:00.000Z',
  order: 1,
  type: 'Standard',
  status: 'Applied',
};

const emptyRecord: ScoreRecord = {
  state: 'DRAFT',
  entries: [],
  totalScore: 10,
  submittedAt: null,
  publishedAt: null,
};

const existingEvidence: Evidence = {
  id: 'file-1',
  criteriaId: overdueCriterion.id,
  localityId: 'locality-1',
  fileName: 'minh-chung.pdf',
  fileUrl: '/files/minh-chung.pdf',
  uploadedAt: '2025-01-01T00:00:00.000Z',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('LocalityScoreTable', () => {
  it('collects an overdue criterion included in a revision request', () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    const ref = createRef<LocalityScoreTableHandle>();

    render(
      <MemoryRouter>
        <LocalityScoreTable
          ref={ref}
          criteria={[overdueCriterion]}
          record={emptyRecord}
          evidence={[existingEvidence]}
          localityId="locality-1"
          editable
          allowRevisionAfterDeadline
          evidenceDeletionLocked
          scoreFieldsLocked
          editableCriteriaIds={new Set([overdueCriterion.id])}
          nowMs={Date.now()}
          onDeleteEvidence={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(ref.current?.collectAll().has(overdueCriterion.id)).toBe(true);
    expect(screen.getByRole('button', { name: 'Xóa minh chứng minh-chung.pdf' })).toBeDisabled();
  });
});
