/**
 * @fileOverview DailyLearningCycle - Cycle d'apprentissage quotidien.
 */
import { runFullTrainingCycle } from './training-pipeline';
import { registerAndDeployModel } from './model-registry';

/**
 * Lance le cycle d'apprentissage quotidien.
 */
export async function runDailyLearningCycle(context: { memory: any[], documents: any[] }) {
  console.log("🌅 DÉMARRAGE DU CYCLE D'APPRENTISSAGE QUOTIDIEN");
  
  // 1. Si assez de données, lancer un entraînement
  if (context.memory.length > 50) {
    const evaluation = await runFullTrainingCycle(context);
    
    // 2. Si amélioration notable, le registry gère déjà le déploiement
    if (evaluation.deployed) {
      console.log(`🚀 Nouveau modèle déployé avec succès : Gain de ${Math.round(evaluation.gain * 100)}%`);
    }
  } else {
    console.log("📊 Données insuffisantes pour un cycle ML aujourd'hui.");
  }
  
  console.log("✨ CYCLE QUOTIDIEN TERMINÉ");
}
