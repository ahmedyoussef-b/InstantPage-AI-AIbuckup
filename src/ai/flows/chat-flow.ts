'use server';
/**
 * @fileOverview Elite 32 Orchestrator - Le cerveau central d'AGENTIC.
 * Version AI Complete : Architecture intégrée via CompleteLearningLoop.
 * Intègre désormais les recommandations personnalisées basées sur le modèle ML local.
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
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
  confidence: z.number().optional(),
  disclaimer: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
  recommendations: z.array(z.any()).optional(), // Objets de recommandation complets (Elite 32)
  newMemoryEpisode: z.any().optional(),
  pedagogicalLevel: z.string().optional(),
  collaborativeInsight: z.string().optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Orchestrateur central Elite 32.
 * Utilise runCompleteEliteLoop pour unifier les 4 phases cognitives.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    // 1. Analyse pré-générative (Innovation 27 & 32)
    const pedaLevel = await evaluatePedagogicalLevel(input.text, 0.7, input.history?.length || 0);
    const collaborativeInsight = await learnFromNetwork(input.text);

    // 2. Exécution de la boucle complète intégrée (Elite 32 Core)
    const loopResult = await runCompleteEliteLoop({
      userId: 'default-user',
      query: input.text,
      documentContext: input.documentContext || "",
      history: input.history || [],
      episodicMemory: input.episodicMemory || [],
      distilledRules: input.distilledRules || [],
      userProfile: input.userProfile
    });

    // 3. Génération de recommandations personnalisées (Phase ML Inférence)
    // Utilise le profil utilisateur et le contexte pour suggérer proactivement
    const recommendations = await personalizedRecommender.recommend('default-user', {
      domain: input.text.toLowerCase().includes('chaudière') ? 'Maintenance' : 'Général',
      limit: 2
    });

    return {
      answer: loopResult.answer,
      confidence: loopResult.confidence,
      disclaimer: loopResult.disclaimer,
      newMemoryEpisode: loopResult.newMemoryEpisode,
      pedagogicalLevel: pedaLevel,
      collaborativeInsight,
      recommendations,
      suggestions: recommendations.map(r => r.title),
      sources: []
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
