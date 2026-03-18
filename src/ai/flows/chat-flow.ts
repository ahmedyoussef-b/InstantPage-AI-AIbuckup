'use server';

import { z } from 'genkit';
import { semanticRouter } from '@/ai/router';
import { semanticCache } from '@/ai/semantic-cache';
import { dynamicPromptEngine } from '@/ai/dynamic-prompt';
import { dynamicCoT } from '@/ai/reasoning/dynamic-cot';

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(z.any()).optional(),
  documentContext: z.string().optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Chat avec CoT Dynamique, Routage Sémantique et Cache Intelligent.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  // Fonction de calcul de réponse (exécutée uniquement en cas de cache miss)
  const computeAnswer = async () => {
    // 1. Analyse du besoin de raisonnement approfondi (Innovation 6: CoT Dynamique)
    // On active le CoT pour les questions techniques longues ou les mots-clés critiques
    const isTechnical = input.text.match(/comment|pourquoi|panne|maintenance|chaudière|gaz|pression|dysfonctionnement|réparer/i);
    
    if (isTechnical && input.text.length > 25) {
      console.log("[AI][CHAT] Activation de la Chaîne de Pensée Dynamique (Innovation 6)...");
      return await dynamicCoT.reason(input.text, input.documentContext || "");
    }

    // 2. Routage standard si CoT non requis
    const hasContext = !!input.documentContext && input.documentContext.length > 100;
    const targetModel = await semanticRouter.route(input.text, hasContext);
    const optimizedPrompt = await dynamicPromptEngine.buildPrompt(input.text, input.documentContext || "");

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

      return response.text || "Désolé, je n'ai pas pu formuler de réponse avec le modèle local.";
    } catch (error) {
      console.error("[AI][CHAT] Erreur génération Ollama:", error);
      return "Une erreur technique empêche la connexion à l'IA locale (Ollama). Vérifiez que le service est actif.";
    }
  };

  // 3. Utilisation du cache sémantique intelligent (Innovation 2)
  const finalAnswer = await semanticCache.getOrCompute(input.text, computeAnswer);

  return {
    answer: finalAnswer,
    sources: [],
  };
}
