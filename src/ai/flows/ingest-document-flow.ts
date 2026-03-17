'use server';
/**
 * @fileOverview Flux d'ingestion et de vectorisation des documents.
 * 
 * - ingestDocument - Découpe le texte et génère des embeddings réels.
 * - IngestInput - Contenu du fichier et métadonnées.
 * - IngestOutput - Statistiques de l'ingestion.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
});
export type IngestOutput = z.infer<typeof IngestOutputSchema>;

/**
 * Découpe un texte en segments de taille fixe.
 */
function chunkText(text: string, size: number): string[] {
  const chunks = [];
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
    
    // 1. Segmentation (1000 caractères par chunk)
    const chunks = chunkText(input.fileContent, 1000);
    console.log(`[BACKEND][INGEST] Document découpé en ${chunks.length} segments.`);

    // 2. Génération des Embeddings (Vecteurs réels)
    console.log(`[BACKEND][INGEST] Génération des vecteurs via Google AI...`);
    
    // En Genkit 1.x, embedMany retourne directement le tableau d'embeddings
    const embeddings = await ai.embedMany({
      embedder: 'googleai/text-embedding-004',
      content: chunks.slice(0, 5), // On limite à 5 pour la démo de rapidité
    });

    console.log(`[BACKEND][INGEST] ${embeddings.length} vecteurs générés avec succès.`);

    return {
      docId: Math.random().toString(36).substring(7),
      chunks: chunks.length,
      embeddingModel: 'text-embedding-004',
      processedAt: new Date().toISOString(),
    };
  }
);
