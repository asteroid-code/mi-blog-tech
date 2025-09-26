export interface Plan {
  name: string;
  id: string; // Unique identifier for the plan
  price: string; // Display price, e.g., "$0/month"
  description: string;
  features: string[];
  articlesPerMonth: number;
  aiModels: string[];
}

export const plans: Plan[] = [
  {
    name: 'Free',
    id: 'free',
    price: '$0/month',
    description: 'Perfect for trying out the platform.',
    features: ['3 articles per month', 'Basic AI models'],
    articlesPerMonth: 3,
    aiModels: ['huggingface-basic'],
  },
  {
    name: 'Pro',
    id: 'pro',
    price: '$19/month',
    description: 'For growing content creators.',
    features: ['50 articles per month', 'Advanced AI models (OpenAI, Google, Cohere, Groq)'],
    articlesPerMonth: 50,
    aiModels: ['huggingface', 'cohere', 'grok', 'openai', 'google'],
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: '$99/month',
    description: 'Unlimited power for large teams.',
    features: ['1000 articles per month', 'All AI models', 'Priority support'],
    articlesPerMonth: 1000,
    aiModels: ['all'],
  },
];

export type PlanType = 'free' | 'pro' | 'enterprise';
