'use server';
/**
 * @fileOverview QueryAnalyzer - Intelligence sémantique de la Phase 1.
 * Analyse et structure les demandes utilisateur pour optimiser le processus RAG.
 */

import { ai } from '@/ai/genkit';

export type QueryType = 'factual' | 'procedural' | 'comparative' | 'explanatory' | 'action' | 'general';
export type Intent = 'inform' | 'help' | 'explain' | 'summarize' | 'calculate';

export interface QueryAnalysis {
  type: QueryType;
  intent: Intent;
  concepts: string[];
  entities: string[];
  complexity: number;
  original: string;
}

/**
 * Analyse complète d'une requête via LLM local et heuristiques.
 */
export async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  console.log(`[AI][ANALYZER] Analyse sémantique : "${query.substring(0, 50)}..."`);

  try {
    // 1. Extraction intelligente via LLM (Ollama/Phi3)
    const llmAnalysis = await performLLMAnalysis(query);
    
    // 2. Calcul de complexité heuristique
    const complexity = assessComplexity(query, llmAnalysis.concepts);

    return {
      type: llmAnalysis.type as QueryType,
      intent: llmAnalysis.intent as Intent,
      concepts: llmAnalysis.concepts,
      entities: llmAnalysis.entities,
      complexity,
      original: query
    };
  } catch (error) {
    console.warn("[AI][ANALYZER] Échec analyse IA, repli sur mode basique.");
    return fallbackAnalysis(query);
  }
}

async function performLLMAnalysis(query: string) {
  // Wrap in a 15-second timeout to allow model swapping into RAM
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("LLM Analysis Timeout")), 15000);
  });
  
  const generatePromise = ai.generate({
    model: 'ollama/tinyllama:latest',
    system: `Tu es un Analyste Sémantique expert en maintenance industrielle. 
    Analyse la requête et extrait les informations au format JSON STRICT.
    TYPES: factual, procedural, comparative, explanatory, action.
    INTENTS: inform, help, explain, summarize, calculate.`,
    prompt: `Analyse cette requête : "${query}"
    Réponds en JSON: 
    {
      "type": "type_détecté",
      "intent": "intention_détectée",
      "concepts": ["concept1", "concept2"],
      "entities": ["équipement", "code_erreur"]
    }`,
  });

  const response = await Promise.race([generatePromise, timeoutPromise]) as any;

  const match = response.text.match(/\{.*\}/s);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error("Réponse LLM invalide");
}

function assessComplexity(query: string, concepts: string[]): number {
  let score = 0.2; // Base

  // Longueur de la requête
  score += Math.min(query.length / 300, 0.3);

  // Densité de concepts techniques
  score += Math.min(concepts.length * 0.15, 0.4);

  // Présence de connecteurs logiques (Si, Alors, Pourquoi, Comment)
  if (query.match(/si|alors|pourquoi|comment|différence|comparer/i)) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

function fallbackAnalysis(query: string): QueryAnalysis {
  const q = query.toLowerCase();
  let type: QueryType = 'general';
  let intent: Intent = 'inform';

  if (q.includes('comment') || q.includes('étape') || q.includes('procédure')) {
    type = 'procedural';
    intent = 'help';
  } else if (q.includes('pourquoi') || q.includes('explique')) {
    type = 'explanatory';
    intent = 'explain';
  } else if (q.match(/\d+[\+\-\*\/]\d+/)) {
    intent = 'calculate';
  }

  return {
    type,
    intent,
    concepts: [],
    entities: [],
    complexity: 0.4,
    original: query
  };
}
