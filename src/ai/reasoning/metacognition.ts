/**
 * @fileOverview MetacognitiveReasoner - Innovation 13.
 * L'IA évalue sa propre compréhension et confiance avant et après avoir répondu.
 * Version stabilisée avec parsing JSON robuste et gestion d'erreurs.
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
      
      // Si la confiance initiale est extrêmement basse, on évite l'hallucination
      if (assessment.confidence < 0.25) {
        console.warn("[AI][REASONING] Confiance initiale trop faible. Admission d'ignorance.");
        return {
          answer: "Désolé, après auto-évaluation, j'estime ne pas disposer d'assez d'informations précises dans vos documents pour répondre à cette question technique sans risque d'erreur.",
          confidence: assessment.confidence,
          missingInfo: assessment.missingInfo || "Données manquantes dans le contexte local.",
          suggestions: ["Vérifiez que le document pertinent est indexé", "Reformulez votre demande avec plus de détails techniques"]
        };
      }

      // 2. Génération de la réponse via le pipeline standard (ou spécifique)
      const answer = await generateFn(question, context);

      // 3. Auto-évaluation critique de la réponse générée
      const evaluation = await this.evaluateOwnAnswer(question, answer, context);
      
      // 4. Synthèse finale de la confiance (Moyenne pondérée)
      const finalConfidence = (assessment.confidence * 0.4) + (evaluation.confidence * 0.6);
      
      let disclaimer = undefined;
      if (finalConfidence < 0.65) {
        disclaimer = "Note : Cette réponse est basée sur une déduction logique avec un niveau de confiance modéré. Une vérification manuelle via vos manuels techniques est recommandée.";
      }

      console.log(`[AI][REASONING] Méta-cognition terminée. Confiance finale: ${Math.round(finalConfidence * 100)}%`);

      return {
        answer,
        confidence: finalConfidence,
        disclaimer
      };

    } catch (error) {
      console.error("[AI][REASONING] Échec critique méta-cognition, fallback standard.");
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
        system: "Tu es un module d'auto-évaluation technique. Analyse si le contexte fourni permet de répondre fidèlement à la question. Réponds UNIQUEMENT en JSON.",
        prompt: `Question: ${question}\nContexte: ${context.substring(0, 1500)}\n\nÉvalue ta capacité à répondre (0.0 à 1.0) et ce qui manque. Format: {"confidence": 0.X, "missingInfo": "..."}`,
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
        system: "Tu es un critique technique sévère. Évalue la fidélité de la réponse générée par rapport au contexte source. Réponds UNIQUEMENT en JSON.",
        prompt: `Question: ${question}\nRéponse à évaluer: ${answer}\nContexte source: ${context.substring(0, 1500)}\n\nÉvalue la précision technique (0.0 à 1.0). Format: {"confidence": 0.X}`,
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
