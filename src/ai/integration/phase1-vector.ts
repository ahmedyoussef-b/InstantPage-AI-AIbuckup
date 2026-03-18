// src/ai/integration/phase1-vector.ts
export class Phase1VectorIntegration {
    async comprendre(question: string, userId: string) {
      // 1. Vectoriser la question
      const qEmbedding = await this.getEmbedding(question);
      
      // 2. Rechercher dans TOUS les vecteurs (pas seulement documents)
      const results = await this.vectorDB.search({
        embedding: qEmbedding,
        collections: [
          'documents',      // Fichiers uploadés
          'concepts',       // Concepts appris (Phase 4)
          'past_qa',        // Questions/réponses antérieures
          'user_patterns'   // Patterns de l'utilisateur
        ],
        limit: 10
      });
      
      // 3. Enrichir le contexte avec TOUS ces apprentissages
      return this.enrichContext(question, results);
    }
    
    private async enrichContext(question: string, results: any[]) {
      // Les résultats vectoriels deviennent le contexte RAG
      const context = results.map(r => ({
        type: r.collection,
        content: r.content,
        relevance: r.score,
        source: r.metadata
      }));
      
      return context;
    }
  }