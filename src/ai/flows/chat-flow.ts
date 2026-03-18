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

/**
 * Chat Intelligent personnalisé pour AHMED.
 * Gère le contexte RAG et les interactions personnelles.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  console.log(`[BACKEND][FLOW:chat] Requête pour AHMED : "${input.text}"`);

  const contextPrompt = input.documentContext 
    ? `Voici le contenu des documents disponibles pour t'aider :\n\n${input.documentContext}`
    : "Aucun document n'est chargé pour le moment.";

  const systemPrompt = `Tu es l'Assistant Personnel Intelligent de AHMED.
    
    IDENTITÉ : Ton utilisateur s'appelle AHMED. Tu dois être poli, expert en maintenance industrielle et le saluer personnellement.
    
    INSTRUCTIONS :
    - Si AHMED te dit "Bonjour", "Bonsoir", "Salut", réponds toujours en mentionnant son nom : "Bonjour AHMED", "Bonsoir AHMED".
    - Réponds TOUJOURS en français.
    - Utilise le contexte des documents fournis ci-dessous pour répondre précisément.
    - Sois concis et technique si nécessaire.
    
    CONTEXTE DOCUMENTS :
    ${contextPrompt}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    // Utilisation d'Ollama local par défaut
    const url = 'http://localhost:11434/api/generate';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi3:mini', // Modèle performant et léger
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
      const lowerText = input.text.toLowerCase();
      if (["bonjour", "bonsoir", "salut"].some(g => lowerText.includes(g))) {
        return {
          answer: `Bonjour AHMED ! Ravi de vous voir. Le service IA local est momentanément hors ligne, mais je suis là pour vos documents.`,
          sources: []
        };
      }
      return {
        answer: "Désolé AHMED, le moteur IA local (Ollama) ne répond pas.",
        sources: [],
      };
    }

    const data = await response.json();
    return {
      answer: data.response || "Désolé AHMED, je n'ai pas pu formuler de réponse.",
      sources: [],
    };
  } catch (error: any) {
    const lowerText = input.text.toLowerCase();
    if (["bonjour", "salut", "bonsoir"].some(g => lowerText.includes(g))) {
      return {
        answer: "Bonjour AHMED ! Ravi de vous voir. Comment puis-je vous aider aujourd'hui ?",
        sources: []
      };
    }
    return {
      answer: "Désolé AHMED, une erreur technique empêche la connexion à l'IA locale.",
      sources: [],
    };
  }
}
