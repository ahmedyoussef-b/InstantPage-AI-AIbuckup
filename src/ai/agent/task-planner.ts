// src/ai/agent/task-planner.ts
export class TaskPlanner {
    async decompose(intention: Intention, context: AgentContext): Promise<TaskStep[]> {
      // Utiliser le LLM pour décomposer
      const prompt = `
      Intention: ${intention.type}
      Description: ${intention.description}
      
      Décompose cette intention en étapes atomiques exécutables.
      Chaque étape doit pouvoir être réalisée par un outil spécifique.
      
      Format JSON:
      [
        {
          "id": "step1",
          "description": "Vérifier les disponibilités",
          "tool": "calendar",
          "params": {},
          "dependencies": []
        },
        ...
      ]
      `;
      
      const steps = await this.callLLM(prompt);
      return JSON.parse(steps);
    }
    
    async createPlan(steps: TaskStep[], context: AgentContext): Promise<TaskPlan> {
      // 1. Vérifier les dépendances
      const withDeps = this.resolveDependencies(steps);
      
      // 2. Ordonnancer
      const ordered = this.optimizeOrder(withDeps);
      
      // 3. Ajouter des points de validation
      const withValidation = this.addValidationPoints(ordered);
      
      // 4. Estimer les ressources
      const withResources = await this.estimateResources(withValidation, context);
      
      return {
        steps: withResources,
        totalEstimatedTime: this.calculateTotalTime(withResources),
        criticalPath: this.findCriticalPath(withResources),
        fallbackPlan: await this.createFallbackPlan(withResources)
      };
    }
    
    private resolveDependencies(steps: TaskStep[]): TaskStep[] {
      // Analyser et ajouter les dépendances implicites
      return steps.map((step, index) => {
        if (step.tool === 'email' && index > 0) {
          // L'envoi d'email dépend probablement des étapes précédentes
          step.dependencies = steps.slice(0, index).map(s => s.id);
        }
        return step;
      });
    }
    
    private optimizeOrder(steps: TaskStep[]): TaskStep[] {
      // Ordonnancement pour parallélisation maximale
      const graph = this.buildDependencyGraph(steps);
      return this.topologicalSort(graph);
    }
    
    private async estimateResources(step: TaskStep, context: AgentContext): Promise<TaskStep> {
      // Estimer le temps et les ressources nécessaires
      const estimation = await this.callLLM(`
        Étape: ${step.description}
        Outil: ${step.tool}
        
        Estime:
        - Temps d'exécution (secondes)
        - Ressources nécessaires
        - Probabilité de succès
      `);
      
      return {
        ...step,
        estimatedTime: estimation.time,
        resources: estimation.resources,
        successProbability: estimation.probability
      };
    }
  }