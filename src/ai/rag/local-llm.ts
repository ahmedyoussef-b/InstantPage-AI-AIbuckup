// src/ai/rag/local-llm.ts
export class LocalLLM {
    private ollamaUrl = 'http://localhost:11434';
    private currentModel = 'tinyllama:latest';
    
    async generate(prompt: string, context: AssembledContext): Promise<LLMResponse> {
      const startTime = Date.now();
      
      // 1. Construire le prompt final
      const fullPrompt = this.buildPrompt(prompt, context);
      
      // 2. Appeler Ollama
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.currentModel,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: this.getTemperature(context),
            top_p: 0.9,
            max_tokens: 1000
          }
        })
      });
      
      const data = await response.json();
      
      // 3. Post-traitement
      const processed = this.postProcess(data.response, context);
      
      return {
        text: processed,
        tokens: data.eval_count,
        latency: Date.now() - startTime,
        model: this.currentModel,
        sources: context.sources
      };
    }
    
    private buildPrompt(userPrompt: string, context: AssembledContext): string {
      return `
  ${context.text}
  
  Question de l'utilisateur: ${userPrompt}
  
  Instructions:
  - Réponds en français
  - Base-toi uniquement sur le contexte fourni
  - Cite tes sources entre crochets
  - Sois précis et concis
  - Si l'information n'est pas dans le contexte, dis-le
  
  Réponse:`;
    }
    
    private getTemperature(context: AssembledContext): number {
      // Ajuster la température selon le type de question
      if (context.sources.some(s => s.source === 'document')) {
        return 0.3; // Plus factuel
      }
      if (context.sources.some(s => s.source === 'lesson')) {
        return 0.5; // Équilibré
      }
      return 0.7; // Plus créatif
    }
    
    private postProcess(response: string, context: AssembledContext): string {
      // Nettoyer la réponse
      let cleaned = response.trim();
      
      // S'assurer que les sources sont citées
      if (!cleaned.includes('[') && context.sources.length > 0) {
        cleaned += `\n\n[Source: ${context.sources[0].title}]`;
      }
      
      return cleaned;
    }
  }