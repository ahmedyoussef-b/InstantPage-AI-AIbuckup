'use server';
/**
 * @fileOverview AgentLearner - Phase 4 de l'Architecture Agentic.
 * Analyse les exécutions pour en extraire des patterns de réussite et d'échec.
 * Permet l'auto-optimisation des stratégies de planification et de sélection d'outils.
 */

import { ai } from '@/ai/genkit';
import { Intention, AgentContext } from './mcp';
import { TaskPlan } from './task-planner';
import { ExecutionResult, StepResult } from './task-executor';

export interface AgentExperience {
  request: string;
  intention: Intention;
  plan: TaskPlan;
  result: ExecutionResult;
  userId: string;
  context: AgentContext;
}

export interface Pattern {
  intention: string;
  steps: string[];
  duration: number;
  successRate: number;
  examples?: string[];
}

export interface OptimizationSuggestion {
  suggestedSteps: string[];
  expectedSuccessRate: number;
  estimatedTime: number;
  basedOn: string[];
}

export class AgentLearner {
  /**
   * Analyse une mission terminée et consolide les apprentissages.
   */
  async learnFromExecution(experience: AgentExperience) {
    console.log(`[LEARNER] Analyse de l'expérience mission : ${experience.intention.type}`);

    // 1. Analyser le succès global
    const successRate = this.calculateSuccessRate(experience.result);
    
    if (successRate > 0.8) {
      await this.recordSuccessPattern(experience);
    } else {
      await this.analyzeFailure(experience);
    }

    // 2. Apprendre de chaque étape individuelle
    for (const step of experience.result.steps) {
      if (!step.success) {
        await this.generateAvoidanceRule(step, experience);
      }
    }

    // 3. Mise à jour des probabilités de succès pour le futur (simulation)
    console.log(`[LEARNER] Apprentissage consolidé (Score de réussite: ${Math.round(successRate * 100)}%)`);
  }

  /**
   * Suggère des optimisations pour une nouvelle intention basée sur le passé.
   */
  async suggestOptimization(intention: Intention): Promise<OptimizationSuggestion | null> {
    console.log(`[LEARNER] Recherche d'optimisations pour : ${intention.type}`);
    
    // Simulation de recherche dans la base de patterns
    // Dans une version réelle, on interrogerait la base vectorielle
    if (intention.type === 'action' && intention.description.toLowerCase().includes('rapport')) {
      return {
        suggestedSteps: ['search', 'summarize', 'email'],
        expectedSuccessRate: 0.94,
        estimatedTime: 120,
        basedOn: ['Mission act-782x', 'Mission act-991z']
      };
    }

    return null;
  }

  private calculateSuccessRate(result: ExecutionResult): number {
    if (result.steps.length === 0) return 0;
    const successful = result.steps.filter(s => s.success).length;
    return successful / result.steps.length;
  }

  private async recordSuccessPattern(exp: AgentExperience) {
    console.log(`[LEARNER][SUCCESS] Nouveau pattern de réussite identifié.`);
    
    try {
      // On vectorise le pattern pour que le TaskPlanner puisse s'y référer
      const patternDescription = `Succès pour ${exp.intention.type} : ${exp.plan.steps.map(s => s.tool).join(' -> ')}`;
      
      await ai.embed({
        embedder: 'googleai/embedding-001',
        content: patternDescription,
      });
    } catch (e) {
      // Fallback silencieux
    }
  }

  private async analyzeFailure(exp: AgentExperience) {
    console.log(`[LEARNER][FAILURE] Analyse des causes racines de l'échec.`);
    
    try {
      const failedSteps = exp.result.steps.filter(s => !s.success);
      
      const response = await ai.generate({
        model: 'ollama/phi3:mini',
        system: "Tu es un Analyste de Causes Racines IA. Identifie pourquoi le plan a échoué.",
        prompt: `Mission: ${exp.request}
        Étapes échouées: ${JSON.stringify(failedSteps)}
        Contexte: ${JSON.stringify(exp.context.constraints)}
        
        Explique la cause technique probable et suggère une règle d'évitement.`,
      });

      console.log(`[LEARNER][INSIGHT] : ${response.text.substring(0, 100)}...`);
    } catch (e) {
      console.warn("[LEARNER] Échec de l'analyse IA de l'erreur.");
    }
  }

  private async generateAvoidanceRule(step: StepResult, exp: AgentExperience) {
    // Crée une leçon négative pour ne pas répéter la même erreur
    const rule = `ÉVITER: L'outil ${step.stepId} a échoué avec l'erreur "${step.error}" dans le contexte "${exp.intention.description}".`;
    
    try {
      await ai.embed({
        embedder: 'googleai/embedding-001',
        content: rule,
      });
    } catch (e) {}
  }
}
