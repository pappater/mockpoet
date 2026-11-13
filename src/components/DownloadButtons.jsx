import { useState } from 'react';
import { generatePDF, generateEPUB, generateKindleEPUB } from '../utils/downloadUtils';
import './DownloadButtons.css';

export default function DownloadButtons({ bookTitle, chapters }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDownload = async (format) => {
    setIsGenerating(true);
    setErrorMessage('');
    try {
      const chaptersData = typeof chapters === 'function' ? await chapters() : chapters;

      if (!chaptersData || chaptersData.length === 0) {
        setErrorMessage('No entries available to download.');
        return;
      }

      if (format === 'kindle') {
        await generateKindleEPUB(bookTitle, chaptersData);
      } else if (format === 'pdf') {
        generatePDF(bookTitle, chaptersData);
      } else if (format === 'html') {
        generateEPUB(bookTitle, chaptersData);
      }
    } catch (error) {
      console.error(`Error generating ${format}:`, error);
      setErrorMessage(`Failed to generate ${format.toUpperCase()}. Please try again.`);
    } finally {
      setTimeout(() => setIsGenerating(false), 600);
    }
  };

  return (
    <div className="download-buttons-container">
      <div className="download-buttons">
        <button
          type="button"
          onClick={() => handleDownload('kindle')}
          disabled={isGenerating}
          className="download-button download-kindle"
          aria-label="Download Kindle EPUB"
          title="Download .epub for Kindle & e-readers (supports English & Tamil)"
        >
          {isGenerating ? 'Preparing…' : 'Kindle (.epub)'}
        </button>
        <button
          type="button"
          onClick={() => handleDownload('pdf')}
          disabled={isGenerating}
          className="download-button download-pdf"
          aria-label="Download as PDF"
          title="Download / Print PDF (full Tamil & English support)"
        >
          {isGenerating ? '…' : 'PDF'}
        </button>
        <button
          type="button"
          onClick={() => handleDownload('html')}
          disabled={isGenerating}
          className="download-button download-epub"
          aria-label="Download as HTML"
          title="Download standalone UTF-8 HTML"
        >
          {isGenerating ? '…' : 'HTML'}
        </button>
      </div>
      {errorMessage && (
        <div className="download-error">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
