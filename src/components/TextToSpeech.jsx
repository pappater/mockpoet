import { useState, useRef, useEffect } from 'react';
import './TextToSpeech.css';

const QUALITY_VOICE_KEYWORDS = ['enhanced', 'premium', 'natural', 'neural'];
const SPEEDS = [0.85, 1.0, 1.25];

export default function TextToSpeech({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const utteranceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (utteranceRef.current && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  useEffect(() => {
    setIsPlaying(false);
    setIsPaused(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [text]);

  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return null;
  }

  const pickVoice = (voices, isTamil) => {
    const langPrefix = isTamil ? 'ta' : 'en';
    return (
      voices.find((voice) => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        return QUALITY_VOICE_KEYWORDS.some((kw) => name.includes(kw)) && lang.startsWith(langPrefix);
      }) ||
      voices.find((voice) => voice.localService && voice.lang.toLowerCase().startsWith(langPrefix)) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith(langPrefix)) ||
      null
    );
  };

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    if (!plainText.trim()) return;

    const isTamil = /[\u0B80-\u0BFF]/.test(plainText);
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = isTamil ? 'ta-IN' : 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const bestVoice = pickVoice(voices, isTamil);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.rate = SPEEDS[speedIndex];
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

  const cycleSpeed = () => {
    setSpeedIndex((prev) => (prev + 1) % SPEEDS.length);
  };

  return (
    <div className="text-to-speech">
      {!isPlaying && !isPaused && (
        <button type="button" onClick={handlePlay} className="tts-button tts-play" aria-label="Listen">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Listen
        </button>
      )}
      {isPlaying && (
        <button type="button" onClick={handlePause} className="tts-button tts-pause" aria-label="Pause">
          Pause
        </button>
      )}
      {isPaused && (
        <button type="button" onClick={handlePlay} className="tts-button tts-resume" aria-label="Resume">
          Resume
        </button>
      )}
      {(isPlaying || isPaused) && (
        <button type="button" onClick={handleStop} className="tts-button tts-stop" aria-label="Stop">
          Stop
        </button>
      )}
      <button
        type="button"
        onClick={cycleSpeed}
        className="tts-speed-btn"
        aria-label="Playback speed"
        title="Change speech speed"
      >
        {SPEEDS[speedIndex]}×
      </button>
    </div>
  );
}
