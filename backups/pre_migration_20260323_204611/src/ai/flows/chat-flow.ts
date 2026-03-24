/**
 * @fileOverview Elite 32 Orchestrator - Point d'entrée Chat (Version RAG Enhancée)
 * @version 3.0.0
 * @lastUpdated 2026-03-20
 */

import { z } from 'genkit';
import { runCompleteEliteLoop, runCompleteEliteLoopStream } from '@/ai/integration/complete-loop';
import { evaluatePedagogicalLevel } from '@/ai/learning/curriculum';
import { learnFromNetwork } from '@/ai/learning/collaborative-network';
import { personalizedRecommender } from '@/ai/ml/personalized-recommender';
import { SemanticCache } from '@/ai/semantic-cache';
import { generateMetaPrompt } from '@/ai/prompts/meta-prompt-generator';
import { validateResponseAgainstContext } from '@/ai/validation/context-validator';

// ============================================
// SCHÉMAS DE VALIDATION
// ============================================

const ChatInputSchema = z.object({
  text: z.string().min(1, "La question ne peut pas être vide"),
  history: z.array(z.any()).optional().default([]),
  documentContext: z.string().optional().default(""),
  episodicMemory: z.array(z.any()).optional().default([]),
  distilledRules: z.array(z.any()).optional().default([]),
  userProfile: z.object({
    id: z.string().optional().default("default-user"),
    expertise: z.enum(["débutant", "intermédiaire", "expert"]).optional().default("intermédiaire"),
    preferences: z.record(z.any()).optional().default({}),
    domain: z.string().optional().default("général")
  }).optional(),
  hierarchyNodes: z.array(z.any()).optional().default([]),
  strictness: z.number().min(0).max(1).optional().default(0.7),
  maxTokens: z.number().optional().default(1000),
  temperature: z.number().min(0).max(2).optional().default(0.3),
  responseFormat: z.enum(["détaillé", "concis", "technique", "pédagogique"]).optional().default("détaillé")
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    relevance: z.number(),
    excerpt: z.string().optional()
  })).optional().default([]),
  confidence: z.number().min(0).max(1).optional(),
  disclaimer: z.string().optional(),
  suggestions: z.array(z.string()).optional().default([]),
  recommendations: z.array(z.any()).optional().default([]),
  newMemoryEpisode: z.any().optional(),
  pedagogicalLevel: z.string().optional(),
  collaborativeInsight: z.string().optional(),
  processingTime: z.number().optional(),
  tokenUsage: z.object({
    prompt: z.number(),
    completion: z.number(),
    total: z.number()
  }).optional(),
  warnings: z.array(z.string()).optional().default([])
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// ============================================
// CACHE SÉMANTIQUE INTELLIGENT
// ============================================

const semanticCache = new SemanticCache({
  ttl: 3600,
  maxCacheSize: 1000,
  similarityThreshold: 0.85
});

// ============================================
// ORCHESTRATEUR PRINCIPAL
// ============================================

