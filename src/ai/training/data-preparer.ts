/**
 * @fileOverview DataPreparer - Nettoyage et formatage des données pour le fine-tuning.
 * Prépare le dataset final en appliquant des poids aux exemples critiques.
 */

import { RawTrainingData } from './data-collector';

export interface TrainingExample {
  instruction: string;
  input: string;
  output: string;
  weight: number;
}

export interface PreparedDataset {
  train: TrainingExample[];
  test: TrainingExample[];
}

export class DataPreparer {
  /**
   * Prépare le dataset final pour le processus d'entraînement.
   */
  async prepare(rawData: RawTrainingData[]): Promise<PreparedDataset> {
    console.log(`[AI][TRAINING-DATA] Préparation de ${rawData.length} exemples...`);

    // 1. Nettoyage et Filtrage
    // On retire les exemples trop courts ou sans valeur technique réelle
    const filtered = rawData.filter(d => 
      d.output.length > 25 && 
      d.input.length > 5
    );

    // 2. Formatage au format Instruction-Tuning
    const examples: TrainingExample[] = filtered.map(d => this.formatExample(d));

    // 3. Augmentation Sémantique (Simulation)
    // On renforce les corrections utilisateur pour qu'elles aient plus d'impact
    const augmented = await this.augmentData(examples);

    // 4. Split Train/Test (85/15) pour la validation locale
    const shuffled = augmented.sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * 0.85);

    console.log(`[AI][TRAINING-DATA] Dataset prêt : ${splitIndex} train, ${shuffled.length - splitIndex} test.`);

    return {
      train: shuffled.slice(0, splitIndex),
      test: shuffled.slice(splitIndex)
    };
  }

  private formatExample(data: RawTrainingData): TrainingExample {
    let instruction = "";
    let weight = 1.0;

    switch (data.type) {
      case 'correction':
        instruction = "Tu es un expert technique. Corrige l'erreur suivante et fournis la réponse exacte basée sur les manuels.";
        weight = 3.0; // Poids très élevé pour les corrections manuelles
        break;
      case 'reasoning':
        instruction = "Décompose ton raisonnement technique étape par étape pour résoudre cette problématique.";
        weight = 1.5;
        break;
      case 'comprehension':
        instruction = "Synthétise les points critiques de ce document technique de manière précise.";
        weight = 1.0;
        break;
      case 'action':
        instruction = "Détermine les paramètres d'exécution optimaux pour cet outil technique.";
        weight = 2.0;
        break;
      default:
        instruction = "Réponds avec expertise et précision à la demande technique suivante.";
    }

    return {
      instruction,
      input: data.input,
      output: data.output,
      weight
    };
  }

  /**
   * Simule l'augmentation de données par duplication des cas critiques (Oversampling).
   */
  private async augmentData(examples: TrainingExample[]): Promise<TrainingExample[]> {
    const augmented = [...examples];
    
    // On duplique les exemples de haute importance (corrections) pour forcer l'apprentissage
    examples.forEach(e => {
      if (e.weight >= 2.0) {
        // Ajout d'une variante avec une instruction légèrement différente
        augmented.push({
          ...e,
          instruction: "Action corrective impérative : " + e.instruction
        });
      }
    });

    return augmented;
  }
}

export const dataPreparer = new DataPreparer();
