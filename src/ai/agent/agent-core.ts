import { ModelContextProtocol } from './mcp';
import { TaskPlanner } from './task-planner';
import { TaskExecutor } from './task-executor';
import { AgentLearner } from './agent-learner';

export interface AgentStep {
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
}

export interface AgentResponse {
  summary: string;
  details: string;
  steps: AgentStep[];
  suggestions: string[];
  canUndo: boolean;
}

/**
 * @fileOverview IntelligentAgent - Orchestrateur central Elite 32.
 * Unifie les phases : Comprendre -> Raisonner -> Agir -> Apprendre pour les missions complexes.
 */
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

  /**
   * Orchestre le traitement d'une demande complexe via les 4 phases cognitives.
   */
  async processComplexRequest(request: string, userId: string): Promise<AgentResponse> {
    console.log(`[AGENT][CORE] Démarrage mission Elite pour: "${request.substring(0, 50)}..."`);

    try {
      // 1. PHASE 1: COMPRENDRE - Collecte du contexte et analyse de l'intention (MCP)
      const context = await this.mcp.gatherContext(request, userId);
      const intention = await this.mcp.analyzeIntention(request, context);
      console.log(`[AGENT][PHASE-1] Intention identifiée: ${intention.type} (Complexité: ${intention.complexity}/10)`);

      // 2. PHASE 2: RAISONNER - Décomposition hiérarchique et planification
      const steps = await this.planner.decompose(intention, context);
      const plan = await this.planner.createPlan(steps, context);
      console.log(`[AGENT][PHASE-2] Plan généré avec ${plan.steps.length} étapes.`);

      // 3. PHASE 3: AGIR - Exécution du plan via les outils sécurisés MCP
      const executionResult = await this.executor.executePlan(plan, context);
      console.log(`[AGENT][PHASE-3] Exécution terminée. Succès: ${executionResult.success}`);

      // 4. PHASE 4: APPRENDRE - Analyse de l'expérience et mémorisation des patterns
      await this.learner.learnFromExecution({
        request,
        intention,
        plan,
        result: executionResult,
        userId,
        context
      });
      console.log(`[AGENT][PHASE-4] Apprentissage consolidé dans la base vectorielle.`);

      // Synthèse de la réponse finale
      return this.generateResponse(executionResult, plan);
    } catch (error: any) {
      console.error("[AGENT][ERROR] Échec de la mission complexe:", error);
      throw new Error(`Échec de l'agent: ${error.message}`);
    }
  }

  /**
   * Génère une réponse structurée incluant le rapport d'exécution et des suggestions.
   */
  private async generateResponse(executionResult: any, plan: any): Promise<AgentResponse> {
    // Suggestions proactives basées sur le résultat technique
    const suggestions = [
      "Souhaitez-vous archiver le rapport d'exécution ?",
      "Dois-je programmer un suivi pour cette opération ?",
      "Vérifier les contraintes de sécurité associées ?"
    ];

    return {
      summary: executionResult.summary || "Mission accomplie avec succès.",
      details: executionResult.details || "Toutes les étapes du plan ont été validées via le protocole MCP.",
      steps: plan.steps.map((s: any) => ({
        description: s.description,
        status: s.status,
        result: s.result
      })),
      suggestions,
      canUndo: executionResult.reversible || false
    };
  }
}
