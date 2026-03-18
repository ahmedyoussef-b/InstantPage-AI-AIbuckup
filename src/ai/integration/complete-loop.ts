'use server';
/**
 * @fileOverview CompleteLearningLoop - Innovation Elite 32.
 * Orchestration unifiée de la boucle cognitive liée à la base vectorielle.
 * Next.js 15 Compliant: Uniquement des fonctions asynchrones exportées.
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
 * Comprendre (Phase 1) -> Raisonner (Phase 2) -> Agir (Phase 3) -> Apprendre (Phase 4).
 */
export async function runCompleteEliteLoop(interaction: LoopInteraction): Promise<LoopResult> {
  console.log(`[AI][ELITE-LOOP] Traitement de l'interaction pour l'utilisateur : ${interaction.userId}`);

  // 1. PHASE 1: COMPRENDRE (Contexte Vectoriel Multi-Strates)
  const vectorInsights = await comprendreVector(interaction.query, {
    episodicMemory: interaction.episodicMemory,
    distilledRules: interaction.distilledRules,
    userProfile: interaction.userProfile
  });
  
  let enrichedContext = interaction.documentContext;
  enrichedContext += await formatVectorContext(vectorInsights);

  // 2. PHASE 3: AGIR (Anticipation basée sur patterns vectoriels d'action)
  const actionInsight = await agirVector(interaction.query, { mode: 'standard' });
  if (actionInsight) {
    enrichedContext += await formatActionInsight(actionInsight);
  }

  // 3. PHASE 2: RAISONNER (Méta-cognition guidée par analogies)
  const metaResult = await metacognitiveReasoner.reason(
    interaction.query, 
    enrichedContext, 
    async (q, ctx) => {
      // Tentative de raisonnement par analogie vectorielle
      const analogy = await raisonnerVector(q, ctx, []); 
      if (analogy) return analogy;
      
      // Fallback vers raisonnement modulaire standard
      const { modularReasoner } = await import('@/ai/reasoning/modular');
      return await modularReasoner.reason(q, ctx);
    }
  );

  // 4. PHASE 4: APPRENDRE (Extraction et Vectorisation dynamique)
  const lessons = await apprendreVector(interaction.query, metaResult.answer, metaResult.confidence);

  // Préparation du nouvel épisode de mémoire pour persistance client
  const newMemoryEpisode = {
    type: 'interaction',
    content: metaResult.answer.substring(0, 300),
    context: interaction.query,
    importance: metaResult.confidence,
    timestamp: Date.now(),
    tags: lessons.map(l => l.content.substring(0, 15))
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
