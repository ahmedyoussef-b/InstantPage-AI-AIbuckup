/**
 * @fileOverview FeedbackLoop - Surveillance active de la satisfaction et auto-déclenchement.
 */

import { UserInteraction, PredictionRecord } from './types';

export class FeedbackLoop {
  private interactions: Map<string, PredictionRecord> = new Map();
  
  startMonitoring() {
    console.log("[ML-FEEDBACK] Surveillance active des performances lancée.");
    // Simulation d'une tâche de fond
    setInterval(() => this.analyzePerformance(), 3600000); // Toutes les heures
  }
  
  async recordInteraction(interaction: UserInteraction) {
    const id = Math.random().toString(36).substring(7);
    const record: PredictionRecord = {
      ...interaction,
      id,
      timestamp: Date.now()
    };
    this.interactions.set(id, record);
    
    if (interaction.feedback?.rating && interaction.feedback.rating < 2) {
      console.log(`⚠️ [ML-FEEDBACK] Alerte insatisfaction détectée sur interaction ${id}`);
    }
  }
  
  private analyzePerformance() {
    const recent = Array.from(this.interactions.values()).filter(i => i.timestamp > Date.now() - 86400000);
    const avgRating = recent.reduce((acc, i) => acc + (i.feedback?.rating || 4), 0) / (recent.length || 1);
    
    console.log(`📊 [ML-FEEDBACK] Statut 24h : Satisfaction moyenne ${avgRating.toFixed(2)}/5`);
  }
}
