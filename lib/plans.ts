export const PLANS = {
  free: { articlesPerMonth: 3, aiModels: ['huggingface-basic'], price: 0 },
  pro: { articlesPerMonth: 50, aiModels: ['huggingface', 'cohere', 'grok'], price: 19 },
  enterprise: { articlesPerMonth: 1000, aiModels: ['all'], price: 99 }
};

export type PlanType = keyof typeof PLANS;

export interface PlanDetails {
  articlesPerMonth: number;
  aiModels: string[];
  price: number;
}
