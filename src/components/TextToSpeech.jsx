import { useState, useRef, useEffect } from 'react';
import './TextToSpeech.css';

export default function TextToSpeech({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Cleanup when component unmounts or text changes
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      // Cancel any existing speech
      window.speechSynthesis.cancel();

      // Create plain text from HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';

      const utterance = new SpeechSynthesisUtterance(plainText);
      
      // Set voice preferences
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a male voice using multiple criteria
      const maleVoice = voices.find(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        
        // Check for explicit male indicators in name
        if (name.includes('male') && !name.includes('female')) return true;
        
        // Check for common male voice names
        const maleNames = ['david', 'george', 'daniel', 'james', 'alex', 'thomas'];
        if (maleNames.some(n => name.includes(n))) return true;
        
        // Prefer English voices as fallback
        return lang.startsWith('en');
      });
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="text-to-speech">
      {!isPlaying && !isPaused && (
        <button onClick={handlePlay} className="tts-button tts-play" aria-label="Play">
          ▶ Play
        </button>
      )}
      {isPlaying && (
        <button onClick={handlePause} className="tts-button tts-pause" aria-label="Pause">
          ⏸ Pause
        </button>
      )}
      {isPaused && (
        <button onClick={handlePlay} className="tts-button tts-resume" aria-label="Resume">
          ▶ Resume
        </button>
      )}
      {(isPlaying || isPaused) && (
        <button onClick={handleStop} className="tts-button tts-stop" aria-label="Stop">
          ⏹ Stop
        </button>
      )}
    </div>
  );
}
