// src/app/api/ml/dashboard/route.ts
export async function GET() {
    const pipeline = new CompleteMLPipeline();
    const recommender = new PersonalizedRecommender();
    
    const stats = {
      model: await getCurrentModelStats(),
      training: await getTrainingStats(),
      inference: await getInferenceStats(),
      recommendations: await getRecommendationStats()
    };
    
    return Response.json({
      model: {
        version: stats.model.version,
        accuracy: stats.model.accuracy,
        trainedOn: stats.model.trainedOn,
        dataSize: stats.model.dataSize
      },
      training: {
        lastTraining: stats.training.lastTraining,
        nextScheduled: stats.training.nextScheduled,
        dataAvailable: stats.training.dataAvailable,
        threshold: 100
      },
      inference: {
        totalPredictions: stats.inference.total,
        avgLatency: stats.inference.avgLatency,
        cacheHitRate: stats.inference.cacheHitRate,
        confidenceAvg: stats.inference.confidenceAvg
      },
      recommendations: {
        total: stats.recommendations.total,
        clickRate: stats.recommendations.clickRate,
        satisfactionAvg: stats.recommendations.satisfactionAvg,
        topCategories: stats.recommendations.topCategories
      },
      recentFeedback: await getRecentFeedback()
    });
  }