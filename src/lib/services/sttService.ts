// lib/services/sttService.ts
import voskProvider from './sttProviders/voskProvider';
import webSpeechProvider from './sttProviders/webSpeechProvider';
import { STTOptions, STTResult } from '@/types/voice';

// 🔧 INTERFACE POUR LES PROVIDERS
interface STTProvider {
  initialize: () => Promise<boolean>;
  isInitialized: () => Promise<boolean>;
  isListening: () => Promise<boolean>;
  startListening: (options: STTOptions, onResult: (result: STTResult) => void, onError: (error: string) => void) => Promise<void>;
  stopListening: () => Promise<string>;
  transcribeFile: (audioBuffer: Buffer, options: STTOptions) => Promise<string>;
  isAvailable: () => Promise<boolean>;
  getCurrentVolume?: () => number;
}

class STTService {
  private providers: Record<string, STTProvider>;
  private defaultProvider: 'vosk' | 'webspeech';
  private fallbackProvider: 'vosk' | 'webspeech';

  constructor() {
    this.providers = {
      vosk: voskProvider,
      webspeech: webSpeechProvider
    };
    
    this.defaultProvider = 'vosk'; // Rapide et local
    this.fallbackProvider = 'webspeech'; // Fallback navigateur
    
    console.log('✅ Service STT initialisé');
  }

  /**
   * Initialiser la reconnaissance vocale
   */
  async initialize(provider: 'vosk' | 'webspeech' = this.defaultProvider): Promise<boolean> {
    try {
      const sttProvider = this.providers[provider];
      if (!sttProvider) {
        throw new Error(`Provider STT non trouvé: ${provider}`);
      }
      
      return await sttProvider.initialize();
    } catch (error) {
      console.error('❌ Erreur initialisation STT:', error);
      return false;
    }
  }

  /**
   * Démarrer l'écoute
   */
  async startListening(
    options: STTOptions = {},
    onResult: (result: STTResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    // ✅ Conversion sécurisée du type
    const provider = (options.model || this.defaultProvider) as 'vosk' | 'webspeech';
    
    try {
      const sttProvider = this.providers[provider];
      
      if (!sttProvider) {
        throw new Error(`Provider non trouvé: ${provider}`);
      }

      // Vérifier que le provider est initialisé
      if (!await sttProvider.isInitialized()) {
        const initialized = await sttProvider.initialize();
        if (!initialized) {
          throw new Error(`Impossible d'initialiser ${provider}`);
        }
      }

      // Démarrer l'écoute
      await sttProvider.startListening(options, onResult, onError);
      
    } catch (error) {
      console.error('❌ Erreur démarrage STT:', error);
      
      // Fallback automatique
      if (provider !== this.fallbackProvider) {
        console.log(`🔄 Fallback vers ${this.fallbackProvider}`);
        return this.startListening(
          { ...options, model: this.fallbackProvider },
          onResult,
          onError
        );
      }
      
      onError(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  }

  /**
   * Arrêter l'écoute
   */
  async stopListening(): Promise<string> {
    // Essayer tous les providers actifs
    for (const provider of Object.values(this.providers)) {
      if (provider.isListening && await provider.isListening()) {
        return await provider.stopListening();
      }
    }
    return '';
  }

  /**
   * Transcrire un fichier audio (mode batch)
   */
  async transcribeFile(audioBuffer: Buffer, options: STTOptions = {}): Promise<string> {
    // ✅ Conversion sécurisée du type
    const provider = (options.model || this.defaultProvider) as 'vosk' | 'webspeech';
    
    try {
      const sttProvider = this.providers[provider];
      return await sttProvider.transcribeFile(audioBuffer, options);
    } catch (error) {
      console.error('❌ Erreur transcription fichier:', error);
      throw error;
    }
  }

  /**
   * Vérifier la santé des providers
   */
  async checkHealth(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        status[name] = await provider.isAvailable();
      } catch {
        status[name] = false;
      }
    }
    
    return status;
  }

  /**
   * Obtenir le niveau sonore actuel (pour visualisation)
   */
  getCurrentVolume(): number {
    for (const provider of Object.values(this.providers)) {
      if (provider.getCurrentVolume) {
        const volume = provider.getCurrentVolume();
        if (volume > 0) return volume;
      }
    }
    return 0;
  }
}

export default new STTService();