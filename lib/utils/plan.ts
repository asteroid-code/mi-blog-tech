import { PlanType, plans, Plan } from '@/lib/plans';

export function getPlanDetails(planType: PlanType): Plan {
  const plan = plans.find(p => p.lookup_key === planType);
  if (!plan) {
    // Fallback to free plan if planType is not found
    return plans.find(p => p.lookup_key === 'free')!;
  }
  return plan;
}

export function canGenerateArticles(userPlanType: PlanType, currentArticleCount: number): boolean {
  const planDetails = getPlanDetails(userPlanType);
  return currentArticleCount < planDetails.articlesPerMonth;
}

export function canUseAIModel(userPlanType: PlanType, modelName: string): boolean {
  const planDetails = getPlanDetails(userPlanType);
  if (planDetails.aiModels.includes('all')) {
    return true;
  }
  return planDetails.aiModels.includes(modelName);
}

// Example usage:
// const userPlan = 'pro';
// const canGenerate = canGenerateArticles(userPlan, 40); // true if pro allows > 40 articles
// const canUseOpenAI = canUseAIModel(userPlan, 'openai'); // true if pro plan includes openai
