/**
 * @fileOverview Routeur Sémantique pour l'Architecture Multi-Modèles.
 * Classifie les requêtes pour diriger vers le modèle spécialisé optimal.
 * Simule un classificateur ONNX ultra-léger (10MB).
 */

export type ModelCategory = 'legal' | 'medical' | 'technical' | 'general';

export class ModelRouter {
  // Configuration des modèles spécialisés (Ollama)
  private models = {
    legal: 'llama3:8b',     // Précision pour les textes réglementaires
    medical: 'phi3:mini',   // Efficace pour les terminologies santé
    technical: 'phi3:mini', // Optimisé pour la maintenance industrielle
    general: 'tinyllama'    // Polyvalent et rapide pour le reste
  };

  /**
   * Analyse la question et retourne le nom du modèle optimal.
   */
  async route(question: string): Promise<string> {
    const category = await this.classifyQuestion(question);
    console.log(`[AI][ROUTER] Catégorie : ${category.toUpperCase()} -> Modèle : ${this.models[category]}`);
    return this.models[category];
  }

  /**
   * Classification ultra-rapide basée sur l'analyse sémantique.
   * Simulation d'un moteur ONNX Runtime local.
   */
  private async classifyQuestion(question: string): Promise<ModelCategory> {
    const q = question.toLowerCase();
    
    // Logique de routage Technique (Maintenance, Industrie, Gaz, Pression)
    if (q.includes('chaudière') || q.includes('panne') || q.includes('maintenance') || 
        q.includes('vanne') || q.includes('pression') || q.includes('gaz') || q.includes('technique')) {
      return 'technical';
    }
    
    // Logique de routage Légal (Droit, Contrat, Règlement, Sécurité)
    if (q.includes('loi') || q.includes('contrat') || q.includes('règlement') || 
        q.includes('juridique') || q.includes('norme') || q.includes('obligation')) {
      return 'legal';
    }
    
    // Logique de routage Médical (Santé, Urgence, Premiers secours)
    if (q.includes('santé') || q.includes('blessure') || q.includes('secours') || 
        q.includes('médical') || q.includes('urgence') || q.includes('douleur')) {
      return 'medical';
    }
    
    return 'general';
  }
}

export const semanticRouter = new ModelRouter();
