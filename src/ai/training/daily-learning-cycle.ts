// src/ai/training/daily-learning-cycle.ts
export class DailyLearningCycle {
    private pipeline: TrainingPipeline;
    private registry: ModelRegistry;
    
    constructor() {
      this.pipeline = new TrainingPipeline();
      this.registry = new ModelRegistry();
    }
    
    async runDailyCycle() {
      console.log("🌅 DÉMARRAGE DU CYCLE D'APPRENTISSAGE QUOTIDIEN");
      
      // 1. Collecter les données du jour
      const todayData = await this.collectTodayData();
      console.log(`📊 Données du jour: ${todayData.length} interactions`);
      
      // 2. Si assez de données, lancer un entraînement
      if (todayData.length > 100) {
        const evaluation = await this.pipeline.runTrainingCycle();
        
        // 3. Si amélioration, proposer un test A/B
        if (evaluation.improvement > 0.03) {
          await this.registry.a_b_test(evaluation.newModel);
        }
      }
      
      // 4. Mise à jour des embeddings
      await this.updateEmbeddings(todayData);
      
      // 5. Nettoyage des vieilles données
      await this.cleanOldData();
      
      console.log("✨ CYCLE QUOTIDIEN TERMINÉ");
    }
    
    private async collectTodayData() {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      return await db.interactions.find({
        timestamp: { $gt: oneDayAgo }
      });
    }
    
    private async updateEmbeddings(newData: any[]) {
      // Re-vectoriser avec les nouvelles données
      for (const item of newData) {
        const embedding = await getEmbedding(item.content);
        
        await vectorDB.update(item.id, {
          vector: embedding,
          metadata: {
            ...item,
            lastUpdated: Date.now()
          }
        });
      }
    }
  }