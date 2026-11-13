import jsPDF from 'jspdf';
import JSZip from 'jszip';

const TAMIL_REGEX = /[\u0B80-\u0BFF]/;

function containsTamil(bookTitle, chapters) {
  if (TAMIL_REGEX.test(bookTitle || '')) return true;
  return (chapters || []).some(
    (ch) => TAMIL_REGEX.test(ch.title || '') || TAMIL_REGEX.test(ch.content || '')
  );
}

function safeFilename(title, ext) {
  const ascii = (title || 'mockpoet_edition')
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  const base = ascii || 'mockpoet_edition';
  return `${base}.${ext}`;
}

function escapeXml(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function htmlToXhtmlParagraphs(htmlContent) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent || '';
  const blocks = [];
  tempDiv.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const text = node.textContent || '';
      if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
        blocks.push(`<h3>${escapeXml(text)}</h3>`);
      } else if (tag === 'blockquote') {
        blocks.push(`<blockquote><p>${escapeXml(text)}</p></blockquote>`);
      } else if (tag === 'hr') {
        blocks.push('<hr />');
      } else if (tag === 'ul') {
        const items = Array.from(node.querySelectorAll('li'))
          .map((li) => `<li>${escapeXml(li.textContent || '')}</li>`)
          .join('');
        blocks.push(`<ul>${items}</ul>`);
      } else {
        // Preserve <br /> line breaks for poetry
        const innerHtml = node.innerHTML
          .split(/<br\s*\/?>/i)
          .map((part) => {
            const d = document.createElement('div');
            d.innerHTML = part;
            return escapeXml(d.textContent || '');
          })
          .join('<br />');
        blocks.push(`<p>${innerHtml}</p>`);
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      blocks.push(`<p>${escapeXml(node.textContent.trim())}</p>`);
    }
  });
  return blocks.join('\n      ');
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Print/Save as PDF with full Tamil & English UTF-8 font support via hidden iframe (avoids window.open)
 */
function printUnicodePdfViaIframe(bookTitle, chapters) {
  const html = generateKindleHTML(bookTitle, chapters, true);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
    }
  }, 400);
}

/**
 * Generate PDF from chapters (automatically uses Unicode print-to-PDF when Tamil script is detected)
 */
