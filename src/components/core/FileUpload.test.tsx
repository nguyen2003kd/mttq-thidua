import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ALLOWED_UPLOAD_ACCEPT, UPLOAD_FILE_TYPE_ERROR } from '@/lib/fileTypes';
import { FileUpload } from './FileUpload';

describe('FileUpload allowed file types', () => {
  it('rejects executable and archive files even if they bypass the file picker filter', () => {
    const onChange = vi.fn();
    const { container } = render(<FileUpload value={[]} onChange={onChange} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');

    expect(input).toHaveAttribute('accept', ALLOWED_UPLOAD_ACCEPT);
    fireEvent.change(input!, {
      target: {
        files: [
          new File(['executable'], 'setup.exe', { type: 'application/x-msdownload' }),
          new File(['archive'], 'package.zip', { type: 'application/zip' }),
        ],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(UPLOAD_FILE_TYPE_ERROR);
  });

  it('accepts image, Excel, Word, PDF and TXT files', () => {
    const onChange = vi.fn();
    const { container } = render(<FileUpload value={[]} onChange={onChange} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    const files = [
      new File(['image'], 'photo.jpg', { type: 'image/jpeg' }),
      new File(['spreadsheet'], 'scores.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      new File(['document'], 'report.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      new File(['pdf'], 'decision.pdf', { type: 'application/pdf' }),
      new File(['text'], 'notes.txt', { type: 'text/plain' }),
    ];

    fireEvent.change(input!, { target: { files } });

    expect(onChange).toHaveBeenCalledWith(files);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
