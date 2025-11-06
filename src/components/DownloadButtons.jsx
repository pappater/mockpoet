import { useState } from 'react';
import { generatePDF, generateEPUB } from '../utils/downloadUtils';
import './DownloadButtons.css';

export default function DownloadButtons({ bookTitle, chapters }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDownload = async (format) => {
    setIsGenerating(true);
    setErrorMessage('');
    try {
      // If chapters is a function, call it to get the actual chapters data
      const chaptersData = typeof chapters === 'function' ? await chapters() : chapters;
      
      if (!chaptersData || chaptersData.length === 0) {
        setErrorMessage('No chapters available to download.');
        return;
      }
      
      if (format === 'pdf') {
        generatePDF(bookTitle, chaptersData);
      } else if (format === 'epub') {
        generateEPUB(bookTitle, chaptersData);
      }
    } catch (error) {
      console.error(`Error generating ${format}:`, error);
      setErrorMessage(`Failed to generate ${format.toUpperCase()}. Please try again.`);
    } finally {
      setTimeout(() => setIsGenerating(false), 1000);
    }
  };

  return (
    <div className="download-buttons-container">
      <div className="download-buttons">
        <button
          onClick={() => handleDownload('pdf')}
          disabled={isGenerating}
          className="download-button download-pdf"
          aria-label="Download as PDF"
        >
          {isGenerating ? '⏳ Generating...' : '📄 Download PDF'}
        </button>
        <button
          onClick={() => handleDownload('epub')}
          disabled={isGenerating}
          className="download-button download-epub"
          aria-label="Download as EPUB"
        >
          {isGenerating ? '⏳ Generating...' : '📚 Download HTML'}
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
