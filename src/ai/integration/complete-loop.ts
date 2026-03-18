'use server';
/**
 * @fileOverview CompleteLearningLoop - Innovation Elite 32.
 * Orchestration unifiée de la boucle cognitive liée à la base vectorielle centrale.
 * Comprendre (Phase 1) -> Anticiper (Phase 3) -> Raisonner (Phase 2) -> Apprendre (Phase 4).
 */

import { comprendreVector, formatVectorContext } from './phase1-vector';
import { raisonnerVector } from './phase2-vector';
import { agirVector, formatActionInsight } from './phase3-vector';
import { apprendreVector } from './phase4-vector';
import { metacognitiveReasoner } from '@/ai/reasoning/metacognition';

export interface LoopInteraction {
  userId: string;
  query: string;
  documentContext: string;
  history: any[];
  episodicMemory: any[];
  distilledRules: any[];
  userProfile?: any;
  hierarchyNodes?: any[];
}

export interface LoopResult {
  answer: string;
  confidence: number;
  disclaimer?: string;
  lessons: any[];
  actionInsight: any;
  newMemoryEpisode: any;
}

/**
 * Exécute la boucle cognitive complète Elite 32.
 * Cette fonction lie dynamiquement l'apprentissage passé à la génération actuelle via la vectorisation.
 */
export async function runCompleteEliteLoop(interaction: LoopInteraction): Promise<LoopResult> {
  console.log(`[AI][ELITE-LOOP] Traitement symbiotique (Boucle + Vectorisation) pour : ${interaction.userId}`);

  // 1. PHASE 1: COMPRENDRE (Recherche Multi-Strates)
  // On récupère les documents, mais aussi les leçons et patterns appris au fil du temps
  const vectorInsights = await comprendreVector(interaction.query, {
    episodicMemory: interaction.episodicMemory,
    distilledRules: interaction.distilledRules,
    userProfile: interaction.userProfile,
    hierarchyNodes: interaction.hierarchyNodes
  });
  
  let enrichedContext = interaction.documentContext;
  enrichedContext += await formatVectorContext(vectorInsights);

  // 2. PHASE 3: AGIR (Anticipation par Patterns)
  // Avant de raisonner, on vérifie si un schéma d'exécution réussi existe déjà dans la base vectorielle
  const actionInsight = await agirVector(interaction.query, { mode: 'standard' });
  if (actionInsight) {
    enrichedContext += await formatActionInsight(actionInsight);
  }

  // 3. PHASE 2: RAISONNER (Analogie & Méta-cognition)
  // On utilise les succès de réflexion passés pour guider la nouvelle réponse
  const metaResult = await metacognitiveReasoner.reason(
    interaction.query, 
    enrichedContext, 
    async (q, ctx) => {
      // Tentative de raisonnement par analogie vectorielle (Innovation 12)
      const analogy = await raisonnerVector(q, ctx, []); 
      if (analogy) return analogy;
      
      // Fallback vers le moteur modulaire
      const { modularReasoner } = await import('@/ai/reasoning/modular');
      return await modularReasoner.reason(q, ctx);
    }
  );

  // 4. PHASE 4: APPRENDRE (Extraction et Vectorisation immédiate)
  // L'IA apprend de sa propre réponse et la rend indexable pour le futur
  const lessons = await apprendreVector(interaction.query, metaResult.answer, metaResult.confidence);

  // Préparation du nouvel épisode de mémoire pour persistence VFS
  const newMemoryEpisode = {
    type: 'interaction',
    content: metaResult.answer.substring(0, 500),
    context: interaction.query,
    importance: metaResult.confidence,
    timestamp: Date.now(),
    tags: lessons.map(l => l.content.substring(0, 20))
  };

  return {
    answer: metaResult.answer,
    confidence: metaResult.confidence,
    disclaimer: metaResult.disclaimer,
    lessons,
    actionInsight,
    newMemoryEpisode
  };
}
