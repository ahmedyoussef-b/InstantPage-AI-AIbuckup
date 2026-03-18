// src/ai/ml/data-collector.ts
export class TrainingDataCollector {
    async collectAll(): Promise<TrainingExample[]> {
      const examples = [];
      
      // SOURCE 1: Documents structurés
      const documents = await this.extractFromDocuments();
      examples.push(...documents);
      
      // SOURCE 2: QA pairs des conversations
      const conversations = await this.extractFromChats();
      examples.push(...conversations);
      
      // SOURCE 3: Corrections (poids élevé)
      const corrections = await this.extractFromCorrections();
      examples.push(...corrections.map(c => ({ ...c, weight: 2.0 })));
      
      // SOURCE 4: Actions réussies
      const actions = await this.extractFromActions();
      examples.push(...actions);
      
      // SOURCE 5: Données synthétiques (augmentation)
      if (examples.length < 500) {
        const synthetic = await this.generateSyntheticData(examples);
        examples.push(...synthetic);
      }
      
      return examples;
    }
    
    private async extractFromDocuments(): Promise<TrainingExample[]> {
      const docs = await db.documents.find({ processed: true });
      const examples = [];
      
      for (const doc of docs) {
        // Créer des paires question/réponse à partir des documents
        const qaPairs = await this.generateQAPairs(doc.content);
        examples.push(...qaPairs);
        
        // Extraire les concepts clés
        const concepts = await this.extractConcepts(doc.content);
        examples.push(...concepts.map(c => ({
          type: 'concept',
          input: `Explique le concept: ${c.term}`,
          output: c.definition,
          source: 'document',
          docId: doc.id
        })));
      }
      
      return examples;
    }
    
    private async extractFromChats(): Promise<TrainingExample[]> {
      const chats = await db.chats.find({
        rating: { $gt: 4 }, // Seulement les conversations bien notées
        timestamp: { $gt: Date.now() - 30 * 24 * 60 * 60 * 1000 }
      });
      
      return chats.map(chat => ({
        type: 'chat',
        input: chat.query,
        output: chat.response,
        context: chat.context,
        rating: chat.rating,
        source: 'conversation'
      }));
    }
    
    private async extractFromCorrections(): Promise<TrainingExample[]> {
      const corrections = await db.corrections.find({});
      
      return corrections.map(c => ({
        type: 'correction',
        input: `Question: ${c.query}\nMauvaise réponse: ${c.wrongAnswer}`,
        output: c.correctAnswer,
        correction: c.userFeedback,
        weight: 2.0,
        source: 'user_correction'
      }));
    }
    
    private async generateSyntheticData(existing: TrainingExample[]): Promise<TrainingExample[]> {
      // Utiliser le modèle actuel pour générer des variations
      const synthetic = [];
      
      for (const example of existing.slice(0, 50)) {
        // Paraphraser
        const paraphrased = await this.paraphraseExample(example);
        if (paraphrased) synthetic.push(paraphrased);
        
        // Varier le contexte
        const contextualized = await this.addContextVariation(example);
        if (contextualized) synthetic.push(contextualized);
      }
      
      return synthetic;
    }
  }