'use server';

import { z } from 'genkit';
import { semanticRouter } from '@/ai/router';

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(z.any()).optional(),
  availableFiles: z.array(z.string()).optional(),
  documentContext: z.string().optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Chat Intelligent avec Routage Sémantique pour une assistance professionnelle.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  console.log(`[BACKEND][FLOW:chat] Requête reçue : "${input.text}"`);

  // 1. Déterminer le modèle optimal via le Routeur Sémantique
  const targetModel = await semanticRouter.route(input.text);

  const contextPrompt = input.documentContext 
    ? `Voici le contenu des documents disponibles pour t'aider :\n\n${input.documentContext}`
    : "Aucun document n'est chargé pour le moment.";

  const systemPrompt = `Tu es un Assistant Personnel Intelligent expert technique.
    
    INSTRUCTIONS :
    - Réponds de manière professionnelle et concise.
    - Réponds TOUJOURS en français.
    - Utilise le contexte des documents fournis ci-dessous pour répondre précisément.
    - Cite tes sources si l'information provient d'un document.
    
    CONTEXTE DOCUMENTS :
    ${contextPrompt}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const url = 'http://localhost:11434/api/generate';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel, 
        prompt: `${systemPrompt}\n\nQuestion : ${input.text}\n\nRéponse en français :`,
        stream: false,
        options: {
          temperature: 0.7,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        answer: "Désolé, le service IA local est momentanément indisponible.",
        sources: [],
      };
    }

    const data = await response.json();
    return {
      answer: data.response || "Désolé, je n'ai pas pu formuler de réponse.",
      sources: [],
    };
  } catch (error: any) {
    return {
      answer: "Désolé, une erreur technique empêche la connexion à l'IA locale.",
      sources: [],
    };
  }
}
