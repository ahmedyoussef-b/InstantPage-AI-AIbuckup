// src/ai/rag/query-analyzer.ts
export class QueryAnalyzer {
    async analyze(query: string): Promise<QueryAnalysis> {
      // 1. Détection du type de question
      const type = this.detectQueryType(query);
      
      // 2. Extraction des concepts clés
      const concepts = await this.extractConcepts(query);
      
      // 3. Évaluation de la complexité
      const complexity = this.assessComplexity(query);
      
      // 4. Détection de l'intention
      const intent = this.detectIntent(query);
      
      // 5. Extraction des entités nommées
      const entities = await this.extractEntities(query);
      
      return {
        type,
        concepts,
        complexity,
        intent,
        entities,
        original: query
      };
    }
    
    private detectQueryType(query: string): QueryType {
      const patterns = {
        factual: /(qu'est-ce que|comment|pourquoi|quand|où)/i,
        procedural: /(comment faire|étapes|procédure|manuel)/i,
        comparative: /(différence|comparaison|versus|vs)/i,
        explanatory: /(explique|décris|détaille)/i,
        action: /(peux-tu|peut-on|est-ce possible)/i
      };
      
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(query)) {
          return type as QueryType;
        }
      }
      
      return 'general';
    }
    
    private async extractConcepts(query: string): Promise<string[]> {
      // Utiliser un petit modèle NER local
      const response = await fetch('http://localhost:8080/ner', {
        method: 'POST',
        body: JSON.stringify({ text: query })
      });
      
      const { entities } = await response.json();
      return entities.map(e => e.text);
    }
    
    private assessComplexity(query: string): number {
      let complexity = 0.3; // Base
      
      // Longueur
      complexity += Math.min(query.length / 200, 0.3);
      
      // Mots techniques
      const technicalTerms = this.countTechnicalTerms(query);
      complexity += technicalTerms * 0.1;
      
      // Sous-questions
      const subQuestions = (query.match(/\?/g) || []).length;
      complexity += subQuestions * 0.2;
      
      return Math.min(complexity, 1.0);
    }
    
    private detectIntent(query: string): Intent {
      if (query.includes('aide') || query.includes('aide-moi')) {
        return 'help';
      }
      if (query.includes('explique')) {
        return 'explain';
      }
      if (query.includes('résume') || query.includes('synthèse')) {
        return 'summarize';
      }
      if (query.match(/\d+[\+\-\*\/]\d+/)) {
        return 'calculate';
      }
      return 'inform';
    }
  }