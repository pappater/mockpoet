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
      
      // Set voice to male (prefer male voices)
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('george') ||
        voice.name.toLowerCase().includes('daniel')
      ) || voices.find(voice => !voice.name.toLowerCase().includes('female'));
      
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
