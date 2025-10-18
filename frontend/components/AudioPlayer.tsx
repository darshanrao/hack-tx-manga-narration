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

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        onError();
      });
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
    const handleError = () => onError();
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

  // Update src when audioUrl changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioUrl && audio.src !== audioUrl) {
      audio.src = audioUrl;
      audio.load();
    }
  }, [audioUrl]);

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      style={{ display: 'none' }}
    />
  );
}
