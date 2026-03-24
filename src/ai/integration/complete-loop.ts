'use server';
/**
 * @fileOverview Elite 32 - Orchestrateur RAG Enhancée (Version Finale).
 */

import { retrieveContext } from '@/ai/rag/intelligent-retriever';
import { assembleContext } from '@/ai/rag/context-assembler';
import { generateLLMResponse } from '@/ai/rag/local-llm';
import { learnFromRAGInteraction } from '@/ai/rag/rag-learning-loop';
import { metacognitiveReasoner } from '@/ai/reasoning/metacognition';
import { agirVector } from './phase3-vector';
import { apprendreVector } from './phase4-vector';

export interface LoopInteraction {
  userId: string;
  query: string;
  documentContext: string;
  history: any[];
  episodicMemory: any[];
  distilledRules: any[];
  userProfile?: any;
  hierarchyNodes?: any[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LoopResult {
  answer: string;
  confidence: number;
  disclaimer?: string;
  sources: any[];
  newMemoryEpisode: any;
  tokenUsage?: any;
}

/**
 * Exécute la boucle RAG Enhancée complète.
 */
export async function runCompleteEliteLoop(interaction: LoopInteraction): Promise<LoopResult> {
  const cycleId = Math.random().toString(36).substring(7);
  console.log(`[ELITE-LOOP][CYCLE][START] Cycle ID: ${cycleId} | Requête: "${interaction.query.substring(0, 30)}..."`);

  // --- PHASE 1: COMPRENDRE ---
  const retrievalResult = await retrieveContext(interaction.query, interaction.userId);

  // --- PHASE 2: RAISONNER ---
  const assembledContext = await assembleContext(retrievalResult);
  
  // Raisonnement métacognitif
  console.log(`[ELITE-LOOP][METACOGNITION] Auto-évaluation de la capacité à répondre...`);
  const metaResult = await metacognitiveReasoner.reason(
    interaction.query,
    assembledContext.text,
    async (q, ctx) => {
      // --- PHASE 3: AGIR ---
      const llmResponse = await generateLLMResponse(q, {
        ...assembledContext,
        text: ctx 
      });
      return llmResponse.text;
    }
  );

  // --- PHASE 4: APPRENDRE ---
  console.log(`[ELITE-LOOP][LEARNING] Consolidation et ré-indexation de l'interaction...`);
  await apprendreVector(interaction.query, metaResult.answer, metaResult.confidence);
  
  await learnFromRAGInteraction(
    {
      query: interaction.query,
      response: metaResult.answer,
      context: assembledContext.text,
      usedContexts: retrievalResult.contexts
    },
    {
      rating: metaResult.confidence > 0.7 ? 4 : 3,
      successfulSources: assembledContext.sources.map(s => s.source)
    }
  );

  const newMemoryEpisode = {
    type: 'interaction',
    content: metaResult.answer.substring(0, 500),
    context: interaction.query,
    importance: metaResult.confidence,
    timestamp: Date.now(),
    tags: retrievalResult.analysis.concepts
  };

  console.log(`[ELITE-LOOP][CYCLE][FINISH] ID: ${cycleId} | Confiance finale: ${Math.round(metaResult.confidence * 100)}%`);

  return {
    answer: metaResult.answer,
    confidence: metaResult.confidence,
    disclaimer: metaResult.disclaimer,
    sources: assembledContext.sources,
    newMemoryEpisode
  };
}
