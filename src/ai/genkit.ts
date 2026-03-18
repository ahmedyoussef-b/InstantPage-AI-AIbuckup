// src/ai/genkit.ts - Version avec support pour modèle quantifié spécialisé
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
          name: 'llama3:8b',
          type: 'generate' as const,
        },
        { 
          name: 'tinyllama:latest',
          type: 'generate' as const,
        },
        {
          // Innovation 7: Modèle ultra-spécialisé quantifié (4-bit, ~350MB)
          name: 'custom-specialized-model:latest',
          type: 'generate' as const,
        }
      ],
    }),
  ],
  model: 'ollama/phi3:mini', // Modèle par défaut
});
