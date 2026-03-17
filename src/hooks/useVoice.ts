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
  }, [state]);

  // Fallback vers Web Speech API (Browser)
  const playWithWebSpeech = (text: string, speed: number, volume: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.error("Web Speech API non supportée");
        resolve();
        return;
      }

      // Arrêter toute lecture en cours
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = speed;
      utterance.volume = volume;

      utterance.onstart = () => {
        setState(prev => ({ ...prev, isPlaying: true, currentText: text }));
      };

      utterance.onend = () => {
        setState(prev => ({ ...prev, isPlaying: false, currentText: null }));
        processNextInQueue();
        resolve();
      };

      utterance.onerror = (e) => {
        console.error("Erreur Web Speech API:", e);
        setState(prev => ({ ...prev, isPlaying: false, currentText: null }));
        processNextInQueue();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

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
        const errorData = await response.json().catch(() => ({}));
        console.warn(`[VOICE] Erreur serveur (${response.status}): ${errorData.error || 'Inconnu'}. Fallback Web Speech.`);
        await playWithWebSpeech(text, state.speed, state.volume);
        return;
      }

      const data: VoiceResponse = await response.json();
      
      if (audioRef.current && data.audio) {
        const mimeType = data.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
        const audioSrc = `data:${mimeType};base64,${data.audio}`;
        
        audioRef.current.src = audioSrc;
        audioRef.current.volume = state.volume;
        audioRef.current.playbackRate = 1.0; 
        
        await audioRef.current.play().catch(async (err) => {
          console.error("Erreur lecture Audio Element:", err);
          await playWithWebSpeech(text, state.speed, state.volume);
        });
        
        setState(prev => ({
          ...prev,
          isPlaying: true,
          currentText: text
        }));
      } else {
        await playWithWebSpeech(text, state.speed, state.volume);
      }
    } catch (error) {
      console.error('Erreur synthèse, passage au secours vocal:', error);
      await playWithWebSpeech(text, state.speed, state.volume);
    }
  }, [state]);

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
    } else if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    setState(prev => ({ ...prev, isPaused: true }));
  }, [state.isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && state.isPaused && audioRef.current.src) {
      audioRef.current.play().catch(console.error);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setState(prev => ({ ...prev, isPaused: false }));
  }, [state.isPaused]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
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
