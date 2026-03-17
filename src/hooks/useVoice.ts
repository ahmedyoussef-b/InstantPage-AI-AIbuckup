'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceOptions, VoiceResponse, VoiceState } from '@/types/voice';
import { cleanTextForTTS } from '@/lib/utils/textCleaner';

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
      console.warn('⚠️ Audio Element Error. Attempting fallback...');
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

  const processNextInQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) {
      return;
    }
    
    processingRef.current = true;
    const nextText = queueRef.current.shift();
    
    if (nextText) {
      try {
        await playText(nextText);
      } catch (error) {
        console.error('❌ Error processing queue:', error);
      }
    }
    
    processingRef.current = false;
  }, []);

  const playWithWebSpeech = useCallback((text: string, speed: number, volume: number): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn("⚠️ Web Speech API not supported");
        resolve();
        return;
      }

      const cleanText = cleanTextForTTS(text);
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'fr-FR';
      utterance.rate = speed;
      utterance.volume = volume;

      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find(v => v.lang.includes('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.onstart = () => {
        setState(prev => ({ ...prev, isPlaying: true, currentText: text }));
      };

      utterance.onend = () => {
        setState(prev => ({ ...prev, isPlaying: false, currentText: null }));
        processNextInQueue();
        resolve();
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') {
          console.error("❌ Web Speech API Error:", e.error);
        }
        setState(prev => ({ ...prev, isPlaying: false, currentText: null }));
        processNextInQueue();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [processNextInQueue]);

  const playText = useCallback(async (text: string) => {
    try {
      const cleanText = cleanTextForTTS(text);
      
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          provider: state.provider,
          voice: state.voice,
          speed: state.speed,
          cache: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Server synthesis failed');
      }

      const data: VoiceResponse = await response.json();
      
      if (audioRef.current && data.audio) {
        const mimeType = data.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
        const audioSrc = `data:${mimeType};base64,${data.audio}`;
        
        audioRef.current.src = audioSrc;
        audioRef.current.volume = state.volume;
        
        await audioRef.current.play();
        
        setState(prev => ({
          ...prev,
          isPlaying: true,
          currentText: text
        }));
      } else {
        await playWithWebSpeech(text, state.speed, state.volume);
      }
    } catch (error) {
      await playWithWebSpeech(text, state.speed, state.volume);
    }
  }, [state.provider, state.voice, state.speed, state.volume, playWithWebSpeech]);

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
    } else if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
    }
    setState(prev => ({ ...prev, isPaused: true }));
  }, [state.isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && state.isPaused && audioRef.current.src) {
      audioRef.current.play().catch(console.error);
    } else if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
    }
    setState(prev => ({ ...prev, isPaused: false }));
  }, [state.isPaused]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
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
    const safeVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = safeVolume;
    }
    setState(prev => ({ ...prev, volume: safeVolume }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    const safeSpeed = Math.max(0.5, Math.min(2, speed));
    setState(prev => ({ ...prev, speed: safeSpeed }));
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
