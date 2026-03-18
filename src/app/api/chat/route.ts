// src/app/api/chat/route.ts - Version améliorée
import { NextRequest } from 'next/server';
import { RAGEngine } from '@/ai/rag/rag-engine';
import { AgentOrchestrator } from '@/ai/agent/agent-orchestrator';
import { LearningCollector } from '@/ai/learning/learning-collector';

export async function POST(req: NextRequest) {
  const { prompt, userId, mode = 'chat' } = await req.json();
  
  // PHASE 1: COMPRENDRE - Analyse de l'intention
  const ragEngine = new RAGEngine();
  const intention = await ragEngine.analyzeIntention(prompt, userId);
  
  // PHASE 2: RAG - Recherche contextuelle enrichie
  const context = await ragEngine.retrieveRelevantContext(prompt, userId, {
    includeDocuments: true,
    includeLearnings: true,
    includePastInteractions: true,
    includeUserProfile: true
  });
  
  let response;
  
  if (intention.requiresAgent || mode === 'agent') {
    // Mode AGENT pour intentions complexes
    const agent = new AgentOrchestrator();
    response = await agent.processComplexRequest({
      prompt,
      context,
      userId,
      intention
    });
  } else {
    // Mode CHAT standard avec RAG amélioré
    const llmResponse = await ragEngine.generateResponse({
      prompt,
      context,
      userId,
      intention
    });
    
    response = {
      text: llmResponse.text,
      sources: llmResponse.sources,
      suggestions: llmResponse.suggestions
    };
  }
  
  // PHASE 3: APPRENDRE de cette interaction
  const learningCollector = new LearningCollector();
  await learningCollector.recordInteraction({
    userId,
    prompt,
    response: response.text,
    context,
    intention,
    timestamp: Date.now()
  });
  
  // PHASE 4: Générer des suggestions personnalisées
  const suggestions = await generatePersonalizedSuggestions(userId, prompt, response);
  
  return Response.json({
    ...response,
    suggestions,
    learning: {
      recorded: true,
      modelVersion: await getCurrentModelVersion()
    }
  });
}