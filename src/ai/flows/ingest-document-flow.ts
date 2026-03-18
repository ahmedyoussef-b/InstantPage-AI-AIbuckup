'use server';
/**
 * @fileOverview Flux d'ingestion et de construction du graphe de connaissances (Logique Serveur).
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
  concepts: z.array(z.string()),
  graphData: z.any().optional(),
});
export type IngestOutput = z.infer<typeof IngestOutputSchema>;

/**
 * Extrait les concepts et entités d'un texte via LLM.
 * Cette fonction s'exécute uniquement côté serveur.
 */
async function extractKnowledgeFromText(docId: string, text: string) {
  try {
    // Utilisation d'un modèle léger pour l'extraction de graphe
    const response = await ai.generate({
      model: 'ollama/tinyllama:latest',
      system: "Tu es un extracteur de graphe de connaissances technique. Analyse le texte et identifie les 3 concepts les plus importants.",
      prompt: `Extrait les concepts clés de ce texte (max 3) et présente-les sous la forme "Concept -> Relation -> Sujet" : "${text.substring(0, 800)}"`,
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
        relations.push({ from: docId, to: subId, predicate: 'discute' });
        relations.push({ from: subId, to: objId, predicate: predicate });
      }
    });

    // Fallback si aucune ligne structurée n'est retournée
    if (nodes.length === 1) {
      nodes.push({ id: 'general_tech', label: 'Maintenance Technique', type: 'concept' });
      relations.push({ from: docId, to: 'general_tech', predicate: 'concerne' });
    }

    return { nodes, relations };
  } catch (e) {
    console.warn("[AI][KNOWLEDGE-GRAPH] Échec de l'extraction IA, passage en mode simplifié.");
    return { 
      nodes: [
        { id: docId, label: 'Document', type: 'document' },
        { id: 'auto_concept', label: 'Informations Techniques', type: 'concept' }
      ], 
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
    console.log(`[SERVER][INGEST] Traitement de : ${input.fileName}`);
    
    const chunks = chunkText(input.fileContent, 1000);
    const docId = Math.random().toString(36).substring(7);

    // Construction du Graphe de Connaissances Automatique via LLM
    const { nodes, relations } = await extractKnowledgeFromText(docId, input.fileContent);

    // Génération des Embeddings (Limité aux premiers segments pour la performance)
    if (chunks.length > 0) {
      try {
        await ai.embedMany({
          embedder: 'googleai/embedding-001',
          content: chunks.slice(0, 3),
        });
      } catch (e) {
        console.error(`[SERVER][INGEST] Erreur lors de la génération des embeddings :`, e);
      }
    }

    return {
      docId,
      chunks: chunks.length,
      embeddingModel: 'embedding-001',
      processedAt: new Date().toISOString(),
      concepts: nodes.map(n => n.label),
      graphData: { nodes, relations }
    };
  }
);
