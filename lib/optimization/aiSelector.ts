// lib/optimization/aiSelector.ts
interface AIModel {
  id: string;
  costPerToken: number;
  qualityScore: number; // e.g., 0-100
}

const availableAIModels: AIModel[] = [
  { id: "model-a", costPerToken: 0.001, qualityScore: 85 },
  { id: "model-b", costPerToken: 0.002, qualityScore: 92 },
  { id: "model-c", costPerToken: 0.0005, qualityScore: 70 },
];

class AISelector {
  private models: AIModel[];

  constructor(models: AIModel[] = availableAIModels) {
    this.models = models;
  }

  /**
   * Selects the best AI model based on a cost-quality trade-off.
   * A higher `qualityPreference` (0 to 1) means it will prioritize quality over cost.
   */
  selectBestModel(qualityPreference: number = 0.5): AIModel {
    if (qualityPreference < 0 || qualityPreference > 1) {
      throw new Error("Quality preference must be between 0 and 1.");
    }

    // Normalize scores and costs for comparison
    const maxCost = Math.max(...this.models.map(m => m.costPerToken));
    const minCost = Math.min(...this.models.map(m => m.costPerToken));
    const maxQuality = Math.max(...this.models.map(m => m.qualityScore));
    const minQuality = Math.min(...this.models.map(m => m.qualityScore));

    let bestModel: AIModel = this.models[0];
    let bestScore: number = -Infinity;

    for (const model of this.models) {
      const normalizedCost = (model.costPerToken - minCost) / (maxCost - minCost || 1);
      const normalizedQuality = (model.qualityScore - minQuality) / (maxQuality - minQuality || 1);

      // Calculate a weighted score
      const score = (normalizedQuality * qualityPreference) - (normalizedCost * (1 - qualityPreference));

      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }

    return bestModel;
  }

  getModelById(id: string): AIModel | undefined {
    return this.models.find(model => model.id === id);
  }
}

export const aiSelector = new AISelector();
