/**
 * @fileOverview KnowledgeGraphBuilder - Consultation du graphe de connaissances local.
 * Les fonctions d'extraction lourdes ont été déplacées dans les flux serveurs.
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
 * Utilisable côté client car ne dépend pas de Genkit.
 */
export async function queryKnowledgeGraph(query: string, availableNodes: any[]): Promise<string> {
  if (!availableNodes || availableNodes.length === 0) return "";
  
  const q = query.toLowerCase();
  const relevantNodes = availableNodes.filter(node => 
    q.includes(node.label.toLowerCase()) || node.label.toLowerCase().includes(q)
  );

  if (relevantNodes.length === 0) return "";

  return `CONNAISSANCES LIÉES (Graphe) : ${relevantNodes.map(n => n.label).join(', ')}.`;
}
