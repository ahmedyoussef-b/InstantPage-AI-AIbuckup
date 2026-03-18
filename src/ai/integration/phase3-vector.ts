// src/ai/integration/phase3-vector.ts
export class Phase3VectorIntegration {
    async agir(decision: string, userId: string) {
      // 1. Vectoriser la décision
      const decisionEmbedding = await this.getEmbedding(decision);
      
      // 2. Chercher des actions similaires déjà exécutées
      const pastActions = await this.vectorDB.search({
        embedding: decisionEmbedding,
        collection: 'actions',  // Historique des actions
        filter: { userId, success: true },
        limit: 5
      });
      
      // 3. Adapter l'action basée sur les précédents
      const adaptedAction = await this.adaptAction(decision, pastActions);
      
      // 4. Exécuter
      const result = await this.executeAction(adaptedAction);
      
      // 5. Vectoriser le résultat pour apprentissage futur
      await this.vectorDB.insert({
        collection: 'actions',
        vector: decisionEmbedding,
        metadata: {
          decision,
          action: adaptedAction,
          result,
          userId,
          timestamp: Date.now()
        }
      });
      
      return result;
    }
  }