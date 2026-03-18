import { NextRequest, NextResponse } from 'next/server';
/**
 * @fileOverview Chat API Route - Orchestrateur de l'Intelligence Hybride Elite 32.
 * Route hybride basculant dynamiquement entre le RAG Enhancée et l'Agent Autonome (MCP).
 */
import { analyzeQuery } from '@/ai/rag/query-analyzer';
import { chat } from '@/ai/flows/chat-flow';
import { processAgentMission } from '@/ai/agent/agent-core';
import { getCurrentActiveModel } from '@/ai/training/model-registry';

/**
 * Gère les interactions de chat avec détection d'intention et routage intelligent.
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, history = [], userId = 'default-user', mode = 'auto' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Le message est requis." }, { status: 400 });
    }

    // PHASE 1: COMPRENDRE - Analyse sémantique de l'intention
    const analysis = await analyzeQuery(prompt);
    
    // Logique de routage : Agent vs Chat RAG
    const useAgent = mode === 'agent' || (mode === 'auto' && (analysis.complexity > 0.75 || analysis.type === 'action'));

    let responseData;

    if (useAgent) {
      // --- BRANCHE 1: AGENT INTELLIGENT (Innovation Agentic) ---
      console.log(`[API][CHAT] Déclenchement MISSION AGENT pour: "${prompt.substring(0, 40)}..."`);
      const agentRes = await processAgentMission(prompt, userId);
      
      responseData = {
        answer: agentRes.summary,
        details: agentRes.details,
        sources: [],
        suggestions: agentRes.suggestions,
        isAgentMission: true,
        steps: agentRes.steps,
        confidence: 0.95,
        patternsLearned: agentRes.patternsLearned
      };
    } else {
      // --- BRANCHE 2: CHAT RAG ENHANCÉE (Innovation Elite 32) ---
      console.log(`[API][CHAT] Déclenchement CHAT RAG pour: "${prompt.substring(0, 40)}..."`);
      const chatRes = await chat({
        text: prompt,
        history: history,
        userId: userId
      } as any);

      responseData = {
        answer: chatRes.answer,
        sources: chatRes.sources || [],
        suggestions: chatRes.suggestions || [],
        confidence: chatRes.confidence,
        isAgentMission: false,
        pedagogicalLevel: chatRes.pedagogicalLevel,
        collaborativeInsight: chatRes.collaborativeInsight,
        recommendations: chatRes.recommendations,
        disclaimer: chatRes.disclaimer
      };
    }

    const activeModel = await getCurrentActiveModel();

    return NextResponse.json({
      ...responseData,
      learning: {
        recorded: true,
        modelVersion: activeModel.id,
        timestamp: Date.now()
      }
    });

  } catch (error: any) {
    console.error("[API][CHAT] Échec critique de l'orchestrateur hybride:", error);
    return NextResponse.json({ 
      error: "L'assistant a rencontré une difficulté technique lors de l'analyse.",
      details: error.message 
    }, { status: 500 });
  }
}
