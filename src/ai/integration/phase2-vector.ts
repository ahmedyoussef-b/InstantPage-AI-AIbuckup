'use server';
/**
 * @fileOverview Phase2VectorIntegration - Innovation Elite 32.
 * Utilise la base vectorielle pour guider le raisonnement par analogie.
 */

import { ai } from '@/ai/genkit';
import { analogicalReasoner, type SolvedProblem } from '@/ai/reasoning/analogical';

/**
 * Phase 2: RAISONNER - Utilise des analogies vectorielles pour structurer la réflexion.
 */
export async function raisonnerVector(
  question: string, 
  context: string, 
  pastReasonings: SolvedProblem[]
): Promise<string | null> {
  console.log(`[AI][PHASE-2] Recherche d'analogies dans la base vectorielle...`);

  // Recherche d'analogies structurelles via le moteur dédié
  const analogyResult = await analogicalReasoner.reason(question, context, pastReasonings);

  if (analogyResult) {
    console.log(`[AI][PHASE-2] Analogie trouvée et appliquée au raisonnement.`);
    return analogyResult;
  }

  return null;
}

/**
 * Extrait les concepts pivots d'une question pour affiner la recherche vectorielle.
 */
export async function extractVectorConcepts(question: string): Promise<string[]> {
  try {
    const response = await ai.generate({
      model: 'ollama/tinyllama:latest',
      system: "Tu es un extracteur de concepts techniques. Retourne uniquement une liste de 2-3 mots clés séparés par des virgules.",
      prompt: `Extrait les concepts pivots de : "${question}"`,
    });

    return response.text.split(',').map(c => c.trim());
  } catch {
    return [question.substring(0, 30)];
  }
}
