'use server';
/**
 * @fileOverview Genkit Flow pour les missions Agentic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { runAgenticLoop } from '@/ai/orchestration/agentic-loop';

const AgentInputSchema = z.object({
  text: z.string(),
  context: z.string().optional().default(''),
});

export type AgentInput = z.infer<typeof AgentInputSchema>;

const AgentOutputSchema = z.object({
  answer: z.string(),
  missionStatus: z.string(),
  steps: z.array(z.any()),
  patternsLearned: z.number()
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;

/**
 * Point d'entrée pour les tâches complexes nécessitant un Agent.
 */
export async function runAgentMission(input: AgentInput): Promise<AgentOutput> {
  const result = await runAgenticLoop(input.text, input.context || '');

  return {
    answer: result.finalResponse,
    missionStatus: 'COMPLETED',
    steps: result.stepsTaken,
    patternsLearned: result.learnedPatternsCount
  };
}
