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
  console.log(`[BACKEND][FLOW:chat] Query for AHMED: "${input.text}"`);

  const contextPrompt = input.documentContext 
    ? `Voici le contenu des documents disponibles pour t'aider :\n\n${input.documentContext}`
    : "Aucun document n'est chargé pour le moment.";

  // Prompt système personnalisé pour AHMED
  const systemPrompt = `Tu es l'Assistant Personnel Intelligent de AHMED.
    
    IDENTITÉ : Ton utilisateur s'appelle AHMED. Tu dois être poli, efficace et le saluer personnellement.
    
    INSTRUCTIONS :
    - Si l'utilisateur dit "Bonjour", "Bonsoir", "Salut", réponds toujours en mentionnant son nom : "Bonjour AHMED", "Bonsoir AHMED".
    - Réponds TOUJOURS en français.
    - Utilise le contexte des documents fournis ci-dessous pour répondre précisément.
    - Si la réponse ne se trouve pas dans les documents, admets-le poliment en t'adressant à AHMED.
    
    CONTEXTE DOCUMENTS :
    ${contextPrompt}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    // Tentative avec TinyLlama local ou fallback textuel
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
      // Fallback si Ollama n'est pas lancé
      const greetings = ["bonjour", "bonsoir", "salut", "hello"];
      const lowerText = input.text.toLowerCase();
      if (greetings.some(g => lowerText.includes(g))) {
        return {
          answer: `Bonjour AHMED ! Je suis votre assistant. Ollama semble indisponible, mais je suis là pour vous aider avec vos documents.`,
          sources: []
        };
      }
      return {
        answer: "Désolé AHMED, le moteur de réponse est indisponible (Ollama).",
        sources: [],
      };
    }

    const data = await response.json();
    return {
      answer: data.response || "Désolé AHMED, je n'ai pas pu formuler de réponse.",
      sources: [],
    };
  } catch (error: any) {
    // Fallback d'accueil si pas de connexion
    const lowerText = input.text.toLowerCase();
    if (lowerText.includes("bonjour") || lowerText.includes("salut")) {
      return {
        answer: "Bonjour AHMED ! Ravi de vous voir. Comment puis-je vous aider aujourd'hui ?",
        sources: []
      };
    }
    return {
      answer: "Désolé AHMED, une erreur technique empêche la connexion à Ollama.",
      sources: [],
    };
  }
}
