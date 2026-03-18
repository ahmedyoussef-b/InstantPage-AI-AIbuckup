// src/ai/agent/task-executor.ts
export class TaskExecutor {
    private mcp: ModelContextProtocol;
    private maxRetries = 3;
    
    async executePlan(plan: TaskPlan, context: AgentContext): Promise<ExecutionResult> {
      const results = [];
      const executed = new Set();
      
      for (const step of plan.steps) {
        // Vérifier si les dépendances sont satisfaites
        if (!this.dependenciesSatisfied(step, executed)) {
          console.log(`⏳ En attente des dépendances pour: ${step.description}`);
          continue;
        }
        
        // Exécuter l'étape
        console.log(`⚡ Exécution: ${step.description}`);
        const result = await this.executeStepWithRetry(step, context);
        results.push(result);
        executed.add(step.id);
        
        // Vérifier le résultat
        if (!result.success && step.critical) {
          // Échec critique - tenter le fallback
          const fallbackResult = await this.executeFallback(step, plan.fallbackPlan, context);
          if (!fallbackResult.success) {
            return this.createFailureResult(results, step);
          }
        }
        
        // Mettre à jour le contexte
        context = await this.updateContext(context, step, result);
      }
      
      return this.createSuccessResult(results, plan);
    }
    
    private async executeStepWithRetry(step: TaskStep, context: AgentContext): Promise<StepResult> {
      let lastError;
      
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          // Adapter les paramètres selon le contexte
          const adaptedParams = await this.adaptParams(step.params, context);
          
          // Exécuter via MCP
          const result = await this.mcp.executeTool(step.tool, adaptedParams);
          
          return {
            stepId: step.id,
            success: true,
            result,
            attempt
          };
        } catch (error) {
          lastError = error;
          console.log(`⚠️ Tentative ${attempt} échouée pour ${step.description}`);
          
          // Attendre avant de réessayer (backoff exponentiel)
          await this.sleep(1000 * Math.pow(2, attempt));
        }
      }
      
      return {
        stepId: step.id,
        success: false,
        error: lastError.message,
        attempts: this.maxRetries
      };
    }
    
    private async executeFallback(step: TaskStep, fallbackPlan: TaskPlan, context: AgentContext): Promise<StepResult> {
      console.log(`🔄 Tentative de fallback pour: ${step.description}`);
      
      // Chercher une alternative dans le plan de secours
      const alternative = fallbackPlan.steps.find(s => s.forStep === step.id);
      
      if (alternative) {
        return this.executeStepWithRetry(alternative, context);
      }
      
      return {
        stepId: step.id,
        success: false,
        error: 'No fallback available'
      };
    }
    
    private async adaptParams(params: any, context: AgentContext): Promise<any> {
      // Adapter les paramètres selon le contexte (dates, noms, etc.)
      const adapted = { ...params };
      
      if (params.date === 'now') {
        adapted.date = new Date().toISOString();
      }
      
      if (params.user && context.user) {
        adapted.userEmail = context.user.email;
      }
      
      return adapted;
    }
  }