// src/ai/actions/contextual-validator.ts
export class ContextualValidator {
    private safetyRules: SafetyRule[] = [];
    private contextHistory: ContextSnapshot[] = [];
    
    async validateAction(action: Action, context: any): Promise<ValidationResult> {
      // 1. Vérifications de base
      const basicChecks = await this.basicSafetyChecks(action);
      if (!basicChecks.passed) {
        return {
          valid: false,
          reason: basicChecks.reason,
          severity: 'high'
        };
      }
      
      // 2. Vérification contextuelle
      const contextCheck = await this.checkContextualRelevance(action, context);
      if (!contextCheck.relevant) {
        return {
          valid: false,
          reason: `Action hors contexte: ${contextCheck.reason}`,
          severity: 'medium'
        };
      }
      
      // 3. Vérification des précédents
      const precedentCheck = await this.checkPrecedents(action, context);
      
      // 4. Simulation rapide
      const simulation = await this.simulateAction(action, context);
      
      // 5. Analyse des risques
      const riskAnalysis = await this.analyzeRisks(action, simulation);
      
      // 6. Décision finale
      return this.makeDecision(basicChecks, contextCheck, precedentCheck, riskAnalysis);
    }
    
    private async basicSafetyChecks(action: Action): Promise<CheckResult> {
      // Règle 1: Pas de suppression sans backup
      if (action.type === 'delete' && !action.backup) {
        return { passed: false, reason: 'Suppression sans backup interdite' };
      }
      
      // Règle 2: Pas de commandes système dangereuses
      const dangerousCommands = ['rm -rf', 'format', 'dd', 'mkfs'];
      if (action.type === 'command') {
        for (const cmd of dangerousCommands) {
          if (action.command.includes(cmd)) {
            return { passed: false, reason: `Commande dangereuse détectée: ${cmd}` };
          }
        }
      }
      
      // Règle 3: Limite de taux
      if (await this.isRateLimited(action)) {
        return { passed: false, reason: 'Trop d\'actions récentes' };
      }
      
      return { passed: true };
    }
    
    private async checkContextualRelevance(action: Action, context: any): Promise<ContextCheck> {
      const prompt = `Action proposée: ${JSON.stringify(action)}
  Contexte actuel: ${JSON.stringify(context).substring(0, 500)}
  
  Cette action est-elle pertinente dans le contexte actuel?
  Considère:
  - Cohérence avec la conversation en cours
  - Moment approprié
  - État du système
  
  Réponds en JSON: {
    "relevant": boolean,
    "reason": string,
    "suggestedTiming": "immediate" | "delayed" | "never"
  }`;
      
      const response = await this.model.generate(prompt);
      return JSON.parse(response);
    }
    
    private async analyzeRisks(action: Action, simulation: any): Promise<RiskAssessment> {
      const risks = [];
      let overallRisk = 'low';
      
      // Analyser différents types de risques
      const riskTypes = ['data_loss', 'performance', 'security', 'user_experience'];
      
      for (const riskType of riskTypes) {
        const risk = await this.assessRiskType(action, riskType, simulation);
        if (risk.level !== 'low') {
          risks.push(risk);
        }
      }
      
      // Déterminer le risque global
      if (risks.some(r => r.level === 'high')) {
        overallRisk = 'high';
      } else if (risks.some(r => r.level === 'medium')) {
        overallRisk = 'medium';
      }
      
      return {
        level: overallRisk,
        risks,
        mitigation: await this.suggestMitigations(risks)
      };
    }
    
    async suggestAlternative(action: Action, validation: ValidationResult): Promise<Action | null> {
      if (validation.severity === 'high') {
        return null; // Pas d'alternative pour les actions à haut risque
      }
      
      const prompt = `Action refusée: ${JSON.stringify(action)}
  Raison: ${validation.reason}
  
  Propose une alternative plus sûre qui accomplit le même objectif:`;
      
      const alternative = await this.model.generate(prompt);
      return this.parseAction(alternative);
    }
  }