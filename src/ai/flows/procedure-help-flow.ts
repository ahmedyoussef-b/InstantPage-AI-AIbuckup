'use server';
/**
 * @fileOverview Flux d'aide contextuelle pour les procédures techniques.
 * 
 * - getProcedureHelp - Aide personnalisée pour l'opérateur en difficulté.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcedureHelpInputSchema = z.object({
  userName: z.string().default('AHMED'),
  stepTitle: z.string(),
  instruction: z.string(),
  problem: z.string(),
  expectedValue: z.string(),
});
export type ProcedureHelpInput = z.infer<typeof ProcedureHelpInputSchema>;

const ProcedureHelpOutputSchema = z.object({
  advice: z.string(),
  safetyReminder: z.string().optional(),
});
export type ProcedureHelpOutput = z.infer<typeof ProcedureHelpOutputSchema>;

export async function getProcedureHelp(input: ProcedureHelpInput): Promise<ProcedureHelpOutput> {
  return procedureHelpFlow(input);
}

const procedureHelpFlow = ai.defineFlow(
  {
    name: 'procedureHelpFlow',
    inputSchema: ProcedureHelpInputSchema,
    outputSchema: ProcedureHelpOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      system: `Tu es un expert en maintenance industrielle assistant un opérateur nommé ${input.userName}.
      Ta mission est de l'aider à résoudre un problème spécifique lors d'une étape de procédure.
      RÈGLES :
      1. Sois très précis et technique mais rassurant.
      2. Utilise toujours le prénom ${input.userName} dans ta réponse.
      3. Propose des solutions concrètes et actionnables immédiatement.
      4. Si le problème semble dangereux, insiste sur la sécurité.`,
      prompt: `L'opérateur rencontre un problème à l'étape : ${input.stepTitle}.
      Instruction originale : ${input.instruction}
      Valeur attendue : ${input.expectedValue}
      Problème signalé par l'opérateur : ${input.problem}`,
    });

    return {
      advice: response.text,
      safetyReminder: "N'oublie pas de porter tes EPI avant toute intervention corrective."
    };
  }
);