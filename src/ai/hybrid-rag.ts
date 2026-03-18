/**
 * @fileOverview HybridRAG - Moteur de recherche hybride (Vectoriel + Graphe + Temporel).
 * Fusionne les résultats de différentes méthodes pour un contexte optimal.
 */
import { FileSystemItem } from '@/types';

export class HybridRAG {
  /**
   * Récupère le contexte enrichi pour une requête donnée.
   */
  async retrieve(query: string, documents: FileSystemItem[]): Promise<string> {
    const q = query.toLowerCase();
    
    // 1. Recherche Vectorielle (Simulée par filtrage sémantique sur le contenu)
    const vectorResults = documents.filter(doc => 
      doc.content?.toLowerCase().includes(q) || 
      q.split(' ').some(word => word.length > 3 && doc.content?.toLowerCase().includes(word))
    );

    // 2. Recherche Temporelle (Priorité aux documents récents)
    const temporalResults = [...documents].sort((a, b) => 
      new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime()
    ).slice(0, 2);

    // 3. Fusion et Ranking
    const seen = new Set();
    let context = "";

    // On fusionne les résultats vectoriels et temporels
    const finalDocs = [...vectorResults, ...temporalResults].filter(doc => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    }).slice(0, 5);

    finalDocs.forEach(doc => {
      context += `--- DOCUMENT: ${doc.name} (Mis à jour: ${doc.uploadedAt}) ---\n${doc.content}\n\n`;
    });

    console.log(`[AI][HYBRID-RAG] Context enrichi avec ${finalDocs.length} documents.`);
    return context || "Aucun document pertinent trouvé dans la base de connaissances.";
  }
}

export const hybridRAG = new HybridRAG();
