'use server';
/**
 * @fileOverview SelfImprovingAI - Innovation Elite Finale.
 * Orchestre le cycle d'auto-amélioration nocturne : consolidation sémantique, 
 * distillation de connaissances et optimisation des stratégies.
 */

import { enrichDocumentContent, revectorizeContent } from '@/ai/vector/dynamic-revectorization';
import { detectCommunityPatterns } from '@/ai/learning/cross-user-learning';
import { extractHierarchicalConcepts } from '@/ai/learning/concept-hierarchy';
import { distillInteractions } from '@/ai/learning/knowledge-distillation';
import { extractTaskFeatures, selectOptimalStrategy } from '@/ai/learning/meta-learning';

export interface ImprovementResult {
  consolidatedDocs: number;
  newRules: number;
  communityPatterns: number;
  strategyOptimized: boolean;
  timestamp: number;
}

/**
 * Exécute le cycle complet d'auto-amélioration (Simulation nocturne).
 */
export async function runNighttimeImprovement(context: {
  documents: any[];
  memory: any[];
  currentRules: any[];
  instanceId: string;
}): Promise<ImprovementResult> {
  console.log("🌙 [AI][SELF-IMPROVEMENT] Lancement du cycle d'optimisation nocturne...");

  let consolidatedDocs = 0;
  let newRulesCount = 0;
  let communityPatternsCount = 0;

  // 1. PHASE 5.3: Re-vectorisation et enrichissement des documents
  for (const doc of context.documents) {
    if (doc.type === 'file') {
      const relatedMemory = context.memory.filter(e => 
        e.content.toLowerCase().includes(doc.name.toLowerCase())
      );
      
      if (relatedMemory.length > 0) {
        const { enhancedContent } = await enrichDocumentContent(doc.content, {
          corrections: [],
          relatedQueries: relatedMemory.map(m => m.context),
          lessons: relatedMemory.map(m => m.content)
        });
        await revectorizeContent(enhancedContent);
        consolidatedDocs++;
      }
    }
  }

  // 2. PHASE 32.2: Détection de patterns collectifs
  const newPatterns = await detectCommunityPatterns(context.memory);
  communityPatternsCount = newPatterns.length;

  // 3. PHASE 32.1: Mise à jour de la hiérarchie pour les nouveaux docs
  for (const doc of context.documents.slice(0, 3)) {
    await extractHierarchicalConcepts(doc.content);
  }

  // 4. PHASE 28: Distillation globale des interactions
  const distillation = await distillInteractions(context.memory);
  newRulesCount = distillation.rules.length;

  // 5. PHASE 31: Méta-optimisation de la stratégie
  if (context.memory.length > 0) {
    const lastTask = context.memory[0];
    const features = await extractTaskFeatures(lastTask.context, lastTask.content);
    await selectOptimalStrategy(features);
  }

  console.log("✨ [AI][SELF-IMPROVEMENT] Cycle terminé. AGENTIC est prêt pour demain.");

  return {
    consolidatedDocs,
    newRules: newRulesCount,
    communityPatterns: communityPatternsCount,
    strategyOptimized: true,
    timestamp: Date.now()
  };
}
