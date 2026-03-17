'use server';
/**
 * @fileOverview Agentic Chat Flow for the Personal Assistant.
 * 
 * - chat - Main function for conversational interaction.
 * - ChatInput - Input schema including current text, history, and known files.
 * - ChatOutput - Output schema including the answer and source citations.
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
  availableFiles: z.array(z.string()).optional().describe('Liste des fichiers actuellement indexés dans la base de données.'),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Tool for retrieving context from local documents.
 */
const retrieveDocuments = ai.defineTool(
  {
    name: 'retrieveDocuments',
    description: 'Recherche des informations pertinentes dans les documents de l\'utilisateur. Utilisez cet outil si la question porte sur des fichiers importés.',
    inputSchema: z.object({ 
      query: z.string().describe('La recherche textuelle à effectuer.'),
      targetFiles: z.array(z.string()).optional().describe('Fichiers spécifiques à cibler si mentionnés.')
    }),
    outputSchema: z.object({
      context: z.string(),
      sources: z.array(z.string()),
    }),
  },
  async (input) => {
    console.log(`[BACKEND][TOOL:retrieveDocuments] Recherche : "${input.query}"`);
    
    // Simulation d'une recherche RAG basée sur les fichiers connus
    const files = input.targetFiles && input.targetFiles.length > 0 
      ? input.targetFiles 
      : ["Document_Principal.pdf"];

    return {
      context: `Résultat de la recherche sémantique dans ${files.join(', ')} : Les données indiquent une progression conforme aux objectifs fixés.`,
      sources: files,
    };
  }
);

/**
 * Main chat flow.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  console.log(`[BACKEND][FLOW:chat] Query: "${input.text}" | Files known: ${input.availableFiles?.length || 0}`);

  const filesList = input.availableFiles?.length 
    ? `Tu as accès aux fichiers suivants : ${input.availableFiles.join(', ')}.`
    : "Aucun fichier n'est actuellement indexé. Invite l'utilisateur à en uploader.";

  const response = await ai.generate({
    system: `Tu es un assistant personnel intelligent. 
    ${filesList}
    TES RÈGLES :
    1. Réponds TOUJOURS en français.
    2. Utilise l'outil 'retrieveDocuments' si l'utilisateur pose une question sur ses fichiers.
    3. Si tu utilises des sources, cite-les clairement à la fin.
    4. Formate tes réponses en Markdown.
    5. Sois précis et professionnel.`,
    prompt: input.text,
    history: input.history,
    tools: [retrieveDocuments],
  });

  // Extraction simple des sources pour l'UI
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
