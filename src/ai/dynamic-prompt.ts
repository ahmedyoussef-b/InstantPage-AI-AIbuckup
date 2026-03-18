/**
 * @fileOverview DynamicPromptEngine - Optimisation adaptative des prompts.
 * Analyse le type de question pour construire le meilleur contexte possible.
 */

export interface PerformanceRecord {
  question: string;
  prompt: string;
  response: string;
  feedback: number;
  timestamp: number;
}

export class DynamicPromptEngine {
  private defaultTemplate = `Tu es un Assistant Professionnel Intelligent expert.
    
    INSTRUCTIONS :
    - Réponds de manière précise, technique et concise.
    - Réponds toujours en français.
    - Utilise le contexte des documents fournis ci-dessous.
    
    CONTEXTE DOCUMENTS :
    {{context}}
    
    Question : {{question}}`;

  private templates: Record<string, string> = {
    procedure: `Tu es un Expert en Procédures Techniques. 
      Ta mission est de fournir des instructions étape par étape claires et sécurisées.
      Utilise des listes numérotées et mets en évidence les avertissements de sécurité.
      
      CONTEXTE :
      {{context}}
      
      PROCÉDURE DEMANDÉE : {{question}}`,
    
    definition: `Tu es un Expert Technique spécialisé dans la vulgarisation.
      Explique le concept suivant de manière précise mais accessible.
      Donne une définition courte suivie d'une application concrète.
      
      CONTEXTE :
      {{context}}
      
      CONCEPT : {{question}}`,
    
    comparison: `Tu es un Analyste Technique. 
      Compare les éléments mentionnés en soulignant les avantages, les inconvénients et les différences clés.
      Utilise un format structuré (tableau ou liste comparative).
      
      CONTEXTE :
      {{context}}
      
      COMPARAISON : {{question}}`
  };

  /**
   * Construit un prompt optimisé basé sur la question.
   */
  async buildPrompt(question: string, context: string): Promise<string> {
    const type = this.analyzeQuestionType(question);
    const template = this.templates[type] || this.defaultTemplate;

    return template
      .replace('{{question}}', question)
      .replace('{{context}}', context || "Aucun document spécifique n'est chargé pour cette question.");
  }

  /**
   * Analyse sémantique simplifiée pour déterminer le type de question.
   */
  private analyzeQuestionType(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('comment') || q.includes('étape') || q.includes('procédure') || q.includes('faire')) {
      return 'procedure';
    }
    if (q.includes('qu\'est-ce que') || q.includes('définition') || q.includes('signifie') || q.includes('est quoi')) {
      return 'definition';
    }
    if (q.includes('différence') || q.includes('comparer') || q.includes('mieux') || q.includes('versus') || q.includes('vs')) {
      return 'comparison';
    }
    return 'general';
  }
}

export const dynamicPromptEngine = new DynamicPromptEngine();
