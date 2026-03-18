'use server';

import { z } from 'genkit';
import { semanticRouter } from '@/ai/router';
import { semanticCache } from '@/ai/semantic-cache';
import { dynamicPromptEngine } from '@/ai/dynamic-prompt';
import { metacognitiveReasoner } from '@/ai/reasoning/metacognition';
import { contrastiveReasoning } from '@/ai/reasoning/contrastive';
import { analogicalReasoner, type SolvedProblem } from '@/ai/reasoning/analogical';
import { toolformer } from '@/ai/actions/toolformer-local';
import { getHierarchicalPlan, formatHierarchicalPlan } from '@/ai/actions/hierarchical-planner';
import { recordAction, undoLastAction } from '@/ai/actions/reversible-executor';
import { orchestrateMultiAgents } from '@/ai/orchestration/multi-agent-system';
import { validateAction, suggestAlternative } from '@/ai/actions/contextual-validator';
import { extractPoliciesFromHistory, suggestActionFromPolicy, type Demonstration } from '@/ai/actions/demonstration-learner';
import { submitWorkflow } from '@/ai/actions/async-workflow';
import { predictNextActions } from '@/ai/actions/predictive-engine';

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(z.any()).optional(),
  documentContext: z.string().optional(),
  analogyMemory: z.array(z.any()).optional(),
  demonstrationHistory: z.array(z.any()).optional(),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).optional(),
  confidence: z.number().optional(),
  isAnalogical: z.boolean().optional(),
  disclaimer: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
  proactiveSuggestions: z.array(z.any()).optional(),
  actionTaken: z.any().optional(),
  planGenerated: z.boolean().optional(),
  multiAgentActive: z.boolean().optional(),
  demoPolicyApplied: z.boolean().optional(),
  asyncTaskId: z.string().optional(),
  undoAvailable: z.boolean().optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    const q = input.text.toLowerCase();
    let docContext = input.documentContext || "";
    let prefixOutput = "";
    let planGenerated = false;
    let multiAgentActive = false;
    let demoPolicyApplied = false;
    let undoAvailable = false;
    let proactiveSuggestions: any[] = [];

    // 1. Innovation 23: Workflow Asynchrone
    if (q.match(/audit complet|analyse massive|traitement profond|longue tâche/i)) {
      const taskId = await submitWorkflow('ANALYSIS_HEAVY', input.text);
      return {
        answer: `🚀 **Workflow Asynchrone (Innovation 23)** : Analyse profonde lancée en arrière-plan.\n\nID : \`${taskId}\`.\n\nVous serez notifié de la progression.`,
        confidence: 1.0,
        asyncTaskId: taskId
      };
    }

    // 2. Innovation 19: Réversibilité
    if (q.match(/annuler|undo|effacer dernière action/i)) {
      const undoResult = await undoLastAction();
      return {
        answer: undoResult.message,
        confidence: 1.0,
        undoAvailable: false
      };
    }

    // 3. Innovation 22 & 24: Apprentissage & Prédiction
    const history = (input.demonstrationHistory || []) as Demonstration[];
    if (history.length > 0) {
      // Apprentissage par démonstration
      const policies = await extractPoliciesFromHistory(history);
      const suggestedAction = await suggestActionFromPolicy(input.text, docContext, policies);
      if (suggestedAction) {
        demoPolicyApplied = true;
        docContext += `\n[ACTION APPRISE DÉTECTÉE: ${suggestedAction.type}]`;
      }

      // Innovation 24: Prédiction proactive
      proactiveSuggestions = await predictNextActions(history, input.text + " " + docContext);
    }

    // 4. Innovation 20: Orchestration Multi-Agents
    if (q.length > 300 || q.includes('audit technique complet')) {
      const orchestration = await orchestrateMultiAgents(input.text, docContext);
      multiAgentActive = true;
      return {
        answer: orchestration.finalAnswer,
        confidence: orchestration.consensusScore,
        multiAgentActive: true,
        proactiveSuggestions
      };
    }

    // 5. Toolformer & Planification (Innovation 17 & 18)
    const actionDecision = await toolformer.decideAction(input.text, docContext);
    
    if (q.match(/préparer|planifier|organiser|décomposer/i) || q.length > 150) {
      const plan = await getHierarchicalPlan(input.text, docContext);
      const validation = await validateAction({ type: 'PLANIFICATION', task: input.text }, docContext);
      
      if (!validation.valid) {
        const alternative = await suggestAlternative({ type: 'PLANIFICATION', task: input.text }, validation.reason || "");
        return { answer: `⚠️ **Sécurité**: ${validation.reason}\n\n${alternative ? `Suggestion : ${JSON.stringify(alternative)}` : ""}`, confidence: 0.1 };
      }

      prefixOutput = await formatHierarchicalPlan(plan) + "\n\n---\n\n";
      planGenerated = true;
      await recordAction('PLANIFICATION', { task: input.text }, docContext);
      undoAvailable = true;
    } else if (actionDecision.type === 'use_tool') {
      const validation = await validateAction(actionDecision, docContext);
      if (validation.valid) {
        await recordAction(actionDecision.tool || 'tool', actionDecision.params, docContext);
        undoAvailable = true;
        prefixOutput = `🔧 **Action** : \`${actionDecision.tool}\` (${actionDecision.expectedOutcome})\n\n`;
      }
    }

    // 6. Génération avec Méta-cognition (Innovation 13)
    const standardGenerate = async (query: string, ctx: string): Promise<string> => {
      // Innovation 12: Analogies
      if (input.analogyMemory && input.analogyMemory.length > 0) {
        const analogResponse = await analogicalReasoner.reason(query, ctx, input.analogyMemory as SolvedProblem[]);
        if (analogResponse) return analogResponse;
      }
      
      // Innovation 9: Contraste
      if (query.match(/différence|versus|vs|comparer/i)) return await contrastiveReasoning.reason(query, ctx);

      const targetModel = await semanticRouter.route(query, ctx.length > 100);
      const optimizedPrompt = await dynamicPromptEngine.buildPrompt(query, ctx);
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate({ model: `ollama/${targetModel}`, prompt: optimizedPrompt, config: { temperature: 0.4 } });
      return response.text;
    };

    const metaResult = await metacognitiveReasoner.reason(input.text, docContext, standardGenerate);

    return {
      answer: prefixOutput + metaResult.answer,
      confidence: metaResult.confidence,
      disclaimer: metaResult.disclaimer,
      suggestions: metaResult.suggestions,
      proactiveSuggestions,
      planGenerated,
      demoPolicyApplied,
      undoAvailable,
      actionTaken: actionDecision.type === 'use_tool' ? actionDecision : undefined
    };
  };

  const cached = await semanticCache.getOrCompute(input.text, async () => {
    const res = await computeAnswer();
    return JSON.stringify(res);
  });

  try {
    const parsed = JSON.parse(cached);
    return { ...parsed, sources: [] };
  } catch {
    return { answer: cached, sources: [] };
  }
}
