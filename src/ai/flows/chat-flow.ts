'use server';
/**
 * @fileOverview Agentic Chat Flow for the Personal Assistant.
 * 
 * - chat - Main function for conversational interaction.
 * - ChatInput - Input schema including current text and history.
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
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Tool for retrieving context from local documents.
 * The LLM decides when to call this based on the user's query.
 */
const retrieveDocuments = ai.defineTool(
  {
    name: 'retrieveDocuments',
    description: 'Recherche des informations pertinentes dans la base de documents de l\'utilisateur (PDF, TXT, MD, JSON, CSV). Utilisez cet outil si la question porte sur le contenu des fichiers importés.',
    inputSchema: z.object({ query: z.string().describe('La recherche textuelle à effectuer dans les documents.') }),
    outputSchema: z.object({
      context: z.string(),
      sources: z.array(z.string()),
    }),
  },
  async (input) => {
    // Simulated RAG Retrieval logic
    // In a production environment, this would query ChromaDB or Firestore Vector Search.
    console.log(`[RAG] Searching for: ${input.query}`);
    
    return {
      context: "D'après les documents indexés (Rapport_Annuel_2023.pdf et Strategie_Q1.md), l'entreprise prévoit une transition vers des architectures agentiques d'ici la fin de l'année. La sécurité des données locales est citée comme la priorité numéro 1.",
      sources: ["Rapport_Annuel_2023.pdf", "Strategie_Q1.md"],
    };
  }
);

/**
 * Main chat flow that acts as an Agent.
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const response = await ai.generate({
    system: `Tu es un assistant personnel intelligent et agentique. 
    TES RÈGLES :
    1. Réponds TOUJOURS en français.
    2. Utilise l'outil 'retrieveDocuments' si tu as besoin d'informations provenant des fichiers de l'utilisateur pour répondre.
    3. Si tu utilises des documents, cite-les explicitement à la fin de ta réponse.
    4. Garde un ton professionnel, précis et utile.
    5. Formate tes réponses en Markdown (gras, listes, tableaux si nécessaire).`,
    prompt: input.text,
    history: input.history,
    tools: [retrieveDocuments],
  });

  // In this implementation, we extract the answer from the model's text response.
  // We can also check if the tool was called to enrich the source metadata.
  return {
    answer: response.text,
    // For simplicity in this MVP, sources are mentioned in the text or we can mock them based on tool usage
    sources: response.text.includes('Rapport_Annuel_2023.pdf') ? ["Rapport_Annuel_2023.pdf", "Strategie_Q1.md"] : [],
  };
}
