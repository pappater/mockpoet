import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import './TextToSpeech.css';

const QUALITY_KEYWORDS = ['natural', 'neural', 'online', 'enhanced', 'premium', 'siri', 'google', 'pallavi', 'valluvar', 'samantha', 'daniel', 'karen', 'moira'];
const SPEEDS = [0.8, 0.9, 1.0, 1.15, 1.35];

function splitIntoSentences(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  // Split at sentence punctuation or line boundaries while keeping natural cadence
  const parts = cleaned
    .split(/(?<=[.!?।…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Break overly long sentences cleanly around ~220 chars on commas/semicolons so SpeechSynthesis never stalls
  const chunks = [];
  for (const part of parts) {
    if (part.length <= 240) {
      chunks.push(part);
    } else {
      const subParts = part.split(/(?<=[,;:])\s+/);
      let buffer = '';
      for (const sub of subParts) {
        if ((buffer + ' ' + sub).trim().length > 220 && buffer) {
          chunks.push(buffer.trim());
          buffer = sub;
        } else {
          buffer = (buffer + ' ' + sub).trim();
        }
      }
      if (buffer) chunks.push(buffer.trim());
    }
  }
  return chunks;
}

function extractSpokenSegments(html) {
  if (!html || typeof document === 'undefined') return [];
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const blocks = wrapper.querySelectorAll('p, h1, h2, h3, h4, blockquote, li');
  const segments = [];

  if (blocks.length > 0) {
    blocks.forEach((el, blockIndex) => {
      const text = (el.textContent || '').trim();
      if (!text) return;
      const sentences = splitIntoSentences(text);
      sentences.forEach((sentence) => {
        segments.push({ blockIndex, text: sentence });
      });
    });
  } else {
    const plain = (wrapper.textContent || '').trim();
    splitIntoSentences(plain).forEach((sentence, idx) => {
      segments.push({ blockIndex: idx, text: sentence });
    });
  }
  return segments;
}

function scoreVoice(voice, isTamil) {
  const lang = (voice.lang || '').toLowerCase();
  const name = (voice.name || '').toLowerCase();
  let score = 0;

  if (isTamil) {
    if (lang.startsWith('ta')) score += 100;
    else if (lang.includes('in')) score += 20;
  } else {
    if (lang.startsWith('en-gb') || lang.startsWith('en-us') || lang.startsWith('en-in')) score += 80;
    else if (lang.startsWith('en')) score += 60;
  }

  QUALITY_KEYWORDS.forEach((kw, idx) => {
    if (name.includes(kw)) {
      score += 40 - idx;
    }
  });
  if (name.includes('compact') || name.includes('espeak')) score -= 25;
  if (!voice.localService && name.includes('natural')) score += 18;
  return score;
}

export default function TextToSpeech({ text, onSegmentChange }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2); // 1.0x default
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showStudio, setShowStudio] = useState(false);

  const sessionTokenRef = useRef(0);
  const segments = useMemo(() => extractSpokenSegments(text), [text]);
  const isTamil = useMemo(
    () => segments.some((s) => /[\u0B80-\u0BFF]/.test(s.text)),
    [segments]
  );

  // Load and sort system voices dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices() || [];
      const sorted = [...available].sort((a, b) => scoreVoice(b, isTamil) - scoreVoice(a, isTamil));
      setVoices(sorted);
      if (sorted.length > 0) {
        setSelectedVoiceURI((prev) => {
          if (prev && sorted.some((v) => v.voiceURI === prev)) return prev;
          return sorted[0].voiceURI;
        });
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, [isTamil]);

  // Reset playback whenever chapter text changes
  useEffect(() => {
    sessionTokenRef.current += 1;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIdx(0);
    if (onSegmentChange) onSegmentChange(null);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return () => {
      sessionTokenRef.current += 1;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text, onSegmentChange]);

  const speakAt = useCallback(
    (index, rateOverride = null, voiceUriOverride = null) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      if (!segments.length || index < 0 || index >= segments.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentIdx(0);
        if (onSegmentChange) onSegmentChange(null);
        return;
      }

      sessionTokenRef.current += 1;
      const activeToken = sessionTokenRef.current;

      window.speechSynthesis.cancel();

      const seg = segments[index];
      const utterance = new SpeechSynthesisUtterance(seg.text);
      const chosenUri = voiceUriOverride || selectedVoiceURI;
      const matchedVoice = voices.find((v) => v.voiceURI === chosenUri) || voices[0];

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = isTamil ? 'ta-IN' : 'en-US';
      }

      utterance.rate = rateOverride || SPEEDS[speedIndex];
      utterance.pitch = 1.0;

      setCurrentIdx(index);
      setIsPlaying(true);
      setIsPaused(false);
      setShowStudio(true);

      if (onSegmentChange) {
        onSegmentChange({
          blockIndex: seg.blockIndex,
          sentenceIndex: index,
          text: seg.text,
          total: segments.length,
        });
      }

      utterance.onend = () => {
        if (sessionTokenRef.current !== activeToken) return;
        if (index + 1 < segments.length) {
          speakAt(index + 1, rateOverride, chosenUri);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentIdx(0);
          if (onSegmentChange) onSegmentChange(null);
        }
      };

      utterance.onerror = () => {
        if (sessionTokenRef.current !== activeToken) return;
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [segments, selectedVoiceURI, voices, isTamil, speedIndex, onSegmentChange]
  );

  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return null;
  }

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    speakAt(currentIdx);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    sessionTokenRef.current += 1;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIdx(0);
    setShowStudio(false);
    if (onSegmentChange) onSegmentChange(null);
  };

  const handlePrevSentence = () => {
    const target = Math.max(0, currentIdx - 1);
    speakAt(target);
  };

  const handleNextSentence = () => {
    const target = Math.min(segments.length - 1, currentIdx + 1);
    speakAt(target);
  };

  const cycleSpeed = () => {
    const nextIdx = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(nextIdx);
    if (isPlaying) {
      speakAt(currentIdx, SPEEDS[nextIdx]);
    }
  };

  const handleVoiceChange = (e) => {
    const newUri = e.target.value;
    setSelectedVoiceURI(newUri);
    if (isPlaying) {
      speakAt(currentIdx, SPEEDS[speedIndex], newUri);
    }
  };

  const relevantVoices = voices
    .filter((v) => {
      const l = (v.lang || '').toLowerCase();
      return isTamil ? l.startsWith('ta') || l.startsWith('en-in') : l.startsWith('en');
    })
    .slice(0, 12);

  const dropdownVoices = relevantVoices.length > 0 ? relevantVoices : voices.slice(0, 10);
  const currentSegment = segments[currentIdx] || null;

  return (
    <div className={`tts-studio ${showStudio ? 'expanded' : ''}`}>
      <div className="text-to-speech">
        {!isPlaying && !isPaused && (
          <button
            type="button"
            onClick={handlePlay}
            className="tts-button tts-play"
            aria-label="Listen"
            disabled={segments.length === 0}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Listen
          </button>
        )}

        {isPlaying && (
          <button type="button" onClick={handlePause} className="tts-button tts-pause" aria-label="Pause">
            ❚❚ Pause
          </button>
        )}

        {isPaused && (
          <button type="button" onClick={handlePlay} className="tts-button tts-resume" aria-label="Resume">
            ▶ Resume
          </button>
        )}

        {(isPlaying || isPaused) && (
          <>
            <button
              type="button"
              onClick={handlePrevSentence}
              className="tts-icon-btn"
              aria-label="Previous sentence"
              title="Previous sentence"
              disabled={currentIdx <= 0}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNextSentence}
              className="tts-icon-btn"
              aria-label="Next sentence"
              title="Next sentence"
              disabled={currentIdx >= segments.length - 1}
            >
              ›
            </button>
            <button type="button" onClick={handleStop} className="tts-button tts-stop" aria-label="Stop">
              Stop
            </button>
          </>
        )}

        <button
          type="button"
          onClick={cycleSpeed}
          className="tts-speed-btn"
          aria-label="Playback speed"
          title="Change narration speed"
        >
          {SPEEDS[speedIndex]}×
        </button>

        {dropdownVoices.length > 0 && (
          <button
            type="button"
            onClick={() => setShowStudio((prev) => !prev)}
            className={`tts-voice-toggle ${showStudio ? 'active' : ''}`}
            aria-label="Voice options"
            title="Choose narrator voice"
          >
            Voice ▾
          </button>
        )}
      </div>

      {showStudio && (
        <div className="tts-player-bar" role="region" aria-label="Audio narrator controls">
          <div className="tts-player-top">
            <label className="tts-voice-picker">
              <span>Narrator</span>
              <select value={selectedVoiceURI} onChange={handleVoiceChange} aria-label="Select narrator voice">
                {dropdownVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>
            {segments.length > 0 && (
              <span className="tts-progress-label">
                Line {currentIdx + 1} / {segments.length}
              </span>
            )}
          </div>
          {(isPlaying || isPaused) && currentSegment && (
            <div className="tts-live-line" aria-live="polite">
              {currentSegment.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
