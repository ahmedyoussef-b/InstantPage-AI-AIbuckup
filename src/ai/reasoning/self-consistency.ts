/**
 * @fileOverview SelfConsistencyReasoner - Innovation 10 pour la résistance aux hallucinations.
 * Génère plusieurs chemins de raisonnement et vote pour la réponse la plus stable.
 */

export class SelfConsistencyReasoner {
  private numPaths = 3; // Limité à 3 pour la performance locale (Ollama)

  /**
   * Effectue un raisonnement auto-consistant sur une question.
   */
  async reason(question: string, context: string): Promise<{ answer: string; confidence: number }> {
    console.log("[AI][REASONING] Activation de la Vérification Auto-Consistante (Innovation 10)...");

    try {
      // 1. Générer plusieurs chemins de raisonnement en parallèle
      const paths = await Promise.all(
        Array(this.numPaths).fill(0).map((_, i) => 
          this.generateReasoningPath(question, context, i)
        )
      );

      // 2. Synthétiser la réponse majoritaire
      const { answer, confidence } = await this.synthesizeConsensus(question, paths);
      
      console.log(`[AI][REASONING] Consensus atteint avec une confiance de ${Math.round(confidence * 100)}%`);
      
      return { answer, confidence };
    } catch (error) {
      console.error("[AI][REASONING] Échec auto-consistance:", error);
      return { 
        answer: "Désolé, je n'ai pas pu établir de consensus fiable pour cette question.", 
        confidence: 0 
      };
    }
  }

  private async generateReasoningPath(question: string, context: string, seed: number): Promise<string> {
    const { ai } = await import('@/ai/genkit');
    
    const variations = [
      "Analyse les faits étape par étape :",
      "Vérifie d'abord les contraintes de sécurité, puis déduis :",
      "Décompose le problème technique :"
    ];

    const response = await ai.generate({
      model: 'ollama/tinyllama:latest',
      system: "Tu es un module de raisonnement logique. Montre ton cheminement sans donner la réponse finale immédiatement.",
      prompt: `Question: ${question}\nContexte: ${context}\n\nApproche : ${variations[seed % variations.length]}`,
      config: {
        temperature: 0.6 + (seed * 0.1), // Variation pour explorer différents chemins
      }
    });

    return response.text;
  }

  private async synthesizeConsensus(question: string, paths: string[]): Promise<{ answer: string; confidence: number }> {
    const { ai } = await import('@/ai/genkit');
    
    const response = await ai.generate({
      model: 'ollama/phi3:mini',
      system: "Tu es un arbitre technique. Analyse les différents chemins de raisonnement fournis et déduis la réponse la plus cohérente et fiable. Évalue aussi le niveau de confiance (0.0 à 1.0) basé sur l'accord entre les réflexions.",
      prompt: `
        Question: ${question}
        
        CHEMINS DE RAISONNEMENT :
        ${paths.map((p, i) => `Raisonnement ${i+1}:\n${p}`).join('\n\n')}
        
        INSTRUCTIONS :
        1. Identifie la conclusion majoritaire.
        2. Formule la réponse finale précise.
        3. Retourne au début de ta réponse : "CONFIANCE: [0.X]" suivi de ta synthèse.`,
    });

    const text = response.text;
    const confidenceMatch = text.match(/CONFIANCE:\s*([\d.]+)/);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;

    return { 
      answer: text.replace(/CONFIANCE:\s*[\d.]+/, '').trim(), 
      confidence 
    };
  }
}

export const selfConsistencyReasoner = new SelfConsistencyReasoner();
