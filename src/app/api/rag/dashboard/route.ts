// src/app/api/rag/dashboard/route.ts
export async function GET() {
    const stats = await getRAGStats();
    
    return Response.json({
      performance: {
        avgRetrievalTime: stats.avgRetrievalTime,
        avgGenerationTime: stats.avgGenerationTime,
        contextSizeAvg: stats.contextSizeAvg,
        sourcesPerQuery: stats.sourcesPerQuery
      },
      quality: {
        relevanceScore: stats.relevanceScore,
        citationAccuracy: stats.citationAccuracy,
        userSatisfaction: stats.userSatisfaction
      },
      sources: {
        documents: stats.documentsUsed,
        lessons: stats.lessonsUsed,
        interactions: stats.interactionsUsed
      },
      learning: {
        correctionsIntegrated: stats.correctionsCount,
        weightsCurrent: stats.currentWeights,
        nextOptimization: stats.nextOptimization
      }
    });
  }