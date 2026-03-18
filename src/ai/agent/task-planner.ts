'use server';
/**
 * @fileOverview TaskPlanner - Phase 2 de l'Architecture Agentic.
 * Gère la décomposition des intentions complexes en étapes atomiques et la planification stratégique.
 */

import { ai } from '@/ai/genkit';
import { Intention, AgentContext } from './mcp';

export interface TaskStep {
  id: string;
  description: string;
  tool: string;
  params: any;
  dependencies: string[];
  critical: boolean;
  estimatedTime?: number;
  resources?: any;
  successProbability?: number;
}

export interface TaskPlan {
  steps: TaskStep[];
  totalEstimatedTime: number;
  criticalPath: string[];
  fallbackPlan?: TaskPlan;
}

export class TaskPlanner {
  /**
   * Décompose une intention complexe en étapes atomiques exécutables via LLM.
   */
  async decompose(intention: Intention, context: AgentContext): Promise<TaskStep[]> {
    console.log(`[PLANNER] Décomposition de l'intention: ${intention.type}`);

    try {
      const response = await ai.generate({
        model: 'ollama/phi3:mini',
        system: "Tu es un Planificateur de Tâches expert. Décompose l'intention en étapes atomiques exécutables par des outils techniques (search, email, calculator, calendar).",
        prompt: `Intention: ${intention.description}
        Sous-tâches identifiées: ${intention.subTasks.join(', ')}
        Outils disponibles: ${intention.tools.join(', ')}
        Contraintes: ${intention.constraints.join(', ')}
        
        Réponds par un JSON STRICT (liste d'objets):
        [
          {
            "id": "step_1",
            "description": "Description précise",
            "tool": "un_des_outils_disponibles",
            "params": {},
            "dependencies": [],
            "critical": true
          }
        ]`,
      });

      const match = response.text.match(/\[.*\]/s);
      return match ? JSON.parse(match[0]) : [];
    } catch (e) {
      console.error("[PLANNER] Erreur lors de la décomposition:", e);
      return [{
        id: 'fallback',
        description: intention.description,
        tool: intention.tools[0] || 'search',
        params: { query: intention.description },
        dependencies: [],
        critical: true
      }];
    }
  }

  /**
   * Crée un plan d'action structuré avec dépendances et estimations.
   */
  async createPlan(steps: TaskStep[], context: AgentContext): Promise<TaskPlan> {
    console.log(`[PLANNER] Structuration du plan (${steps.length} étapes).`);

    // 1. Enrichissement des étapes avec des métriques (Innovation 18)
    const enrichedSteps = await Promise.all(
      steps.map(async (step) => {
        const metrics = await this.estimateStepMetrics(step);
        return { ...step, ...metrics };
      })
    );

    // 2. Calcul du chemin critique (étapes marquées comme critiques)
    const criticalPath = enrichedSteps
      .filter(s => s.critical)
      .map(s => s.id);

    // 3. Calcul du temps total
    const totalTime = enrichedSteps.reduce((acc, s) => acc + (s.estimatedTime || 0), 0);

    return {
      steps: enrichedSteps,
      totalEstimatedTime: totalTime,
      criticalPath,
      fallbackPlan: this.generateFallbackPlan(enrichedSteps)
    };
  }

  private async estimateStepMetrics(step: TaskStep): Promise<{ estimatedTime: number, successProbability: number }> {
    try {
      const response = await ai.generate({
        model: 'ollama/tinyllama:latest',
        system: "Réponds en JSON: {\"time\": secondes, \"prob\": 0.X}",
        prompt: `Estime le temps et la probabilité de succès pour: "${step.description}" utilisant l'outil "${step.tool}".`,
      });
      const match = response.text.match(/\{.*\}/s);
      if (match) {
        const data = JSON.parse(match[0]);
        return {
          estimatedTime: data.time || 45,
          successProbability: data.prob || 0.85
        };
      }
    } catch {
      // Ignorer l'erreur LLM d'estimation
    }
    return { estimatedTime: 60, successProbability: 0.8 };
  }

  private generateFallbackPlan(steps: TaskStep[]): TaskPlan {
    return {
      steps: steps.map(s => ({ ...s, id: `${s.id}_retry`, description: `Tentative de secours: ${s.description}` })),
      totalEstimatedTime: 0,
      criticalPath: []
    };
  }
}
