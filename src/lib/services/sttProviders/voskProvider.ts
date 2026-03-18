// lib/services/sttProviders/voskProvider.ts
import { STTOptions, STTResult } from '@/types/voice';

/**
 * VoskProvider - Désactivé temporairement à cause des contraintes de compilation native (ffi-napi).
 * La logique est conservée pour réactivation future si l'environnement supporte Python/Node-Gyp.
 */
class VoskProvider {
  private initialized: boolean = false;
  private isListeningFlag: boolean = false;

  async isAvailable(): Promise<boolean> {
    return false; // Désactivé pour éviter les erreurs npm install
  }

  async isInitialized(): Promise<boolean> {
    return false;
  }

  async isListening(): Promise<boolean> {
    return false;
  }

  async initialize(): Promise<boolean> {
    console.warn('⚠️ VoskProvider est désactivé (problème de dépendances natives). Utilisation de WebSpeech.');
    return false;
  }

  async startListening(
    options: STTOptions,
    onResult: (result: STTResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    onError('Vosk non disponible');
  }

  async processAudioChunk(chunk: Buffer): Promise<Partial<STTResult> | null> {
    return null;
  }

  async stopListening(): Promise<string> {
    return '';
  }

  async transcribeFile(audioBuffer: Buffer, options: STTOptions): Promise<string> {
    throw new Error('Vosk non disponible pour la transcription');
  }

  getCurrentVolume(): number {
    return 0;
  }
}

export default new VoskProvider();