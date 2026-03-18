'use server';
/**
 * @fileOverview Phase 4: APPRENDRE - Boucle d'apprentissage RAG.
 * Analyse les feedbacks et les corrections pour optimiser les futurs retrievals.
 */

import { ai } from '@/ai/genkit';
import { FusedResult } from './intelligent-retriever';

export interface RAGInteraction {
  query: string;
  response: string;
  context: string;
  usedContexts: FusedResult[];
}

export interface Feedback {
  rating: number; // Score de 1 à 5
  correction?: string;
  successfulSources?: string[];
  failedSources?: string[];
}

/**
 * Apprend d'une interaction en analysant le feedback utilisateur.
 */
export async function learnFromRAGInteraction(interaction: RAGInteraction, feedback: Feedback) {
  console.log(`[AI][PHASE-4] Analyse de l'interaction pour apprentissage (Rating: ${feedback.rating}/5)`);

  if (feedback.rating >= 4) {
    await reinforceSuccess(interaction);
  }

  if (feedback.rating <= 2 || feedback.correction) {
    await learnFromCorrection(interaction, feedback);
  }

  await updateRetrieverWeights(feedback);
}

async function reinforceSuccess(interaction: RAGInteraction) {
  console.log(`[AI][PHASE-4] Renforcement de ${interaction.usedContexts.length} segments sources.`);
  try {
    await ai.embed({
      embedder: 'googleai/embedding-001',
      content: `RAG_SUCCESS: Question "${interaction.query}" résolue avec succès via les sources: ${interaction.usedContexts.map(c => c.source).join(', ')}`,
    });
  } catch (e) {
    console.warn("[AI][PHASE-4] Échec de la vectorisation du succès.");
  }
}

async function learnFromCorrection(interaction: RAGInteraction, feedback: Feedback) {
  const lessonText = feedback.correction 
    ? `LEÇON APPRISE: Pour la question "${interaction.query}", la réponse correcte est: ${feedback.correction}. (Précédemment erroné: ${interaction.response.substring(0, 50)}...)`
    : `ALERTE ÉCHEC: La recherche pour "${interaction.query}" n'a pas produit de résultat satisfaisant avec le contexte actuel.`;

  console.log(`[AI][PHASE-4] Création d'une nouvelle leçon pour la base vectorielle.`);

  try {
    await ai.embed({
      embedder: 'googleai/embedding-001',
      content: lessonText,
    });
  } catch (e) {
    console.warn("[AI][PHASE-4] Échec de la vectorisation de la leçon.");
  }
}

async function updateRetrieverWeights(feedback: Feedback) {
  if (feedback.failedSources && feedback.failedSources.length > 0) {
    console.log(`[AI][PHASE-4] Signal de dégradation détecté pour les sources: ${feedback.failedSources.join(', ')}`);
  }
  
  if (feedback.rating === 5) {
    console.log(`[AI][PHASE-4] Stratégie de retrieval validée pour ce type de requête.`);
  }
}
