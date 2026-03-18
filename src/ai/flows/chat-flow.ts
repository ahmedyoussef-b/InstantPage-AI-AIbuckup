'use server';

import { z } from 'genkit';
import { semanticRouter } from '@/ai/router';
import { semanticCache } from '@/ai/semantic-cache';
import { dynamicPromptEngine } from '@/ai/dynamic-prompt';

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
 * Chat avec Routage Sémantique, Cache Intelligent et Prompt Dynamique.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    // 1. Détermination du modèle via le routeur sémantique
    const targetModel = await semanticRouter.route(input.text);

    // 2. Construction du prompt dynamique adaptatif
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
          options: { temperature: 0.7 }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Service IA local (Ollama) indisponible");
      }

      const data = await response.json();
      return data.response || "Désolé, je n'ai pas pu formuler de réponse.";
    } catch (error) {
      console.error("[AI][CHAT] Erreur génération:", error);
      return "Une erreur technique empêche la connexion à l'IA locale. Vérifiez que le service Ollama est démarré.";
    }
  };

  // 3. Utilisation du cache sémantique pour optimiser la réponse
  const finalAnswer = await semanticCache.getOrCompute(input.text, computeAnswer);

  return {
    answer: finalAnswer,
    sources: [],
  };
}
