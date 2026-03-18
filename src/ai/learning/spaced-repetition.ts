'use server';
/**
 * @fileOverview SpacedRepetition - Innovation 29.
 * Gère la planification des révisions pour optimiser la rétention à long terme.
 * Basé sur une adaptation de l'algorithme SM-2 pour l'IA industrielle.
 */

import { ai } from '@/ai/genkit';

export interface KnowledgeItem {
  id: string;
  content: string;
  concept: string;
  stability: number; // Intervalle actuel en jours
  difficulty: number; // 0.1 à 1.0
  lastReview: number;
  nextReview: number;
  reviewsCount: number;
}

/**
 * Calcule le prochain intervalle de révision.
 */
export async function calculateNextReview(
  item: KnowledgeItem, 
  performance: number // 0 (oubli) à 1 (parfait)
): Promise<KnowledgeItem> {
  let newStability: number;
  // Ajustement de la difficulté basée sur la performance
  let newDifficulty = item.difficulty + (0.1 - (1 - performance) * (1 - performance) * 0.15);
  newDifficulty = Math.max(0.1, Math.min(1.0, newDifficulty));

  if (performance < 0.6) {
    newStability = 1; // Recommencer à 1 jour si échec
  } else {
    if (item.reviewsCount === 0) {
      newStability = 1;
    } else if (item.reviewsCount === 1) {
      newStability = 6;
    } else {
      // Multiplication de l'intervalle par un facteur décroissant avec la difficulté
      newStability = Math.round(item.stability * (2.5 - newDifficulty * 1.5));
    }
  }

  return {
    ...item,
    stability: newStability,
    difficulty: newDifficulty,
    lastReview: Date.now(),
    nextReview: Date.now() + (newStability * 24 * 60 * 60 * 1000),
    reviewsCount: item.reviewsCount + 1
  };
}

/**
 * Identifie les concepts cruciaux à réactiver dans la session actuelle.
 */
export async function getPendingReviews(items: KnowledgeItem[]): Promise<KnowledgeItem[]> {
  const now = Date.now();
  return items
    .filter(item => item.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview)
    .slice(0, 2);
}

/**
 * Génère une question de révision pour un concept.
 */
export async function generateReviewQuestion(content: string, concept: string): Promise<string> {
  try {
    const response = await ai.generate({
      model: 'ollama/phi3:mini',
      system: "Tu es un Expert en Réactivation de Connaissances. Génère une question de validation technique courte et précise (max 20 mots) basée sur l'information fournie.",
      prompt: `Concept: ${concept}\nInformation: ${content}\n\nQuestion de révision :`,
    });
    return response.text;
  } catch {
    return `Question de révision sur le concept "${concept}" : Comment décririez-vous son importance technique ?`;
  }
}
