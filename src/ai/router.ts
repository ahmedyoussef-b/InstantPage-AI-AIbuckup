/**
 * @fileOverview Routeur Sémantique pour l'Architecture Multi-Modèles.
 * Classifie les requêtes d'AHMED pour diriger vers le modèle spécialisé optimal.
 */

export type ModelCategory = 'legal' | 'medical' | 'technical' | 'general';

export class ModelRouter {
  private models = {
    legal: 'llama3:8b', // Modèle avec plus de paramètres pour la précision légale
    medical: 'phi3:mini', // Modèle efficace pour les termes médicaux
    technical: 'phi3:mini', // Modèle optimisé pour le code et la maintenance
    general: 'phi3:mini'   // Modèle polyvalent par défaut
  };

  /**
   * Analyse la question et retourne le nom du modèle Ollama à utiliser.
   */
  async route(question: string): Promise<string> {
    const category = await this.classifyQuestion(question);
    console.log(`[AI][ROUTER] Catégorie détectée : ${category.toUpperCase()} -> Utilisation du modèle : ${this.models[category]}`);
    return this.models[category];
  }

  /**
   * Classification ultra-rapide basée sur l'analyse sémantique des mots-clés.
   * Simulation d'un classificateur ONNX léger (10MB).
   */
  private async classifyQuestion(question: string): Promise<ModelCategory> {
    const q = question.toLowerCase();
    
    // Logique de routage technique (Maintenance industrielle, chaudière, etc.)
    if (q.includes('chaudière') || q.includes('panne') || q.includes('technique') || q.includes('gaz') || q.includes('vannes') || q.includes('pression')) {
      return 'technical';
    }
    
    // Logique de routage légal (Contrat, règlement, loi, sécurité)
    if (q.includes('loi') || q.includes('contrat') || q.includes('règlement') || q.includes('juridique') || q.includes('norme')) {
      return 'legal';
    }
    
    // Logique de routage médical (Santé, blessure, premiers secours)
    if (q.includes('santé') || q.includes('blessure') || q.includes('secours') || q.includes('urgence') || q.includes('douleur')) {
      return 'medical';
    }
    
    return 'general';
  }
}

export const semanticRouter = new ModelRouter();
