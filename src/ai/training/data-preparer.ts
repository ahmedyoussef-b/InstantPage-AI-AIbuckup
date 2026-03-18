/**
 * @fileOverview DataPreparer - Nettoyage et formatage des données pour le fine-tuning.
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

    // 1. Nettoyage et Formatage
    const examples: TrainingExample[] = rawData
      .filter(d => d.output.length > 20) // Supprimer les réponses trop courtes
      .map(d => this.formatExample(d));

    // 2. Augmentation (Simulation)
    const augmented = await this.augmentData(examples);

    // 3. Split Train/Test (80/20)
    const shuffled = augmented.sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * 0.8);

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
        instruction = "Corrige l'erreur technique suivante et fournis la réponse exacte.";
        weight = 2.0; // Donner plus de poids aux corrections
        break;
      case 'reasoning':
        instruction = "Explique le raisonnement technique étape par étape pour cette situation.";
        break;
      case 'comprehension':
        instruction = "Synthétise l'information technique extraite des documents fournis.";
        break;
      default:
        instruction = "Réponds avec précision à la demande de l'utilisateur.";
    }

    return {
      instruction,
      input: data.input,
      output: data.output,
      weight
    };
  }

  private async augmentData(examples: TrainingExample[]): Promise<TrainingExample[]> {
    // Dans un système réel, nous ferions de la paraphrase via LLM
    // Ici, nous simulons l'augmentation en doublant les exemples de correction
    const augmented = [...examples];
    examples.filter(e => e.weight > 1.5).forEach(e => augmented.push({ ...e, instruction: "Action corrective : " + e.instruction }));
    return augmented;
  }
}