export function generatePDF(bookTitle, chapters) {
  if (containsTamil(bookTitle, chapters)) {
    printUnicodePdfViaIframe(bookTitle, chapters);
    return { mode: 'unicode_print' };
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  doc.setFontSize(20);
  doc.setFont('times', 'bold');
  const titleLines = doc.splitTextToSize(bookTitle, maxWidth);
  doc.text(titleLines, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += titleLines.length * 10 + 18;

  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  doc.text('mockpoet Archival Edition', pageWidth / 2, yPosition, { align: 'center' });

  chapters.forEach((chapter, index) => {
    doc.addPage();
    yPosition = margin;

    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    const chapterTitle = chapter.title || `Entry ${index + 1}`;
    const titleHeight = doc.splitTextToSize(chapterTitle, maxWidth);
    doc.text(titleHeight, margin, yPosition);
    yPosition += titleHeight.length * 8 + 8;

    if (chapter.publishedDate) {
      doc.setFontSize(9);
      doc.setFont('times', 'italic');
      doc.text(`Published: ${chapter.publishedDate}`, margin, yPosition);
      yPosition += 8;
    }

    yPosition += 4;
    doc.setFontSize(11.5);
    doc.setFont('times', 'normal');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = chapter.content || '';
    const paragraphs = Array.from(tempDiv.querySelectorAll('p, blockquote, h2, h3, li'))
      .map((el) => (el.textContent || '').trim())
      .filter(Boolean);

    const blocks = paragraphs.length > 0 ? paragraphs : [(tempDiv.textContent || '').trim()];

    blocks.forEach((paragraph) => {
      const lines = doc.splitTextToSize(paragraph, maxWidth);
      lines.forEach((line) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6.5;
      });
      yPosition += 4.5;
    });
  });

  doc.save(safeFilename(bookTitle, 'pdf'));
  return { mode: 'jspdf' };
}

/**
 * Generate a genuine, standards-compliant EPUB 3 archive (.epub) compatible with Amazon Send-to-Kindle,
 * Apple Books, Kobo, Calibre, and Tamil/English UTF-8 text.
 */
export async function generateKindleEPUB(bookTitle, chapters) {
  const zip = new JSZip();
  const isTamil = containsTamil(bookTitle, chapters);
  const langCode = isTamil ? 'ta' : 'en';
  const bookUuid = `urn:uuid:mockpoet-${Date.now()}`;
  const updatedIso = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  // 1. mimetype MUST be stored uncompressed (STORE)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. OEBPS/styles.css
  zip.file(
    'OEBPS/styles.css',
    `body {
  font-family: "Noto Serif Tamil", "Latha", Georgia, serif;
  line-height: 1.7;
  margin: 1em;
  color: #1C1917;
}
h1, h2, h3 {
  font-family: "Noto Serif Tamil", Georgia, serif;
  line-height: 1.25;
  margin-bottom: 0.75em;
}
.title-page {
  text-align: center;
  margin-top: 25%;
}
.subtitle {
  color: #6B655E;
  font-style: italic;
}
.chapter-date {
  font-size: 0.85em;
  color: #6B655E;
  margin-bottom: 1.5em;
}
blockquote {
  border-left: 2px solid #9A3412;
  padding-left: 1em;
  font-style: italic;
  margin: 1em 0;
}
p {
  margin-bottom: 0.9em;
}`
  );

  // 4. Title page XHTML
  zip.file(
    'OEBPS/title.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${langCode}" lang="${langCode}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(bookTitle)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
  <div class="title-page">
    <h1>${escapeXml(bookTitle)}</h1>
    <p class="subtitle">mockpoet Literary Edition (Kindle &amp; E-Reader Ready)</p>
  </div>
</body>
</html>`
  );

  // 5. Chapter XHTML files + Manifest/Spine items
  const manifestItems = [
    '<item id="css" href="styles.css" media-type="text/css"/>',
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '<item id="titlepage" href="title.xhtml" media-type="application/xhtml+xml"/>',
  ];
  const spineItems = ['<itemref idref="titlepage"/>'];
  const navLinks = ['<li><a href="title.xhtml">Title Page</a></li>'];
  const ncxPoints = [];

  chapters.forEach((chapter, idx) => {
    const num = idx + 1;
    const filename = `chapter_${String(num).padStart(4, '0')}.xhtml`;
    const chapterTitle = chapter.title || `Entry ${num}`;
    const bodyXhtml = htmlToXhtmlParagraphs(chapter.content || '');
    const dateLine = chapter.publishedDate
      ? `<p class="chapter-date">Published: ${escapeXml(chapter.publishedDate)}</p>`
      : '';

    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${langCode}" lang="${langCode}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(chapterTitle)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
  <h2>${escapeXml(chapterTitle)}</h2>
  ${dateLine}
  ${bodyXhtml}
</body>
</html>`;

    zip.file(`OEBPS/${filename}`, xhtml);
    manifestItems.push(
      `<item id="ch_${num}" href="${filename}" media-type="application/xhtml+xml"/>`
    );
    spineItems.push(`<itemref idref="ch_${num}"/>`);
    navLinks.push(`<li><a href="${filename}">${escapeXml(chapterTitle)}</a></li>`);
    ncxPoints.push(
      `<navPoint id="navPoint-${num}" playOrder="${num}">
      <navLabel><text>${escapeXml(chapterTitle)}</text></navLabel>
      <content src="${filename}"/>
    </navPoint>`
    );
  });

  // 6. OEBPS/nav.xhtml (EPUB 3 navigation)
  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${langCode}" lang="${langCode}">
<head>
  <meta charset="UTF-8" />
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
      ${navLinks.join('\n      ')}
    </ol>
  </nav>
</body>
</html>`
  );

  // 7. OEBPS/toc.ncx (EPUB 2 / Kindle compatibility)
  zip.file(
    'OEBPS/toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookUuid}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${escapeXml(bookTitle)}</text></docTitle>
  <navMap>
    ${ncxPoints.join('\n    ')}
  </navMap>
</ncx>`
  );

  // 8. OEBPS/content.opf
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId" xml:lang="${langCode}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${bookUuid}</dc:identifier>
    <dc:title>${escapeXml(bookTitle)}</dc:title>
    <dc:language>${langCode}</dc:language>
    <dc:creator>mockpoet</dc:creator>
    <meta property="dcterms:modified">${updatedIso}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`
  );

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
  });
  triggerBlobDownload(blob, safeFilename(bookTitle, 'epub'));
}

/**
 * Generate Kindle-ready UTF-8 HTML file (backward-compatible generateEPUB export)
 */
export function generateEPUB(bookTitle, chapters) {
  const content = generateKindleHTML(bookTitle, chapters, false);
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  triggerBlobDownload(blob, safeFilename(bookTitle, 'html'));
}

function generateKindleHTML(bookTitle, chapters, includePrintFonts = false) {
  const fontLink = includePrintFonts
    ? `<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Noto+Serif+Tamil:wght@400;600&display=swap" rel="stylesheet" />`
    : '';

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(bookTitle)}</title>
  ${fontLink}
  <style>
    body {
      font-family: "Noto Serif Tamil", "Lora", Georgia, serif;
      font-size: 12pt;
      line-height: 1.7;
      margin: 2em auto;
      max-width: 700px;
      color: #1C1917;
    }
    h1 {
      font-size: 1.8em;
      margin-top: 2em;
      margin-bottom: 0.5em;
      page-break-before: always;
    }
    .title-page {
      text-align: center;
      padding: 4em 0;
    }
    .title-page h1 {
      page-break-before: avoid;
    }
    .chapter-date {
      font-style: italic;
      font-size: 0.9em;
      color: #6B655E;
      margin-bottom: 1em;
    }
    blockquote {
      border-left: 2px solid #9A3412;
      padding-left: 1em;
      font-style: italic;
      margin: 1em 0;
    }
    p {
      margin-bottom: 1em;
    }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${escapeXml(bookTitle)}</h1>
    <p>mockpoet Archival Edition · Kindle &amp; Offline Reader</p>
  </div>
`;

  chapters.forEach((chapter, index) => {
    const chapterTitle = chapter.title || `Entry ${index + 1}`;
    html += `\n  <section class="chapter">\n`;
    html += `    <h1>${escapeXml(chapterTitle)}</h1>\n`;
    if (chapter.publishedDate) {
      html += `    <p class="chapter-date">Published: ${escapeXml(chapter.publishedDate)}</p>\n`;
    }
    html += chapter.content || '';
    html += `\n  </section>\n`;
  });

  html += `</body>\n</html>`;
  return html;
}
