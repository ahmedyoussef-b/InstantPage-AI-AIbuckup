// src/hooks/useVoice.ts - Version avec synthèse vocale désactivée
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceOptions, VoiceState } from '@/types/voice';

interface UseVoiceReturn {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string | null;
  queue: string[];
  volume: number;
  speed: number;
  play: (text: string, options?: Partial<VoiceOptions>) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  clearQueue: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [state, setState] = useState<VoiceState>({
    isPlaying: false,
    isPaused: false,
    currentText: null,
    queue: [],
    volume: 1,
    speed: 1,
    provider: 'disabled', // Changé à 'disabled'
    voice: 'none'
  });

  const queueRef = useRef<string[]>([]);

  // Version désactivée - ne fait rien mais retourne une API fonctionnelle
  const play = useCallback(async (text: string, options?: Partial<VoiceOptions>) => {
    console.log('🔇 Synthèse vocale désactivée (mode silencieux)');
    // Simuler un délai pour que l'UI reste réactive
    await new Promise(resolve => setTimeout(resolve, 100));
  }, []);

  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);
  const stop = useCallback(() => {
    queueRef.current = [];
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentText: null,
      queue: []
    }));
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setState(prev => ({ ...prev, queue: [] }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, speed }));
  }, []);

  return {
    isPlaying: false,
    isPaused: false,
    currentText: null,
    queue: [],
    volume: state.volume,
    speed: state.speed,
    play,
    pause,
    resume,
    stop,
    setVolume,
    setSpeed,
    clearQueue
  };
}