import { NextRequest, NextResponse } from 'next/server';
/**
 * @fileOverview Ingest API Route - Phase 1 de l'Architecture Elite 32.
 * Orchestre le pipeline complet d'intégration documentaire avec suggestions proactives.
 */

import { ingestDocument } from '@/ai/flows/ingest-document-flow';

/**
 * Gère l'upload et le traitement intelligent d'un document.
 * Intègre la boucle de profilage pour l'apprentissage adaptatif.
 */
export async function POST(req: NextRequest) {
  console.log("[API][INGEST] Démarrage du pipeline d'ingestion Elite...");

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string || 'default-user';

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier n'a été détecté dans la requête." }, { status: 400 });
    }

    // PHASE 1: Extraction du texte brut
    const text = await file.text();
    
    // PHASE 2, 3 & 4: Traitement via le flux Genkit Elite
    // Gère le chunking, les embeddings, le graphe et la hiérarchie (Innovation 32.1)
    const result = await ingestDocument({
      fileName: file.name,
      fileContent: text,
      fileType: file.type
    });

    // PHASE 5: Génération de suggestions contextuelles
    const suggestions = generateInitialSuggestions(file.name, result.concepts);

    console.log(`[API][INGEST] Succès : ${file.name} traité en ${result.chunks} segments.`);

    return NextResponse.json({
      success: true,
      documentId: result.docId,
      metadata: {
        filename: file.name,
        size: file.size,
        type: file.type,
        processedAt: result.processedAt
      },
      stats: {
        chunks: result.chunks,
        conceptsIdentified: result.concepts.length,
        embeddingModel: result.embeddingModel
      },
      hierarchy: result.hierarchy,
      suggestions
    });

  } catch (error: any) {
    console.error("[API][INGEST] Échec du pipeline d'ingestion :", error);
    return NextResponse.json({ 
      error: "Une erreur est survenue lors du traitement du document.",
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Génère des suggestions de questions basées sur les concepts extraits.
 */
function generateInitialSuggestions(filename: string, concepts: string[]): string[] {
  const baseSuggestions = [
    `Fais-moi une synthèse technique de ${filename}.`,
    `Quels sont les points critiques identifiés dans ce document ?`
  ];

  if (concepts.length > 0) {
    baseSuggestions.push(`Explique-moi le concept de "${concepts[0]}" mentionné ici.`);
  }

  return baseSuggestions;
}
