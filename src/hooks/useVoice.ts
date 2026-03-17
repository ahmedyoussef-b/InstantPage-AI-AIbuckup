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
    
    audioRef.current.onerror = (e) => {
      console.error('Erreur élément audio:', e);
      setState(prev => ({ ...prev, isPlaying: false, currentText: null }));
      processingRef.current = false;
      processNextInQueue();
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur synthèse serveur');
      }

      const data: VoiceResponse = await response.json();
      
      if (audioRef.current) {
        // Important: utiliser le format renvoyé par le serveur
        const mimeType = data.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
        const audioSrc = `data:${mimeType};base64,${data.audio}`;
        
        audioRef.current.src = audioSrc;
        audioRef.current.volume = state.volume;
        audioRef.current.playbackRate = 1.0; // Piper gère déjà la vitesse côté serveur
        
        await audioRef.current.play();
        
        setState(prev => ({
          ...prev,
          isPlaying: true,
          currentText: text
        }));
      }
    } catch (error) {
      console.error('Erreur lecture voice hook:', error);
      processingRef.current = false;
      // Optionnel: notifier l'utilisateur de l'échec de lecture
    }
  }, [state.provider, state.voice, state.speed, state.volume, processNextInQueue]);

  // Fonction principale pour jouer
  const play = useCallback(async (text: string, options?: Partial<VoiceOptions>) => {
    if (options) {
      setState(prev => ({ ...prev, ...options }));
    }
    
    queueRef.current.push(text);
    setState(prev => ({ ...prev, queue: [...queueRef.current] }));
    
    if (!processingRef.current && !state.isPlaying) {
      processNextInQueue();
    }
  }, [state.isPlaying, processNextInQueue]);

  const pause = useCallback(() => {
    if (audioRef.current && state.isPlaying) {
      audioRef.current.pause();
    }
  }, [state.isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && state.isPaused) {
      audioRef.current.play().catch(console.error);
    }
  }, [state.isPaused]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
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

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setState(prev => ({ ...prev, queue: [] }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
    setState(prev => ({ ...prev, volume }));
  }, []);

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