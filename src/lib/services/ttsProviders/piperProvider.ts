// lib/services/ttsProviders/piperProvider.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

class PiperProvider {
  name = 'piper';
  private modelsPath: string;
  private tempPath: string;

  constructor() {
    this.modelsPath = path.join(process.cwd(), 'data/tts/models');
    this.tempPath = path.join(process.cwd(), 'data/tts/temp');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.modelsPath, this.tempPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Vérifier si Piper est disponible
   */
  async checkHealth(): Promise<boolean> {
    try {
      await execAsync('piper --help');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtenir les voix disponibles
   */
  async getVoices(): Promise<string[]> {
    const files = await fs.promises.readdir(this.modelsPath);
    return files
      .filter(f => f.endsWith('.onnx'))
      .map(f => f.replace('.onnx', ''));
  }

  /**
   * Synthétiser le texte
   */
  async synthesize(text: string, options: {
    voice: string;
    speed?: number;
  }): Promise<Buffer> {
    const { voice, speed = 1.0 } = options;
    
    // Chemin du modèle
    const modelPath = path.join(this.modelsPath, `${voice}.onnx`);
    const configPath = path.join(this.modelsPath, `${voice}.json`);
    
    // Vérifier si le modèle existe
    if (!fs.existsSync(modelPath)) {
      await this.downloadModel(voice);
    }

    // Fichier temporaire pour la sortie
    const outputPath = path.join(this.tempPath, `${crypto.randomUUID()}.wav`);
    
    try {
      // Exécuter Piper
      const command = `echo "${text}" | piper --model "${modelPath}" --config "${configPath}" --output-file "${outputPath}"`;
      
      if (speed !== 1.0) {
        // Ajuster la vitesse avec sox si disponible
        await execAsync(command);
        const speededPath = path.join(this.tempPath, `${crypto.randomUUID()}.wav`);
        await execAsync(`sox "${outputPath}" "${speededPath}" speed ${speed}`);
        const audio = await fs.promises.readFile(speededPath);
        await fs.promises.unlink(speededPath).catch(() => {});
        return audio;
      } else {
        await execAsync(command);
        return await fs.promises.readFile(outputPath);
      }
    } finally {
      // Nettoyer
      await fs.promises.unlink(outputPath).catch(() => {});
    }
  }

  /**
   * Télécharger un modèle
   */
  private async downloadModel(voice: string): Promise<void> {
    console.log(`📥 Téléchargement du modèle Piper: ${voice}`);
    
    const modelPath = path.join(this.modelsPath, `${voice}.onnx`);
    const configPath = path.join(this.modelsPath, `${voice}.json`);
    
    // URLs des modèles Piper
    const baseUrl = 'https://huggingface.co/rhasspy/piper-voices/resolve/main';
    const modelUrl = `${baseUrl}/${voice.replace(/-/g, '/')}/${voice}.onnx`;
    const configUrl = `${baseUrl}/${voice.replace(/-/g, '/')}/${voice}.json`;
    
    // Télécharger avec fetch
    const modelResponse = await fetch(modelUrl);
    const modelBuffer = Buffer.from(await modelResponse.arrayBuffer());
    await fs.promises.writeFile(modelPath, modelBuffer);
    
    const configResponse = await fetch(configUrl);
    const configBuffer = Buffer.from(await configResponse.arrayBuffer());
    await fs.promises.writeFile(configPath, configBuffer);
    
    console.log(`✅ Modèle téléchargé: ${voice}`);
  }
}

export default new PiperProvider();