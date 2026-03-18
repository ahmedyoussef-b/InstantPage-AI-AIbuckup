/**
 * @fileOverview KnowledgeGraphBuilder - Consultation du graphe de connaissances local.
 * Les fonctions d'extraction lourdes (Genkit) sont isolées dans les flux serveurs.
 */

export interface GraphNode {
  id: string;
  label: string;
  type: 'concept' | 'entity' | 'document';
}

export interface GraphRelation {
  from: string;
  to: string;
  predicate: string;
}

/**
 * Recherche dans le graphe pour enrichir le contexte.
 * Utilisable côté client car ne dépend d'aucune librairie Node.js ou Genkit.
 */
export async function queryKnowledgeGraph(query: string, availableNodes: any[]): Promise<string> {
  if (!availableNodes || availableNodes.length === 0) return "";
  
  const q = query.toLowerCase();
  const relevantNodes = availableNodes.filter(node => 
    q.includes(node.label.toLowerCase()) || node.label.toLowerCase().includes(q)
  );

  if (relevantNodes.length === 0) return "";

  const concepts = relevantNodes.map(n => n.label).join(', ');
  return `CONNAISSANCES LIÉES (Graphe) : Cette question touche aux concepts suivants : ${concepts}.`;
}
