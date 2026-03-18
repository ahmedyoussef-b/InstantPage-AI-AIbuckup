// src/ai/agent/agent-core.ts
export class IntelligentAgent {
    private mcp: ModelContextProtocol;
    private planner: TaskPlanner;
    private executor: TaskExecutor;
    private learner: AgentLearner;
    
    constructor() {
      this.mcp = new ModelContextProtocol();
      this.planner = new TaskPlanner();
      this.executor = new TaskExecutor();
      this.learner = new AgentLearner();
    }
    
    async processComplexRequest(request: string, userId: string): Promise<AgentResponse> {
      console.log("🎯 Traitement d'une intention complexe:", request);
      
      // 1. PHASE 1: COMPRENDRE l'intention via MCP
      const context = await this.mcp.gatherContext(request, userId);
      const intention = await this.mcp.analyzeIntention(request, context);
      console.log(`📋 Intention analysée: ${intention.type}, complexité: ${intention.complexity}`);
      
      // 2. PHASE 2: RAISONNER - Décomposer et planifier
      const steps = await this.planner.decompose(intention, context);
      const plan = await this.planner.createPlan(steps, context);
      console.log(`📝 Plan créé: ${plan.steps.length} étapes`);
      
      // 3. PHASE 3: AGIR - Exécuter le plan
      const executionResult = await this.executor.executePlan(plan, context);
      
      // 4. PHASE 4: APPRENDRE de l'expérience
      await this.learner.learnFromExecution({
        request,
        intention,
        plan,
        result: executionResult,
        userId
      });
      
      // 5. Générer la réponse finale
      return this.generateResponse(executionResult, plan);
    }
    
    private async generateResponse(executionResult: ExecutionResult, plan: TaskPlan): Promise<AgentResponse> {
      return {
        summary: executionResult.summary,
        details: executionResult.details,
        steps: plan.steps.map(s => ({
          description: s.description,
          status: s.status,
          result: s.result
        })),
        suggestions: await this.generateSuggestions(executionResult),
        canUndo: executionResult.reversible
      };
    }
  }