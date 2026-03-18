'use server';
/**
 * @fileOverview DailyLearningCycle - Orchestration du cycle d'apprentissage quotidien.
 * Intègre le seuil de déclenchement et le reporting final.
 */

import { runFullTrainingCycle } from './training-pipeline';

export interface DailyCycleResult {
  status: 'skipped' | 'completed' | 'failed';
  reason?: string;
  gain?: number;
  deployed?: boolean;
}

/**
 * Lance le cycle d'apprentissage quotidien basé sur les nouvelles données accumulées.
 */
export async function runDailyLearningCycle(context: { memory: any[], documents: any[] }): Promise<DailyCycleResult> {
  console.log("🌅 [AI][DAILY-LEARNING] Analyse des opportunités d'optimisation...");
  
  // Seuil minimum de données pour garantir un fine-tuning de qualité
  const MIN_SAMPLES = 50;
  
  if (context.memory.length < MIN_SAMPLES) {
    console.log(`📊 [AI][DAILY-LEARNING] Données insuffisantes (${context.memory.length}/${MIN_SAMPLES}). Cycle reporté.`);
    return { 
      status: 'skipped', 
      reason: `Besoin de ${MIN_SAMPLES - context.memory.length} exemples supplémentaires.` 
    };
  }

  try {
    const result = await runFullTrainingCycle(context);
    
    if (result.deployed) {
      console.log(`🚀 [AI][DAILY-LEARNING] Succès : Nouveau modèle actif (+${Math.round(result.gain * 100)}%).`);
    } else {
      console.log(`📉 [AI][DAILY-LEARNING] Cycle terminé : Le nouveau modèle n'a pas surpassé la production.`);
    }

    return {
      status: 'completed',
      gain: result.gain,
      deployed: result.deployed
    };
  } catch (error) {
    console.error("❌ [AI][DAILY-LEARNING] Échec critique du cycle ML :", error);
    return { status: 'failed', reason: "Erreur interne lors de l'entraînement." };
  }
}
