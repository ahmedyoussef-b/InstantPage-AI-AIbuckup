/**
 * @fileOverview TrainingDataCollector - Collecte intelligente des données multi-sources.
 */

import { TrainingExample } from './types';

// Simulation d'une base de données locale (VFS Serveur)
const mockDb = {
  documents: { find: async () => [] as any[] },
  chats: { find: async () => [] as any[] },
  corrections: { find: async () => [] as any[] },
  actions: { find: async () => [] as any[] }
};

export class TrainingDataCollector {
  async collectAll(): Promise<TrainingExample[]> {
    const examples: TrainingExample[] = [];
    
    try {
      // SOURCE 1: Documents structurés
      const docs = await this.extractFromDocuments();
      examples.push(...docs);
      
      // SOURCE 2: QA pairs des conversations réussies
      const conversations = await this.extractFromChats();
      examples.push(...conversations);
      
      // SOURCE 3: Corrections utilisateur (Poids fort)
      const corrections = await this.extractFromCorrections();
      examples.push(...corrections);
      
      console.log(`[ML-COLLECTOR] Moisson terminée : ${examples.length} exemples.`);
    } catch (e) {
      console.warn("[ML-COLLECTOR] Erreur lors de la collecte.", e);
    }
    
    return examples;
  }
  
  private async extractFromDocuments(): Promise<TrainingExample[]> {
    // Dans une version réelle, on interrogerait le VFS
    return [{
      type: 'concept',
      input: "Qu'est-ce qu'une chaudière à condensation ?",
      output: "Une chaudière à condensation récupère la chaleur latente de la vapeur d'eau contenue dans les gaz de combustion.",
      source: 'document'
    }];
  }
  
  private async extractFromChats(): Promise<TrainingExample[]> {
    return [{
      type: 'chat',
      input: "Comment vérifier la pression ?",
      output: "Regardez le manomètre situé sur le panneau frontal, il doit être entre 1.5 et 2 bars.",
      source: 'conversation',
      rating: 5
    }];
  }
  
  private async extractFromCorrections(): Promise<TrainingExample[]> {
    return [{
      type: 'correction',
      input: "La vanne HV701 est-elle rouge ?",
      output: "Non, la vanne HV701 est jaune (arrivée gaz) selon le manuel technique.",
      weight: 3.0,
      source: 'user_correction'
    }];
  }
}
