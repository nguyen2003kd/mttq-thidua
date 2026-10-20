import { describe, expect, it } from 'vitest';
import { isDeadlineBlockingLocalityEdit } from './deadlineRules';

describe('isDeadlineBlockingLocalityEdit', () => {
  it('blocks locality edits after the deadline on normal submissions', () => {
    expect(isDeadlineBlockingLocalityEdit(true, false)).toBe(true);
  });

  it('allows a locality to complete a requested revision after the deadline', () => {
    expect(isDeadlineBlockingLocalityEdit(true, true)).toBe(false);
  });

  it('does not block edits before the deadline', () => {
    expect(isDeadlineBlockingLocalityEdit(false, false)).toBe(false);
  });
});
