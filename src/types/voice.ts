// types/voice.ts

export interface VoiceOptions {
    text: string;
    provider?: 'piper' | 'coqui' | 'edge';
    voice?: string;
    language?: string;
    speed?: number;
    cache?: boolean;
  }
  
  export interface VoiceResponse {
    audio: string; // Base64 ou URL
    format: 'mp3' | 'wav';
    duration: number;
    fromCache: boolean;
  }
  
  export interface VoiceProvider {
    name: string;
    synthesize: (text: string, options: any) => Promise<Buffer>;
    checkHealth: () => Promise<boolean>;
    getVoices: () => Promise<VoiceInfo[]>;
  }
  
  export interface VoiceInfo {
    id: string;
    name: string;
    language: string;
    gender: 'male' | 'female';
    provider: string;
  }
  
  export interface VoiceState {
    isPlaying: boolean;
    isPaused: boolean;
    currentText: string | null;
    queue: string[];
    volume: number;
    speed: number;
    provider: string;
    voice: string;
  }