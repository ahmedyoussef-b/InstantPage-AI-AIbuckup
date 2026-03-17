// src/hooks/useVoice.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceOptions, VoiceResponse, VoiceState } from '@/types/voice';

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
    provider: 'piper',
    voice: 'female-1'
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef<boolean>(false);

  // Initialiser l'élément audio
  useEffect(() => {
    audioRef.current = new Audio();
    
    audioRef.current.onended = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentText: null }));
      processNextInQueue();
    };
    
    audioRef.current.onpause = () => {
      setState(prev => ({ ...prev, isPaused: true }));
    };
    
    audioRef.current.onplay = () => {
      setState(prev => ({ ...prev, isPaused: false }));
    };
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Traiter la file d'attente
  const processNextInQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) {
      return;
    }
    
    processingRef.current = true;
    const nextText = queueRef.current.shift();
    
    if (nextText) {
      await playText(nextText);
    }
    
    processingRef.current = false;
  }, []);

  // Jouer un texte
  const playText = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          provider: state.provider,
          voice: state.voice,
          speed: state.speed,
          cache: true
        })
      });
      
      const data: VoiceResponse = await response.json();
      
      if (audioRef.current) {
        const audioSrc = `data:audio/${data.format};base64,${data.audio}`;
        audioRef.current.src = audioSrc;
        audioRef.current.volume = state.volume;
        await audioRef.current.play();
        
        setState(prev => ({
          ...prev,
          isPlaying: true,
          currentText: text
        }));
      }
    } catch (error) {
      console.error('Erreur lecture:', error);
      processingRef.current = false;
      processNextInQueue();
    }
  }, [state.provider, state.voice, state.speed, state.volume, processNextInQueue]);

  // Fonction principale pour jouer
  const play = useCallback(async (text: string, options?: Partial<VoiceOptions>) => {
    // Mettre à jour les options si fournies
    if (options) {
      setState(prev => ({
        ...prev,
        ...options
      }));
    }
    
    // Ajouter à la file d'attente
    queueRef.current.push(text);
    setState(prev => ({ ...prev, queue: [...queueRef.current] }));
    
    // Démarrer le traitement si pas déjà en cours
    if (!processingRef.current && !state.isPlaying) {
      processNextInQueue();
    }
  }, [state.isPlaying, processNextInQueue]);

  // Pause
  const pause = useCallback(() => {
    if (audioRef.current && state.isPlaying) {
      audioRef.current.pause();
    }
  }, [state.isPlaying]);

  // Reprendre
  const resume = useCallback(() => {
    if (audioRef.current && state.isPaused) {
      audioRef.current.play();
    }
  }, [state.isPaused]);

  // Arrêter
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    queueRef.current = [];
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentText: null,
      queue: []
    }));
    processingRef.current = false;
  }, []);

  // Vider la file d'attente
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setState(prev => ({ ...prev, queue: [] }));
  }, []);

  // Changer volume
  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
    setState(prev => ({ ...prev, volume }));
  }, []);

  // Changer vitesse
  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, speed }));
  }, []);

  return {
    isPlaying: state.isPlaying,
    isPaused: state.isPaused,
    currentText: state.currentText,
    queue: state.queue,
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