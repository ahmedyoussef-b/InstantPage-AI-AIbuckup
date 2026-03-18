/**
 * @fileOverview Cache Sémantique Intelligent.
 * Mémorise les vecteurs des questions passées pour réutiliser les réponses similaires.
 */
import { ai } from '@/ai/genkit';

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
      if (!qEmbedding) return computeFn();

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
      console.warn("[AI][CACHE] Erreur cache, repli sur génération standard.");
      return computeFn();
    }
  }

  private async getEmbedding(text: string): Promise<number[] | null> {
    try {
      const result = await ai.embed({
        embedder: 'googleai/embedding-001',
        content: text,
      });
      return result;
    } catch {
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
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async adaptResponse(answer: string, newQ: string, oldQ: string): Promise<string> {
    // Si la question est identique, pas d'adaptation nécessaire
    if (newQ.toLowerCase() === oldQ.toLowerCase()) return answer;

    // Utilisation d'un prompt ultra-rapide pour l'adaptation
    const response = await ai.generate({
      model: 'ollama/tinyllama:latest',
      system: "Tu es un adaptateur de réponse. Ta mission est d'ajuster légèrement une réponse existante pour qu'elle réponde parfaitement à une nouvelle question très similaire, sans changer les faits.",
      prompt: `Question originale: "${oldQ}"\nRéponse originale: "${answer}"\nNouvelle question: "${newQ}"\nRéponse adaptée :`,
    });

    return response.text;
  }

  private addToCache(question: string, answer: string, embedding: number[]) {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(question, {
      answer,
      embedding,
      timestamp: Date.now()
    });
  }
}

export const semanticCache = new SemanticCache();
