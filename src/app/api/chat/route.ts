import { NextRequest, NextResponse } from 'next/server';
/**
 * @fileOverview Chat API Route - Orchestrateur de l'Intelligence Hybride Elite 32.
 * Route hybride basculant dynamiquement entre le RAG Enhancée et l'Agent Autonome (MCP).
 */
import { analyzeQuery } from '@/ai/rag/query-analyzer';
import { chat } from '@/ai/flows/chat-flow';
import { processAgentMission } from '@/ai/agent/agent-core';
import { getCurrentActiveModel } from '@/ai/training/model-registry';
import { implicitRL } from '@/ai/learning/implicit-rl';

export async function POST(req: NextRequest) {
  console.log("[API][CHAT] Nouvelle requête reçue.");

  try {
    const { prompt, history = [], userId = 'default-user', mode = 'auto' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Le message est requis." }, { status: 400 });
    }

    // PHASE 1: COMPRENDRE - Analyse sémantique de l'intention
    console.log(`[API][CHAT] Phase 1 : Analyse de l'intention...`);
    const analysis = await analyzeQuery(prompt);
    
    // Logique de routage : Agent vs Chat RAG
    const useAgent = mode === 'agent' || (mode === 'auto' && (analysis.complexity > 0.75 || analysis.type === 'action'));
    console.log(`[API][CHAT] Stratégie sélectionnée : ${useAgent ? 'MISSION AGENT' : 'CHAT RAG'}`);

    let responseData;

    if (useAgent) {
      // --- BRANCHE 1: AGENT INTELLIGENT (Mission Autonome MCP) ---
      console.log(`[API][CHAT] Déclenchement de l'agent missionnaire...`);
      const agentRes = await processAgentMission(prompt, userId);
      
      responseData = {
        answer: agentRes.summary,
        details: agentRes.details,
        sources: [],
        suggestions: agentRes.suggestions,
        isAgentMission: true,
        steps: agentRes.steps,
        confidence: agentRes.confidence,
        patternsLearned: agentRes.patternsLearned
      };
    } else {
      // --- BRANCHE 2: CHAT RAG ENHANCÉE (Raisonnement Métacognitif) ---
      console.log(`[API][CHAT] Déclenchement du flux RAG Elite...`);
      
      // Charger le profil utilisateur pour adapter la réponse (Implicit RL)
      implicitRL.loadProfile();
      
      const chatRes = await chat({
        text: prompt,
        history: history,
        userProfile: implicitRL.getProfile()
      } as any);

      responseData = {
        answer: chatRes.answer,
        sources: chatRes.sources || [],
        suggestions: chatRes.suggestions || [],
        confidence: chatRes.confidence || 0.8,
        isAgentMission: false,
        pedagogicalLevel: chatRes.pedagogicalLevel,
        collaborativeInsight: chatRes.collaborativeInsight,
        recommendations: chatRes.recommendations,
        disclaimer: chatRes.disclaimer,
        newMemoryEpisode: chatRes.newMemoryEpisode
      };
    }

    // Récupérer le modèle actif pour le reporting
    const activeModel = await getCurrentActiveModel();
    console.log(`[API][CHAT] Réponse prête (Modèle: ${activeModel.id}).`);

    return NextResponse.json({
      ...responseData,
      learning: {
        recorded: true,
        modelVersion: activeModel.id,
        timestamp: Date.now()
      }
    });

  } catch (error: any) {
    console.error("[API][CHAT] Échec critique de l'orchestrateur hybride :", error);
    return NextResponse.json({ 
      error: "L'assistant a rencontré une difficulté technique lors de l'analyse.",
      details: error.message 
    }, { status: 500 });
  }
}
