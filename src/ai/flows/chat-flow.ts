'use server';

import { z } from 'genkit';
import { semanticRouter } from '@/ai/router';
import { semanticCache } from '@/ai/semantic-cache';
import { dynamicPromptEngine } from '@/ai/dynamic-prompt';
import { dynamicCoT } from '@/ai/reasoning/dynamic-cot';
import { contrastiveReasoning } from '@/ai/reasoning/contrastive';
import { selfConsistencyReasoner } from '@/ai/reasoning/self-consistency';
import { latentTree } from '@/ai/reasoning/latent-tree';
import { analogicalReasoner, type SolvedProblem } from '@/ai/reasoning/analogical';

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(z.any()).optional(),
  documentContext: z.string().optional(),
  analogyMemory: z.array(z.any()).optional(), // Mémoire d'expérience passée
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
  confidence: z.number().optional(),
  isAnalogical: z.boolean().optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Chat Intelligent intégrant les 12 Innovations Élite.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    const q = input.text.toLowerCase();
    const docContext = input.documentContext || "";

    // 1. Raisonnement Analogique (Innovation 12) - Priorité haute
    if (input.analogyMemory && input.analogyMemory.length > 0) {
      const analogResponse = await analogicalReasoner.reason(input.text, docContext, input.analogyMemory as SolvedProblem[]);
      if (analogResponse) {
        return { answer: analogResponse, isAnalogical: true };
      }
    }

    // 2. Analyse du type de raisonnement requis (Innovations 6, 9, 10 & 11)
    
    // CAS A : Arbre de Décision Latent (Innovation 11)
    const isDecision = q.match(/dois-je|devrais-je|choisir|décider|investir|opportunité|conseille-moi|quel choix/i);
    if (isDecision && docContext.length > 50) {
      const answer = await latentTree.reason(input.text, docContext);
      return { answer };
    }

    // CAS B : Vérification Auto-Consistante (Innovation 10)
    const isCriticalFact = q.match(/vrai|faux|est-ce que|valeur|seuil|pression|limite|autorisé|obligatoire|combien|température/i);
    if (isCriticalFact && docContext.length > 50) {
      const result = await selfConsistencyReasoner.reason(input.text, docContext);
      return { answer: result.answer, confidence: result.confidence };
    }

    // CAS C : Raisonnement par Contraste (Innovation 9)
    const isDefinition = q.includes('qu\'est-ce que') || q.includes('définition') || q.includes('signifie');
    const isComparison = q.includes('différence') || q.includes('comparer') || q.includes(' vs ') || q.includes('mieux que');
    if ((isDefinition || isComparison) && docContext.length > 100) {
      const answer = await contrastiveReasoning.reason(input.text, docContext);
      return { answer };
    }

    // CAS D : Chaîne de Pensée Dynamique (Innovation 6)
    const isTechnicalProblem = q.match(/comment|pourquoi|panne|maintenance|chaudière|gaz|circuit|dysfonctionnement|réparer|étape/i);
    if (isTechnicalProblem && input.text.length > 20) {
      const answer = await dynamicCoT.reason(input.text, docContext);
      return { answer };
    }

    // 3. Routage standard (Innovation 1)
    const hasContext = docContext.length > 100;
    const targetModel = await semanticRouter.route(input.text, hasContext);
    const optimizedPrompt = await dynamicPromptEngine.buildPrompt(input.text, docContext);

    try {
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate({
        model: `ollama/${targetModel}`,
        prompt: optimizedPrompt,
        config: {
          temperature: 0.4,
          num_ctx: 4096
        }
      });

      return { answer: response.text || "Désolé, je n'ai pas pu formuler de réponse avec le moteur local." };
    } catch (error) {
      console.error("[AI][CHAT] Erreur génération Ollama:", error);
      return { answer: "Une erreur technique empêche la connexion à l'IA locale (Ollama). Vérifiez que le service est actif." };
    }
  };

  // 4. Utilisation du cache sémantique intelligent (Innovation 2)
  const result = await semanticCache.getOrCompute(input.text, async () => {
    const res = await computeAnswer();
    return JSON.stringify(res);
  });

  let finalAnswer = "";
  let confidence = undefined;
  let isAnalogical = false;

  try {
    const parsed = JSON.parse(result);
    finalAnswer = parsed.answer || result;
    confidence = parsed.confidence;
    isAnalogical = parsed.isAnalogical || false;
  } catch {
    finalAnswer = result;
  }

  return {
    answer: finalAnswer,
    sources: [],
    confidence,
    isAnalogical
  };
}
