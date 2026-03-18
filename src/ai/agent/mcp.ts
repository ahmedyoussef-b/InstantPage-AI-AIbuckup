'use server';
/**
 * @fileOverview Model Context Protocol (MCP) - Innovation Elite 32.
 * Gère l'unification du contexte et l'accès sécurisé aux outils pour l'agent.
 */

import { ai } from '@/ai/genkit';

export interface AgentContext {
  user: {
    id: string;
    email: string;
    expertise: string;
  };
  temporal: string;
  documents: string;
  history: any[];
  constraints: string[];
  request: string;
}

export interface Intention {
  type: 'organisation' | 'recherche' | 'action' | 'communication';
  complexity: number;
  description: string;
  subTasks: string[];
  tools: string[];
  constraints: string[];
}

export interface ToolResult {
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
}

/**
 * Rassemble tout le contexte nécessaire à la prise de décision de l'agent.
 */
export async function gatherContext(request: string, userId: string): Promise<AgentContext> {
  console.log(`[MCP] Collecte du contexte pour : ${userId}`);

  const temporal = new Date().toLocaleString('fr-FR');
  const documents = "Contexte documentaire extrait de la base VFS via HybridRAG.";

  const user = {
    id: userId,
    email: "tech@agentic.local",
    expertise: "expert"
  };

  return {
    user,
    temporal,
    documents,
    history: [], 
    constraints: ["Respecter les normes ISO", "Priorité à la sécurité"],
    request
  };
}

/**
 * Analyse l'intention de l'utilisateur à l'aide du LLM.
 */
export async function analyzeIntention(request: string, context: AgentContext): Promise<Intention> {
  const response = await ai.generate({
    model: 'ollama/phi3:mini',
    system: "Tu es un Analyste d'Intention MCP. Détermine les besoins réels derrière la demande.",
    prompt: `Demande: "${request}"\nContexte: ${JSON.stringify(context)}\n\nRéponds en JSON STRICT: { "type": "organisation", "complexity": 5, "description": "...", "subTasks": [], "tools": ["search"], "constraints": [] }`,
  });

  try {
    const match = response.text.match(/\{.*\}/s);
    if (match) return JSON.parse(match[0]);
  } catch (e) {}

  return {
    type: 'action',
    complexity: 5,
    description: request,
    subTasks: [request],
    tools: ['search'],
    constraints: []
  };
}

/**
 * Exécute un outil via le protocole MCP.
 */
export async function executeMCPTool(toolName: string, params: any): Promise<ToolResult> {
  const startTime = Date.now();
  console.log(`[MCP][TOOL] Exécution de ${toolName}...`);

  try {
    let output;
    switch (toolName) {
      case 'search':
        output = `Résultats de recherche pour ${params.query || params.expression}`;
        break;
      case 'email':
        output = `Email envoyé à ${params.to || 'destinataire'}`;
        break;
      case 'calendar':
        output = `Intervention programmée le ${params.date || 'demain'}`;
        break;
      case 'calculator':
        output = `Résultat du calcul : ${params.expression || '0'}`;
        break;
      default:
        throw new Error(`Outil ${toolName} non supporté`);
    }
    
    return {
      success: true,
      output,
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}
