// src/ai/genkit.ts - VERSION CORRIGÉE

import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    ollama({
      // La configuration du serveur se fait via variable d'environnement
      models: [
        {
          name: 'tinyllama:latest',
          type: 'generate'
        },
        {
          name: 'nomic-embed-text',
          type: 'embedding'
        }
      ],
      // Pas de propriété 'server' ici
    }),
  ],
  model: 'ollama/tinyllama:latest',
});