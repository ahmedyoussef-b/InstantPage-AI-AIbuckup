/**
 * @fileOverview ContrastiveReasoning - Innovation 9 pour le raisonnement par opposition.
 * Aide l'IA à définir des concepts complexes en les comparant à ce qu'ils ne sont pas.
 */

export class ContrastiveReasoning {
  /**
   * Effectue un raisonnement contrastif sur une question.
   */
  async reason(question: string, context: string): Promise<string> {
    console.log("[AI][REASONING] Activation du Raisonnement par Contraste (Innovation 9)...");
    
    try {
      // 1. Identifier le concept central
      const concept = await this.extractMainConcept(question);
      
      // 2. Générer des contre-exemples pertinents basés sur le contexte
      const counterExamples = await this.generateCounterExamples(concept, context);
      
      if (counterExamples.length === 0) {
        return this.directGenerate(question, context);
      }

      // 3. Comparer systématiquement
      const comparisons = [];
      for (const counter of counterExamples) {
        const diff = await this.compare(concept, counter, context);
        comparisons.push({ counter, difference: diff });
      }
      
      // 4. Synthétiser par contraste
      return await this.synthesizeAnswer(concept, comparisons, question, context);
    } catch (error) {
      console.error("[AI][REASONING] Échec raisonnement contrastif:", error);
      return "Une erreur est survenue lors de l'analyse comparative.";
    }
  }

  private async extractMainConcept(question: string): Promise<string> {
    const { ai } = await import('@/ai/genkit');
    const response = await ai.generate({
      model: 'ollama/tinyllama:latest',
      system: "Tu es un extracteur de concept. Retourne uniquement le nom du concept principal (1-3 mots) de la question, sans ponctuation.",
      prompt: `Question: "${question}"`,
    });
    return response.text.trim() || "Sujet technique";
  }

  private async generateCounterExamples(concept: string, context: string): Promise<string[]> {
    const { ai } = await import('@/ai/genkit');
    try {
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: "Tu es un expert technique. Identifie 2 concepts proches mais différents du concept fourni, présents ou suggérés dans le contexte.",
        prompt: `Concept: ${concept}\nContexte: ${context}\n\nDonne 2 contre-exemples (un par ligne) :`,
      });
      return response.text.split('\n').map(c => c.replace(/^\d+\.\s*/, '').trim()).filter(c => c && c !== concept).slice(0, 2);
    } catch (e) {
      return [];
    }
  }

  private async compare(concept: string, counter: string, context: string): Promise<string> {
    const { ai } = await import('@/ai/genkit');
    const response = await ai.generate({
      model: 'ollama/tinyllama:latest',
      system: "Tu es un analyste technique. Explique en une phrase la différence clé entre les deux concepts fournis.",
      prompt: `Concept A: ${concept}\nConcept B: ${counter}\nContexte: ${context}\n\nDifférence clé :`,
    });
    return response.text.trim();
  }

  private async synthesizeAnswer(concept: string, comparisons: any[], question: string, context: string): Promise<string> {
    const { ai } = await import('@/ai/genkit');
    const response = await ai.generate({
      model: 'ollama/phi3:mini',
      system: "Tu es un Assistant Expert. Réponds à la question en utilisant les contrastes fournis pour apporter une précision technique maximale.",
      prompt: `
        Question: ${question}
        Concept Central: ${concept}
        
        CONTRASTES IDENTIFIÉS :
        ${comparisons.map(c => `- Différence avec ${c.counter}: ${c.difference}`).join('\n')}
        
        RÉPONSE FINALE PRÉCISE :`,
    });
    return response.text;
  }

  private async directGenerate(question: string, context: string): Promise<string> {
    const { ai } = await import('@/ai/genkit');
    const response = await ai.generate({
      model: 'ollama/phi3:mini',
      prompt: `Contexte: ${context}\nQuestion: ${question}`,
    });
    return response.text;
  }
}

export const contrastiveReasoning = new ContrastiveReasoning();
