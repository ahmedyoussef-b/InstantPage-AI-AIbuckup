/**
 * @fileOverview HybridRAG - Moteur de recherche hybride (Vectoriel + Graphe + Temporel).
 * Fusionne les résultats de différentes méthodes pour un contexte optimal.
 */
import { FileSystemItem } from '@/types';
import { queryKnowledgeGraph } from '@/ai/knowledge-graph-builder';

export class HybridRAG {
  /**
   * Récupère le contexte enrichi pour une requête donnée.
   * Combine la recherche textuelle, les métadonnées temporelles et le graphe de connaissances.
   */
  async retrieve(query: string, documents: FileSystemItem[]): Promise<string> {
    const q = query.toLowerCase();
    
    // 1. Recherche "Vectorielle" (Filtrage sémantique simulé sur le contenu)
    const vectorResults = documents.filter(doc => 
      doc.content?.toLowerCase().includes(q) || 
      q.split(' ').some(word => word.length > 4 && doc.content?.toLowerCase().includes(word))
    );

    // 2. Recherche Temporelle (Priorité aux documents les plus récents)
    const temporalResults = [...documents].sort((a, b) => 
      new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime()
    ).slice(0, 2);

    // 3. Recherche dans le Graphe (Contexte thématique)
    // On extrait tous les nœuds de graphe stockés dans les métadonnées des fichiers
    const allNodes = documents.flatMap(d => (d as any).graphNodes || []);
    const graphContext = await queryKnowledgeGraph(query, allNodes);

    // 4. Fusion et Ranking (Dédoublonnage)
    const seen = new Set();
    let context = graphContext ? `${graphContext}\n\n` : "";

    // On fusionne les résultats vectoriels et temporels
    const finalDocs = [...vectorResults, ...temporalResults].filter(doc => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    }).slice(0, 5); // Top 5 documents pour ne pas saturer le contexte

    finalDocs.forEach(doc => {
      context += `--- DOCUMENT: ${doc.name} (Mis à jour le: ${new Date(doc.uploadedAt || '').toLocaleDateString('fr-FR')}) ---\n${doc.content}\n\n`;
    });

    if (finalDocs.length > 0) {
      console.log(`[AI][HYBRID-RAG] Récupération réussie : ${finalDocs.length} documents pertinents.`);
    }

    return context || "Aucun document pertinent n'a été trouvé dans la base de connaissances locale pour cette requête.";
  }
}

export const hybridRAG = new HybridRAG();
