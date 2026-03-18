'use server';
/**
 * @fileOverview IntelligentAgent Core - Orchestrateur central Elite 32.
 * Unifie les phases : Comprendre -> Raisonner -> Agir -> Apprendre.
 * Version stabilisée pour l'exécution asynchrone (Next.js 15).
 */

import { gatherContext, analyzeIntention } from './mcp';
import { decomposeIntention, createTaskPlan } from './task-planner';
import { executeTaskPlan } from './task-executor';
import { learnFromExecution } from './agent-learner';

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
  patternsLearned: number;
  confidence: number;
}

/**
 * Orchestre le traitement d'une demande complexe via les 4 phases cognitives.
 */
export async function processAgentMission(request: string, userId: string): Promise<AgentResponse> {
  console.log(`[AGENT][CORE] Démarrage mission Elite pour: "${request.substring(0, 50)}..."`);

  try {
    // 1. PHASE 1: COMPRENDRE - Collecte du contexte et analyse de l'intention (MCP)
    const context = await gatherContext(request, userId);
    const intention = await analyzeIntention(request, context);
    console.log(`[AGENT][PHASE-1] Intention identifiée: ${intention.type} (Complexité: ${intention.complexity}/10)`);

    // 2. PHASE 2: RAISONNER - Décomposition hiérarchique et planification
    const steps = await decomposeIntention(intention, context);
    const plan = await createTaskPlan(steps, context);
    console.log(`[AGENT][PHASE-2] Plan généré avec ${plan.steps.length} étapes.`);

    // 3. PHASE 3: AGIR - Exécution du plan via les outils sécurisés MCP
    const executionResult = await executeTaskPlan(plan, context);
    console.log(`[AGENT][PHASE-3] Exécution terminée. Succès: ${executionResult.success}`);

    // 4. PHASE 4: APPRENDRE - Analyse de l'expérience et mémorisation des patterns
    const learningResults = await learnFromExecution({
      request,
      intention,
      plan,
      result: executionResult,
      userId,
      context
    });
    console.log(`[AGENT][PHASE-4] Apprentissage consolidé dans la base vectorielle.`);

    // Synthèse de la réponse finale
    return {
      summary: executionResult.summary || "Mission accomplie avec succès.",
      details: executionResult.details || "Toutes les étapes du plan ont été validées via le protocole MCP.",
      steps: plan.steps.map((s: any) => ({
        description: s.description,
        status: s.status,
        result: s.result
      })),
      suggestions: [
        "Souhaitez-vous archiver le rapport d'exécution ?",
        "Dois-je programmer un suivi pour cette opération ?",
        "Vérifier les contraintes de sécurité associées ?"
      ],
      canUndo: executionResult.reversible || false,
      patternsLearned: learningResults.patternsLearned,
      confidence: 0.95
    };
  } catch (error: any) {
    console.error("[AGENT][ERROR] Échec de la mission complexe:", error);
    throw new Error(`Échec de l'agent: ${error.message}`);
  }
}
