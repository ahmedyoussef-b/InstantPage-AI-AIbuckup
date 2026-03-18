// src/ai/rag/context-assembler.ts
export class ContextAssembler {
    async assemble(retrievalResult: RetrievalResult): Promise<AssembledContext> {
      // 1. Trier par pertinence
      const sorted = retrievalResult.contexts.sort((a, b) => b.finalScore - a.finalScore);
      
      // 2. Limiter la taille du contexte (token limit)
      const limited = this.limitContextSize(sorted);
      
      // 3. Formater pour le LLM
      const formatted = this.formatForLLM(limited);
      
      // 4. Ajouter des métadonnées
      const withMetadata = this.addMetadata(formatted, retrievalResult);
      
      return {
        text: withMetadata,
        sources: limited.map(c => ({
          source: c.source,
          title: c.metadata?.title || 'Document',
          relevance: c.finalScore
        })),
        tokenCount: this.countTokens(withMetadata)
      };
    }
    
    private limitContextSize(contexts: any[]): any[] {
      let totalTokens = 0;
      const limit = 2000; // Tokens max
      const limited = [];
      
      for (const ctx of contexts) {
        const tokens = this.countTokens(ctx.content);
        if (totalTokens + tokens <= limit) {
          limited.push(ctx);
          totalTokens += tokens;
        } else {
          // Tronquer le dernier si nécessaire
          const remaining = limit - totalTokens;
          if (remaining > 50) {
            limited.push({
              ...ctx,
              content: ctx.content.substring(0, remaining * 4) // Approximation
            });
          }
          break;
        }
      }
      
      return limited;
    }
    
    private formatForLLM(contexts: any[]): string {
      let formatted = "Contexte pertinent:\n\n";
      
      contexts.forEach((ctx, i) => {
        formatted += `[Source ${i + 1}: ${ctx.source} - Pertinence: ${(ctx.finalScore * 100).toFixed(0)}%]\n`;
        formatted += `${ctx.content}\n\n`;
      });
      
      return formatted;
    }
    
    private addMetadata(text: string, retrievalResult: RetrievalResult): string {
      // Ajouter des instructions basées sur l'analyse
      const analysis = retrievalResult.analysis;
      
      let enhanced = text;
      
      if (analysis.type === 'procedural') {
        enhanced = "INSTRUCTION: Réponds avec des étapes numérotées claires.\n\n" + enhanced;
      }
      
      if (analysis.complexity > 0.7) {
        enhanced = "INSTRUCTION: Décompose ta réponse et explique étape par étape.\n\n" + enhanced;
      }
      
      return enhanced;
    }
  }