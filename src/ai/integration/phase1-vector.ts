'use server';
/**
 * @fileOverview Phase1VectorIntegration - Innovation Elite 32.
 * Architecture de recherche vectorielle multidimensionnelle unifiée.
 * Connecte les 4 phases de l'IA à la Base Vectorielle Centrale.
 */

import { ai } from '@/ai/genkit';

export interface VectorSearchResult {
  collection: 'DOCUMENTS' | 'CONCEPTS' | 'LESSONS' | 'PATTERNS';
  content: string;
  score: number;
  metadata: any;
}

/**
 * Phase 1: COMPRENDRE - Interroge la base vectorielle centrale sur toutes ses strates.
 */
export async function comprendreVector(question: string, context: { 
  episodicMemory: any[], 
  distilledRules: any[],
  userProfile?: any 
}): Promise<VectorSearchResult[]> {
  console.log(`[AI][PHASE-1] Vectorisation profonde & Recherche multi-strates...`);

  // 1. Point d'ancrage sémantique (Embedding de la requête)
  const qEmbedding = await getEmbedding(question);
  
  // Dans un environnement de production, nous ferions une recherche vectorielle réelle (ex: ChromaDB)
  // Ici, nous simulons la recherche multi-strates sur les données contextualisées
  const results: VectorSearchResult[] = [];

  // Strate CONCEPTS: Règles techniques distillées (Innovation 28)
  context.distilledRules.forEach(rule => {
    results.push({
      collection: 'CONCEPTS',
      content: `Règle apprise : ${rule.instruction} (Domaine: ${rule.domain})`,
      score: 0.95,
      metadata: { type: 'rule', id: rule.id }
    });
  });

  // Strate LESSONS: Souvenirs d'interactions critiques (Innovation 25)
  context.episodicMemory.filter(e => e.importance > 0.7).slice(0, 3).forEach(epi => {
    results.push({
      collection: 'LESSONS',
      content: `Leçon retenue : Dans le contexte "${epi.context}", la réponse optimale était "${epi.content.substring(0, 100)}..."`,
      score: 0.88,
      metadata: { timestamp: epi.timestamp }
    });
  });

  // Strate PATTERNS: Préférences et styles (Innovation 26)
  if (context.userProfile) {
    results.push({
      collection: 'PATTERNS',
      content: `Style détecté : Préférence pour la ${context.userProfile.technicality > 0.7 ? 'haute technicité' : 'vulgarisation'} et la ${context.userProfile.conciseness > 0.7 ? 'brièveté' : 'pédagogie'}.`,
      score: 1.0,
      metadata: { source: 'RL_ENGINE' }
    });
  }

  return results;
}

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const result = await ai.embed({
      embedder: 'googleai/embedding-001',
      content: text,
    });
    return result;
  } catch (e) {
    console.warn("[AI][VECTOR] Service d'embedding indisponible, mode sémantique dégradé.");
    return null;
  }
}

/**
 * Formate le contexte vectoriel fusionné pour le prompt de génération.
 */
export async function formatVectorContext(results: VectorSearchResult[]): Promise<string> {
  if (results.length === 0) return "";
  
  let output = "\n--- CONTEXTE DE LA BASE VECTORIELLE CENTRALE ---\n";
  
  const collections = ['DOCUMENTS', 'CONCEPTS', 'LESSONS', 'PATTERNS'];
  
  collections.forEach(col => {
    const filtered = results.filter(r => r.collection === col);
    if (filtered.length > 0) {
      output += `[STRATE: ${col}]\n`;
      filtered.forEach(res => {
        output += `- ${res.content}\n`;
      });
    }
  });
  
  output += "------------------------------------------------\n";
  return output;
}
