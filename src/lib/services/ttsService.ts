// lib/services/ttsService.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import piperProvider from './ttsProviders/piperProvider';
import edgeProvider from './ttsProviders/edgeProvider';
import ttsCache from './ttsCache';
import { VoiceOptions, VoiceResponse, VoiceInfo } from '@/types/voice';

const execAsync = promisify(exec);

class TTSService {
  private providers: Record<string, any>;
  private defaultProvider: string;
  private fallbackProvider: string;
  private cache: typeof ttsCache;
  private voices: Record<string, any>;

  constructor() {
    this.providers = {
      piper: piperProvider,
      edge: edgeProvider
    };
    
    this.defaultProvider = process.env.TTS_DEFAULT_PROVIDER || 'piper';
    this.fallbackProvider = 'edge';
    this.cache = ttsCache;
    
    this.voices = {
      'fr-FR': {
        piper: {
          'female-1': 'fr_FR-siwis-medium',
          'male-1': 'fr_FR-mls-medium',
          'default': 'fr_FR-siwis-medium'
        },
        edge: {
          'female-1': 'fr-FR-DeniseNeural',
          'male-1': 'fr-FR-HenriNeural',
          'default': 'fr-FR-DeniseNeural'
        }
      },
      'en-US': {
        piper: {
          'female-1': 'en_US-lessac-medium',
          'male-1': 'en_US-ljspeech-medium',
          'default': 'en_US-lessac-medium'
        },
        edge: {
          'female-1': 'en-US-JennyNeural',
          'male-1': 'en-US-GuyNeural',
          'default': 'en-US-JennyNeural'
        }
      }
    };

    console.log('✅ Service TTS initialisé');
  }

  /**
   * Synthétiser un texte en audio
   */
  async synthesize(options: VoiceOptions): Promise<VoiceResponse> {
    console.log('🔊 Synthèse vocale:', options.text.substring(0, 50) + '...');
    
    const {
      text,
      provider = this.defaultProvider,
      voice = 'default',
      language = 'fr-FR',
      speed = 1.0,
      cache = true
    } = options;

    try {
      // Vérifier le cache
      const cacheKey = this.generateCacheKey(text, { provider, voice, language, speed });
      
      if (cache) {
        const cachedAudio = await this.cache.get(cacheKey);
        if (cachedAudio) {
          console.log('✅ Audio récupéré du cache');
          return {
            audio: cachedAudio.toString('base64'),
            format: 'mp3',
            duration: this.estimateDuration(text),
            fromCache: true
          };
        }
      }

      // Sélectionner le provider
      const ttsProvider = this.providers[provider] || this.providers[this.defaultProvider];
      
      if (!ttsProvider) {
        throw new Error(`Provider TTS non trouvé: ${provider}`);
      }

      // Obtenir le modèle de voix
      const voiceModel = this.getVoiceModel(language, provider, voice);
      
      console.log(`🔄 Provider: ${provider}, Voix: ${voiceModel}`);
      
      // Synthétiser
      const audioBuffer = await ttsProvider.synthesize(text, {
        voice: voiceModel,
        speed,
        language
      });

      // Sauvegarder dans le cache
      if (cache) {
        await this.cache.set(cacheKey, audioBuffer);
      }

      console.log(`✅ Synthèse réussie: ${audioBuffer.length} bytes`);
      
      return {
        audio: audioBuffer.toString('base64'),
        format: 'mp3',
        duration: this.estimateDuration(text),
        fromCache: false
      };

    } catch (error) {
      console.error('❌ Erreur synthèse:', error);
      
      // Fallback automatique
      if (provider !== this.fallbackProvider) {
        console.log(`🔄 Fallback vers ${this.fallbackProvider}`);
        return this.synthesize({ ...options, provider: this.fallbackProvider });
      }
      
      throw error;
    }
  }

  /**
   * Obtenir le modèle de voix
   */
  private getVoiceModel(language: string, provider: string, voiceType: string): string {
    return this.voices[language]?.[provider]?.[voiceType] || 
           this.voices[language]?.[provider]?.default ||
           this.voices['fr-FR'][provider]?.default;
  }

  /**
   * Générer clé de cache
   */
  private generateCacheKey(text: string, options: any): string {
    const data = `${text}-${JSON.stringify(options)}`;
    return crypto.createHash('md5').update(data).digest('hex') + '.mp3';
  }

  /**
   * Estimer la durée audio (approximatif)
   */
  private estimateDuration(text: string): number {
    // ~150 mots par minute, ~5 caractères par mot
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / 150 * 60);
  }

  /**
   * Lister les voix disponibles
   */
  async listVoices(): Promise<VoiceInfo[]> {
    const voices: VoiceInfo[] = [];
    
    for (const [lang, langData] of Object.entries(this.voices)) {
      for (const [provider, providerVoices] of Object.entries(langData as any)) {
        for (const [voiceId, modelName] of Object.entries(providerVoices)) {
          if (voiceId !== 'default') {
            voices.push({
              id: `${provider}-${lang}-${voiceId}`,
              name: modelName as string,
              language: lang,
              gender: voiceId.includes('female') ? 'female' : 'male',
              provider
            });
          }
        }
      }
    }
    
    return voices;
  }

  /**
   * Vérifier la santé des providers
   */
  async checkHealth(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        status[name] = await provider.checkHealth();
      } catch {
        status[name] = false;
      }
    }
    
    return status;
  }
}

export default new TTSService();