/**
 * Orchestrateur central Elite 32
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const startTime = Date.now();
  console.log(`[ELITE-32][START] Requête: "${input.text.substring(0, 50)}..."`);

  const computeAnswer = async (): Promise<ChatOutput> => {
    try {
      const [pedaLevel, collaborativeInsight] = await Promise.all([
        evaluatePedagogicalLevel(input.text, 0.7, input.history?.length || 0),
        learnFromNetwork(input.text)
      ]);

      const metaPrompt = generateMetaPrompt(input.text, {
        userExpertise: input.userProfile?.expertise,
        domain: input.userProfile?.domain,
        responseFormat: input.responseFormat,
        strictness: input.strictness,
        hasDocuments: !!input.documentContext
      });

      const loopResult = await runCompleteEliteLoop({
        userId: input.userProfile?.id || 'default-user',
        query: input.text,
        systemPrompt: metaPrompt,
        documentContext: input.documentContext || "",
        history: input.history || [],
        episodicMemory: input.episodicMemory || [],
        distilledRules: input.distilledRules || [],
        userProfile: input.userProfile || {
          id: 'default-user',
          expertise: 'intermédiaire',
          preferences: {},
          domain: 'général'
        },
        hierarchyNodes: input.hierarchyNodes || [],
        temperature: input.temperature,
        maxTokens: input.maxTokens
      });

      const validation = await validateResponseAgainstContext(
        loopResult.answer, 
        input.documentContext || ""
      );

      const recommendations = await personalizedRecommender.recommend(
        input.userProfile?.id || 'default-user',
        {
          domain: input.text.toLowerCase().includes('chaudière') ? 'Maintenance' : 'Général',
          limit: 2
        }
      );

      const processingTime = Date.now() - startTime;

      console.log(`[ELITE-32][SUCCESS] Confiance: ${Math.round(validation.relevanceScore * 100)}%, Temps: ${processingTime}ms`);

      return {
        answer: loopResult.answer,
        confidence: validation.relevanceScore,
        disclaimer: validation.relevanceScore < 0.5 
          ? "⚠️ Réponse avec fiabilité limitée"
          : undefined,
        sources: loopResult.sources?.map((s: any) => ({
          id: s.id || 'unknown',
          title: s.title || "Document source",
          relevance: s.relevance || 0.8,
          excerpt: s.excerpt
        })) || [],
        warnings: validation.hasHallucinations ? ["⚠️ Risque d'hallucination détecté"] : [],
        suggestions: recommendations.map((r: any) => r.title || "Suggestion"),
        recommendations,
        newMemoryEpisode: loopResult.newMemoryEpisode,
        pedagogicalLevel: pedaLevel,
        collaborativeInsight,
        processingTime
      };
    } catch (error) {
      console.error('[ELITE-32][ERROR]', error);
      
      return {
        answer: "Désolé, une erreur technique est survenue.",
        confidence: 0.1,
        warnings: ["❌ Erreur système"],
        processingTime: Date.now() - startTime,
        sources: [],
        suggestions: [],
        recommendations: []
      };
    }
  };

  const cacheKey = `${input.text}:${input.documentContext?.substring(0, 100)}:${input.userProfile?.expertise || 'default'}`;
  
  const cached = await semanticCache.getOrCompute(cacheKey, async () => {
    const result = await computeAnswer();
    return JSON.stringify(result);
  });

  try {
    const parsed = JSON.parse(cached);
    if (!parsed.processingTime) {
      parsed.processingTime = 0;
      parsed.warnings = [...(parsed.warnings || []), "💡 Réponse du cache"];
    }
    return parsed;
  } catch {
    return { 
      answer: cached, 
      sources: [], 
      warnings: ["⚠️ Format non standard"],
      processingTime: Date.now() - startTime,
      suggestions: [],
      recommendations: []
    };
  }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

export async function clearCache(): Promise<void> {
  await semanticCache.clear();
}

export async function getCacheStats() {
  return semanticCache.getStats();
}

export async function chatSimple(query: string): Promise<string> {
  const result = await chat({
    text: query,
    history: [],
    documentContext: '',
    episodicMemory: [],
    distilledRules: [],
    userProfile: undefined,
    hierarchyNodes: [],
    strictness: 0.7,
    maxTokens: 1000,
    temperature: 0.3,
    responseFormat: 'détaillé'
  });
  return result.answer;
}

/**
 * Version streaming pour le client
 */
export async function* generateResponseStream(query: string, options: any = {}): AsyncIterable<string> {
  console.log(`[ELITE-32][STREAM] Nouvelle session pour: ${query.substring(0, 30)}...`);
  
  const input = {
    text: query,
    userProfile: options.userProfile || { id: 'default-user', expertise: 'intermédiaire' },
    history: options.history || []
  };

  const stream = runCompleteEliteLoopStream({
    query: query,
    userId: options.userProfile?.id || 'default-user',
    userProfile: options.userProfile || { id: 'default-user', expertise: 'intermédiaire' },
    history: options.history || [],
    documentContext: ""
  } as any);
  for await (const chunk of stream) {
    yield chunk;
  }
}