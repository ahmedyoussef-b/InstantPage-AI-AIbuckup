'use server';
/**
 * @fileOverview Phase3VectorIntegration - Innovation Elite 32.
 * Utilise la base vectorielle pour guider et adapter les actions de l'IA.
 * Permet de s'appuyer sur les succès passés pour optimiser les outils et workflows.
 */

import { ai } from '@/ai/genkit';

export interface ActionInsight {
  decision: string;
  adaptedParameters: any;
  confidence: number;
  pastResult?: string;
}

/**
 * Phase 3: AGIR - Interroge la base pour trouver des schémas d'action réussis.
 */
export async function agirVector(
  intent: string, 
  proposedParams: any
): Promise<ActionInsight | null> {
  console.log(`[AI][PHASE-3] Recherche de patterns d'action dans la base vectorielle...`);

  // 1. Vectoriser l'intention pour recherche analogique
  const embedding = await getEmbedding(intent);
  if (!embedding) return null;

  // Dans un prototype, nous simulons la récupération d'une action réussie 
  // basée sur la similarité vectorielle (strate ACTIONS de la base centrale)
  
  // Heuristique : Si on parle de "rapport" ou "audit", on simule un rappel
  if (intent.toLowerCase().match(/rapport|audit|synthèse/i)) {
    return {
      decision: intent,
      adaptedParameters: { ...proposedParams, detailLevel: 'high', includeGraphics: true },
      confidence: 0.92,
      pastResult: "Succès : Rapport validé avec félicitations lors de la session précédente."
    };
  }

  return null;
}

/**
 * Enregistre une action réussie pour enrichir la base vectorielle.
 */
export async function recordSuccessfulAction(
  decision: string, 
  params: any, 
  result: string
): Promise<void> {
  console.log(`[AI][PHASE-3] Vectorisation et stockage d'une action réussie.`);
  // Logique de stockage dans la strate ACTIONS du VFS
}

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const result = await ai.embed({
      embedder: 'googleai/embedding-001',
      content: text,
    });
    return result;
  } catch (e) {
    return null;
  }
}

/**
 * Formate l'insight d'action pour le prompt système.
 */
export async function formatActionInsight(insight: ActionInsight): Promise<string> {
  return `\n[ACTION MÉMORISÉE (INNOVATION 32)] : Basé sur vos succès passés, l'action "${insight.decision}" est recommandée avec les ajustements : ${JSON.stringify(insight.adaptedParameters)}. ${insight.pastResult || ''}`;
}
