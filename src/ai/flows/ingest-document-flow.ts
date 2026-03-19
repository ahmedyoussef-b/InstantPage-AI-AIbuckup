'use server';
/**
 * @fileOverview Flux d'ingestion et de construction du graphe de connaissances (Logique Serveur).
 * Intègre désormais l'indexation hiérarchique des concepts (Innovation 32.1).
 * Optimisé pour la performance via exécution parallèle avec timeouts.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { extractHierarchicalConcepts } from '@/ai/learning/concept-hierarchy';

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
  graphData: z.any().optional(),
  hierarchy: z.any().optional(),
});
export type IngestOutput = z.infer<typeof IngestOutputSchema>;

/**
 * Utilitaire pour limiter le temps d'exécution d'une promesse.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  const timeoutPromise = new Promise<T>((resolve) =>
    setTimeout(() => {
      console.warn(`[INGEST] Timeout atteint après ${timeoutMs}ms. Utilisation du fallback.`);
      resolve(fallback);
    }, timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Extrait les concepts et entités d'un texte via LLM.
 */
async function extractKnowledgeFromText(docId: string, text: string) {
  try {
    const slice = text.substring(0, 1500); // Réduit pour la vitesse
    
    const response = await ai.generate({
      model: 'ollama/tinyllama:latest',
      system: "Tu es un extracteur de graphe de connaissances technique. Analyse le texte et identifie les 3 relations les plus importantes.",
      prompt: `Analyse ce document technique et extrait au maximum 3 relations clés sous le format "Sujet -> Relation -> Objet".
      Contenu : "${slice}"`,
    });

    const lines = response.text.split('\n').filter(l => l.includes('->'));
    const nodes: any[] = [{ id: docId, label: 'Document Principal', type: 'document' }];
    const relations: any[] = [];

    lines.forEach(line => {
      const parts = line.split('->').map(p => p.trim());
      if (parts.length === 3) {
        const [subject, predicate, object] = parts;
        const subId = subject.toLowerCase().replace(/\s+/g, '_');
        const objId = object.toLowerCase().replace(/\s+/g, '_');

        nodes.push({ id: subId, label: subject, type: 'concept' });
        nodes.push({ id: objId, label: object, type: 'entity' });
        relations.push({ from: docId, to: subId, predicate: 'décrit' });
        relations.push({ from: subId, to: objId, predicate: predicate });
      }
    });

    if (nodes.length === 1) {
      nodes.push({ id: 'technical_base', label: 'Connaissances Techniques', type: 'concept' });
      relations.push({ from: docId, to: 'technical_base', predicate: 'concerne' });
    }
    return { nodes, relations };
  } catch (e) {
    return { 
      nodes: [{ id: docId, label: 'Document', type: 'document' }], 
      relations: [] 
    };
  }
}

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
    console.log(`[FLOW][INGEST][1/4] Début du traitement : ${input.fileName}`);
    
    const chunks = chunkText(input.fileContent, 1000);
    const docId = Math.random().toString(36).substring(7);

    console.log(`[FLOW][INGEST][2/4] Segmentation : ${chunks.length} segments.`);
    
    // ANALYSES SÉMANTIQUES PARALLÈLES AVEC TIMEOUTS (Max 15s par tâche)
    console.log(`[FLOW][INGEST][3/4] Activation des analyses IA (Graphe, Hiérarchie, Embeddings)...`);
    
    const results = await Promise.allSettled([
      withTimeout(extractKnowledgeFromText(docId, input.fileContent), 15000, { nodes: [], relations: [] }),
      withTimeout(extractHierarchicalConcepts(input.fileContent.substring(0, 1000)), 12000, { nodes: [], relations: [] }),
      chunks.length > 0 ? withTimeout(ai.embedMany({
        embedder: 'ollama/nomic-embed-text',
        content: chunks.slice(0, 5),
      }), 15000, null) : Promise.resolve(null)
    ]);

    const knowledge = results[0].status === 'fulfilled' ? results[0].value : { nodes: [], relations: [] };
    const hierarchy = results[1].status === 'fulfilled' ? results[1].value : null;

    console.log(`[FLOW][INGEST][4/4] Indexation finale.`);

    return {
      docId,
      chunks: chunks.length,
      embeddingModel: 'ollama/nomic-embed-text',
      processedAt: new Date().toISOString(),
      concepts: (knowledge as any).nodes?.map((n: any) => n.label) || [],
      graphData: knowledge,
      hierarchy
    };
  }
);
