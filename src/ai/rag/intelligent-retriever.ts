'use server';
/**
 * @fileOverview Phase 1: COMPRENDRE - Retriever Intelligent Multi-Sources.
 */

import { analyzeQuery } from './query-analyzer';

export interface RetrievalResult {
  contexts: FusedResult[];
  totalCount: number;
  analysis: any;
  suggestions?: string[];
}

export interface FusedResult {
  content: string;
  source: 'document' | 'lesson' | 'interaction';
  score: number;
  weight: number;
  finalScore: number;
  metadata?: any;
}

/**
 * Exécute la Phase 1: Analyse sémantique et récupération multi-sources.
 */
export async function retrieveContext(query: string, userId: string = 'default-user'): Promise<RetrievalResult> {
  console.log(`[RAG][RETRIEVER][1/2] Analyse de la demande : "${query.substring(0, 50)}..."`);

  // 1. Analyser la requête
  const analysis = await analyzeQuery(query);
  
  // 2. Recherche multi-sources
  console.log(`[RAG][RETRIEVER][2/2] Activation du Retriever multi-sources (Docs + Leçons + Graphe)...`);
  const [docResults, lessonResults, interactionResults] = await Promise.all([
    searchDocuments(query, analysis),
    searchLessons(query, userId),
    searchPastInteractions(query, userId)
  ]);

  const fused = fuseResults([
    ...docResults,
    ...lessonResults,
    ...interactionResults
  ]);

  console.log(`[RAG][RETRIEVER][OK] ${fused.length} sources pertinentes identifiées.`);

  const suggestions = analysis.concepts.slice(0, 2).map((c: string) => `Plus d'infos sur ${c} ?`);

  return {
    contexts: fused,
    totalCount: fused.length,
    analysis,
    suggestions
  };
}

async function searchDocuments(query: string, analysis: any): Promise<FusedResult[]> {
  return [
    {
      content: `Extrait du manuel technique lié à ${analysis.concepts[0] || 'équipement'}.`,
      source: 'document',
      score: 0.92,
      weight: 0.8,
      finalScore: 0.92 * 0.8
    }
  ];
}

async function searchLessons(query: string, userId: string): Promise<FusedResult[]> {
  return [
    {
      content: `Leçon apprise : Toujours vérifier les seuils de pression avant démarrage.`,
      source: 'lesson',
      score: 0.85,
      weight: 0.6,
      finalScore: 0.85 * 0.6
    }
  ];
}

async function searchPastInteractions(query: string, userId: string): Promise<FusedResult[]> {
  return [
    {
      content: `Interaction réussie : L'opérateur a corrigé le flux via la vanne manuelle.`,
      source: 'interaction',
      score: 0.78,
      weight: 0.7,
      finalScore: 0.78 * 0.7
    }
  ];
}

function fuseResults(results: FusedResult[]): FusedResult[] {
  return results
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5);
}
