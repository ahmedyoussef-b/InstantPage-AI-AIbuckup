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
import { validateAction, suggestAlternative } from '@/ai/actions/contextual-validator';
import { extractPoliciesFromHistory, suggestActionFromPolicy, type Demonstration } from '@/ai/actions/demonstration-learner';
import { submitWorkflow } from '@/ai/actions/async-workflow';

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
  actionTaken: z.any().optional(),
  planGenerated: z.boolean().optional(),
  historyReport: z.string().optional(),
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

    // 1. Innovation 23: Détection de besoin de Workflow Asynchrone
    if (q.match(/audit complet|analyse massive|traitement profond|générer tout|longue tâche/i)) {
      const taskId = await submitWorkflow('ANALYSIS_HEAVY', input.text);
      return {
        answer: `🚀 **Innovation 23 active** : Cette tâche nécessite une analyse approfondie. J'ai lancé un workflow asynchrone non-bloquant.\n\nID de suivi : \`${taskId}\`\n\nVous pouvez continuer à me poser d'autres questions pendant que je travaille en arrière-plan.`,
        confidence: 1.0,
        asyncTaskId: taskId,
        suggestions: ["Vérifier l'état de l'analyse", "Annuler la tâche"]
      };
    }

    // 2. Innovation 19: Détection de commande d'annulation
    if (q.match(/annuler|undo|revenir en arrière|effacer dernière action/i)) {
      const undoResult = await undoLastAction();
      return {
        answer: undoResult.message + (undoResult.restoredContext ? "\n\nContexte restauré avec succès." : ""),
        confidence: 1.0,
        suggestions: ["Afficher l'historique", "Reprendre la discussion"]
      };
    }

    // 3. Innovation 22: Apprentissage par Démonstration
    if (input.demonstrationHistory && input.demonstrationHistory.length > 0) {
      const policies = await extractPoliciesFromHistory(input.demonstrationHistory as Demonstration[]);
      const suggestedAction = await suggestActionFromPolicy(input.text, docContext, policies);
      
      if (suggestedAction) {
        demoPolicyApplied = true;
        docContext += `\n[NOTE SYSTÈME: Action automatique basée sur vos habitudes : ${suggestedAction.type}]`;
      }
    }

    // 4. Innovation 20: Orchestration Multi-Agents (Requêtes complexes)
    if (q.match(/expertise complète|audit technique|analyse multi-domaine|complet/i) || q.length > 250) {
      const orchestration = await orchestrateMultiAgents(input.text, docContext);
      multiAgentActive = true;
      return {
        answer: orchestration.finalAnswer,
        confidence: orchestration.consensusScore,
        multiAgentActive: true,
        suggestions: ["Voir les contributions par agent", "Affiner l'analyse"]
      };
    }

    // 5. Toolformer & Planification (Innovation 17 & 18)
    const actionDecision = await toolformer.decideAction(input.text, docContext);
    
    // Si un plan complexe est requis
    if (q.match(/préparer|planifier|organiser|automatiser|faire un plan|décomposer/i) || q.length > 100) {
      const plan = await getHierarchicalPlan(input.text, docContext);
      
      // Innovation 21: Validation contextuelle
      const validation = await validateAction({ type: 'PLANIFICATION', task: input.text }, docContext);
      
      if (!validation.valid) {
        const alternative = await suggestAlternative({ type: 'PLANIFICATION', task: input.text }, validation.reason || "");
        return {
          answer: `⚠️ **Sécurité (Innovation 21)**: ${validation.reason}\n\n${alternative ? `Alternative suggérée : ${JSON.stringify(alternative)}` : ""}`,
          confidence: 0.1
        };
      }

      prefixOutput = await formatHierarchicalPlan(plan) + "\n\n---\n\n";
      planGenerated = true;
      
      // Innovation 19: Enregistrement pour réversibilité
      await recordAction('PLANIFICATION', { task: input.text }, docContext);
      undoAvailable = true;
    } 
    // Sinon, si un outil spécifique est nécessaire
    else if (actionDecision.type === 'use_tool') {
      const validation = await validateAction(actionDecision, docContext);
      
      if (!validation.valid) {
        return {
          answer: `⚠️ **Action refusée**: ${validation.reason}. Veuillez reformuler votre demande de manière plus sûre.`,
          confidence: 0.2
        };
      }

      await recordAction(actionDecision.tool || 'tool_use', actionDecision.params, docContext);
      undoAvailable = true;
      prefixOutput = `🔧 **Action exécutée** : Utilisation de l'outil \`${actionDecision.tool}\` (Résultat attendu : ${actionDecision.expectedOutcome})\n\n`;
    }

    // 6. Génération de la réponse avec Méta-cognition (Innovation 13)
    const standardGenerate = async (query: string, ctx: string): Promise<string> => {
      // Innovation 12: Analogies
      if (input.analogyMemory && input.analogyMemory.length > 0) {
        const analogResponse = await analogicalReasoner.reason(query, ctx, input.analogyMemory as SolvedProblem[]);
        if (analogResponse) return analogResponse;
      }
      
      // Innovation 9: Contraste (si applicable)
      if (query.match(/différence|versus|vs|comparer/i)) {
        return await contrastiveReasoning.reason(query, ctx);
      }

      const targetModel = await semanticRouter.route(query, ctx.length > 100);
      const optimizedPrompt = await dynamicPromptEngine.buildPrompt(query, ctx);
      
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate({
        model: `ollama/${targetModel}`,
        prompt: optimizedPrompt,
        config: { temperature: 0.4, num_ctx: 4096 }
      });
      
      return response.text || "Désolé, je n'ai pas pu formuler de réponse.";
    };

    const metaResult = await metacognitiveReasoner.reason(input.text, docContext, standardGenerate);

    return {
      answer: prefixOutput + metaResult.answer,
      confidence: metaResult.confidence,
      disclaimer: metaResult.disclaimer,
      suggestions: metaResult.suggestions,
      planGenerated,
      demoPolicyApplied,
      undoAvailable,
      isAnalogical: q.includes('analogie') || (input.analogyMemory && input.analogyMemory.length > 0),
      actionTaken: actionDecision.type === 'use_tool' ? actionDecision : undefined
    };
  };

  // Cache sémantique (Innovation 2)
  const result = await semanticCache.getOrCompute(input.text, async () => {
    const res = await computeAnswer();
    return JSON.stringify(res);
  });

  try {
    const parsed = JSON.parse(result);
    return {
      ...parsed,
      answer: parsed.answer || result,
      sources: []
    };
  } catch {
    return { answer: result, sources: [] };
  }
}
