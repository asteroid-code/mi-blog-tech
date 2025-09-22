// lib/monitoring/engagementTracker.ts
interface EngagementMetric {
  articleId: string;
  timestamp: Date;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

class EngagementTracker {
  private engagementData: Map<string, EngagementMetric[]>; // articleId -> array of metrics

  constructor() {
    this.engagementData = new Map();
  }

  trackEngagement(articleId: string, metrics: Partial<Omit<EngagementMetric, "articleId" | "timestamp">>): void {
    const currentMetrics = this.engagementData.get(articleId) || [];
    const newMetric: EngagementMetric = {
      articleId,
      timestamp: new Date(),
      views: metrics.views || 0,
      likes: metrics.likes || 0,
      shares: metrics.shares || 0,
      comments: metrics.comments || 0,
    };
    currentMetrics.push(newMetric);
    this.engagementData.set(articleId, currentMetrics);
    console.log(`Engagement tracked for article ${articleId}:`, newMetric);
  }

  getEngagementHistory(articleId: string): EngagementMetric[] {
    return this.engagementData.get(articleId) || [];
  }

  getLatestEngagement(articleId: string): EngagementMetric | null {
    const history = this.getEngagementHistory(articleId);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  // This would typically interact with a database in a real application
  private saveToDatabase(metric: EngagementMetric): void {
    // Placeholder for database interaction
    console.log("Saving engagement metric to database:", metric);
  }
}

export const engagementTracker = new EngagementTracker();
