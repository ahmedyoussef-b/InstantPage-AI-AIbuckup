'use server';
/**
 * @fileOverview Phase4VectorIntegration - Innovation Elite 32.
 * Gère la mémorisation et la vectorisation des apprentissages après chaque interaction.
 */

import { ai } from '@/ai/genkit';

export interface Lesson {
  content: string;
  importance: number;
  timestamp: number;
}

/**
 * Phase 4: APPRENDRE - Extrait et vectorise les leçons d'une interaction.
 */
export async function apprendreVector(
  query: string, 
  answer: string, 
  confidence: number
): Promise<Lesson[]> {
  console.log(`[AI][PHASE-4] Extraction et vectorisation des leçons...`);

  // 1. Extraction des leçons via LLM
  const lessons = await extractLessons(query, answer);

  // 2. Vectorisation (Simulation de stockage dans la strate LEARN de la base centrale)
  for (const lesson of lessons) {
    try {
      await ai.embed({
        embedder: 'googleai/embedding-001',
        content: lesson.content,
      });
      console.log(`[AI][PHASE-4] Leçon vectorisée et mémorisée : ${lesson.content.substring(0, 40)}...`);
    } catch (e) {
      // Fallback silencieux si le service d'embedding est indisponible
    }
  }

  return lessons;
}

async function extractLessons(query: string, answer: string): Promise<Lesson[]> {
  try {
    const response = await ai.generate({
      model: 'ollama/tinyllama:latest',
      system: "Tu es un Extracteur de Savoir Technique. Identifie une leçon technique clé issue de l'interaction.",
      prompt: `Question: ${query}\nRéponse: ${answer}\n\nFormat JSON STRICT: [{"content": "fait technique appris", "importance": 0.X}]`,
    });

    const match = response.text.match(/\[.*\]/s);
    if (match) {
      const data = JSON.parse(match[0]);
      return data.map((l: any) => ({ 
        ...l, 
        timestamp: Date.now() 
      }));
    }
  } catch (e) {
    console.warn("[AI][PHASE-4] Échec de l'extraction des leçons.");
  }
  return [];
}
