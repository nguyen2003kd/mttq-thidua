import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ScoreStateBadge,
  LocalityStatusBadge,
  CriteriaStatusBadge,
  ActionBadge,
} from './StatusBadge';

describe('badge core — hiển thị nhãn tiếng Việt, không enum thô', () => {
  it('ScoreStateBadge', () => {
    render(<ScoreStateBadge state="CHO_DUYET_BAN" />);
    expect(screen.getByText('Đang chờ duyệt')).toBeInTheDocument();
    expect(screen.queryByText('CHO_DUYET_BAN')).not.toBeInTheDocument();
  });

  it('LocalityStatusBadge', () => {
    render(<LocalityStatusBadge status="published" />);
    expect(screen.getByText('Công bố')).toBeInTheDocument();
  });

  it('CriteriaStatusBadge', () => {
    render(<CriteriaStatusBadge status="ACTIVE" />);
    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument();
  });

  it('ActionBadge', () => {
    render(<ActionBadge action="REJECT" />);
    expect(screen.getByText('Trả lại')).toBeInTheDocument();
  });
});
