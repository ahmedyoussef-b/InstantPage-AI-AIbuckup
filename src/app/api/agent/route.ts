import { NextRequest, NextResponse } from 'next/server';
/**
 * @fileOverview Agent API Route - Innovation Elite 32.
 * Point d'entrée dédié aux missions complexes nécessitant autonomie et orchestration d'outils.
 */
import { processAgentMission } from '@/ai/agent/agent-core';

/**
 * Gère les missions agentiques autonomes.
 * Déclenche le cycle : Décomposition -> Planification -> Exécution MCP -> Apprentissage.
 */
export async function POST(req: NextRequest) {
  console.log("[API][AGENT] Réception d'une nouvelle mission complexe...");

  try {
    const { request, userId = 'default-user' } = await req.json();

    if (!request) {
      return NextResponse.json(
        { error: "La description de la mission est requise." }, 
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // PHASE 1 à 4: Orchestration centrale via le cœur décisionnel fonctionnel
    // processAgentMission gère :
    // - L'analyse d'intention via MCP (Phase 1)
    // - La décomposition et planification hiérarchique (Phase 2)
    // - L'exécution résiliente des outils (Phase 3)
    // - L'apprentissage par démonstration (Phase 4)
    const missionResult = await processAgentMission(request, userId);

    const durationMs = Date.now() - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    console.log(`[API][AGENT] Mission accomplie en ${durationSec}s.`);

    return NextResponse.json({
      success: true,
      summary: missionResult.summary,
      details: missionResult.details,
      steps: missionResult.steps,
      duration: `${durationSec}s`,
      canUndo: missionResult.canUndo,
      patternsLearned: missionResult.patternsLearned,
      suggestions: missionResult.suggestions,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error("[API][AGENT] Échec critique de la mission agentique:", error);
    
    return NextResponse.json({ 
      success: false,
      error: "L'agent a rencontré une difficulté majeure lors de l'exécution.",
      details: error.message 
    }, { status: 500 });
  }
}
