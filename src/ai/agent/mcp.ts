/**
 * @fileOverview Model Context Protocol (MCP) - Innovation Elite 32.
 * Gère l'unification du contexte et l'accès sécurisé aux outils pour l'agent.
 */

import { ai } from '@/ai/genkit';
import { hybridRAG } from '@/ai/hybrid-rag';

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

export interface Tool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

export class ModelContextProtocol {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Rassemble tout le contexte nécessaire à la prise de décision de l'agent.
   */
  async gatherContext(request: string, userId: string): Promise<AgentContext> {
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
  async analyzeIntention(request: string, context: AgentContext): Promise<Intention> {
    const response = await ai.generate({
      model: 'ollama/phi3:mini',
      system: "Tu es un Analyste d'Intention MCP. Détermine les besoins réels derrière la demande.",
      prompt: `Demande: "${request}"\nContexte: ${JSON.stringify(context)}\n\nRéponds en JSON STRICT: { "type": "...", "complexity": X, "description": "...", "subTasks": [], "tools": [], "constraints": [] }`,
    });

    try {
      const match = response.text.match(/\{.*\}/s);
      return match ? JSON.parse(match[0]) : this.fallbackIntention(request);
    } catch (e) {
      return this.fallbackIntention(request);
    }
  }

  /**
   * Exécute un outil via le protocole MCP.
   */
  async executeTool(toolName: string, params: any): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(toolName);

    if (!tool) {
      return { success: false, error: `Outil ${toolName} non trouvé`, duration: Date.now() - startTime };
    }

    try {
      console.log(`[MCP][TOOL] Exécution de ${toolName}...`);
      const output = await tool.execute(params);
      
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

  private registerDefaultTools() {
    this.tools.set('search', {
      name: 'search',
      description: 'Recherche technique approfondie',
      execute: async (p) => `Résultats de recherche pour ${p.query || p.expression}`
    });

    this.tools.set('email', {
      name: 'email',
      description: 'Envoi de rapports techniques',
      execute: async (p) => `Email envoyé à ${p.to || 'destinataire'}`
    });

    this.tools.set('calendar', {
      name: 'calendar',
      description: 'Gestion des interventions',
      execute: async (p) => `Intervention programmée le ${p.date || 'demain'}`
    });

    this.tools.set('calculator', {
      name: 'calculator',
      description: 'Calculs industriels complexes',
      execute: async (p) => `Résultat du calcul : ${p.expression || '0'}`
    });
  }

  private fallbackIntention(request: string): Intention {
    return {
      type: 'action',
      complexity: 5,
      description: request,
      subTasks: [request],
      tools: ['search'],
      constraints: []
    };
  }
}
