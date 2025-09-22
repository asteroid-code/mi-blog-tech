// lib/monitoring/abTesting.ts
interface Experiment {
  id: string;
  name: string;
  variants: { [key: string]: any }; // e.g., { "A": { aiModel: "model-a" }, "B": { aiModel: "model-b" } }
  trafficAllocation: { [key: string]: number }; // e.g., { "A": 0.5, "B": 0.5 }
  startDate: Date;
  endDate?: Date;
  status: "active" | "inactive" | "completed";
  results?: { [key: string]: any }; // e.g., { "A": { engagement: 0.7 }, "B": { engagement: 0.75 } }
}

class ABTestingSystem {
  private experiments: Map<string, Experiment>;

  constructor() {
    this.experiments = new Map();
  }

  createExperiment(
    id: string,
    name: string,
    variants: Experiment["variants"],
    trafficAllocation: Experiment["trafficAllocation"]
  ): Experiment {
    if (this.experiments.has(id)) {
      throw new Error(`Experiment with ID "${id}" already exists.`);
    }
    const totalAllocation = Object.values(trafficAllocation).reduce((sum, val) => sum + val, 0);
    if (totalAllocation !== 1) {
      throw new Error("Traffic allocation must sum to 1.");
    }

    const newExperiment: Experiment = {
      id,
      name,
      variants,
      trafficAllocation,
      startDate: new Date(),
      status: "active",
    };
    this.experiments.set(id, newExperiment);
    console.log(`Experiment "${name}" created:`, newExperiment);
    return newExperiment;
  }

  getExperiment(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  activateExperiment(id: string): boolean {
    const experiment = this.experiments.get(id);
    if (experiment) {
      experiment.status = "active";
      return true;
    }
    return false;
  }

  deactivateExperiment(id: string): boolean {
    const experiment = this.experiments.get(id);
    if (experiment) {
      experiment.status = "inactive";
      return true;
    }
    return false;
  }

  completeExperiment(id: string, results: Experiment["results"]): boolean {
    const experiment = this.experiments.get(id);
    if (experiment) {
      experiment.status = "completed";
      experiment.endDate = new Date();
      experiment.results = results;
      return true;
    }
    return false;
  }

  /**
   * Assigns a user/request to a variant based on traffic allocation.
   * In a real system, this would use a consistent hashing mechanism for user stickiness.
   */
  getVariant(experimentId: string): { variantName: string; config: any } | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== "active") {
      return null;
    }

    const random = Math.random();
    let cumulativeProbability = 0;

    for (const variantName in experiment.trafficAllocation) {
      cumulativeProbability += experiment.trafficAllocation[variantName];
      if (random <= cumulativeProbability) {
        return { variantName, config: experiment.variants[variantName] };
      }
    }
    return null; // Should not happen if allocation sums to 1
  }
}

export const abTestingSystem = new ABTestingSystem();
