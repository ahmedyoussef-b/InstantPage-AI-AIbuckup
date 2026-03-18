'use server';
/**
 * @fileOverview MetaLearning - Innovation 31.
 * L'IA apprend à optimiser son propre processus d'apprentissage.
 * Gère la sélection adaptative des stratégies et la modélisation de la progression.
 */

import { ai } from '@/ai/genkit';

export interface TaskFeatures {
  complexity: number;
  novelty: number;
  type: 'analytical' | 'creative' | 'practical';
  dependencies: number;
  ambiguity: number;
}

export interface LearningStrategy {
  id: string;
  name: string;
  applicability: string[];
  confidence: number;
  metaParameters: Record<string, any>;
}

export interface PerformanceMetrics {
  strategyId: string;
  success: boolean;
  quality: number;
  timeSpent: number;
  timestamp: number;
}

/**
 * Analyse une tâche pour extraire ses caractéristiques sémantiques.
 */
export async function extractTaskFeatures(query: string, context: string): Promise<TaskFeatures> {
  const q = query.toLowerCase();
  
  // Heuristiques rapides
  const complexity = Math.min((query.length / 200) + (context.length / 2000), 1);
  const novelty = q.match(/nouveau|inconnu|jamais|appliquer|découvrir/i) ? 0.8 : 0.3;
  
  let type: 'analytical' | 'creative' | 'practical' = 'analytical';
  if (q.match(/créer|imaginer|inventer|rédiger/i)) type = 'creative';
  if (q.match(/comment|faire|étape|procédure|réparer/i)) type = 'practical';

  return {
    complexity,
    novelty,
    type,
    dependencies: (q.match(/et|ensuite|puis|après/g) || []).length,
    ambiguity: q.length < 30 ? 0.7 : 0.2
  };
}

/**
 * Sélectionne la meilleure stratégie d'apprentissage pour la tâche donnée.
 */
export async function selectOptimalStrategy(features: TaskFeatures): Promise<LearningStrategy> {
  // Logique de sélection basée sur les caractéristiques
  if (features.novelty > 0.6 && features.type === 'analytical') {
    return {
      id: 'transfer_learning',
      name: 'Transfert Cross-Domaine',
      applicability: ['innovation', 'nouveaux_concepts'],
      confidence: 0.9,
      metaParameters: { abstractionLevel: 'high' }
    };
  }

  if (features.complexity > 0.7) {
    return {
      id: 'hierarchical_decomposition',
      name: 'Décomposition Hiérarchique',
      applicability: ['problèmes_complexes'],
      confidence: 0.85,
      metaParameters: { maxDepth: 3 }
    };
  }

  return {
    id: 'pattern_recognition',
    name: 'Reconnaissance de Motifs',
    applicability: ['routine', 'données_connues'],
    confidence: 0.95,
    metaParameters: { threshold: 0.8 }
  };
}

/**
 * Génère une directive de méta-apprentissage pour optimiser le prompt.
 */
export async function getMetaLearningDirective(strategy: LearningStrategy): Promise<string> {
  return `\n[MÉTA-APPRENTISSAGE (INNOVATION 31)] : Stratégie activée "${strategy.name}". Optimisation du processus de réflexion via ${strategy.id}.`;
}

/**
 * Évalue la progression globale de l'IA (Courbe d'apprentissage).
 */
export async function getLearningCurve(history: PerformanceMetrics[]): Promise<{ slope: number; status: string }> {
  if (history.length < 5) return { slope: 0, status: 'Initialisation' };
  
  const recent = history.slice(-5);
  const successRate = recent.filter(h => h.success).length / recent.length;
  
  return {
    slope: successRate,
    status: successRate > 0.8 ? 'Optimisé' : 'En progression'
  };
}
