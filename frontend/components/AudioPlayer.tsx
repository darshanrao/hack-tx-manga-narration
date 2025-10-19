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

    // Only seek if the difference is significant (more than 0.5 seconds)
    // This prevents stuttering during normal playback while allowing proper seeking
    const timeDifference = Math.abs(audio.currentTime - currentTime);
    if (timeDifference > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  // Handle play/pause with readiness guard
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // If not ready, wait for canplay then attempt to play once
      if (!audio.src) return;
      const tryPlay = () => {
        audio.play().catch((error) => {
          if (error.name === 'AbortError') {
            console.log('Audio play was aborted (likely due to source change)');
            return;
          }
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

  // Set up event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => onTimeUpdate(audio.currentTime);
    const handleLoadedMetadata = () => onDurationChange(audio.duration);
    const handleEnded = () => onEnded();
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
      if (isPlaying) {
        const tryPlay = () => {
          audio.play().catch((error) => {
            if (error.name === 'AbortError') {
              console.log('Audio play was aborted (likely due to source change)');
              return;
            }
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
      }
    }
  }, [audioUrl, onError, isPlaying, speed, volume, isMuted]);

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      style={{ display: 'none' }}
    >
      {/* Provide a source element with type to help browser recognize format */}
      {previousUrlRef.current && (
        <source src={previousUrlRef.current} type="audio/mpeg" />
      )}
    </audio>
  );
}
