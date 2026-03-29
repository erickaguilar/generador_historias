import { useState, useRef, useCallback, useEffect } from 'react';

// For TypeScript: define the WakeLockSentinel interface as it might not be in default libs.
interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => any) | null;
}

export interface StoryAudioControls {
  playbackState: 'stopped' | 'playing' | 'paused';
  progress: number;
  audioError: string | null;
  startPlayback: (text: string) => void;
  togglePlayPause: () => void;
  playAudioFragment: (fragment: string) => void;
  stopAudioPlayback: () => void;
  isSpeechSynthesisSupported: boolean;
  seekTo: (percentage: number) => void;
}

export const useStoryAudio = (): StoryAudioControls => {
  const [playbackState, setPlaybackState] = useState<'stopped' | 'playing' | 'paused'>('stopped');
  const [progress, setProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeechSynthesisSupported, setIsSpeechSynthesisSupported] = useState<boolean>(true);
  
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textToPlayRef = useRef<string>('');
  const charIndexOffsetRef = useRef<number>(0);
  const lastCharIndexRef = useRef<number>(0); // To store progress for robust resume
  const isPausingRef = useRef<boolean>(false); // Flag to differentiate pause from stop/error
  const wakeLockSentinelRef = useRef<WakeLockSentinel | null>(null);

  // Refs for smooth progress updates
  const progressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // --- Wake Lock Management ---
  const acquireWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
          return; // Lock is already active
        }
        wakeLockSentinelRef.current = await navigator.wakeLock.request('screen');
        wakeLockSentinelRef.current.addEventListener('release', () => {
          console.log('Wake Lock was released by the system.');
        });
        console.log('Wake Lock acquired.');
      } catch (err) {
        if (err instanceof Error) {
            console.error(`Wake Lock request failed: ${err.name}, ${err.message}`);
        }
      }
    } else {
      console.warn('Wake Lock API is not supported.');
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
      try {
        await wakeLockSentinelRef.current.release();
        wakeLockSentinelRef.current = null;
        console.log('Wake Lock released.');
      } catch (err) {
        if (err instanceof Error) {
            console.error(`Failed to release Wake Lock: ${err.name}, ${err.message}`);
        }
      }
    }
  }, []);

  const internalStop = useCallback(() => {
    if (!isSpeechSynthesisSupported || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    isPausingRef.current = false; // Ensure pause flag is reset on any hard stop
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused) {
      window.speechSynthesis.cancel();
    }
    
    if(currentUtteranceRef.current) {
        currentUtteranceRef.current.onend = null;
        currentUtteranceRef.current.onerror = null;
        currentUtteranceRef.current.onstart = null;
        currentUtteranceRef.current.onboundary = null;
        currentUtteranceRef.current = null;
    }
  }, [isSpeechSynthesisSupported]);

  const stopAudioPlayback = useCallback(() => {
    internalStop();
    setPlaybackState('stopped');
    setProgress(0);
    progressRef.current = 0;
    releaseWakeLock();
  }, [internalStop, releaseWakeLock]);
  
  const playInternal = useCallback((fullText: string, startIndex: number) => {
    internalStop(); // Stop anything currently playing

    const textFragment = fullText.substring(startIndex);
    if (!textFragment.trim()) {
      stopAudioPlayback();
      return;
    }

    const start = () => {
      let currentVoices = voices;
      if (currentVoices.length === 0) {
        currentVoices = window.speechSynthesis.getVoices();
        if (currentVoices.length > 0) {
          setVoices(currentVoices);
        }
      }
      
      if (currentVoices.length === 0) {
          setAudioError("No se encontraron voces de síntesis de voz. Intenta recargar.");
          return;
      }

      textToPlayRef.current = fullText;
      charIndexOffsetRef.current = startIndex;
      lastCharIndexRef.current = startIndex;
      
      const utterance = new SpeechSynthesisUtterance(textFragment);
      
      const spanishVoices = currentVoices.filter(voice => voice.lang.startsWith('es'));
      let selectedVoice: SpeechSynthesisVoice | undefined;
      if (spanishVoices.length > 0) {
        const priorityKeywords = ['natural', 'google', 'siri', 'premium', 'microsoft'];
        for (const keyword of priorityKeywords) {
          selectedVoice = spanishVoices.find(voice => voice.name.toLowerCase().includes(keyword));
          if (selectedVoice) break;
        }
        if (!selectedVoice) selectedVoice = spanishVoices.find(voice => voice.lang === 'es-ES');
        if (!selectedVoice) selectedVoice = spanishVoices.find(voice => voice.lang === 'es-MX');
        if (!selectedVoice) selectedVoice = spanishVoices[0];
      }
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Speech Synthesis: Using voice "${selectedVoice.name}" (${selectedVoice.lang})`);
      } else {
        utterance.lang = 'es-ES';
        console.warn("Speech Synthesis: No Spanish voice found. Using browser default for 'es-ES'.");
      }
      
      utterance.onstart = () => {
        setPlaybackState('playing');
        setAudioError(null);
        acquireWakeLock();
        
        const initialProgress = fullText.length > 0 ? (startIndex / fullText.length) * 100 : 0;
        progressRef.current = initialProgress;
        
        const animateProgress = () => {
          setProgress(progressRef.current);
          animationFrameRef.current = requestAnimationFrame(animateProgress);
        };
        animationFrameRef.current = requestAnimationFrame(animateProgress);
      };

      utterance.onend = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        if (isPausingRef.current) {
            isPausingRef.current = false;
            return;
        }
        setPlaybackState('stopped');
        setProgress(100);
        progressRef.current = 100;
        releaseWakeLock();
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (isPausingRef.current) {
            isPausingRef.current = false;
            return;
        }
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.error("Error en la síntesis de voz:", event.error, event);
          let detailedError = String(event.error) || "Error desconocido en TTS";
          setAudioError(`Error al reproducir audio: ${detailedError}`);
        }
        stopAudioPlayback();
      };

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (textToPlayRef.current.length > 0) {
            const totalCharsPlayed = charIndexOffsetRef.current + event.charIndex;
            lastCharIndexRef.current = totalCharsPlayed;
            const currentProgress = (totalCharsPlayed / textToPlayRef.current.length) * 100;
            progressRef.current = currentProgress;
        }
      };
      
      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
    
    // Un pequeño timeout para asegurar que el `cancel` se procese correctamente antes de `speak`.
    setTimeout(start, 100);
  }, [isSpeechSynthesisSupported, voices, acquireWakeLock, releaseWakeLock, stopAudioPlayback, internalStop]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSpeechSynthesisSupported(false);
      setAudioError("La síntesis de voz no es compatible con este navegador.");
      return;
    }
    setIsSpeechSynthesisSupported(true); 
    const speechApi = window.speechSynthesis;

    const updateVoiceList = () => {
      const availableVoices = speechApi.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length === 0 && speechApi.onvoiceschanged === null) {
        speechApi.onvoiceschanged = updateVoiceList;
      }
    };

    updateVoiceList();
    if (speechApi.getVoices().length === 0) {
        speechApi.onvoiceschanged = updateVoiceList;
    }
    
    return () => {
      speechApi.onvoiceschanged = null; 
      if (speechApi.speaking || speechApi.pending) {
        speechApi.cancel();
      }
      releaseWakeLock();
    };
  }, [releaseWakeLock]);
  
  const startPlayback = useCallback((textToPlay: string) => {
    if (!isSpeechSynthesisSupported) {
      setAudioError("La síntesis de voz no es compatible con este navegador.");
      return;
    }
    if (!textToPlay.trim()) {
      setAudioError("No hay texto para reproducir.");
      return;
    }

    playInternal(textToPlay, 0);
  }, [isSpeechSynthesisSupported, playInternal]);

  const pausePlayback = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      isPausingRef.current = true;
      window.speechSynthesis.cancel();
      setPlaybackState('paused');
      // No liberamos el wake lock en pausa para que la pantalla no se apague.
    }
  }, []);

  const resumePlayback = useCallback(() => {
    if (playbackState === 'paused' && textToPlayRef.current) {
      playInternal(textToPlayRef.current, lastCharIndexRef.current);
    }
  }, [playbackState, playInternal]);

  const togglePlayPause = useCallback(() => {
    if (playbackState === 'playing') {
      pausePlayback();
    } else if (playbackState === 'paused') {
      resumePlayback();
    }
  }, [playbackState, pausePlayback, resumePlayback]);
  
  const seekTo = useCallback((percentage: number) => {
    if (!textToPlayRef.current) return;
    const fullText = textToPlayRef.current;
    const targetIndex = Math.floor((percentage / 100) * fullText.length);
    
    let finalIndex = targetIndex;
    // Seek to the beginning of the next word to avoid starting mid-word
    if (finalIndex > 0 && finalIndex < fullText.length - 1 && fullText[finalIndex] !== ' ' && fullText[finalIndex - 1] !== ' ') {
        const nextSpace = fullText.indexOf(' ', finalIndex);
        if (nextSpace !== -1) {
            finalIndex = nextSpace + 1;
        }
    }
    
    progressRef.current = (finalIndex / fullText.length) * 100;
    setProgress(progressRef.current);

    playInternal(fullText, finalIndex);
  }, [playInternal]);
  
  const playAudioFragment = useCallback((fragment: string) => {
    // Treat the fragment as a new, complete story for playback purposes.
    playInternal(fragment, 0);
  }, [playInternal]);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, [stopAudioPlayback]);

  return {
    playbackState,
    progress,
    audioError,
    startPlayback,
    togglePlayPause,
    playAudioFragment,
    stopAudioPlayback,
    isSpeechSynthesisSupported,
    seekTo,
  };
};