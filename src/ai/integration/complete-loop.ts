'use server';
/**
 * @fileOverview Elite 32 - Orchestrateur RAG Enhancée (Version Finale).
 * Unifie les 4 phases : Comprendre -> Raisonner -> Agir -> Apprendre.
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
}

export interface LoopResult {
  answer: string;
  confidence: number;
  disclaimer?: string;
  sources: any[];
  newMemoryEpisode: any;
}

/**
 * Exécute la boucle RAG Enhancée complète.
 */
export async function runCompleteEliteLoop(interaction: LoopInteraction): Promise<LoopResult> {
  console.log(`[AI][ENHANCED-RAG] Cycle 4-Phases démarré pour: ${interaction.query.substring(0, 30)}...`);

  // --- PHASE 1: COMPRENDRE (Retriever Intelligent & Query Analyzer) ---
  const retrievalResult = await retrieveContext(interaction.query, interaction.userId);
  const queryAnalysis = retrievalResult.analysis;

  // --- PHASE 2: RAISONNER (Context Assembler & Metacognition) ---
  const assembledContext = await assembleContext(retrievalResult);
  
  // Utilisation de la méta-cognition pour valider si le contexte permet de répondre
  const metaResult = await metacognitiveReasoner.reason(
    interaction.query,
    assembledContext.text,
    async (q, ctx) => {
      // --- PHASE 3: AGIR (Génération LLM Locale) ---
      const llmResponse = await generateLLMResponse(q, {
        ...assembledContext,
        text: ctx 
      });
      return llmResponse.text;
    }
  );

  // Anticipation d'action
  await agirVector(interaction.query, { mode: 'standard' });

  // --- PHASE 4: APPRENDRE (Learning Loop & Vectorisation) ---
  await apprendreVector(interaction.query, metaResult.answer, metaResult.confidence);
  
  // Enregistrement dans la boucle d'apprentissage RAG spécifique
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

  // Création de l'épisode de mémoire
  const newMemoryEpisode = {
    type: 'interaction',
    content: metaResult.answer.substring(0, 500),
    context: interaction.query,
    importance: metaResult.confidence,
    timestamp: Date.now(),
    tags: queryAnalysis.concepts
  };

  console.log(`[AI][ENHANCED-RAG] Cycle terminé avec succès. Confiance: ${Math.round(metaResult.confidence * 100)}%`);

  return {
    answer: metaResult.answer,
    confidence: metaResult.confidence,
    disclaimer: metaResult.disclaimer,
    sources: assembledContext.sources,
    newMemoryEpisode
  };
}
