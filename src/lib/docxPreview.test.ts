import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { prepareDocxPreview, sanitizeDocxHtml, buildDocxPreviewDocument } from './docxPreview';

describe('secure DOCX preview', () => {
  it('converts a real DOCX into a sandbox-ready HTML preview', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', '<?xml version="1.0" encoding="utf-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Nội dung hồ sơ minh chứng</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
    const bytes = await zip.generateAsync({ type: 'arraybuffer' });
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    Object.defineProperty(blob, 'arrayBuffer', { value: async () => bytes });
    const html = await prepareDocxPreview(blob);
    expect(html).toContain('Nội dung hồ sơ minh chứng');
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain('<article>');
  });

  it('removes executable HTML, scripting attributes, and javascript links', () => {
    const html = sanitizeDocxHtml('<p>Văn bản</p><img src="x" onerror="alert(1)"><a href="javascript:alert(2)">Mở</a><script>alert(3)</script>');
    expect(html).toContain('Văn bản');
    expect(html).not.toMatch(/onerror|<script|javascript:/i);
  });

  it('prepares HTML with a restrictive content security policy', () => {
    const content = buildDocxPreviewDocument('<p>Văn bản</p>');
    expect(content).toContain("default-src 'none'");
    expect(content).toContain('Văn bản');
  });

  it('refuses empty and oversized documents', async () => {
    await expect(prepareDocxPreview(new Blob([]))).rejects.toThrow('DOCX trống');
    const big = { size: 21 * 1024 * 1024 } as Blob;
    await expect(prepareDocxPreview(big)).rejects.toThrow('20 MB');
  });
});
