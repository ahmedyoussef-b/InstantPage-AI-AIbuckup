/**
 * @fileOverview Cache Sémantique Intelligent.
 * Les appels Genkit ont été déplacés à l'intérieur des méthodes pour éviter les erreurs d'import client.
 */

interface CacheEntry {
  answer: string;
  embedding: number[];
  timestamp: number;
}

export class SemanticCache {
  private cache: Map<string, CacheEntry> = new Map();
  private similarityThreshold = 0.85;
  private maxEntries = 100;

  /**
   * Récupère une réponse du cache ou exécute le calcul.
   */
  async getOrCompute(question: string, computeFn: () => Promise<string>): Promise<string> {
    try {
      // 1. Générer l'embedding de la question actuelle
      const qEmbedding = await this.getEmbedding(question);
      if (!qEmbedding) {
        console.warn("[AI][CACHE] Embedding impossible, bypass cache.");
        return computeFn();
      }

      // 2. Chercher une question similaire dans le cache
      const similar = await this.findSimilar(qEmbedding);

      if (similar && similar.similarity > this.similarityThreshold) {
        console.log(`[AI][CACHE] Hit! Similitude: ${(similar.similarity * 100).toFixed(1)}%`);
        return this.adaptResponse(similar.answer, question, similar.original);
      }

      // 3. Calculer nouvelle réponse si pas de match
      const answer = await computeFn();

      // 4. Stocker dans le cache
      this.addToCache(question, answer, qEmbedding);

      return answer;
    } catch (error) {
      console.warn("[AI][CACHE] Erreur critique cache, repli sur génération standard.");
      return computeFn();
    }
  }

  private async getEmbedding(text: string): Promise<number[] | null> {
    try {
      // Import dynamique pour éviter l'inclusion dans le bundle client
      const { ai } = await import('@/ai/genkit');
      const result = await ai.embed({
        embedder: 'googleai/embedding-001',
        content: text,
      });
      return result;
    } catch (e) {
      console.error("[AI][CACHE] Erreur Embedding:", e);
      return null;
    }
  }

  private async findSimilar(qEmbedding: number[]) {
    let bestMatch = null;
    let maxSim = -1;

    for (const [cachedQ, entry] of this.cache) {
      const similarity = this.cosineSimilarity(qEmbedding, entry.embedding);
      if (similarity > maxSim) {
        maxSim = similarity;
        bestMatch = { answer: entry.answer, similarity: maxSim, original: cachedQ };
      }
    }

    return bestMatch;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
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

  private async adaptResponse(answer: string, newQ: string, oldQ: string): Promise<string> {
    if (newQ.toLowerCase() === oldQ.toLowerCase()) return answer;

    try {
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: "Tu es un adaptateur de réponse professionnel. Ta mission est d'ajuster légèrement une réponse existante pour qu'elle réponde parfaitement à une nouvelle question très similaire, sans changer les faits techniques.",
        prompt: `Question originale: "${oldQ}"\nRéponse originale: "${answer}"\nNouvelle question: "${newQ}"\nRéponse adaptée :`,
      });
      return response.text;
    } catch (e) {
      console.warn("[AI][CACHE] Échec adaptation, retour réponse originale.");
      return answer;
    }
  }

  private addToCache(question: string, answer: string, embedding: number[]) {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(question, {
      answer,
      embedding,
      timestamp: Date.now()
    });
  }
}

export const semanticCache = new SemanticCache();
