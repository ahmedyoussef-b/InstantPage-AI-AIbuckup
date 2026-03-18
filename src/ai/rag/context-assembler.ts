'use server';
/**
 * @fileOverview ContextAssembler - Phase 2: RAISONNER.
 * Fusionne, pondère et structure le contexte pour le LLM local.
 */

import { RetrievalResult, FusedResult } from './intelligent-retriever';

export interface AssembledContext {
  text: string;
  sources: {
    source: string;
    title: string;
    relevance: number;
  }[];
  tokenCount: number;
}

/**
 * Assemble le contexte final pour la génération.
 */
export async function assembleContext(retrievalResult: RetrievalResult): Promise<AssembledContext> {
  console.log(`[AI][PHASE-2] Assemblage du contexte avec ${retrievalResult.contexts.length} sources.`);

  // 1. Trier par pertinence finale (score pondéré)
  const sorted = [...retrievalResult.contexts].sort((a, b) => b.finalScore - a.finalScore);
  
  // 2. Limiter la taille du contexte pour respecter la fenêtre de tokens
  const limited = limitContextSize(sorted);
  
  // 3. Formater les sources pour une lecture optimale par le LLM
  const formatted = formatForLLM(limited);
  
  // 4. Ajouter des méta-instructions basées sur l'analyse sémantique
  const withMetadata = addMetadata(formatted, retrievalResult);
  
  return {
    text: withMetadata,
    sources: limited.map(c => ({
      source: c.source,
      title: c.metadata?.title || getDefaultTitle(c.source),
      relevance: c.finalScore
    })),
    tokenCount: countTokens(withMetadata)
  };
}

function limitContextSize(contexts: FusedResult[]): FusedResult[] {
  let totalTokens = 0;
  const limit = 3000; 
  const limited: FusedResult[] = [];
  
  for (const ctx of contexts) {
    const tokens = countTokens(ctx.content);
    if (totalTokens + tokens <= limit) {
      limited.push(ctx);
      totalTokens += tokens;
    } else {
      break;
    }
  }
  
  return limited;
}

function formatForLLM(contexts: FusedResult[]): string {
  if (contexts.length === 0) return "NOTE: Aucun contexte spécifique n'a été trouvé dans la base locale.";

  let formatted = "### CONTEXTE TECHNIQUE DE RÉFÉRENCE\n\n";
  
  contexts.forEach((ctx, i) => {
    const sourceLabel = ctx.source.toUpperCase();
    formatted += `[Source ${i + 1} (${sourceLabel}) - Confiance: ${(ctx.finalScore * 100).toFixed(0)}%]\n`;
    formatted += `${ctx.content}\n\n`;
  });
  
  formatted += "### FIN DU CONTEXTE\n";
  return formatted;
}

function addMetadata(text: string, retrievalResult: RetrievalResult): string {
  const analysis = retrievalResult.analysis;
  let instructions = "";
  
  if (analysis.type === 'procedural') {
    instructions += "DIRECTIVE: L'utilisateur demande une procédure. Détaille chaque étape avec précision et numérotation.\n";
  }
  
  if (analysis.complexity > 0.65) {
    instructions += "DIRECTIVE: La problématique est complexe. Décompose ton raisonnement et explique les causes possibles.\n";
  }

  if (analysis.intent === 'summarize') {
    instructions += "DIRECTIVE: Fournis une synthèse concise en points clés.\n";
  }

  if (analysis.intent === 'calculate') {
    instructions += "DIRECTIVE: Vérifie scrupuleusement les unités et les seuils de mesure cités.\n";
  }
  
  return instructions ? `${instructions}\n${text}` : text;
}

function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function getDefaultTitle(source: string): string {
  switch(source) {
    case 'document': return 'Manuel technique';
    case 'lesson': return 'Leçon apprise';
    case 'interaction': return 'Historique chat';
    default: return 'Information système';
  }
}
