import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { generateKindleEPUB } from './downloadUtils';

describe('downloadUtils Kindle EPUB generation', () => {
  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('builds a valid UTF-8 EPUB archive containing Tamil and English chapters', async () => {
    let capturedBlob = null;
    globalThis.URL.createObjectURL = vi.fn((blob) => {
      capturedBlob = blob;
      return 'blob:mock-epub';
    });

    await generateKindleEPUB('காற்றில் கலந்த கவிதை', [
      {
        title: 'மழைக் குறிஞ்சி',
        content: '<p>மலைமுகில் தவழும் குறிஞ்சி நிலம்</p>',
        publishedDate: '2026-11-13',
      },
      {
        title: 'English Note',
        content: '<p>Quiet rain across stone.</p>',
      },
    ]);

    expect(capturedBlob).toBeTruthy();
    const arrayBuf = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(capturedBlob);
    });
    const zip = await JSZip.loadAsync(arrayBuf);

    expect(await zip.file('mimetype').async('string')).toBe('application/epub+zip');
    expect(zip.file('META-INF/container.xml')).toBeTruthy();
    expect(zip.file('OEBPS/content.opf')).toBeTruthy();
    expect(zip.file('OEBPS/toc.ncx')).toBeTruthy();
    expect(zip.file('OEBPS/nav.xhtml')).toBeTruthy();

    const ch1 = await zip.file('OEBPS/chapter_0001.xhtml').async('string');
    expect(ch1).toContain('மழைக் குறிஞ்சி');
    expect(ch1).toContain('மலைமுகில் தவழும் குறிஞ்சி நிலம்');

    const opf = await zip.file('OEBPS/content.opf').async('string');
    expect(opf).toContain('<dc:language>ta</dc:language>');
  });
});
