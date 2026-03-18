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
import { recall, remember, type Episode } from '@/ai/learning/episodic-memory';
import { evaluatePedagogicalLevel, getCurriculumDirective, suggestNextTopic } from '@/ai/learning/curriculum';
import { distillInteractions, getApplicableRules, type DistilledRule } from '@/ai/learning/knowledge-distillation';
import { generateReviewQuestion, type KnowledgeItem } from '@/ai/learning/spaced-repetition';

const ChatInputSchema = z.object({
  text: z.string(),
  history: z.array(z.any()).optional(),
  documentContext: z.string().optional(),
  analogyMemory: z.array(z.any()).optional(),
  demonstrationHistory: z.array(z.any()).optional(),
  episodicMemory: z.array(z.any()).optional(),
  distilledRules: z.array(z.any()).optional(),
  pendingReviews: z.array(z.any()).optional(),
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
  newMemoryEpisode: z.any().optional(),
  pedagogicalLevel: z.string().optional(),
  distillationPerformed: z.boolean().optional(),
  newDistilledRules: z.array(z.any()).optional(),
  reviewQuestion: z.string().optional(),
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
    let distillationPerformed = false;
    let newDistilledRules: DistilledRule[] | undefined = undefined;
    let proactiveSuggestions: any[] = [];
    let reviewQuestion: string | undefined = undefined;

    // 0. Innovation 25: Rappel de mémoire épisodique
    const memory = await recall(input.text, (input.episodicMemory || []) as Episode[]);
    if (memory.summary) {
      docContext += `\n[SOUVENIRS LIÉS : ${memory.summary}]`;
    }

    // 0.1 Innovation 28: Application des règles distillées
    if (input.distilledRules && input.distilledRules.length > 0) {
      const rulesContext = await getApplicableRules(input.text, input.distilledRules as DistilledRule[]);
      if (rulesContext) docContext += ` ${rulesContext}`;
    }

    // 0.2 Innovation 27: Curriculum Adaptatif (ZPD)
    const pedaLevel = await evaluatePedagogicalLevel(input.text, 0.7, input.history?.length || 0);
    const pedaDirective = await getCurriculumDirective(pedaLevel);
    docContext += ` ${pedaDirective}`;

    // 0.3 Innovation 29: Génération d'une question de réactivation si besoin
    if (input.pendingReviews && input.pendingReviews.length > 0 && Math.random() > 0.6) {
      const itemToReview = input.pendingReviews[0] as KnowledgeItem;
      reviewQuestion = await generateReviewQuestion(itemToReview.content, itemToReview.concept);
    }

    // 1. Innovation 23: Workflow Asynchrone
    if (q.match(/audit complet|analyse massive|traitement profond|longue tâche/i)) {
      const taskId = await submitWorkflow('ANALYSIS_HEAVY', input.text);
      return {
        answer: `🚀 **Workflow Asynchrone (Innovation 23)** : Analyse profonde lancée en arrière-plan.\n\nID : \`${taskId}\`.\n\nVous serez notifié de la progression via l'interface locale.`,
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

    // 3. Innovation 22 & 24: Apprentissage par démonstration & Prédiction proactive
    const history = (input.demonstrationHistory || []) as Demonstration[];
    if (history.length > 0) {
      const policies = await extractPoliciesFromHistory(history);
      const suggestedAction = await suggestActionFromPolicy(input.text, docContext, policies);
      if (suggestedAction) {
        demoPolicyApplied = true;
        docContext += `\n[ACTION APPRISE DÉTECTÉE: ${suggestedAction.type}]`;
      }
      proactiveSuggestions = await predictNextActions(history, input.text + " " + docContext);
    }

    // 4. Innovation 20: Orchestration Multi-Agents Spécialisés
    if (q.length > 300 || q.includes('audit technique complet') || q.includes('analyse multi-agents')) {
      const orchestration = await orchestrateMultiAgents(input.text, docContext);
      multiAgentActive = true;
      return {
        answer: orchestration.finalAnswer,
        confidence: orchestration.consensusScore,
        multiAgentActive: true,
        proactiveSuggestions,
        pedagogicalLevel: pedaLevel
      };
    }

    // 5. Innovation 17 & 18: Toolformer & Planification Hiérarchique
    const actionDecision = await toolformer.decideAction(input.text, docContext);
    
    if (q.match(/préparer|planifier|organiser|décomposer/i) || q.length > 150) {
      const plan = await getHierarchicalPlan(input.text, docContext);
      const validation = await validateAction({ type: 'PLANIFICATION', task: input.text }, docContext);
      
      if (!validation.valid) {
        const alternative = await suggestAlternative({ type: 'PLANIFICATION', task: input.text }, validation.reason || "");
        return { 
          answer: `⚠️ **Sécurité**: ${validation.reason}\n\n${alternative ? `Alternative sécurisée suggérée : ${JSON.stringify(alternative)}` : ""}`, 
          confidence: 0.1 
        };
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
        prefixOutput = `🔧 **Action Toolformer** : \`${actionDecision.tool}\` (${actionDecision.expectedOutcome})\n\n`;
      }
    }

    // 6. Génération avec Méta-cognition (Innovation 13)
    const standardGenerate = async (query: string, ctx: string): Promise<string> => {
      // 6.1 Raisonnement par Analogie (Innovation 12)
      if (input.analogyMemory && input.analogyMemory.length > 0) {
        const analogResponse = await analogicalReasoner.reason(query, ctx, input.analogyMemory as SolvedProblem[]);
        if (analogResponse) return analogResponse;
      }
      
      // 6.2 Raisonnement par Contraste (Innovation 9)
      if (query.match(/différence|versus|vs|comparer/i)) return await contrastiveReasoning.reason(query, ctx);

      // 6.3 Routage Sémantique (Innovation 1) & Prompting Dynamique (Innovation 5)
      const targetModel = await semanticRouter.route(query, ctx.length > 100);
      const optimizedPrompt = await dynamicPromptEngine.buildPrompt(query, ctx);
      
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate({ 
        model: `ollama/${targetModel}`, 
        prompt: optimizedPrompt, 
        config: { temperature: 0.4 } 
      });
      return response.text;
    };

    const metaResult = await metacognitiveReasoner.reason(input.text, docContext, standardGenerate);

    // 7. Innovation 25: Préparation de l'épisode de mémoire pour consolidation
    const newMemoryEpisode = {
      type: 'interaction',
      content: metaResult.answer.substring(0, 250),
      context: input.text,
      importance: metaResult.confidence,
      tags: [metaResult.confidence > 0.8 ? 'important' : 'routine', pedaLevel.toLowerCase()]
    };

    // 8. Innovation 28: Déclenchement périodique de la distillation
    if (input.episodicMemory && input.episodicMemory.length > 15 && Math.random() > 0.7) {
      const distillation = await distillInteractions(input.episodicMemory as Episode[]);
      if (distillation.rules.length > 0) {
        distillationPerformed = true;
        newDistilledRules = distillation.rules;
      }
    }

    // 9. Innovation 27: Suggestion de la prochaine thématique pédagogique
    const nextStep = await suggestNextTopic(input.text + " " + metaResult.answer);
    const finalSuggestions = metaResult.suggestions || [];
    if (nextStep) finalSuggestions.push(nextStep);

    // Final answer with review question if available
    let finalAnswer = prefixOutput + metaResult.answer;
    if (reviewQuestion) {
      finalAnswer += `\n\n---\n💡 **RÉACTIVATION (Innovation 29)** : ${reviewQuestion}`;
    }

    return {
      answer: finalAnswer,
      confidence: metaResult.confidence,
      disclaimer: metaResult.disclaimer,
      suggestions: finalSuggestions,
      proactiveSuggestions,
      planGenerated,
      demoPolicyApplied,
      undoAvailable,
      actionTaken: actionDecision.type === 'use_tool' ? actionDecision : undefined,
      newMemoryEpisode,
      pedagogicalLevel: pedaLevel,
      distillationPerformed,
      newDistilledRules,
      reviewQuestion
    };
  };

  // Cache Sémantique Intelligent (Innovation 2)
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
