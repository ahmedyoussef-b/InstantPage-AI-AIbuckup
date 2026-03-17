'use server';
/**
 * @fileOverview Agentic Chat Flow for the Personal Assistant.
 * 
 * - chat - Main function for conversational interaction with document context.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(MessageSchema).optional(),
  availableFiles: z.array(z.string()).optional(),
  documentContext: z.string().optional().describe('Le contenu textuel extrait des documents de l\'utilisateur.'),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  console.log(`[BACKEND][FLOW:chat] Query: "${input.text}" | Context Size: ${input.documentContext?.length || 0} chars`);

  const contextPrompt = input.documentContext 
    ? `Voici le contenu de tes documents pour t'aider à répondre :\n\n${input.documentContext}`
    : "Aucun contenu de document n'est disponible pour le moment.";

  const response = await ai.generate({
    system: `Tu es un assistant personnel intelligent et expert en analyse de documents.
    
    CONTEXTE DES DOCUMENTS :
    ${contextPrompt}

    RÈGLES DE RÉPONSE :
    1. Réponds TOUJOURS en français.
    2. Utilise UNIQUEMENT les informations fournies dans le contexte ci-dessus pour répondre aux questions sur les documents.
    3. Si l'information n'est pas dans le contexte, dis-le poliment.
    4. Cite le nom des fichiers sources si tu les connais.
    5. Formate ta réponse en Markdown (gras, listes, tableaux si nécessaire).
    6. Sois précis, professionnel et concis.`,
    prompt: input.text,
    history: input.history,
  });

  // Extraction simple des sources mentionnées pour l'UI
  const sources: string[] = [];
  if (input.availableFiles) {
    input.availableFiles.forEach(f => {
      if (response.text.includes(f)) sources.push(f);
    });
  }

  return {
    answer: response.text,
    sources: sources.length > 0 ? sources : undefined,
  };
}
