'use server';
/**
 * @fileOverview Phase 3: AGIR - Génération via LLM Local (Ollama).
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
 */
export async function generateLLMResponse(
  userPrompt: string, 
  context: AssembledContext,
  options: { model?: string } = {}
): Promise<LLMResponse> {
  const startTime = Date.now();
  const model = options.model || 'tinyllama:latest';
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

  console.log(`[RAG][GENERATOR] Génération de la réponse avec citations. Modèle: ${model}`);

  const fullPrompt = buildFinalPrompt(userPrompt, context);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 secondes max

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 150
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Ollama Error: ${response.status}`);

    const data = await response.json();
    const processedText = postProcessLLMOutput(data.response, context);

    const latency = Date.now() - startTime;
    console.log(`[RAG][GENERATOR][OK] Réponse générée en ${latency}ms.`);

    return {
      text: processedText,
      tokens: data.eval_count || 0,
      latency,
      model: model,
      sources: context.sources
    };
  } catch (error) {
    console.error("[RAG][GENERATOR][ERROR] Échec génération locale.", error);
    return {
      text: "Désolé, l'assistant local est momentanément indisponible.",
      tokens: 0,
      latency: Date.now() - startTime,
      model: model,
      sources: []
    };
  }
}

function buildFinalPrompt(userPrompt: string, context: AssembledContext): string {
  return `
${context.text}

### DEMANDE UTILISATEUR
Question: ${userPrompt}

Réponse (en français, précise, avec citations [Source X]):`;
}

function postProcessLLMOutput(text: string, context: AssembledContext): string {
  let cleaned = text.trim();
  if (context.sources.length > 0 && !cleaned.includes('[') && cleaned.length > 50) {
    cleaned += `\n\n[Basé sur: ${context.sources[0].title}]`;
  }
  return cleaned;
}
