import { useState, useRef, useEffect } from 'react';
import './TextToSpeech.css';

// Quality voice indicators for enhanced text-to-speech
const QUALITY_VOICE_KEYWORDS = ['enhanced', 'premium', 'natural', 'neural'];

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
      
      // Set voice preferences - prioritize natural, high-quality voices
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find the best quality voice using multiple criteria
      // Priority: Enhanced/Premium voices > Local voices > Remote voices
      const bestVoice = voices.find(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        
        // Prioritize enhanced/premium/natural quality voices
        if (QUALITY_VOICE_KEYWORDS.some(keyword => name.includes(keyword))) {
          return lang.startsWith('en');
        }
        
        return false;
      }) || voices.find(voice => {
        const lang = voice.lang.toLowerCase();
        
        // Then try local/offline voices for better quality
        if (voice.localService && lang.startsWith('en')) {
          return true;
        }
        
        return false;
      }) || voices.find(voice => {
        // Fallback to any English voice
        return voice.lang.toLowerCase().startsWith('en');
      });
      
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      // Slightly slower rate for better clarity and podcast-like experience
      utterance.rate = 0.9;
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
