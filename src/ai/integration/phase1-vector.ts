'use server';
/**
 * @fileOverview Phase1VectorIntegration - Innovation Elite 32.
 * Architecture de recherche vectorielle multidimensionnelle.
 * Permet de récupérer le contexte technique, historique et comportemental.
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
 * C'est ici que s'opère la "fusion sémantique" entre les docs et le vécu de l'IA.
 */
export async function comprendreVector(question: string, context: { 
  episodicMemory: any[], 
  distilledRules: any[],
  userProfile?: any 
}): Promise<VectorSearchResult[]> {
  console.log(`[AI][PHASE-1] Fusion Sémantique : Documents + Interactions + Patterns...`);

  const results: VectorSearchResult[] = [];

  // STRATE CONCEPTS : Règles techniques et terminologies distillées (Evolution Day 30)
  context.distilledRules.forEach(rule => {
    results.push({
      collection: 'CONCEPTS',
      content: `Concept appris : ${rule.instruction} (Domaine: ${rule.domain})`,
      score: 0.95,
      metadata: { type: 'rule', id: rule.id }
    });
  });

  // STRATE LESSONS : Souvenirs d'interactions critiques (Anticipation de l'oubli)
  // On priorise les souvenirs qui ont une haute importance pour le contexte actuel
  const q = question.toLowerCase();
  context.episodicMemory
    .filter(e => e.importance > 0.6 && (q.includes(e.context.toLowerCase()) || e.content.toLowerCase().includes(q)))
    .slice(0, 3)
    .forEach(epi => {
      results.push({
        collection: 'LESSONS',
        content: `Rappel historique : Pour la question "${epi.context}", l'IA a conclu : "${epi.content.substring(0, 150)}..."`,
        score: 0.88,
        metadata: { timestamp: epi.timestamp }
      });
    });

  // STRATE PATTERNS : Préférences de l'utilisateur (Innovation 26)
  if (context.userProfile) {
    const p = context.userProfile;
    results.push({
      collection: 'PATTERNS',
      content: `Profil Utilisateur : Préférence pour ${p.technicality > 0.7 ? 'une expertise brute' : 'la vulgarisation'} et ${p.conciseness > 0.7 ? 'la brièveté' : 'la pédagogie détaillée'}.`,
      score: 1.0,
      metadata: { source: 'IMPLICIT_RL' }
    });
  }

  return results;
}

/**
 * Formate le contexte vectoriel fusionné pour le prompt de génération.
 */
export async function formatVectorContext(results: VectorSearchResult[]): Promise<string> {
  if (results.length === 0) return "";
  
  let output = "\n--- MÉMOIRE SÉMANTIQUE CENTRALE (ELITE 32) ---\n";
  
  const collections: ('DOCUMENTS' | 'CONCEPTS' | 'LESSONS' | 'PATTERNS')[] = ['CONCEPTS', 'LESSONS', 'PATTERNS'];
  
  collections.forEach(col => {
    const filtered = results.filter(r => r.collection === col);
    if (filtered.length > 0) {
      output += `[STRATE: ${col}]\n`;
      filtered.forEach(res => {
        output += `- ${res.content}\n`;
      });
    }
  });
  
  output += "----------------------------------------------\n";
  return output;
}
