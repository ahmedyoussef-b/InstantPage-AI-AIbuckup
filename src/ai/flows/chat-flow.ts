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
import { counterfactualReasoner } from '@/ai/reasoning/counterfactual';
import { modularReasoner } from '@/ai/reasoning/modular';

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
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * Chat Intelligent intégrant les 15 Innovations Élite.
 * Version stabilisée avec Raisonnement Modulaire (Innovation 15).
 */
export async function chat(input: ChatInput): Promise<ChatOutput> {
  const computeAnswer = async () => {
    const q = input.text.toLowerCase();
    const docContext = input.documentContext || "";

    // Fonction de génération standard utilisée par la méta-cognition
    const standardGenerate = async (query: string, ctx: string): Promise<string> => {
      // 1. Raisonnement Analogique (Innovation 12)
      if (input.analogyMemory && input.analogyMemory.length > 0) {
        const analogResponse = await analogicalReasoner.reason(query, ctx, input.analogyMemory as SolvedProblem[]);
        if (analogResponse) return analogResponse;
      }

      // 2. Sélection du mode de raisonnement dynamique
      
      // CAS A : Arbre de Décision Latent (Innovation 11) - Pour les choix complexes
      if (q.match(/dois-je|devrais-je|choisir|décider|investir|opportunité|quel choix|stratégie/i) && ctx.length > 50) {
        return await latentTree.reason(query, ctx);
      }

      // CAS B : Raisonnement Modulaire (Innovation 15) - Pour les questions multi-facettes
      if (q.match(/et|avec|aussi|impact|conséquence|calcul|période/i) && q.length > 40 && ctx.length > 100) {
        return await modularReasoner.reason(query, ctx);
      }

      // CAS C : Vérification Auto-Consistante (Innovation 10) - Pour les faits et chiffres
      if (q.match(/vrai|faux|est-ce que|valeur|seuil|pression|limite|autorisé|obligatoire|combien|température/i) && ctx.length > 50) {
        const result = await selfConsistencyReasoner.reason(query, ctx);
        return result.answer;
      }

      // CAS D : Raisonnement par Contraste (Innovation 9) - Pour les définitions et différences
      if ((q.includes('définition') || q.includes('différence') || q.includes('comparer') || q.includes('vs')) && ctx.length > 100) {
        return await contrastiveReasoning.reason(query, ctx);
      }

      // CAS E : Raisonnement Contrefactuel (Innovation 14) - Pour l'analyse de causes
      if (q.match(/pourquoi|cause|raison|si on avait|impact de|origine de|facteur|influence/i) && ctx.length > 100) {
        return await counterfactualReasoner.reason(query, ctx);
      }

      // CAS F : Chaîne de Pensée Dynamique (Innovation 6) - Pour les problèmes techniques
      if (q.match(/comment|pourquoi|panne|maintenance|chaudière|gaz|circuit|réparer|étape/i) && query.length > 20) {
        return await dynamicCoT.reason(query, ctx);
      }

      // 3. Routage standard (Innovation 1)
      const hasContext = ctx.length > 100;
      const targetModel = await semanticRouter.route(query, hasContext);
      const optimizedPrompt = await dynamicPromptEngine.buildPrompt(query, ctx);

      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate({
        model: `ollama/${targetModel}`,
        prompt: optimizedPrompt,
        config: { temperature: 0.4, num_ctx: 4096 }
      });

      return response.text || "Désolé, je n'ai pas pu formuler de réponse technique précise.";
    };

    // 4. Application de la Méta-cognition (Innovation 13)
    const metaResult = await metacognitiveReasoner.reason(input.text, docContext, standardGenerate);

    return {
      answer: metaResult.answer,
      confidence: metaResult.confidence,
      disclaimer: metaResult.disclaimer,
      isAnalogical: q.includes('analogie') || (input.analogyMemory && input.analogyMemory.length > 0)
    };
  };

  // 5. Utilisation du cache sémantique intelligent (Innovation 2)
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
      isAnalogical: parsed.isAnalogical || false,
      sources: []
    };
  } catch {
    return { answer: result, sources: [] };
  }
}
