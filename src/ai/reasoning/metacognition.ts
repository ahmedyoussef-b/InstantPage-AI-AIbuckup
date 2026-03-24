// src/ai/reasoning/metacognition.ts - VERSION SIMPLIFIÉE

import { ConfidenceScorer } from './confidence-scorer';

export interface MetacognitiveResult {
  answer: string;
  confidence: number;
  disclaimer?: string;
  missingInfo?: string;
  suggestions?: string[];
}

export class MetacognitiveReasoner {
  async reason(question: string, context: string, generateFn: (q: string, ctx: string) => Promise<string>): Promise<MetacognitiveResult> {
    console.log("[AI][REASONING] Mode simplifié - Pas de méta-cognition");
    try {
      // Direct pass-through to avoid massive local timeout
      const answer = await generateFn(question, context);
      return {
        answer,
        confidence: 0.85
      };
    } catch (error) {
      console.error("[AI][REASONING] Échec critique générateur.");
      return { answer: "Désolé, une erreur de génération s'est produite.", confidence: 0.1 };
    }
  }
}

export const metacognitiveReasoner = new MetacognitiveReasoner();