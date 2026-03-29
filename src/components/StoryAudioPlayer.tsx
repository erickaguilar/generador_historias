import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useStoryAudio } from '../hooks/useStoryAudio';
import { Alert } from './Alert';
import { AlertType } from '../types';
import { PlayCircleIcon, SoundWaveIcon, StopSquareIcon, PlayIcon, PauseIcon } from './Icons';


const FloatingPlayer = ({ 
    title, 
    progress,
    playbackState,
    onTogglePlayPause,
    onStop,
    onSeek,
}: { 
    title: string; 
    progress: number;
    playbackState: 'playing' | 'paused';
    onTogglePlayPause: () => void;
    onStop: () => void; 
    onSeek: (percentage: number) => void;
}) => {
    const [truncatedTitle, setTruncatedTitle] = useState(title);
    const progressBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const truncate = () => {
            if (window.innerWidth < 480) { // More aggressive truncation for smaller screens
                setTruncatedTitle(title.length > 25 ? title.substring(0, 22) + '...' : title);
            } else {
                setTruncatedTitle(title.length > 40 ? title.substring(0, 37) + '...' : title);
            }
        }
        truncate();
        window.addEventListener('resize', truncate);
        return () => window.removeEventListener('resize', truncate);
    }, [title]);
    
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        if (width === 0) return;
        const percentage = (clickX / width) * 100;
        onSeek(Math.max(0, Math.min(100, percentage)));
    };

    return (
      <div className="fixed bottom-0 left-0 right-0 z-[80] bg-slate-900/90 dark:bg-black/80 text-white backdrop-blur-sm shadow-2xl animate-slide-up" role="status" aria-live="polite">
        <div 
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="w-full h-2.5 bg-sky-900/50 cursor-pointer group"
            title="Saltar a una parte de la historia"
        >
            <div 
                className="h-full bg-sky-400 relative"
                style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
            >
                {/* Visual thumb for the progress bar */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-sky-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <button onClick={onTogglePlayPause} className="flex-shrink-0 p-1 text-white hover:bg-white/20 rounded-full transition-colors" aria-label={playbackState === 'playing' ? 'Pausar' : 'Reproducir'}>
              {playbackState === 'playing' ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
            </button>
            <div className="overflow-hidden">
              <span className="text-xs sm:text-sm text-slate-300 block">
                  {playbackState === 'playing' ? 'Reproduciendo' : 'En Pausa'}
              </span>
              <p className="font-semibold truncate text-sm sm:text-base" title={title}>{truncatedTitle}</p>
            </div>
          </div>
          <button 
            onClick={onStop} 
            className="flex-shrink-0 p-2 text-slate-300 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            title="Parar y cerrar reproductor"
            aria-label="Parar y cerrar reproductor"
          >
            <StopSquareIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    );
};

export interface StoryAudioPlayerProps {
  pureStoryText: string;
  storyTitle: string;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export interface StoryAudioPlayerRef {
  stopPlayback: () => void;
  playFragment: (fragment: string) => void;
}

export const StoryAudioPlayer = forwardRef<StoryAudioPlayerRef, StoryAudioPlayerProps>(
  ({ pureStoryText, storyTitle, onPlaybackStateChange, disabled = false, disabledReason = "No disponible" }, ref) => {
    const { 
      playbackState,
      progress,
      audioError: hookError, 
      startPlayback,
      togglePlayPause,
      stopAudioPlayback,
      playAudioFragment,
      isSpeechSynthesisSupported,
      seekTo,
    } = useStoryAudio();
    
    const [internalError, setInternalError] = useState<string | null>(null);

    useEffect(() => {
      if (hookError) {
        setInternalError(hookError);
      }
    }, [hookError]);
    
    useEffect(() => {
      onPlaybackStateChange?.(playbackState === 'playing');
    }, [playbackState, onPlaybackStateChange]);

    useImperativeHandle(ref, () => ({
      stopPlayback: () => {
        stopAudioPlayback();
      },
      playFragment: (fragment: string) => {
        playAudioFragment(fragment);
      }
    }));

    const handlePlayClick = () => {
      if (disabled || playbackState !== 'stopped') return;
      setInternalError(null);
      startPlayback(pureStoryText);
    };

    const handleSeek = (percentage: number) => {
      seekTo(percentage);
    }
    
    const notSupportedReason = "La síntesis de voz no es compatible con este navegador.";
    if (!isSpeechSynthesisSupported) {
      return (
         <div className="flex items-center gap-2">
            <button
                type="button"
                className="p-2 text-slate-400 dark:text-slate-500 transition-colors rounded-md cursor-not-allowed flex flex-col items-center text-xs w-16 h-16 justify-center"
                aria-label="Escuchar historia (no disponible)"
                title={notSupportedReason}
                disabled={true}
            >
                <PlayCircleIcon className="h-5 w-5" />
                <span className="mt-1">Audio</span>
            </button>
         </div>
      );
    }

    const isPlaybackActive = playbackState !== 'stopped';
    
    return (
      <>
        <div className="flex items-center gap-2">
            <button
            type="button"
            onClick={handlePlayClick}
            disabled={disabled || isPlaybackActive}
            className={`p-2 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 flex flex-col items-center text-xs w-16 h-16 justify-center ${
                (disabled || isPlaybackActive)
                ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-slate-600'
            }`}
            aria-label={isPlaybackActive ? "Reproducción en curso" : "Escuchar historia completa"}
            title={isPlaybackActive ? "Controles de reproducción en el panel inferior" : (disabled ? disabledReason : "Escuchar historia completa")}
            >
            {isPlaybackActive ? <SoundWaveIcon className="h-5 w-5 text-sky-400" /> : <PlayCircleIcon className="h-5 w-5" />}
            <span className="mt-1">{isPlaybackActive ? 'Sonando' : 'Audio'}</span>
            </button>
        </div>
        
        {isPlaybackActive && ReactDOM.createPortal(
            <FloatingPlayer 
                title={storyTitle} 
                progress={progress}
                playbackState={playbackState}
                onTogglePlayPause={togglePlayPause}
                onStop={stopAudioPlayback}
                onSeek={handleSeek} 
            />,
            document.body
        )}
        
        {internalError && (
            <div className="fixed bottom-16 left-1/2 -translate-x-1/2 max-w-md w-auto z-[65]">
             <Alert message={internalError} type={AlertType.Error} onClose={() => setInternalError(null)} />
           </div>
        )}
      </>
    );
  }
);
StoryAudioPlayer.displayName = 'StoryAudioPlayer';