// src/app/api/agent/dashboard/route.ts
export async function GET() {
    const stats = await getAgentStats();
    
    return Response.json({
      performance: {
        requestsProcessed: stats.totalRequests,
        avgProcessingTime: stats.avgTime,
        successRate: stats.successRate,
        stepsPerRequest: stats.avgSteps
      },
      tools: {
        mostUsed: stats.topTools,
        successByTool: stats.toolSuccessRates,
        avgToolTime: stats.toolAvgTime
      },
      learning: {
        patternsLearned: stats.patternsCount,
        optimizationsApplied: stats.optimizations,
        lastImprovement: stats.lastImprovement
      },
      mcp: {
        contextSize: stats.avgContextSize,
        toolsAvailable: stats.toolsCount,
        cacheHitRate: stats.cacheHitRate
      }
    });
  }