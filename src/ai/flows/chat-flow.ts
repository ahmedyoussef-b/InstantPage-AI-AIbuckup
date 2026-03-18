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
    // 1. Analyse du besoin de raisonnement approfondi (CoT)
    const isTechnical = input.text.match(/comment|pourquoi|panne|maintenance|chaudière|gaz|pression/i);
    
    if (isTechnical && input.text.length > 30) {
      console.log("[AI][CHAT] Activation de la Chaîne de Pensée Dynamique...");
      return await dynamicCoT.reason(input.text, input.documentContext || "");
    }

    // 2. Routage standard si CoT non requis
    const hasContext = !!input.documentContext && input.documentContext.length > 100;
    const targetModel = await semanticRouter.route(input.text, hasContext);
    const optimizedPrompt = await dynamicPromptEngine.buildPrompt(input.text, input.documentContext || "");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const url = 'http://localhost:11434/api/generate';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel, 
          prompt: optimizedPrompt,
          stream: false,
          options: { temperature: 0.7, num_ctx: 4096 }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Ollama indisponible");

      const data = await response.json();
      return data.response || "Désolé, je n'ai pas pu formuler de réponse.";
    } catch (error) {
      console.error("[AI][CHAT] Erreur génération:", error);
      return "Une erreur technique empêche la connexion à l'IA locale.";
    }
  };

  // 3. Utilisation du cache sémantique intelligent
  const finalAnswer = await semanticCache.getOrCompute(input.text, computeAnswer);

  return {
    answer: finalAnswer,
    sources: [],
  };
}
