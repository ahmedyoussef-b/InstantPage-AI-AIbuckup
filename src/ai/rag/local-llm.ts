'use server';
/**
 * @fileOverview Phase 3: AGIR - Génération via LLM Local (Ollama).
 * Version refactorisée pour Next.js 15 (Architecture fonctionnelle).
 * Utilise le contexte assemblé pour produire une réponse technique précise.
 */

import { AssembledContext } from './context-assembler';

export interface LLMResponse {
  text: string;
  tokens: number;
  latency: number;
  model: string;
  sources: {
    source: string;
    title: string;
    relevance: number;
  }[];
}

/**
 * Génère une réponse via le modèle local Ollama.
 * Gère la communication API, le prompt système dynamique et le nettoyage des sorties.
 */
export async function generateLLMResponse(
  userPrompt: string, 
  context: AssembledContext,
  options: { model?: string } = {}
): Promise<LLMResponse> {
  const startTime = Date.now();
  const model = options.model || 'phi3:mini';
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  console.log(`[AI][PHASE-3] Génération via ${model} (${context.tokenCount} tokens contextuels)`);

  // Construction du prompt final (System + Context + User)
  const fullPrompt = buildFinalPrompt(userPrompt, context);

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: calculateOptimalTemperature(context),
          top_p: 0.9,
          num_predict: 1000,
          stop: ["### FIN", "Question:", "User:"]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama indisponible (${response.status})`);
    }

    const data = await response.json();
    
    // Post-traitement: Nettoyage et vérification des citations
    const processedText = postProcessLLMOutput(data.response, context);

    return {
      text: processedText,
      tokens: data.eval_count || 0,
      latency: Date.now() - startTime,
      model: model,
      sources: context.sources
    };
  } catch (error) {
    console.error("[AI][PHASE-3] Échec critique génération LLM:", error);
    return {
      text: "ERREUR SYSTÈME: L'assistant local est momentanément indisponible. Vérifiez que le service Ollama est actif.",
      tokens: 0,
      latency: Date.now() - startTime,
      model: model,
      sources: []
    };
  }
}

/**
 * Construit le prompt système final incluant le contexte technique.
 */
function buildFinalPrompt(userPrompt: string, context: AssembledContext): string {
  return `
${context.text}

### DEMANDE UTILISATEUR
Question: ${userPrompt}

### INSTRUCTIONS DE RÉPONSE
1. Réponds EXCLUSIVEMENT en français de manière professionnelle.
2. Base-toi scrupuleusement sur le CONTEXTE TECHNIQUE DE RÉFÉRENCE fourni ci-dessus.
3. Cite tes sources entre crochets [Source X] pour chaque fait technique important.
4. Si l'information est absente du contexte, admets-le : "Désolé, je ne trouve pas cette précision dans la base locale."
5. Structure ta réponse avec du Markdown (gras, listes) pour la lisibilité.

Réponse:`;
}

/**
 * Ajuste la température selon la fiabilité des sources.
 * Température basse (0.2) pour les documents officiels, plus haute (0.5) pour les échanges.
 */
function calculateOptimalTemperature(context: AssembledContext): number {
  const hasOfficialDocs = context.sources.some(s => s.source === 'document');
  return hasOfficialDocs ? 0.2 : 0.5;
}

/**
 * Nettoie la sortie et s'assure que la réponse reste dans le cadre du RAG.
 */
function postProcessLLMOutput(text: string, context: AssembledContext): string {
  let cleaned = text.trim();
  
  // Suppression des préfixes de type "Réponse:" si générés
  cleaned = cleaned.replace(/^Réponse:\s*/i, '');

  // S'assurer qu'au moins une source est citée si le contexte n'était pas vide
  if (context.sources.length > 0 && !cleaned.includes('[') && cleaned.length > 50) {
    const topSource = context.sources[0];
    cleaned += `\n\n[Basé sur: ${topSource.title}]`;
  }
  
  return cleaned;
}
