'use server';
/**
 * @fileOverview Elite 32 Orchestrator - Point d'entrée Chat (Version RAG Enhancée).
 * Unifie l'accès au cerveau local via la boucle complète intégrée.
 */

import { z } from 'genkit';
import { runCompleteEliteLoop } from '@/ai/integration/complete-loop';
import { evaluatePedagogicalLevel } from '@/ai/learning/curriculum';
import { learnFromNetwork } from '@/ai/learning/collaborative-network';
import { semanticCache } from '@/ai/semantic-cache';
import { personalizedRecommender } from '@/ai/ml/personalized-recommender';

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(z.any()).optional(),
  documentContext: z.string().optional(),
  episodicMemory: z.array(z.any()).optional(),
  distilledRules: z.array(z.any()).optional(),
  userProfile: z.any().optional(),
  hierarchyNodes: z.array(z.any()).optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.any()).optional(),
  confidence: z.number().optional(),
  disclaimer: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
  recommendations: z.array(z.any()).optional(),
  newMemoryEpisode: z.any().optional(),
  pedagogicalLevel: z.string().optional(),
  collaborativeInsight: z.string().optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Orchestrateur central Elite 32 utilisant le RAG Enhancé.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    // 1. Analyse pré-générative (Innovation 27 & 32)
    const pedaLevel = await evaluatePedagogicalLevel(input.text, 0.7, input.history?.length || 0);
    const collaborativeInsight = await learnFromNetwork(input.text);

    // 2. Exécution de la boucle complète RAG Enhancée
    const loopResult = await runCompleteEliteLoop({
      userId: 'default-user',
      query: input.text,
      documentContext: input.documentContext || "",
      history: input.history || [],
      episodicMemory: input.episodicMemory || [],
      distilledRules: input.distilledRules || [],
      userProfile: input.userProfile,
      hierarchyNodes: input.hierarchyNodes
    });

    // 3. Génération de recommandations personnalisées
    const recommendations = await personalizedRecommender.recommend('default-user', {
      domain: input.text.toLowerCase().includes('chaudière') ? 'Maintenance' : 'Général',
      limit: 2
    });

    return {
      answer: loopResult.answer,
      confidence: loopResult.confidence,
      disclaimer: loopResult.disclaimer,
      sources: loopResult.sources,
      newMemoryEpisode: loopResult.newMemoryEpisode,
      pedagogicalLevel: pedaLevel,
      collaborativeInsight,
      recommendations,
      suggestions: recommendations.map(r => r.title)
    };
  };

  // Cache sémantique pour optimiser la performance locale
  const cached = await semanticCache.getOrCompute(input.text, async () => {
    const res = await computeAnswer();
    return JSON.stringify(res);
  });

  try {
    return JSON.parse(cached);
  } catch {
    return { answer: cached, sources: [] };
  }
}
