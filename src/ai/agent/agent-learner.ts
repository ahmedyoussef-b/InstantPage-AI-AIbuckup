// src/ai/agent/agent-learner.ts
export class AgentLearner {
    private successPatterns: Map<string, Pattern> = new Map();
    private failurePatterns: Map<string, Pattern> = new Map();
    
    async learnFromExecution(experience: AgentExperience) {
      // 1. Analyser le succès global
      const success = this.analyzeSuccess(experience);
      
      if (success.rate > 0.8) {
        // Pattern réussi - à renforcer
        await this.recordSuccessPattern(experience);
      } else {
        // Pattern à améliorer
        await this.recordFailurePattern(experience);
      }
      
      // 2. Apprendre de chaque étape
      for (const step of experience.result.steps) {
        await this.learnFromStep(step, experience);
      }
      
      // 3. Mettre à jour les stratégies de décomposition
      await this.updateDecompositionStrategies(experience);
      
      // 4. Améliorer la sélection des outils
      await this.updateToolSelection(experience);
    }
    
    private async recordSuccessPattern(experience: AgentExperience) {
      const pattern = {
        intention: experience.intention.type,
        steps: experience.plan.steps.map(s => s.tool),
        duration: experience.result.duration,
        successRate: 1.0
      };
      
      const key = `${experience.intention.type}-${pattern.steps.join('→')}`;
      this.successPatterns.set(key, pattern);
      
      // Stocker dans la base vectorielle
      await this.vectorDB.insert({
        collection: 'agent_patterns',
        vector: await this.getEmbedding(experience.request),
        metadata: {
          type: 'success',
          pattern,
          timestamp: Date.now()
        }
      });
    }
    
    private async learnFromStep(step: StepResult, experience: AgentExperience) {
      if (!step.success) {
        // Analyser l'échec
        const analysis = await this.analyzeFailure(step, experience);
        
        // Générer une règle d'évitement
        const rule = await this.generateAvoidanceRule(step, analysis);
        
        await this.storeRule(rule);
      }
    }
    
    private async analyzeFailure(step: StepResult, experience: AgentExperience): Promise<FailureAnalysis> {
      const prompt = `
      Étape échouée: ${step.stepId}
      Erreur: ${step.error}
      Contexte: ${JSON.stringify(experience.context)}
      
      Analyse la cause de l'échec:
      1. Problème d'outil?
      2. Paramètres incorrects?
      3. Timing inapproprié?
      4. Contraintes non respectées?
      
      Suggère une amélioration.
      `;
      
      const analysis = await this.callLLM(prompt);
      return JSON.parse(analysis);
    }
    
    private async updateDecompositionStrategies(experience: AgentExperience) {
      // Améliorer la façon de décomposer ce type de demande
      if (experience.result.success) {
        // La décomposition a bien fonctionné
        await this.reinforceDecomposition(experience.intention.type, experience.plan);
      } else {
        // La décomposition doit être améliorée
        await this.adjustDecomposition(experience);
      }
    }
    
    async suggestOptimization(intention: Intention): Promise<OptimizationSuggestion | null> {
      // Chercher des patterns similaires
      const similarPatterns = await this.findSimilarPatterns(intention);
      
      if (similarPatterns.length > 0) {
        const bestPattern = similarPatterns[0];
        
        return {
          suggestedSteps: bestPattern.steps,
          expectedSuccessRate: bestPattern.successRate,
          estimatedTime: bestPattern.duration,
          basedOn: bestPattern.examples
        };
      }
      
      return null;
    }
  }