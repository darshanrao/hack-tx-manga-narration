'use client'

import { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  isPlaying: boolean;
  volume: number;
  speed: number;
  isMuted: boolean;
  currentTime: number;
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange: (duration: number) => void;
  onEnded: () => void;
  onError: () => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
}

export function AudioPlayer({ 
  audioUrl, 
  isPlaying, 
  volume, 
  speed, 
  isMuted,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  onEnded,
  onError,
  onLoadStart,
  onCanPlay
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousUrlRef = useRef<string>('');
  const lastSeekTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const hasEndedRef = useRef<boolean>(false);
  const pendingSeekRef = useRef<number | null>(null);

  // Update audio properties when they change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = speed;
  }, [volume, speed, isMuted]);

  // Handle seeking when currentTime changes externally
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const applySeek = (t: number) => {
      isSeekingRef.current = true;
      audio.currentTime = t;
      if (hasEndedRef.current && t < (audio.duration || Infinity) - 0.25) {
        hasEndedRef.current = false;
        if (isPlaying) {
          audio.play().catch(() => {/* ignore autoplay errors */});
        }
      }
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 100);
    };

    const timeDifference = Math.abs(audio.currentTime - currentTime);
    if (timeDifference <= 0.05) return; // ignore tiny deltas

    // If audio not ready with metadata, defer seek until it can play
    if (audio.readyState < 2) {
      pendingSeekRef.current = currentTime;
      const onCanPlayOnce = () => {
        audio.removeEventListener('canplay', onCanPlayOnce);
        const t = pendingSeekRef.current;
        pendingSeekRef.current = null;
        if (t != null) applySeek(t);
      };
      audio.addEventListener('canplay', onCanPlayOnce);
      return;
    }

    applySeek(currentTime);
  }, [currentTime, isPlaying]);

  // Handle play/pause with readiness guard
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // If not ready, wait for canplay then attempt to play once
      if (!audio.src) return;
      
      // Only play if we haven't already ended this audio
      if (hasEndedRef.current) return;
      
      const tryPlay = () => {
        audio.play().catch((error) => {
          if (error.name === 'AbortError') return;
          console.error('Error playing audio:', error);
          onError();
        });
      };

      if (audio.readyState >= 2) {
        tryPlay();
      } else {
        const onCanPlayOnce = () => {
          audio.removeEventListener('canplay', onCanPlayOnce);
          tryPlay();
        };
        audio.addEventListener('canplay', onCanPlayOnce);
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, onError]);

  // Set up event listeners with throttled time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let lastEmitted = 0;
    const handleTimeUpdate = () => {
      if (isSeekingRef.current) return;
      const now = performance.now();
      // throttle to ~2Hz (every 500ms) to minimize React updates
      if (now - lastEmitted >= 500) {
        lastEmitted = now;
        onTimeUpdate(audio.currentTime);
      }
    };
    const handleLoadedMetadata = () => onDurationChange(audio.duration);
    const handleEnded = () => {
      // Prevent multiple ended events from firing
      if (!hasEndedRef.current) {
        hasEndedRef.current = true;
        onEnded();
      }
    };
    const handleError = () => {
      // Prevent looping caused by rapid error -> play attempts
      audio.pause();
      onError();
    };
    const handleLoadStart = () => onLoadStart?.();
    const handleCanPlay = () => onCanPlay?.();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onTimeUpdate, onDurationChange, onEnded, onError, onLoadStart, onCanPlay]);

  // Update src when audioUrl changes and preserve playback settings
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only change source if the URL actually changed
    if (audioUrl && audioUrl !== previousUrlRef.current) {
      // Reset ended flag for new audio
      hasEndedRef.current = false;
      // Normalize relative URLs to root-relative
      const normalizedUrl = (audioUrl.startsWith('http') || audioUrl.startsWith('/'))
        ? audioUrl
        : `/${audioUrl}`;
      // Pause current audio before changing source to prevent AbortError
      audio.pause();
      audio.src = normalizedUrl;
      audio.load();
      // Re-apply current playback settings after changing source
      audio.playbackRate = speed;
      audio.volume = isMuted ? 0 : volume;
      previousUrlRef.current = normalizedUrl;
      // If we should be playing, attempt to play or wait for readiness
      const tryPlay = () => {
        if (!isPlaying || hasEndedRef.current) return;
        audio.play().catch((error) => {
          if (error.name === 'AbortError') return;
          console.error('Error playing audio:', error);
          onError();
        });
      };

      if (audio.readyState >= 2) {
        // Apply any pending seek now that metadata is available
        if (pendingSeekRef.current != null) {
          const t = pendingSeekRef.current;
          pendingSeekRef.current = null;
          audio.currentTime = t;
        }
        tryPlay();
      } else {
        const onCanPlayOnce = () => {
          audio.removeEventListener('canplay', onCanPlayOnce);
          // Apply any pending seek on readiness
          if (pendingSeekRef.current != null) {
            const t = pendingSeekRef.current;
            pendingSeekRef.current = null;
            audio.currentTime = t;
          }
          tryPlay();
        };
        audio.addEventListener('canplay', onCanPlayOnce);
      }
    }
  }, [audioUrl, onError, isPlaying, speed, volume, isMuted]);

  return (
    <audio
      ref={audioRef}
      preload="auto"
      crossOrigin="anonymous"
      style={{ display: 'none' }}
      onLoadStart={() => {/* prevent default behavior */}}
    >
      {/* Provide a source element with type to help browser recognize format */}
      {previousUrlRef.current && (
        <source src={previousUrlRef.current} type="audio/mpeg" />
      )}
    </audio>
  );
}
