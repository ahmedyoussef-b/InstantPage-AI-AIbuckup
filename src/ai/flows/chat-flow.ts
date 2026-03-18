'use server';

import { z } from 'genkit';
import { semanticRouter } from '@/ai/router';
import { semanticCache } from '@/ai/semantic-cache';
import { dynamicPromptEngine } from '@/ai/dynamic-prompt';
import { dynamicCoT } from '@/ai/reasoning/dynamic-cot';
import { contrastiveReasoning } from '@/ai/reasoning/contrastive';
import { selfConsistencyReasoner } from '@/ai/reasoning/self-consistency';
import { latentTree } from '@/ai/reasoning/latent-tree';
import { analogicalReasoner, type SolvedProblem } from '@/ai/reasoning/analogical';
import { metacognitiveReasoner } from '@/ai/reasoning/metacognition';
import { modularReasoner } from '@/ai/reasoning/modular';
import { collaborativeReasoner } from '@/ai/reasoning/collaborative';
import { toolformer } from '@/ai/actions/toolformer-local';
import { getHierarchicalPlan, formatHierarchicalPlan } from '@/ai/actions/hierarchical-planner';

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(z.any()).optional(),
  documentContext: z.string().optional(),
  analogyMemory: z.array(z.any()).optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
  confidence: z.number().optional(),
  isAnalogical: z.boolean().optional(),
  disclaimer: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
  actionTaken: z.any().optional(),
  planGenerated: z.boolean().optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    const q = input.text.toLowerCase();
    let docContext = input.documentContext || "";
    let prefixOutput = "";
    let planGenerated = false;

    // 1. Planification Hiérarchique (Innovation 18) - Détection d'intention de tâche complexe
    if (q.match(/préparer|planifier|organiser|automatiser|faire un plan|décomposer/i) || q.length > 80) {
      console.log("[AI][FLOW] Activation de la Planification Hiérarchique...");
      const plan = await getHierarchicalPlan(input.text, docContext);
      prefixOutput = await formatHierarchicalPlan(plan) + "\n\n---\n\n";
      docContext += `\n[NOTE SYSTÈME: Un plan hiérarchique a été généré pour cette tâche. Analyse-le pour finaliser la réponse.]`;
      planGenerated = true;
    }

    // 2. Toolformer Local (Innovation 17) - Décision d'action avant génération
    const action = await toolformer.decideAction(input.text, docContext);
    let actionInfo = null;

    if (action.type === 'use_tool') {
      console.log(`[AI][ACTION] Activation de l'outil : ${action.tool}`);
      actionInfo = { tool: action.tool, params: action.params, prediction: action.expectedOutcome };
      docContext += `\n[NOTE SYSTÈME: Outil ${action.tool} utilisé. Prédiction: ${action.expectedOutcome}]`;
    }

    const standardGenerate = async (query: string, ctx: string): Promise<string> => {
      // Priorité 1: Mémoire Analogique (Innovation 12)
      if (input.analogyMemory && input.analogyMemory.length > 0) {
        const analogResponse = await analogicalReasoner.reason(query, ctx, input.analogyMemory as SolvedProblem[]);
        if (analogResponse) return analogResponse;
      }

      // Priorité 2: Raisonnement Collaboratif (Innovation 16) pour analyse lourde
      if (q.match(/analyse complète|expertise|consensus|débat/i) || query.length > 200) {
        return await collaborativeReasoner.reason(query, ctx);
      }

      // Priorité 3: Arbre Latent (Innovation 11) pour décisions
      if (q.match(/dois-je|devrais-je|choisir|décider/i) && ctx.length > 50) {
        return await latentTree.reason(query, ctx);
      }

      // Priorité 4: Raisonnement Modulaire (Innovation 15) pour multi-domaines
      if (q.match(/impact|conséquence|calcul|période/i) && ctx.length > 100) {
        return await modularReasoner.reason(query, ctx);
      }

      // Priorité 5: Contraste (Innovation 9) pour définitions
      if ((q.includes('définition') || q.includes('différence') || q.includes('vs')) && ctx.length > 100) {
        return await contrastiveReasoning.reason(query, ctx);
      }

      // Priorité 6: CoT Dynamique (Innovation 6) pour pannes
      if (q.match(/comment|pourquoi|panne|maintenance/i) && query.length > 20) {
        return await dynamicCoT.reason(query, ctx);
      }

      // Fallback: Génération standard optimisée par routeur (Innovation 1)
      const targetModel = await semanticRouter.route(query, ctx.length > 100);
      const optimizedPrompt = await dynamicPromptEngine.buildPrompt(query, ctx);

      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate({
        model: `ollama/${targetModel}`,
        prompt: optimizedPrompt,
        config: { temperature: 0.4, num_ctx: 4096 }
      });

      return response.text || "Désolé, je n'ai pas pu formuler de réponse technique.";
    };

    // Méta-cognition (Innovation 13) - Enveloppe finale de sécurité
    const metaResult = await metacognitiveReasoner.reason(input.text, docContext, standardGenerate);

    return {
      answer: prefixOutput + metaResult.answer,
      confidence: metaResult.confidence,
      disclaimer: metaResult.disclaimer,
      suggestions: metaResult.suggestions,
      actionTaken: actionInfo,
      planGenerated,
      isAnalogical: q.includes('analogie') || (input.analogyMemory && input.analogyMemory.length > 0)
    };
  };

  const result = await semanticCache.getOrCompute(input.text, async () => {
    const res = await computeAnswer();
    return JSON.stringify(res);
  });

  try {
    const parsed = JSON.parse(result);
    return {
      answer: parsed.answer || result,
      confidence: parsed.confidence,
      disclaimer: parsed.disclaimer,
      suggestions: parsed.suggestions,
      actionTaken: parsed.actionTaken,
      planGenerated: parsed.planGenerated,
      isAnalogical: parsed.isAnalogical || false,
      sources: []
    };
  } catch {
    return { answer: result, sources: [] };
  }
}
