/**
 * @fileOverview DataCollector - Collecte des données d'entraînement pour le fine-tuning.
 * Récupère les données depuis toutes les phases de la boucle cognitive Elite 32.
 */

export interface RawTrainingData {
  type: 'comprehension' | 'reasoning' | 'action' | 'correction';
  input: string;
  output: string;
  context?: string;
  success: boolean;
  metadata: any;
}

export class DataCollector {
  /**
   * Collecte les données depuis la mémoire épisodique et les logs d'interactions.
   */
  async collectFromAllPhases(context: { memory: any[], documents: any[] }): Promise<RawTrainingData[]> {
    console.log(`[AI][TRAINING-DATA] Collecte de données sur ${context.memory.length} épisodes...`);
    
    const trainingData: RawTrainingData[] = [];

    // 1. Collecte des corrections (Haute priorité)
    const corrections = context.memory.filter(e => e.type === 'learning' || e.importance > 0.9);
    corrections.forEach(c => {
      trainingData.push({
        type: 'correction',
        input: c.context,
        output: c.content,
        success: true,
        metadata: { importance: c.importance, timestamp: c.timestamp }
      });
    });

    // 2. Collecte des raisonnements réussis
    const successfulReasonings = context.memory.filter(e => e.type === 'interaction' && e.importance > 0.7);
    successfulReasonings.forEach(r => {
      trainingData.push({
        type: 'reasoning',
        input: r.context,
        output: r.content,
        success: true,
        metadata: { score: r.importance }
      });
    });

    // 3. Collecte à partir du contexte documentaire (Synthèse)
    if (context.documents.length > 0) {
      context.documents.slice(0, 5).forEach(doc => {
        trainingData.push({
          type: 'comprehension',
          input: `Résume les points techniques clés du document : ${doc.name}`,
          output: doc.enhancedContent || doc.content?.substring(0, 500) || '',
          success: true,
          metadata: { docId: doc.id }
        });
      });
    }

    return trainingData;
  }
}
