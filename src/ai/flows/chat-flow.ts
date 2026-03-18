'use server';
/**
 * @fileOverview Elite 32 Orchestrator - Le cerveau central d'AGENTIC.
 * Version AI Complete : Architecture intégrée 4 phases + Vectorisation Centrale.
 */

import { z } from 'genkit';
import { comprendreVector, formatVectorContext } from '@/ai/integration/phase1-vector';
import { raisonnerVector } from '@/ai/integration/phase2-vector';
import { metacognitiveReasoner } from '@/ai/reasoning/metacognition';
import { modularReasoner } from '@/ai/reasoning/modular';
import { latentTree } from '@/ai/reasoning/latent-tree';
import { contrastiveReasoning } from '@/ai/reasoning/contrastive';
import { type SolvedProblem } from '@/ai/reasoning/analogical';
import { undoLastAction } from '@/ai/actions/reversible-executor';
import { submitWorkflow } from '@/ai/actions/async-workflow';
import { evaluatePedagogicalLevel, getCurriculumDirective } from '@/ai/learning/curriculum';
import { learnFromNetwork } from '@/ai/learning/collaborative-network';
import { extractTaskFeatures, selectOptimalStrategy, getMetaLearningDirective } from '@/ai/learning/meta-learning';
import { semanticCache } from '@/ai/semantic-cache';

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(z.any()).optional(),
  documentContext: z.string().optional(),
  analogyMemory: z.array(z.any()).optional(),
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
  newMemoryEpisode: z.any().optional(),
  pedagogicalLevel: z.string().optional(),
  metaStrategy: z.string().optional(),
  asyncTaskId: z.string().optional(),
  collaborativeInsight: z.string().optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Orchestrateur central Elite 32.
 * Implémente la boucle : Comprendre -> Raisonner -> Agir -> Apprendre.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    let docContext = input.documentContext || "";
    
    // --- PHASE 1: COMPRENDRE (Understand) + VECTORISATION INTÉGRÉE ---
    const vectorInsights = await comprendreVector(input.text, {
      episodicMemory: input.episodicMemory || [],
      distilledRules: input.distilledRules || [],
      userProfile: input.userProfile
    });
    docContext += await formatVectorContext(vectorInsights);

    const taskFeatures = await extractTaskFeatures(input.text, docContext);
    const metaStrategy = await selectOptimalStrategy(taskFeatures);
    docContext += await getMetaLearningDirective(metaStrategy);

    const collaborativeInsight = await learnFromNetwork(input.text);
    if (collaborativeInsight) docContext += collaborativeInsight;

    const pedaLevel = await evaluatePedagogicalLevel(input.text, 0.7, input.history?.length || 0);
    docContext += await getCurriculumDirective(pedaLevel);

    // --- PHASE 3: AGIR (Act) - Commandes système & Workflows ---
    if (input.text.toLowerCase().match(/audit complet|analyse massive/i)) {
      const taskId = await submitWorkflow('ANALYSIS_HEAVY', input.text);
      return { answer: `🚀 **Workflow Asynchrone** lancé. ID : \`${taskId}\`.`, confidence: 1.0, asyncTaskId: taskId };
    }

    if (input.text.toLowerCase().match(/annuler|undo/i)) {
      const undoResult = await undoLastAction();
      return { answer: undoResult.message, confidence: 1.0 };
    }

    // --- PHASE 2: RAISONNER (Reason) - Intégration Vectorielle ---
    const standardGenerate = async (query: string, ctx: string): Promise<string> => {
      // 1. Analogie Vectorielle (Innovation 32 intégrée)
      const analogRes = await raisonnerVector(query, ctx, (input.analogyMemory || []) as SolvedProblem[]);
      if (analogRes) return analogRes;

      // 2. Contraste (Pour les comparaisons)
      if (query.match(/différence|versus|vs|comparer/i)) return await contrastiveReasoning.reason(query, ctx);
      
      // 3. Arbre Latent (Pour les décisions complexes)
      if (taskFeatures.ambiguity > 0.6) return await latentTree.reason(query, ctx);
      
      // 4. Modulaire (Défaut expert)
      return await modularReasoner.reason(query, ctx);
    };

    const metaResult = await metacognitiveReasoner.reason(input.text, docContext, standardGenerate);

    // --- PHASE 4: APPRENDRE (Learn) ---
    const newMemoryEpisode = {
      type: 'interaction',
      content: metaResult.answer.substring(0, 300),
      context: input.text,
      importance: metaResult.confidence,
      tags: [pedaLevel.toLowerCase(), metaStrategy.name.toLowerCase()]
    };

    return {
      answer: metaResult.answer,
      confidence: metaResult.confidence,
      disclaimer: metaResult.disclaimer,
      suggestions: metaResult.suggestions,
      newMemoryEpisode,
      pedagogicalLevel: pedaLevel,
      metaStrategy: metaStrategy.name,
      collaborativeInsight
    };
  };

  const cached = await semanticCache.getOrCompute(input.text, async () => {
    const res = await computeAnswer();
    return JSON.stringify(res);
  });

  try {
    const parsed = JSON.parse(cached);
    return { ...parsed, sources: [] };
  } catch {
    return { answer: cached, sources: [] };
  }
}
