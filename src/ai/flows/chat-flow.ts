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
import { recordAction, undoLastAction, getActionHistoryReport } from '@/ai/actions/reversible-executor';
import { orchestrateMultiAgents } from '@/ai/orchestration/multi-agent-system';

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
  historyReport: z.string().optional(),
  multiAgentActive: z.boolean().optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    const q = input.text.toLowerCase();
    let docContext = input.documentContext || "";
    let prefixOutput = "";
    let planGenerated = false;
    let multiAgentActive = false;

    // 1. Innovation 19: Détection de commande d'annulation
    if (q.match(/annuler|undo|revenir en arrière|effacer dernière action/i)) {
      const undoResult = await undoLastAction();
      return {
        answer: undoResult.message + (undoResult.restoredContext ? "\n\nContexte restauré avec succès." : ""),
        confidence: 1.0,
        suggestions: ["Afficher l'historique", "Reprendre la discussion"]
      };
    }

    if (q.match(/historique des actions|qu'as-tu fait|audit/i)) {
      const report = await getActionHistoryReport();
      return {
        answer: report,
        confidence: 1.0
      };
    }

    // 2. Innovation 20: Orchestration Multi-Agents (Pour requêtes critiques/complexes)
    if (q.match(/expertise complète|audit technique|analyse multi-domaine|complet/i) || q.length > 250) {
      console.log("[AI][FLOW] Activation de l'Orchestration Multi-Agents (Innovation 20)...");
      const orchestration = await orchestrateMultiAgents(input.text, docContext);
      multiAgentActive = true;
      
      return {
        answer: orchestration.finalAnswer,
        confidence: orchestration.consensusScore,
        multiAgentActive: true,
        suggestions: ["Voir les contributions par agent", "Affiner l'analyse"]
      };
    }

    // 3. Planification Hiérarchique (Innovation 18)
    if (q.match(/préparer|planifier|organiser|automatiser|faire un plan|décomposer/i) || (q.length > 80 && !multiAgentActive)) {
      const plan = await getHierarchicalPlan(input.text, docContext);
      prefixOutput = await formatHierarchicalPlan(plan) + "\n\n---\n\n";
      docContext += `\n[NOTE SYSTÈME: Un plan hiérarchique a été généré.]`;
      planGenerated = true;
      await recordAction('PLANIFICATION', { task: input.text }, docContext);
    }

    // 4. Toolformer Local (Innovation 17)
    const action = await toolformer.decideAction(input.text, docContext);
    let actionInfo = null;

    if (action.type === 'use_tool') {
      actionInfo = { tool: action.tool, params: action.params, prediction: action.expectedOutcome };
      docContext += `\n[NOTE SYSTÈME: Outil ${action.tool} utilisé.]`;
      await recordAction(`TOOL_${action.tool.toUpperCase()}`, action.params, input.documentContext || "");
    }

    const standardGenerate = async (query: string, ctx: string): Promise<string> => {
      // Innovation 12: Analogies
      if (input.analogyMemory && input.analogyMemory.length > 0) {
        const analogResponse = await analogicalReasoner.reason(query, ctx, input.analogyMemory as SolvedProblem[]);
        if (analogResponse) return analogResponse;
      }

      // Innovation 16: Collaboration
      if (q.match(/analyse complète|expertise|consensus|débat/i) || query.length > 200) {
        return await collaborativeReasoner.reason(query, ctx);
      }

      // Innovation 11: Arbre Latent
      if (q.match(/dois-je|devrais-je|choisir|décider/i) && ctx.length > 50) {
        return await latentTree.reason(query, ctx);
      }

      // Innovation 15: Modulaire
      if (q.match(/impact|conséquence|calcul|période/i) && ctx.length > 100) {
        return await modularReasoner.reason(query, ctx);
      }

      // Innovation 9: Contraste
      if ((q.includes('définition') || q.includes('différence') || q.includes('vs')) && ctx.length > 100) {
        return await contrastiveReasoning.reason(query, ctx);
      }

      // Innovation 6: CoT Dynamique
      if (q.match(/comment|pourquoi|panne|maintenance/i) && query.length > 20) {
        return await dynamicCoT.reason(query, ctx);
      }

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

    // Innovation 13: Méta-cognition
    const metaResult = await metacognitiveReasoner.reason(input.text, docContext, standardGenerate);

    return {
      answer: prefixOutput + metaResult.answer,
      confidence: metaResult.confidence,
      disclaimer: metaResult.disclaimer,
      suggestions: metaResult.suggestions,
      actionTaken: actionInfo,
      planGenerated,
      isAnalogical: q.includes('analogie') || (input.analogyMemory && input.analogyMemory.length > 0),
      multiAgentActive: false
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
      multiAgentActive: parsed.multiAgentActive || false,
      sources: []
    };
  } catch {
    return { answer: result, sources: [] };
  }
}
