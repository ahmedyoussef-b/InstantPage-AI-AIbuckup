'use server';
/**
 * @fileOverview ToolRegistry - Innovation Elite 32.
 * Gestionnaire intelligent des outils de l'agent avec suivi de performance et recommandation.
 */

import { ai } from '@/ai/genkit';
import { AgentContext, Tool } from './mcp';

export interface ToolStats {
  usageCount: number;
  successCount: number;
  avgDuration: number;
  lastUsed: number | null;
}

export interface ToolCapability {
  type: string;
  description: string;
}

export interface ToolRecommendation {
  recommended: string | null;
  alternatives: string[];
  reason: string;
  confidence: number;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private toolStats: Map<string, ToolStats> = new Map();
  private capabilities: Map<string, ToolCapability[]> = new Map();

  registerTool(tool: Tool, capabilities: ToolCapability[]) {
    this.tools.set(tool.name, tool);
    this.capabilities.set(tool.name, capabilities);
    
    if (!this.toolStats.has(tool.name)) {
      this.toolStats.set(tool.name, {
        usageCount: 0,
        successCount: 0,
        avgDuration: 0,
        lastUsed: null
      });
    }
  }

  recordExecution(toolName: string, success: boolean, duration: number) {
    const stats = this.toolStats.get(toolName);
    if (stats) {
      stats.usageCount++;
      if (success) stats.successCount++;
      stats.avgDuration = (stats.avgDuration * (stats.usageCount - 1) + duration) / stats.usageCount;
      stats.lastUsed = Date.now();
    }
  }

  async getToolRecommendation(task: string, context: AgentContext): Promise<ToolRecommendation> {
    const requiredCap = await this.analyzeRequiredCapability(task);
    
    const candidates = Array.from(this.tools.values()).filter(tool => {
      const toolCaps = this.capabilities.get(tool.name) || [];
      return toolCaps.some(c => c.type === requiredCap);
    });

    if (candidates.length === 0) {
      return { recommended: null, alternatives: [], reason: "Aucun outil compatible.", confidence: 0 };
    }

    const scored = candidates.map(tool => ({
      name: tool.name,
      score: this.calculateToolScore(tool.name),
    }));

    scored.sort((a, b) => b.score - a.score);

    return {
      recommended: scored[0].name,
      alternatives: scored.slice(1, 3).map(s => s.name),
      reason: `Meilleur score pour la capacité: ${requiredCap}`,
      confidence: Math.round(scored[0].score * 100) / 100
    };
  }

  private async analyzeRequiredCapability(task: string): Promise<string> {
    try {
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: "TYPE: SEARCH, CALCULATION, EMAIL, CALENDAR, SUMMARIZE.",
        prompt: `Tâche: "${task}"\nTYPE REQUIS:`,
      });
      const res = response.text.toUpperCase();
      if (res.includes('SEARCH')) return 'SEARCH';
      if (res.includes('CALC')) return 'CALCULATION';
      if (res.includes('EMAIL')) return 'EMAIL';
      if (res.includes('CALENDAR')) return 'CALENDAR';
      return 'SEARCH';
    } catch {
      return 'SEARCH';
    }
  }

  private calculateToolScore(toolName: string): number {
    const stats = this.toolStats.get(toolName);
    if (!stats || stats.usageCount === 0) return 0.5;
    const successRate = stats.successCount / stats.usageCount;
    return successRate * 0.8 + 0.2;
  }
}

export const toolRegistry = new ToolRegistry();
