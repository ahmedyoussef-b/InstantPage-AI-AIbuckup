/**
 * @fileOverview MetacognitiveReasoner - Innovation 13.
 * L'IA évalue sa propre compréhension et confiance avant et après avoir répondu.
 */

export interface MetacognitiveResult {
  answer: string;
  confidence: number;
  disclaimer?: string;
  missingInfo?: string;
  suggestions?: string[];
}

export class MetacognitiveReasoner {
  /**
   * Effectue un raisonnement méta-cognitif sur une question.
   */
  async reason(question: string, context: string, generateFn: (q: string, ctx: string) => Promise<string>): Promise<MetacognitiveResult> {
    console.log("[AI][REASONING] Activation de la Méta-cognition (Innovation 13)...");

    try {
      // 1. Évaluation préliminaire de la compréhension
      const assessment = await this.assessQuestion(question, context);
      
      if (assessment.confidence < 0.3) {
        console.warn("[AI][REASONING] Confiance initiale trop faible pour répondre.");
        return {
          answer: "Désolé, je ne dispose pas d'assez d'informations précises dans les documents chargés pour répondre avec certitude à cette question technique.",
          confidence: assessment.confidence,
          missingInfo: assessment.missingInfo,
          suggestions: ["Essayez de reformuler la question", "Vérifiez que le document pertinent est bien indexé"]
        };
      }

      // 2. Génération de la réponse via le pipeline standard (ou spécifique)
      const answer = await generateFn(question, context);

      // 3. Auto-évaluation critique de la réponse générée
      const evaluation = await this.evaluateOwnAnswer(question, answer, context);
      
      // 4. Synthèse finale
      const finalConfidence = (assessment.confidence + evaluation.confidence) / 2;
      
      let disclaimer = undefined;
      if (finalConfidence < 0.6) {
        disclaimer = "Note : Cette réponse est basée sur une déduction logique avec un niveau de confiance modéré. Une vérification manuelle est conseillée.";
      }

      console.log(`[AI][REASONING] Méta-cognition terminée. Confiance finale: ${Math.round(finalConfidence * 100)}%`);

      return {
        answer,
        confidence: finalConfidence,
        disclaimer
      };

    } catch (error) {
      console.error("[AI][REASONING] Échec méta-cognition:", error);
      // Fallback sur une réponse simple en cas d'erreur dans le module de méta-cognition
      const answer = await generateFn(question, context);
      return { answer, confidence: 0.5 };
    }
  }

  private async assessQuestion(question: string, context: string): Promise<{ confidence: number; missingInfo?: string }> {
    const { ai } = await import('@/ai/genkit');
    try {
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: "Tu es un module d'auto-évaluation. Analyse si le contexte fourni permet de répondre à la question technique.",
        prompt: `Question: ${question}\nContexte: ${context.substring(0, 1000)}\n\nÉvalue la capacité à répondre (Confiance entre 0.0 et 1.0) et ce qui manque. Réponds strictement en JSON: {"confidence": 0.X, "missingInfo": "..."}`,
      });
      
      const match = response.text.match(/\{.*\}/s);
      if (match) {
        return JSON.parse(match[0]);
      }
      return { confidence: 0.7 };
    } catch (e) {
      return { confidence: 0.7 };
    }
  }

  private async evaluateOwnAnswer(question: string, answer: string, context: string): Promise<{ confidence: number }> {
    const { ai } = await import('@/ai/genkit');
    try {
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: "Tu es un critique technique. Évalue la fidélité de la réponse par rapport au contexte technique fourni.",
        prompt: `Question: ${question}\nRéponse: ${answer}\nContexte: ${context.substring(0, 1000)}\n\nÉvalue la précision technique (0.0 à 1.0). Réponds strictement en JSON: {"confidence": 0.X}`,
      });
      
      const match = response.text.match(/\{.*\}/s);
      if (match) {
        return JSON.parse(match[0]);
      }
      return { confidence: 0.8 };
    } catch (e) {
      return { confidence: 0.8 };
    }
  }
}

export const metacognitiveReasoner = new MetacognitiveReasoner();
