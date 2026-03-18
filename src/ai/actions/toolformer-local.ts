/**
 * @fileOverview ToolformerLocal - Innovation 17.
 * Capacité d'auto-apprentissage et d'utilisation d'outils sans fine-tuning.
 */

import { z } from 'genkit';

export interface ToolExample {
  query: string;
  params: any;
}

export interface Tool {
  name: string;
  description: string;
  parameters: string[];
  examples: ToolExample[];
  dangerous?: boolean;
}

export interface Action {
  type: 'respond' | 'use_tool';
  tool?: string;
  params?: any;
  content?: string;
  expectedOutcome?: string;
  confidence?: number;
}

export class ToolformerLocal {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.initializeTools();
  }

  private initializeTools() {
    this.tools.set('search', {
      name: 'search',
      description: 'Rechercher des informations précises dans la base de documents locale.',
      parameters: ['query: string', 'max_results: number'],
      examples: [{ query: 'trouve la pression max', params: { query: 'pression maximale chaudière', max_results: 3 } }]
    });

    this.tools.set('calculate', {
      name: 'calculate',
      description: 'Effectuer des calculs mathématiques ou conversions d\'unités.',
      parameters: ['expression: string'],
      examples: [{ query: '15% de 2500', params: { expression: '2500 * 0.15' } }]
    });

    this.tools.set('summarize', {
      name: 'summarize',
      description: 'Résumer un long texte ou un document spécifique.',
      parameters: ['text: string', 'max_words: number'],
      examples: [{ query: 'résume ce paragraphe', params: { text: '...', max_words: 50 } }]
    });

    this.tools.set('execute_command', {
      name: 'execute_command',
      description: 'Exécuter une commande système ou un script de diagnostic.',
      parameters: ['command: string'],
      examples: [{ query: 'vérifie l\'espace disque', params: { command: 'df -h' } }],
      dangerous: true
    });
  }

  /**
   * Décide de l'action à entreprendre.
   */
  async decideAction(query: string, context: string): Promise<Action> {
    console.log("[AI][TOOLFORMER] Analyse du besoin d'outils pour:", query);

    const needsTool = await this.shouldUseTool(query);
    if (!needsTool) {
      return { type: 'respond' };
    }

    const tool = await this.selectTool(query);
    if (!tool) return { type: 'respond' };

    const params = await this.generateParams(query, tool);
    const outcome = await this.predictOutcome(tool, params);

    return {
      type: 'use_tool',
      tool: tool.name,
      params,
      expectedOutcome: outcome,
      confidence: 0.85
    };
  }

  private async shouldUseTool(query: string): Promise<boolean> {
    const q = query.toLowerCase();
    // Détection heuristique rapide pour la performance
    if (q.match(/calculer|combien|total|rechercher|trouve|résume|commande|vérifie/i)) return true;
    
    try {
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: "Tu es un sélecteur d'outils. Réponds UNIQUEMENT par 'YES' ou 'NO'.",
        prompt: `Question: "${query}"\nBesoin d'un outil externe ?`,
      });
      return response.text.toUpperCase().includes('YES');
    } catch {
      return false;
    }
  }

  private async selectTool(query: string): Promise<Tool | null> {
    const q = query.toLowerCase();
    if (q.match(/calcul|math|\d+\s*[\+\-\*\/]/i)) return this.tools.get('calculate')!;
    if (q.match(/résum|synthèse/i)) return this.tools.get('summarize')!;
    if (q.match(/recherch|trouv|fichiers|docs/i)) return this.tools.get('search')!;
    if (q.match(/commande|script|shell/i)) return this.tools.get('execute_command')!;
    return null;
  }

  private async generateParams(query: string, tool: Tool): Promise<any> {
    const { ai } = await import('@/ai/genkit');
    try {
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: `Tu es un générateur de paramètres JSON pour l'outil: ${tool.name}.`,
        prompt: `Question: "${query}"\nParamètres requis: ${tool.parameters.join(', ')}\n\nJSON:`,
      });
      const match = response.text.match(/\{.*\}/s);
      return match ? JSON.parse(match[0]) : {};
    } catch {
      return {};
    }
  }

  private async predictOutcome(tool: Tool, params: any): Promise<string> {
    return `Simulation de l'action ${tool.name} avec les paramètres ${JSON.stringify(params)}`;
  }
}

export const toolformer = new ToolformerLocal();
