// src/ai/integration/complete-loop.ts
export class CompleteLearningLoop {
    private vectorDB: VectorDatabase;
    private phase1: Phase1VectorIntegration;
    private phase2: Phase2VectorIntegration;
    private phase3: Phase3VectorIntegration;
    private phase4: Phase4VectorIntegration;
    
    async processUserInteraction(interaction: UserInteraction) {
      // 1. PHASE 1: COMPRENDRE avec contexte vectoriel enrichi
      const contexte = await this.phase1.comprendre(
        interaction.query, 
        interaction.userId
      );
      
      // 2. PHASE 2: RAISONNER avec analogies vectorielles
      const raisonnement = await this.phase2.raisonner(
        interaction.query, 
        contexte
      );
      
      // 3. PHASE 3: AGIR basé sur actions passées vectorisées
      const action = await this.phase3.agir(
        raisonnement.decision,
        interaction.userId
      );
      
      // 4. Observer la réaction de l'utilisateur
      const result = await this.presentAction(action);
      const feedback = await this.getUserFeedback(result);
      
      // 5. PHASE 4: APPRENDRE de toute l'interaction
      await this.phase4.apprendre({
        ...interaction,
        contexte,
        raisonnement,
        action,
        result,
        feedback
      });
      
      // 6. BONUS: Mise à jour vectorielle des documents
      if (feedback.correction) {
        await this.updateDocumentFromCorrection(interaction, feedback);
      }
      
      return {
        result,
        learned: true,
        nextSuggestions: await this.generateSuggestions(interaction.userId)
      };
    }
    
    private async updateDocumentFromCorrection(interaction: UserInteraction, feedback: any) {
      // Trouver le document source
      const sourceDocs = await this.vectorDB.search({
        embedding: await this.getEmbedding(interaction.query),
        collection: 'documents',
        limit: 3
      });
      
      for (const doc of sourceDocs) {
        // Marquer pour révision ou créer une note
        await this.vectorDB.insert({
          collection: 'document_notes',
          vector: await this.getEmbedding(feedback.correction),
          metadata: {
            documentId: doc.id,
            correction: feedback.correction,
            originalQuery: interaction.query,
            timestamp: Date.now()
          }
        });
      }
    }
    
    private async generateSuggestions(userId: string) {
      // Proposer des actions basées sur l'historique vectoriel
      const userVector = await this.getUserVector(userId);
      
      const suggestions = await this.vectorDB.search({
        embedding: userVector,
        collection: 'suggestions',
        limit: 3
      });
      
      return suggestions.map(s => s.metadata);
    }
  }