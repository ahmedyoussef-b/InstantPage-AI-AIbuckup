import { NextRequest, NextResponse } from 'next/server';
/**
 * @fileOverview Ingest API Route - Phase 1 de l'Architecture Elite 32.
 * Orchestre le pipeline complet d'intégration documentaire avec suggestions proactives.
 */
import { ingestDocument } from '@/ai/flows/ingest-document-flow';
import { implicitRL } from '@/ai/learning/implicit-rl';

export const maxDuration = 60; // Autorise jusqu'à 60 secondes pour le traitement IA lourd

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

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier valide n'a été détecté dans la requête." }, { status: 400 });
    }

    console.log(`[API][INGEST_START] Traitement du fichier : ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // PHASE 1: Extraction du texte brut
    let text = "";
    try {
      text = await file.text();
    } catch (e) {
      return NextResponse.json({ error: "Impossible de lire le contenu du fichier." }, { status: 400 });
    }
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Le fichier est vide ou corrompu." }, { status: 400 });
    }

    // PHASE 2, 3 & 4: Traitement via le flux Genkit Elite (Chunking, Graphe, Hiérarchie, Embeddings)
    // Les tâches lourdes sont parallélisées dans le flow pour éviter le timeout
    const result = await ingestDocument({
      fileName: file.name,
      fileContent: text,
      fileType: file.type
    });

    console.log(`[API][INGEST_SUCCESS] Flux terminé. Doc ID: ${result.docId}, Chunks: ${result.chunks}`);

    // PHASE 5: Signal d'apprentissage pour le profilage utilisateur (Innovation 26)
    const isTechnical = (result.concepts?.length || 0) > 5;
    try {
      await implicitRL.processSignal('USAGE', { isTechnical, modelUsed: result.embeddingModel });
    } catch (e) {
      console.warn("[API][INGEST] Échec signal ImplicitRL, non bloquant.");
    }

    // Génération de suggestions contextuelles
    const suggestions = generateInitialSuggestions(file.name, result.concepts || []);

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
        conceptsIdentified: result.concepts?.length || 0,
        embeddingModel: result.embeddingModel
      },
      hierarchy: result.hierarchy,
      suggestions
    });

  } catch (error: any) {
    console.error("[API][INGEST] Échec critique du pipeline :", error);
    return NextResponse.json({ 
      error: "Le traitement a pris trop de temps ou le service IA est indisponible.",
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

  if (concepts && concepts.length > 0) {
    baseSuggestions.push(`Explique-moi le concept de "${concepts[0]}" mentionné ici.`);
  }

  return baseSuggestions;
}
