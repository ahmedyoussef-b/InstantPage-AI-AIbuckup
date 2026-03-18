'use server';
/**
 * @fileOverview Elite 32 - Architecture RAG Enhancée.
 * Orchestration unifiée en 4 phases : Comprendre -> Raisonner -> Agir -> Apprendre.
 */

import { comprendreVector, formatVectorContext } from './phase1-vector';
import { raisonnerVector } from './phase2-vector';
import { agirVector, formatActionInsight } from './phase3-vector';
import { apprendreVector } from './phase4-vector';
import { metacognitiveReasoner } from '@/ai/reasoning/metacognition';
import { dynamicPromptEngine } from '@/ai/dynamic-prompt';

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
 * Exécute la boucle cognitive complète Elite 32 (Architecture RAG Enhancée).
 */
export async function runCompleteEliteLoop(interaction: LoopInteraction): Promise<LoopResult> {
  console.log(`[AI][ELITE-RAG] Démarrage du cycle 4-Phases pour: ${interaction.query.substring(0, 30)}...`);

  // --- PHASE 1: COMPRENDRE (Retriever Intelligent Multi-Sources) ---
  // On récupère les sources de savoir avec analyse sémantique initiale
  const vectorInsights = await comprendreVector(interaction.query, {
    episodicMemory: interaction.episodicMemory,
    distilledRules: interaction.distilledRules,
    userProfile: interaction.userProfile,
    hierarchyNodes: interaction.hierarchyNodes
  });
  
  // --- PHASE 2: RAISONNER (Context Assembler & Pondération) ---
  // Fusion pondérée : Documents (0.8), Interactions (0.7), Leçons (0.6)
  let weightedContext = interaction.documentContext; // Base document
  weightedContext += await formatVectorContext(vectorInsights);

  // Raisonnement par chaîne de pensée et analogies
  const metaResult = await metacognitiveReasoner.reason(
    interaction.query, 
    weightedContext, 
    async (q, ctx) => {
      // 1. Tentative d'analogie
      const analogy = await raisonnerVector(q, ctx, []); 
      if (analogy) return analogy;
      
      // 2. Fallback modulaire
      const { modularReasoner } = await import('@/ai/reasoning/modular');
      return await modularReasoner.reason(q, ctx);
    }
  );

  // --- PHASE 3: AGIR (Prompt Engineering Dynamique & LLM Local) ---
  // Construction du prompt final optimisé par type de question
  const finalPrompt = await dynamicPromptEngine.buildPrompt(interaction.query, metaResult.answer);
  
  // Anticipation d'action (Phase 3 Bonus)
  const actionInsight = await agirVector(interaction.query, { mode: 'standard' });

  // --- PHASE 4: APPRENDRE (Feedback & Vectorisation) ---
  // L'IA extrait les leçons pour enrichir la base de connaissances unifiée
  const lessons = await apprendreVector(interaction.query, metaResult.answer, metaResult.confidence);

  // Création de l'épisode de mémoire pour le futur cycle "Comprendre"
  const newMemoryEpisode = {
    type: 'interaction',
    content: metaResult.answer.substring(0, 500),
    context: interaction.query,
    importance: metaResult.confidence,
    timestamp: Date.now(),
    tags: lessons.map(l => l.content.substring(0, 20))
  };

  console.log(`[AI][ELITE-RAG] Cycle terminé. Confiance: ${Math.round(metaResult.confidence * 100)}%`);

  return {
    answer: metaResult.answer,
    confidence: metaResult.confidence,
    disclaimer: metaResult.disclaimer,
    lessons,
    actionInsight,
    newMemoryEpisode
  };
}
