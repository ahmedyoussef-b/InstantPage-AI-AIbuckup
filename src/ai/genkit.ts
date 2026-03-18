// src/ai/genkit.ts - Version avec tous vos modèles
import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    ollama({
      models: [
        { 
          name: 'phi3:mini',
          type: 'generate' as const,
        },
        { 
          name: 'phi:2.7b',
          type: 'generate' as const,
        },
        { 
          name: 'llama3:8b',
          type: 'generate' as const,
        },
        { 
          name: 'tinyllama:latest',
          type: 'generate' as const,
        },
      ],
    }),
  ],
  model: 'ollama/phi3:mini', // Modèle par défaut
});