// src/ai/agent/tool-registry.ts
export class ToolRegistry {
    private tools: Map<string, Tool> = new Map();
    private toolStats: Map<string, ToolStats> = new Map();
    
    registerTool(tool: Tool) {
      this.tools.set(tool.name, tool);
      this.toolStats.set(tool.name, {
        usageCount: 0,
        successCount: 0,
        avgDuration: 0,
        lastUsed: null
      });
    }
    
    async getBestToolForTask(task: string, context: AgentContext): Promise<Tool | null> {
      // 1. Analyser la tâche
      const requiredCapabilities = await this.analyzeTask(task);
      
      // 2. Trouver les outils compatibles
      const candidates = Array.from(this.tools.values())
        .filter(tool => this.matchesCapabilities(tool, requiredCapabilities));
      
      if (candidates.length === 0) return null;
      
      // 3. Classer par performance historique
      const scored = candidates.map(tool => ({
        tool,
        score: this.calculateToolScore(tool, context)
      }));
      
      scored.sort((a, b) => b.score - a.score);
      
      return scored[0].tool;
    }
    
    private calculateToolScore(tool: Tool, context: AgentContext): number {
      const stats = this.toolStats.get(tool.name);
      if (!stats || stats.usageCount === 0) return 0.5;
      
      // Facteurs de score
      const successRate = stats.successCount / stats.usageCount;
      const recency = stats.lastUsed ? 
        Math.min(1, (Date.now() - stats.lastUsed) / (7 * 24 * 60 * 60 * 1000)) : 0.5;
      const speed = Math.min(1, 1000 / stats.avgDuration); // Plus rapide = mieux
      
      return (successRate * 0.5) + (recency * 0.2) + (speed * 0.3);
    }
    
    async getToolRecommendation(task: string): Promise<ToolRecommendation> {
      const tool = await this.getBestToolForTask(task, {});
      
      if (!tool) {
        return {
          recommended: null,
          alternatives: [],
          reason: "Aucun outil trouvé"
        };
      }
      
      const alternatives = Array.from(this.tools.values())
        .filter(t => t.name !== tool.name)
        .slice(0, 3);
      
      return {
        recommended: tool.name,
        alternatives: alternatives.map(a => a.name),
        reason: "Meilleur score basé sur performance historique"
      };
    }
  }