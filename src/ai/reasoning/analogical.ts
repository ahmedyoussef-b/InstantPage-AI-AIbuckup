/**
 * @fileOverview AnalogicalReasoning - Innovation 12.
 * Transfert de solutions basées sur des problèmes similaires résolus par le passé.
 * Version stabilisée avec gestion d'erreurs et embeddings Genkit.
 */

export interface SolvedProblem {
  problem: string;
  solution: string;
  embedding: number[];
  timestamp: number;
}

export class AnalogicalReasoner {
  /**
   * Effectue un raisonnement analogique en cherchant des solutions passées.
   */
  async reason(question: string, context: string, memory: SolvedProblem[] = []): Promise<string | null> {
    console.log("[AI][REASONING] Activation du Raisonnement Analogique (Innovation 12)...");

    if (!memory || memory.length === 0) {
      console.log("[AI][REASONING] Mémoire analogique vide.");
      return null;
    }

    try {
      // 1. Trouver des problèmes analogues
      const analogs = await this.findAnalogousProblems(question, memory);
      
      if (analogs.length > 0) {
        console.log(`[AI][REASONING] Analogie trouvée (Similitude: ${Math.round(analogs[0].similarity * 100)}%).`);
        return await this.adaptAnalogousSolution(question, analogs[0], context);
      }
      
      return null;
    } catch (error) {
      console.error("[AI][REASONING] Échec raisonnement analogique:", error);
      return null;
    }
  }

  private async findAnalogousProblems(question: string, memory: SolvedProblem[]) {
    try {
      const { ai } = await import('@/ai/genkit');
      
      // Générer l'embedding de la question actuelle
      const qEmbeddingResult = await ai.embed({
        embedder: 'googleai/embedding-001',
        content: question,
      });

      const qEmbedding = qEmbeddingResult;

      const candidates = memory.map(solved => {
        const similarity = this.cosineSimilarity(qEmbedding, solved.embedding);
        return { ...solved, similarity };
      });

      // Seuil de pertinence analogique : 0.75 (Robuste)
      return candidates
        .filter(c => c.similarity > 0.75)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 1);
    } catch (e) {
      console.error("[AI][REASONING] Erreur lors de la recherche d'analogies:", e);
      return [];
    }
  }

  private async adaptAnalogousSolution(question: string, analogous: any, context: string): Promise<string> {
    const { ai } = await import('@/ai/genkit');
    
    const response = await ai.generate({
      model: 'ollama/phi3:mini',
      system: `Tu es un Expert en Transfert de Connaissances et Raisonnement par Analogie.
      Ta mission est d'utiliser la solution d'un problème analogue pour résoudre une nouvelle question technique.
      
      INSTRUCTIONS :
      1. Identifie brièvement le lien entre le problème passé et le nouveau.
      2. Adapte les étapes techniques de la solution historique au contexte actuel.
      3. Reste précis, sécurisé et professionnel.
      4. Réponds toujours en français.`,
      prompt: `
        PROBLÈME ANALOGUE RÉSOLU : "${analogous.problem}"
        SOLUTION HISTORIQUE : "${analogous.solution}"
        
        NOUVELLE QUESTION : "${question}"
        CONTEXTE ACTUEL : "${context}"
        
        ADAPTATION DE LA SOLUTION :`,
    });

    return response.text;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return isNaN(similarity) ? 0 : similarity;
  }
}

export const analogicalReasoner = new AnalogicalReasoner();
