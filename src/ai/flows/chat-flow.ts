'use server';

import { z } from 'genkit';
import { semanticRouter } from '@/ai/router';
import { semanticCache } from '@/ai/semantic-cache';

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
 * Chat avec Routage Sémantique, Cache Intelligent et RAG Hybride.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    // 1. Détermination du modèle via le routeur sémantique
    const targetModel = await semanticRouter.route(input.text);

    const systemPrompt = `Tu es un Assistant Professionnel Intelligent expert.
      
      INSTRUCTIONS :
      - Réponds de manière précise, technique et concise.
      - Réponds toujours en français.
      - Utilise le contexte des documents fournis ci-dessous.
      - Cite tes sources si l'information provient d'un document.
      
      CONTEXTE DOCUMENTS :
      ${input.documentContext || "Aucun document n'est chargé pour le moment."}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const url = 'http://localhost:11434/api/generate';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel, 
          prompt: `${systemPrompt}\n\nQuestion : ${input.text}\n\nRéponse :`,
          stream: false,
          options: { temperature: 0.7 }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Service IA indisponible");
      }

      const data = await response.json();
      return data.response || "Désolé, je n'ai pas pu formuler de réponse.";
    } catch (error) {
      console.error("[AI][CHAT] Erreur génération:", error);
      return "Une erreur technique empêche la connexion à l'IA locale (Ollama). Vérifiez que le service est démarré.";
    }
  };

  // Utilisation du cache sémantique pour optimiser la réponse
  const finalAnswer = await semanticCache.getOrCompute(input.text, computeAnswer);

  return {
    answer: finalAnswer,
    sources: [],
  };
}
