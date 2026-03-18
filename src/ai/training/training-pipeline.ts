/**
 * @fileOverview TrainingPipeline - Orchestration du cycle ML complet Elite 32.
 */

import { DataCollector } from './data-collector';
import { DataPreparer } from './data-preparer';
import { ModelTrainer } from './model-trainer';
import { ModelEvaluator } from './model-evaluator';
import { modelRegistry } from './model-registry';

export class TrainingPipeline {
  private collector = new DataCollector();
  private preparer = new DataPreparer();
  private trainer = new ModelTrainer();
  private evaluator = new ModelEvaluator();

  /**
   * Exécute un cycle complet d'entraînement et de déploiement.
   */
  async runFullCycle(context: { memory: any[], documents: any[] }): Promise<any> {
    console.log("🎯 [AI][TRAINING] Démarrage du cycle d'optimisation ML...");

    try {
      // 1. COLLECTE
      const rawData = await this.collector.collectFromAllPhases(context);
      if (rawData.length < 5) {
        return { status: 'skipped', reason: 'Pas assez de données pour un cycle ML.' };
      }

      // 2. PRÉPARATION
      const dataset = await this.preparer.prepare(rawData);

      // 3. ENTRAÎNEMENT
      const result = await this.trainer.train(dataset);

      // 4. ÉVALUATION
      const evaluation = await this.evaluator.evaluate(result.modelPath, dataset.test);

      // 5. DÉCISION & DÉPLOIEMENT
      const deployed = await modelRegistry.registerAndDeploy(result.modelPath, evaluation.accuracy);

      return {
        status: 'completed',
        newModel: result.modelPath,
        accuracy: evaluation.accuracy,
        deployed,
        gain: evaluation.improvement
      };
    } catch (error) {
      console.error("[AI][TRAINING] Échec du cycle ML :", error);
      throw error;
    }
  }
}

export const trainingPipeline = new TrainingPipeline();
