'use server';

import { z } from 'genkit';
import { semanticRouter } from '@/ai/router';
import { semanticCache } from '@/ai/semantic-cache';
import { dynamicPromptEngine } from '@/ai/dynamic-prompt';
import { dynamicCoT } from '@/ai/reasoning/dynamic-cot';
import { contrastiveReasoning } from '@/ai/reasoning/contrastive';
import { selfConsistencyReasoner } from '@/ai/reasoning/self-consistency';

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(z.any()).optional(),
  documentContext: z.string().optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
  confidence: z.number().optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Chat avec Raisonnement Avancé (CoT, Contraste, Auto-Consistance), Routage Sémantique et Cache.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    const q = input.text.toLowerCase();
    const docContext = input.documentContext || "";

    // 1. Analyse du type de raisonnement requis (Innovations 6, 9 & 10)
    const isCriticalFact = q.match(/vrai|faux|est-ce que|valeur|seuil|pression|limite|autorisé|obligatoire/i) && input.text.length < 150;
    const isDefinition = q.includes('qu\'est-ce que') || q.includes('définition') || q.includes('signifie');
    const isComparison = q.includes('différence') || q.includes('comparer') || q.includes(' vs ');
    const isTechnicalProblem = q.match(/comment|pourquoi|panne|maintenance|chaudière|gaz|pression|dysfonctionnement|réparer/i);

    // Cas C : Vérification Auto-Consistante (Innovation 10) pour les faits critiques
    if (isCriticalFact && docContext.length > 100) {
      const result = await selfConsistencyReasoner.reason(input.text, docContext);
      return { answer: result.answer, confidence: result.confidence };
    }

    // Cas A : Raisonnement par Contraste (Innovation 9) pour les définitions et comparaisons
    if ((isDefinition || isComparison) && docContext.length > 200) {
      const answer = await contrastiveReasoning.reason(input.text, docContext);
      return { answer };
    }

    // Cas B : Chaîne de Pensée Dynamique (Innovation 6) pour les problèmes techniques complexes
    if (isTechnicalProblem && input.text.length > 25) {
      console.log("[AI][CHAT] Activation de la Chaîne de Pensée Dynamique (Innovation 6)...");
      const answer = await dynamicCoT.reason(input.text, docContext);
      return { answer };
    }

    // 2. Routage standard si aucun mode spécial n'est requis
    const hasContext = docContext.length > 100;
    const targetModel = await semanticRouter.route(input.text, hasContext);
    const optimizedPrompt = await dynamicPromptEngine.buildPrompt(input.text, docContext);

    try {
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate({
        model: `ollama/${targetModel}`,
        prompt: optimizedPrompt,
        config: {
          temperature: 0.5,
          num_ctx: 4096
        }
      });

      return { answer: response.text || "Désolé, je n'ai pas pu formuler de réponse avec le modèle local." };
    } catch (error) {
      console.error("[AI][CHAT] Erreur génération Ollama:", error);
      return { answer: "Une erreur technique empêche la connexion à l'IA locale (Ollama). Vérifiez que le service est actif." };
    }
  };

  // 3. Utilisation du cache sémantique intelligent (Innovation 2)
  const result = await semanticCache.getOrCompute(input.text, async () => {
    const res = await computeAnswer();
    return typeof res === 'string' ? res : JSON.stringify(res);
  });

  // Gérer le retour du cache qui peut être un JSON stringifié ou une simple string
  let finalAnswer = "";
  let confidence = undefined;

  try {
    const parsed = JSON.parse(result);
    finalAnswer = parsed.answer || result;
    confidence = parsed.confidence;
  } catch {
    finalAnswer = result;
  }

  return {
    answer: finalAnswer,
    sources: [],
    confidence
  };
}
