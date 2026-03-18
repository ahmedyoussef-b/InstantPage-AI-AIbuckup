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

  /**
   * Enregistre un nouvel outil avec ses capacités.
   */
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

  /**
   * Met à jour les statistiques après une exécution.
   */
  recordExecution(toolName: string, success: boolean, duration: number) {
    const stats = this.toolStats.get(toolName);
    if (stats) {
      stats.usageCount++;
      if (success) stats.successCount++;
      stats.avgDuration = (stats.avgDuration * (stats.usageCount - 1) + duration) / stats.usageCount;
      stats.lastUsed = Date.now();
    }
  }

  /**
   * Recommande le meilleur outil pour une tâche spécifique.
   */
  async getToolRecommendation(task: string, context: AgentContext): Promise<ToolRecommendation> {
    console.log(`[TOOL-REGISTRY] Recherche de l'outil optimal pour: "${task.substring(0, 40)}..."`);

    // 1. Analyse LLM pour identifier les capacités requises
    const requiredCap = await this.analyzeRequiredCapability(task);
    
    // 2. Filtrer les outils compatibles
    const candidates = Array.from(this.tools.values()).filter(tool => {
      const toolCaps = this.capabilities.get(tool.name) || [];
      return toolCaps.some(c => c.type === requiredCap);
    });

    if (candidates.length === 0) {
      return {
        recommended: null,
        alternatives: [],
        reason: "Aucun outil ne correspond aux capacités requises.",
        confidence: 0
      };
    }

    // 3. Scoring par performance historique
    const scored = candidates.map(tool => ({
      name: tool.name,
      score: this.calculateToolScore(tool.name, context),
    }));

    scored.sort((a, b) => b.score - a.score);

    return {
      recommended: scored[0].name,
      alternatives: scored.slice(1, 3).map(s => s.name),
      reason: `Meilleur score de performance pour la capacité: ${requiredCap}`,
      confidence: Math.round(scored[0].score * 100) / 100
    };
  }

  private async analyzeRequiredCapability(task: string): Promise<string> {
    try {
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: "Tu es un Analyste de Capacités. Identifie le TYPE de capacité requis: SEARCH, CALCULATION, EMAIL, CALENDAR, SUMMARIZE.",
        prompt: `Tâche: "${task}"\nTYPE REQUIS:`,
      });
      
      const res = response.text.toUpperCase();
      if (res.includes('SEARCH')) return 'SEARCH';
      if (res.includes('CALC')) return 'CALCULATION';
      if (res.includes('EMAIL')) return 'EMAIL';
      if (res.includes('CALENDAR')) return 'CALENDAR';
      if (res.includes('SUMM')) return 'SUMMARIZE';
      
      return 'SEARCH'; // Défaut
    } catch {
      return 'SEARCH';
    }
  }

  private calculateToolScore(toolName: string, context: AgentContext): number {
    const stats = this.toolStats.get(toolName);
    if (!stats || stats.usageCount === 0) return 0.5; // Score neutre pour nouvel outil

    const successRate = stats.successCount / stats.usageCount;
    
    // Facteur de récence (pénalité si trop vieux et jamais réutilisé)
    const now = Date.now();
    const recencyBonus = stats.lastUsed ? Math.max(0, 1 - (now - stats.lastUsed) / (7 * 24 * 60 * 60 * 1000)) * 0.2 : 0;
    
    // Facteur de rapidité (plus c'est rapide, mieux c'est, normalisé à 2s)
    const speedBonus = Math.max(0, (2000 - stats.avgDuration) / 2000) * 0.1;

    return (successRate * 0.7) + recencyBonus + speedBonus;
  }

  /**
   * Retourne la liste des outils pour le dashboard.
   */
  getRegistrySnapshot() {
    return Array.from(this.tools.keys()).map(name => ({
      name,
      stats: this.toolStats.get(name),
      capabilities: this.capabilities.get(name)
    }));
  }
}

export const toolRegistry = new ToolRegistry();
