// src/ai/genkit.ts - Version corrigée avec typages corrects
import { genkit } from 'genkit';
import { ollama, type OllamaPluginOptions } from 'genkitx-ollama';

// Configuration des modèles disponibles
const models = [
  { 
    name: 'phi3:mini',
    type: 'chat' as const,  // Utiliser 'chat' au lieu de 'generate'
  },
  { 
    name: 'tinyllama:latest',
    type: 'chat' as const,
  },
  {
    name: 'nomic-embed-text',
    type: 'embedding' as const,  // Pour les embeddings
  }
];

// Initialisation de Genkit avec Ollama
export const ai = genkit({
  plugins: [
    ollama({
      models,
      serverUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    } as OllamaPluginOptions),
  ],
});

// Fonction utilitaire pour vérifier la disponibilité des modèles
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch (error) {
    console.error('❌ Impossible de contacter Ollama');
    return [];
  }
}

// Fonction pour obtenir le meilleur modèle disponible
export async function getBestAvailableModel(): Promise<string> {
  const available = await getAvailableModels();
  
  // Priorité des modèles
  const priority = ['phi3:mini', 'tinyllama:latest', 'llama3:8b'];
  
  for (const model of priority) {
    if (available.includes(model)) {
      return model;
    }
  }
  
  return 'tinyllama:latest'; // Fallback par défaut
}