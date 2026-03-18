'use server';
/**
 * @fileOverview AgenticLoop - Orchestrateur de missions complexes.
 * Gère le cycle : Intention -> Plan -> Exécution (MCP) -> Apprentissage.
 */

import { getHierarchicalPlan, formatHierarchicalPlan } from '@/ai/actions/hierarchical-planner';
import { executeMCPTool } from '@/ai/mcp/service';
import { extractPoliciesFromHistory } from '@/ai/actions/demonstration-learner';

export interface AgentMissionResult {
  mission: string;
  stepsTaken: any[];
  finalResponse: string;
  plan: any;
  learnedPatternsCount: number;
}

/**
 * Exécute une boucle agentic complète.
 */
export async function runAgenticLoop(query: string, context: string): Promise<AgentMissionResult> {
  console.log(`[AGENT] Démarrage de la mission : "${query.substring(0, 50)}..."`);

  // PHASE 1 & 2 : Compréhension et Planification Hiérarchique
  const plan = await getHierarchicalPlan(query, context);
  const formattedPlan = await formatHierarchicalPlan(plan);

  const stepsTaken = [];
  
  // PHASE 3 : Exécution séquencée (MCP Tools)
  // Note: Dans ce prototype, on simule l'exécution des étapes du plan
  for (const step of plan.steps) {
    console.log(`[AGENT] Exécution de l'étape : ${step.description}`);
    
    // Identification de l'outil nécessaire via heuristique
    let toolName = 'search';
    if (step.description.toLowerCase().includes('calcul')) toolName = 'calculate';
    if (step.description.toLowerCase().includes('résum')) toolName = 'summarize';

    const result = await executeMCPTool(toolName, { query: step.description }, context);
    stepsTaken.push({
      description: step.description,
      status: result.success ? 'completed' : 'failed',
      output: result.output,
      error: result.error
    });
  }

  // PHASE 4 : Apprentissage par Démonstration
  // Simulation d'extraction de pattern
  const demoHistory = stepsTaken.map(s => ({
    timestamp: Date.now(),
    context: { query },
    action: { tool: 'multi-step-agent' },
    result: s
  }));
  const learnedPolicies = await extractPoliciesFromHistory(demoHistory);

  return {
    mission: query,
    stepsTaken,
    plan,
    learnedPatternsCount: learnedPolicies.length,
    finalResponse: `Mission terminée. ${stepsTaken.filter(s => s.status === 'completed').length}/${stepsTaken.length} étapes réussies.\n\n${formattedPlan}`
  };
}
