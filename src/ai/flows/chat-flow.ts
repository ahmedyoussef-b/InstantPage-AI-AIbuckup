'use server';

import { z } from 'genkit';

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

export async function chat(input: ChatInput): Promise<ChatOutput> {
  console.log(`[BACKEND][FLOW:chat] Query: "${input.text}"`);

  const contextPrompt = input.documentContext 
    ? `Voici le contenu des documents disponibles pour t'aider :\n\n${input.documentContext}`
    : "Aucun document n'est chargé pour le moment.";

  const systemPrompt = `Tu es l'Assistant Personnel Intelligent de AHMED.
    
    IDENTITÉ : Ton utilisateur s'appelle AHMED. Tu dois être poli, efficace et le saluer personnellement (ex: "Bonjour AHMED", "Bonsoir AHMED").
    
    CONTEXTE : ${contextPrompt}

    RÈGLES :
    1. Réponds TOUJOURS en français.
    2. Si AHMED te salue, réponds en mentionnant son nom.
    3. Utilise le contexte des documents pour répondre précisément.
    4. Si tu ne sais pas, admets-le poliment en t'adressant à AHMED.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const url = 'http://localhost:11434/api/generate';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tinyllama:latest',
        prompt: `${systemPrompt}\n\nQuestion de AHMED: ${input.text}\n\nRéponse personnalisée en français:`,
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
        answer: "Désolé AHMED, le moteur de réponse est indisponible actuellement.",
        sources: [],
      };
    }

    const data = await response.json();
    return {
      answer: data.response || "Désolé AHMED, je n'ai pas pu formuler de réponse.",
      sources: [],
    };
  } catch (error: any) {
    return {
      answer: "Désolé AHMED, une erreur technique m'empêche de vous répondre. Vérifiez si Ollama est actif.",
      sources: [],
    };
  }
}