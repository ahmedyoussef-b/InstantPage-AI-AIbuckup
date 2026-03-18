'use server';
/**
 * @fileOverview Flux d'ingestion et de vectorisation des documents.
 * 
 * - ingestDocument - Découpe le texte, génère des embeddings et extrait les concepts du graphe.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { extractAndLink } from '@/ai/graph-store';

const IngestInputSchema = z.object({
  fileName: z.string(),
  fileContent: z.string().describe('Le contenu textuel brut du document.'),
  fileType: z.string(),
});
export type IngestInput = z.infer<typeof IngestInputSchema>;

const IngestOutputSchema = z.object({
  docId: z.string(),
  chunks: z.number(),
  embeddingModel: z.string(),
  processedAt: z.string(),
  concepts: z.array(z.string()),
});
export type IngestOutput = z.infer<typeof IngestOutputSchema>;

/**
 * Découpe un texte en segments de taille fixe.
 */
function chunkText(text: string, size: number): string[] {
  const chunks = [];
  if (!text) return [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.substring(i, i + size));
  }
  return chunks;
}

export async function ingestDocument(input: IngestInput): Promise<IngestOutput> {
  return ingestDocumentFlow(input);
}

const ingestDocumentFlow = ai.defineFlow(
  {
    name: 'ingestDocumentFlow',
    inputSchema: IngestInputSchema,
    outputSchema: IngestOutputSchema,
  },
  async (input) => {
    console.log(`[BACKEND][INGEST] Démarrage de l'ingestion : ${input.fileName}`);
    
    // 1. Segmentation
    const chunks = chunkText(input.fileContent, 1000);
    
    // 2. Extraction des concepts (Graphe) - Appel de la fonction utilitaire serveur
    const docId = Math.random().toString(36).substring(7);
    const { concepts } = await extractAndLink(docId, input.fileContent);

    // 3. Génération des Embeddings (Limité pour la démo)
    if (chunks.length > 0) {
      try {
        await ai.embedMany({
          embedder: 'googleai/embedding-001',
          content: chunks.slice(0, 5),
        });
      } catch (e) {
        console.error(`[BACKEND][INGEST] Erreur embeddings:`, e);
      }
    }

    return {
      docId,
      chunks: chunks.length,
      embeddingModel: 'embedding-001',
      processedAt: new Date().toISOString(),
      concepts,
    };
  }
);
