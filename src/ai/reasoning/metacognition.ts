/**
 * @fileOverview MetacognitiveReasoner - Innovation 13.
 * L'IA évalue sa propre compréhension et confiance avant et après avoir répondu.
 */
import { ConfidenceScorer } from './confidence-scorer';

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
      // 1. Évaluation préliminaire via Scorer de Confiance
      const initialScore = ConfidenceScorer.evaluate(context, question);
      
      // Si la confiance initiale est extrêmement basse, on évite l'hallucination
      if (!ConfidenceScorer.isReliable(initialScore)) {
        console.warn("[AI][REASONING] Confiance initiale trop faible. Admission d'ignorance.");
        return {
          answer: "Désolé, après auto-évaluation, j'estime ne pas disposer d'assez d'informations précises dans vos documents pour répondre à cette question technique sans risque d'erreur.",
          confidence: initialScore,
          missingInfo: "Données manquantes ou contexte insuffisant dans la base locale.",
          suggestions: ["Vérifiez que le manuel technique est bien uploadé", "Précisez le nom exact de l'équipement"]
        };
      }

      // 2. Génération de la réponse via le pipeline standard
      const answer = await generateFn(question, context);

      // 3. Auto-évaluation critique via LLM (Confirmation)
      const evaluation = await this.evaluateOwnAnswer(question, answer, context);
      
      // 4. Synthèse finale de la confiance
      const finalConfidence = (initialScore * 0.4) + (evaluation.confidence * 0.6);
      
      let disclaimer = undefined;
      if (finalConfidence < 0.6) {
        disclaimer = "Note : Cette réponse est basée sur une déduction logique. Une vérification manuelle via vos manuels techniques est recommandée.";
      }

      console.log(`[AI][REASONING] Méta-cognition terminée. Confiance finale: ${Math.round(finalConfidence * 100)}%`);

      return {
        answer,
        confidence: finalConfidence,
        disclaimer
      };

    } catch (error) {
      console.error("[AI][REASONING] Échec critique méta-cognition, fallback standard.");
      const answer = await generateFn(question, context);
      return { answer, confidence: 0.5 };
    }
  }

  private async evaluateOwnAnswer(question: string, answer: string, context: string): Promise<{ confidence: number }> {
    const { ai } = await import('@/ai/genkit');
    try {
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: "Tu es un critique technique. Évalue la fidélité de la réponse par rapport au contexte source. Réponds uniquement en JSON.",
        prompt: `Question: ${question}\nRéponse: ${answer}\nContexte: ${context.substring(0, 1000)}\n\nFormat: {"confidence": 0.X}`,
      });
      
      const match = response.text.match(/\{.*\}/s);
      if (match) return JSON.parse(match[0]);
      return { confidence: 0.7 };
    } catch (e) {
      return { confidence: 0.7 };
    }
  }
}

export const metacognitiveReasoner = new MetacognitiveReasoner();
