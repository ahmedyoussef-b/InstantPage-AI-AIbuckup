'use server';
/**
 * @fileOverview AdaptiveCurriculum - Innovation 27.
 * Gère la progression pédagogique de l'utilisateur du simple au complexe.
 */

import { ai } from '@/ai/genkit';

export interface TopicProgress {
  topicId: string;
  mastery: number; // 0 à 1
  interactions: number;
}

export interface CurriculumState {
  currentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  progress: Record<string, TopicProgress>;
}

/**
 * Évalue dynamiquement le niveau de l'utilisateur basé sur la complexité de sa requête
 * et la qualité de l'interaction précédente.
 */
export async function evaluatePedagogicalLevel(
  query: string, 
  confidence: number, 
  historyLength: number
): Promise<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> {
  const q = query.toLowerCase();
  
  // Heuristique de complexité
  const technicalTermsCount = (q.match(/pression|flux|circuit|étalonnage|vibration|harmonique|impédance/g) || []).length;
  
  if (technicalTermsCount > 2 && confidence > 0.8) return 'ADVANCED';
  if (q.length > 100 || technicalTermsCount > 0 || historyLength > 5) return 'INTERMEDIATE';
  return 'BEGINNER';
}

/**
 * Retourne une directive système pour adapter la réponse au niveau détecté.
 * Doit être asynchrone car exportée dans un fichier 'use server'.
 */
export async function getCurriculumDirective(level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'): Promise<string> {
  const base = "\n[CURRICULUM ADAPTATIF (INNOVATION 27)] : ";
  
  switch (level) {
    case 'BEGINNER':
      return base + "L'utilisateur est en phase d'initiation. Utilise des analogies de la vie courante, décompose les étapes, et évite absolument le jargon non expliqué. Sois très encourageant.";
    case 'INTERMEDIATE':
      return base + "L'utilisateur a des bases. Utilise la terminologie technique standard, fournis des explications sur le 'pourquoi' et commence à introduire des concepts corrélés.";
    case 'ADVANCED':
      return base + "L'utilisateur est expert. Va droit au but technique, fournis des paramètres précis, des schémas de données ou des références aux normes industrielles (ISO/AFNOR) sans vulgarisation.";
    default:
      return "";
  }
}

/**
 * Suggère le prochain concept à explorer basé sur le graphe de dépendances.
 */
export async function suggestNextTopic(context: string): Promise<string | null> {
  // Dans un système réel, on interrogerait un graphe de connaissances.
  // Ici on simule une recommandation pédagogique.
  if (context.includes('chaudière')) return "Voulez-vous approfondir les procédures de sécurité gaz ?";
  if (context.includes('gaz')) return "Prochaine étape recommandée : Maintenance du brûleur principal.";
  return null;
}
