/**
 * @fileOverview Structure Vectorielle Complète - Innovation Elite 32.
 * Définit les strates de la base vectorielle centrale unifiée.
 */

export type VectorCollectionType = 
  | 'DOCUMENTS'   // Contenu technique brut
  | 'CONCEPTS'    // Règles distillées et terminologie
  | 'LESSONS'     // Apprentissages issus des interactions
  | 'PATTERNS'    // Préférences et styles utilisateur
  | 'ACTIONS'     // Historique des schémas d'exécution réussis
  | 'REASONINGS'; // Chaînes de réflexion par analogie

export interface CollectionDefinition {
  id: VectorCollectionType;
  description: string;
  fields: string[];
  updateFrequency: 'on_upload' | 'real_time' | 'after_success' | 'periodic';
  retentionPolicy: 'permanent' | 'rolling' | 'distillable';
}

/**
 * Schéma directeur de la Base Vectorielle Centrale.
 */
export const VectorArchitecture: Record<VectorCollectionType, CollectionDefinition> = {
  DOCUMENTS: {
    id: 'DOCUMENTS',
    description: "Source de vérité technique issue des fichiers uploadés par l'utilisateur.",
    fields: ['content', 'filename', 'type', 'uploadedAt', 'chunks'],
    updateFrequency: 'on_upload',
    retentionPolicy: 'permanent'
  },
  
  CONCEPTS: {
    id: 'CONCEPTS',
    description: "Concepts pivots et relations extraites pour le raisonnement structurel.",
    fields: ['name', 'definition', 'domain', 'related_docs', 'importance'],
    updateFrequency: 'periodic',
    retentionPolicy: 'distillable'
  },
  
  LESSONS: {
    id: 'LESSONS',
    description: "Faits techniques et corrections mémorisés dynamiquement.",
    fields: ['content', 'context', 'confidence', 'timestamp', 'verification_count'],
    updateFrequency: 'real_time',
    retentionPolicy: 'rolling'
  },
  
  PATTERNS: {
    id: 'PATTERNS',
    description: "Profilage des préférences utilisateur (concision, technicité).",
    fields: ['userId', 'preference_type', 'score', 'last_used', 'model_version'],
    updateFrequency: 'real_time',
    retentionPolicy: 'permanent'
  },
  
  ACTIONS: {
    id: 'ACTIONS',
    description: "Bibliothèque de patterns d'exécution d'outils réussis.",
    fields: ['intent', 'tool', 'params', 'outcome', 'success_rate'],
    updateFrequency: 'after_success',
    retentionPolicy: 'permanent'
  },
  
  REASONINGS: {
    id: 'REASONINGS',
    description: "Modèles de réflexion par analogie pour les problèmes complexes.",
    fields: ['query', 'logic_steps', 'conclusion', 'embedding', 'performance_score'],
    updateFrequency: 'after_success',
    retentionPolicy: 'distillable'
  }
};

/**
 * Utilitaire de formatage pour l'injection dans les prompts.
 */
export function getCollectionPromptMetadata(type: VectorCollectionType): string {
  const schema = VectorArchitecture[type];
  return `[STRATE VECTORIELLE: ${schema.id}] - ${schema.description}`;
}

/**
 * Exemple de structure d'indexation multidimensionnelle.
 */
export interface IndexedInsight {
  collection: VectorCollectionType;
  vector: number[];
  metadata: Record<string, any>;
  content: string;
}
