/**
 * @fileOverview GraphStore - Gestionnaire de relations sémantiques entre concepts et documents.
 * Permet de lier les documents par des thématiques communes.
 * Ce module est conçu pour être exécuté côté serveur uniquement.
 */
import { ai } from '@/ai/genkit';

export interface GraphNode {
  id: string;
  type: 'document' | 'concept';
  label: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

/**
 * Extrait les concepts clés d'un texte pour enrichir le graphe de connaissances.
 * Cette fonction utilise Genkit et doit être appelée depuis un environnement serveur.
 * 
 * @param docId - L'identifiant du document source.
 * @param text - Le contenu textuel à analyser.
 * @returns Une liste de concepts extraits.
 */
export async function extractAndLink(docId: string, text: string): Promise<{ concepts: string[] }> {
  try {
    const response = await ai.generate({
      model: 'ollama/tinyllama:latest',
      system: "Tu es un extracteur de concepts techniques. Retourne uniquement une liste de 3 à 5 mots-clés importants séparés par des virgules.",
      prompt: `Extrait les concepts clés de ce texte (maximum 500 caractères) : "${text.substring(0, 500)}"`,
    });

    const concepts = response.text.split(',').map(c => c.trim().toLowerCase()).filter(c => c.length > 0);
    console.log(`[AI][GRAPH] Concepts extraits pour ${docId} :`, concepts);
    
    return { concepts: concepts.length > 0 ? concepts : ['Général'] };
  } catch (e) {
    console.warn("[AI][GRAPH] Échec extraction concepts pour le graphe, utilisation du mode dégradé.");
    return { concepts: ['Général'] };
  }
}
