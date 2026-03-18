/**
 * @fileOverview ModelRegistry - Gestion des versions de modèles et déploiement.
 */

export interface ModelVersion {
  id: string;
  path: string;
  accuracy: number;
  status: 'production' | 'backup' | 'candidate';
  deployedAt?: number;
}

export class ModelRegistry {
  private versions: ModelVersion[] = [
    { id: 'v1-base', path: 'ollama/phi3:mini', accuracy: 0.72, status: 'production' }
  ];

  /**
   * Enregistre un nouveau modèle et gère le basculement si nécessaire.
   */
  async registerAndDeploy(path: string, accuracy: number): Promise<boolean> {
    const newVersion: ModelVersion = {
      id: `v${this.versions.length + 1}-${Math.random().toString(36).substring(7)}`,
      path,
      accuracy,
      status: 'candidate'
    };

    const currentProd = this.versions.find(v => v.status === 'production');
    
    if (!currentProd || accuracy > currentProd.accuracy) {
      console.log(`[AI][REGISTRY] Déploiement du nouveau modèle : ${newVersion.id}`);
      if (currentProd) currentProd.status = 'backup';
      newVersion.status = 'production';
      newVersion.deployedAt = Date.now();
      this.versions.push(newVersion);
      return true;
    }

    console.log(`[AI][REGISTRY] Nouveau modèle moins performant, archivé en candidat.`);
    this.versions.push(newVersion);
    return false;
  }

  getCurrentModel(): ModelVersion {
    return this.versions.find(v => v.status === 'production') || this.versions[0];
  }
}

export const modelRegistry = new ModelRegistry();
