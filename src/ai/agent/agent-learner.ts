'use server';
/**
 * @fileOverview AgentLearner - Phase 4 de l'Architecture Agentic.
 * Analyse les exécutions pour en extraire des patterns de réussite et d'échec.
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

export class AgentLearner {
  /**
   * Analyse une mission terminée et consolide les apprentissages.
   */
  async learnFromExecution(experience: AgentExperience) {
    console.log(`[LEARNER] Analyse de l'expérience mission : ${experience.intention.type}`);

    const successRate = this.calculateSuccessRate(experience.result);
    let patternsLearned = 0;
    
    if (successRate > 0.8) {
      await this.recordSuccessPattern(experience);
      patternsLearned++;
    } else {
      await this.analyzeFailure(experience);
    }

    for (const step of experience.result.steps) {
      if (!step.success) {
        await this.generateAvoidanceRule(step, experience);
      }
    }

    console.log(`[LEARNER] Apprentissage consolidé (Score de réussite: ${Math.round(successRate * 100)}%)`);
    return { successRate, patternsLearned };
  }

  private calculateSuccessRate(result: ExecutionResult): number {
    if (result.steps.length === 0) return 0;
    const successful = result.steps.filter(s => s.success).length;
    return successful / result.steps.length;
  }

  private async recordSuccessPattern(exp: AgentExperience) {
    try {
      const patternDescription = `Succès pour ${exp.intention.type} : ${exp.plan.steps.map(s => s.tool).join(' -> ')}`;
      await ai.embed({
        embedder: 'googleai/embedding-001',
        content: patternDescription,
      });
    } catch (e) {}
  }

  private async analyzeFailure(exp: AgentExperience) {
    try {
      const failedSteps = exp.result.steps.filter(s => !s.success);
      const response = await ai.generate({
        model: 'ollama/phi3:mini',
        system: "Tu es un Analyste de Causes Racines IA. Identifie pourquoi le plan a échoué.",
        prompt: `Mission: ${exp.request}\nÉtapes échouées: ${JSON.stringify(failedSteps)}\nContexte: ${JSON.stringify(exp.context.constraints)}`,
      });
      console.log(`[LEARNER][INSIGHT] : ${response.text.substring(0, 100)}...`);
    } catch (e) {}
  }

  private async generateAvoidanceRule(step: StepResult, exp: AgentExperience) {
    const rule = `ÉVITER: L'outil ${step.stepId} a échoué avec l'erreur "${step.error}" dans le contexte "${exp.intention.description}".`;
    try {
      await ai.embed({
        embedder: 'googleai/embedding-001',
        content: rule,
      });
    } catch (e) {}
  }
}
