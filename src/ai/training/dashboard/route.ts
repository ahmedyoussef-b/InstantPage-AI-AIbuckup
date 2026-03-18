// src/app/api/training/dashboard/route.ts
export async function GET() {
    const registry = new ModelRegistry();
    const stats = await getTrainingStats();
    
    return Response.json({
      currentModel: {
        id: registry.currentModel,
        deployedAt: registry.getCurrentModel()?.deployedAt,
        metrics: registry.getCurrentModel()?.metrics
      },
      trainingStats: {
        totalInteractions: stats.totalInteractions,
        correctionsReceived: stats.corrections,
        avgSatisfaction: stats.avgSatisfaction,
        dataSize: stats.dataSize
      },
      recentImprovements: stats.improvements.slice(-7),
      nextTraining: {
        scheduledFor: stats.nextTraining,
        dataAvailable: stats.todayData,
        threshold: 100,
        ready: stats.todayData >= 100
      },
      models: await registry.listModels()
    });
  }