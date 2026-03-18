import { ModelContextProtocol, AgentContext } from './mcp';
import { TaskPlan, TaskStep } from './task-planner';

export interface StepResult {
  stepId: string;
  success: boolean;
  output?: any;
  error?: string;
  attempts: number;
  duration: number;
}

export interface ExecutionResult {
  success: boolean;
  steps: StepResult[];
  summary: string;
  details: string;
  duration: number;
  reversible: boolean;
}

/**
 * @fileOverview TaskExecutor - Phase 3 de l'Architecture Agentic.
 * Gère l'exécution résiliente et adaptative du plan d'action via MCP.
 */
export class TaskExecutor {
  private mcp: ModelContextProtocol;
  private maxRetries = 3;

  constructor() {
    this.mcp = new ModelContextProtocol();
  }

  /**
   * Exécute un plan complet de manière adaptative en respectant les dépendances.
   */
  async executePlan(plan: TaskPlan, context: AgentContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results: StepResult[] = [];
    const executedSteps = new Set<string>();
    
    console.log(`[EXECUTOR] DÉMARRAGE MISSION : ${plan.steps.length} étapes à traiter.`);

    for (const step of plan.steps) {
      if (!this.areDependenciesSatisfied(step, executedSteps)) {
        console.warn(`[EXECUTOR] Étape ${step.id} reportée : Dépendances manquantes.`);
        continue;
      }

      const result = await this.executeStepWithRetry(step, context);
      results.push(result);
      
      (step as any).status = result.success ? 'completed' : 'failed';
      (step as any).result = result.output || result.error;

      if (result.success) {
        executedSteps.add(step.id);
        context = this.updateContextWithResult(context, step, result);
      } else if (step.critical) {
        console.error(`[EXECUTOR] Échec critique à l'étape ${step.id}. Activation du plan de secours.`);
        const fallbackResult = await this.handleFallback(step, plan, context);
        
        if (!fallbackResult.success) {
          return this.finalizeExecution(results, startTime, false, `Interruption : Échec critique non récupérable à l'étape ${step.id}`);
        }
        
        results.push(fallbackResult);
        executedSteps.add(step.id);
      }
    }

    const allCriticalPassed = plan.steps
      .filter(s => s.critical)
      .every(s => executedSteps.has(s.id));

    return this.finalizeExecution(
      results, 
      startTime, 
      allCriticalPassed, 
      allCriticalPassed ? "Mission accomplie avec succès via MCP." : "Mission partiellement accomplie."
    );
  }

  private areDependenciesSatisfied(step: TaskStep, executed: Set<string>): boolean {
    if (!step.dependencies || step.dependencies.length === 0) return true;
    return step.dependencies.every(depId => executed.has(depId));
  }

  private async executeStepWithRetry(step: TaskStep, context: AgentContext): Promise<StepResult> {
    let lastError = "";
    const startStepTime = Date.now();

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[EXECUTOR] Step: ${step.description} | Tool: ${step.tool} (Essai ${attempt})`);
        
        const adaptedParams = this.adaptParamsToContext(step.params, context);
        const toolResult = await this.mcp.executeTool(step.tool, adaptedParams);

        if (toolResult.success) {
          return {
            stepId: step.id,
            success: true,
            output: toolResult.output,
            attempts: attempt,
            duration: Date.now() - startStepTime
          };
        }
        
        lastError = toolResult.error || "Erreur outil inconnue";
      } catch (e: any) {
        lastError = e.message;
      }

      if (attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 800;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      stepId: step.id,
      success: false,
      error: lastError,
      attempts: this.maxRetries,
      duration: Date.now() - startStepTime
    };
  }

  private async handleFallback(step: TaskStep, plan: TaskPlan, context: AgentContext): Promise<StepResult> {
    if (!plan.fallbackPlan) {
      return { stepId: `${step.id}_err`, success: false, error: "Pas de plan de repli", attempts: 0, duration: 0 };
    }

    const fallbackStep = plan.fallbackPlan.steps.find(s => s.id.includes(step.id));
    if (!fallbackStep) return { stepId: `${step.id}_err`, success: false, error: "Step de secours absent", attempts: 0, duration: 0 };

    return this.executeStepWithRetry(fallbackStep, context);
  }

  private adaptParamsToContext(params: any, context: AgentContext): any {
    const adapted = { ...(params || {}) };
    if (context.temporal) adapted.timestamp = context.temporal;
    if (context.user) adapted.caller = context.user.email;
    return adapted;
  }

  private updateContextWithResult(context: AgentContext, step: TaskStep, result: StepResult): AgentContext {
    return {
      ...context,
      documents: context.documents + `\n[Résultat ${step.id}]: ${JSON.stringify(result.output)}`,
      history: [...(context.history || []), { step: step.id, success: true }]
    };
  }

  private finalizeExecution(results: StepResult[], startTime: number, success: boolean, summary: string): ExecutionResult {
    const duration = Date.now() - startTime;
    const details = results.map(r => 
      `${r.success ? '✅' : '❌'} [${r.stepId}] ${r.success ? 'OK' : 'FAIL: ' + r.error} (${r.attempts} essai(s))`
    ).join('\n');

    return {
      success,
      steps: results,
      summary,
      details,
      duration,
      reversible: success
    };
  }
}
