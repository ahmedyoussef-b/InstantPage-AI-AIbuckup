// lib/services/sttProviders/voskProvider.ts
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as vosk from 'vosk';
import { Readable } from 'stream';
import { STTOptions, STTResult } from '@/types/voice';

const execAsync = promisify(exec);

class VoskProvider {
  private model: any = null;
  private recognizer: any = null;
  private isListeningFlag: boolean = false;
  private modelPath: string;
  private initialized: boolean = false;
  private currentVolume: number = 0;

  constructor() {
    // Chemin du modèle Vosk
    this.modelPath = path.join(process.cwd(), 'public/models/vosk-model-small-fr-0.22');
    
    // Configuration Vosk
    vosk.setLogLevel(-1); // Désactiver les logs Vosk
  }

  /**
   * Vérifier si le provider est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Vérifier si le dossier modèle existe
      await fs.access(this.modelPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Vérifier si initialisé
   */
  async isInitialized(): Promise<boolean> {
    return this.initialized;
  }

  /**
   * Vérifier si en cours d'écoute
   */
  async isListening(): Promise<boolean> {
    return this.isListeningFlag;
  }

  /**
   * Initialiser le modèle Vosk
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initialisation Vosk...');
      
      // Vérifier que le modèle existe
      await fs.access(this.modelPath);
      
      // Charger le modèle
      this.model = new vosk.Model(this.modelPath);
      this.initialized = true;
      
      console.log('✅ Vosk initialisé');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur initialisation Vosk:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Démarrer l'écoute
   */
  async startListening(
    options: STTOptions,
    onResult: (result: STTResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      if (!this.initialized) {
        throw new Error('Vosk non initialisé');
      }

      // Configuration du recognizer
      const sampleRate = 16000;
      this.recognizer = new vosk.Recognizer({ 
        model: this.model, 
        sampleRate,
        grammar: options.grammar || []
      });

      this.isListeningFlag = true;

      // Simuler l'écoute (en réalité, on recevra l'audio du navigateur)
      console.log('🎤 Écoute Vosk démarrée');

      // Note: L'audio est capturé côté client et envoyé via WebSocket
      // Cette fonction sera appelée avec des chunks audio

    } catch (error) {
      this.isListeningFlag = false;
      onError(error instanceof Error ? error.message : 'Erreur Vosk');
    }
  }

  /**
   * Traiter un chunk audio (appelé depuis le client)
   */
  async processAudioChunk(chunk: Buffer): Promise<Partial<STTResult> | null> {
    if (!this.recognizer || !this.isListeningFlag) {
      return null;
    }

    try {
      // Calculer le volume pour visualisation
      this.currentVolume = this.calculateVolume(chunk);

      // Accepter le chunk audio
      if (this.recognizer.acceptWaveform(chunk)) {
        const result = JSON.parse(this.recognizer.result());
        
        if (result.text) {
          return {
            text: result.text,
            isFinal: true,
            confidence: result.confidence
          };
        }
      } else {
        const partial = this.recognizer.partialResult();
        const partialObj = JSON.parse(partial);
        
        if (partialObj.partial) {
          return {
            text: partialObj.partial,
            isFinal: false
          };
        }
      }
    } catch (error) {
      console.error('Erreur traitement audio:', error);
    }

    return null;
  }

  /**
   * Arrêter l'écoute
   */
  async stopListening(): Promise<string> {
    this.isListeningFlag = false;
    
    if (this.recognizer) {
      const finalResult = JSON.parse(this.recognizer.finalResult());
      this.recognizer.free();
      this.recognizer = null;
      this.currentVolume = 0;
      
      return finalResult.text || '';
    }
    
    return '';
  }

  /**
   * Transcrire un fichier audio complet
   */
  async transcribeFile(audioBuffer: Buffer, options: STTOptions): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const recognizer = new vosk.Recognizer({ 
      model: this.model, 
      sampleRate: 16000 
    });

    let fullText = '';

    // Traiter par chunks
    const chunkSize = 8000;
    for (let i = 0; i < audioBuffer.length; i += chunkSize) {
      const chunk = audioBuffer.slice(i, i + chunkSize);
      
      if (recognizer.acceptWaveform(chunk)) {
        const result = JSON.parse(recognizer.result());
        if (result.text) {
          fullText += (fullText ? ' ' : '') + result.text;
        }
      }
    }

    // Résultat final
    const finalResult = JSON.parse(recognizer.finalResult());
    if (finalResult.text) {
      fullText += (fullText ? ' ' : '') + finalResult.text;
    }

    recognizer.free();
    
    return fullText;
  }

  /**
   * Calculer le volume audio (pour visualisation)
   */
  private calculateVolume(buffer: Buffer): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i);
      sum += Math.abs(sample);
    }
    return Math.min(1, sum / (buffer.length * 32768));
  }

  /**
   * Obtenir le volume actuel
   */
  getCurrentVolume(): number {
    return this.currentVolume;
  }
}

export default new VoskProvider();