export interface Plan {
  name: string;
  lookup_key: string; // Corresponds to Stripe Price Lookup Key
  price_id: string; // Corresponds to Stripe Price ID
  price: string; // Display price, e.g., "$0/month"
  description: string;
  features: string[];
  articlesPerMonth: number;
  aiModels: string[];
}

export const plans: Plan[] = [
  {
    name: 'Free',
    lookup_key: 'free',
    price_id: '', // No Stripe Price ID for free plan
    price: '$0/month',
    description: 'Perfect for trying out the platform.',
    features: ['3 articles per month', 'Basic AI models'],
    articlesPerMonth: 3,
    aiModels: ['huggingface-basic'],
  },
  {
    name: 'Pro',
    lookup_key: 'pro',
    price_id: process.env.STRIPE_PRO_PRICE_ID || '', // Replace with actual Stripe Price ID
    price: '$19/month',
    description: 'For growing content creators.',
    features: ['50 articles per month', 'Advanced AI models (OpenAI, Google, Cohere, Groq)'],
    articlesPerMonth: 50,
    aiModels: ['huggingface', 'cohere', 'grok', 'openai', 'google'],
  },
  {
    name: 'Enterprise',
    lookup_key: 'enterprise',
    price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || '', // Replace with actual Stripe Price ID
    price: '$99/month',
    description: 'Unlimited power for large teams.',
    features: ['1000 articles per month', 'All AI models', 'Priority support'],
    articlesPerMonth: 1000,
    aiModels: ['all'],
  },
];

export type PlanType = 'free' | 'pro' | 'enterprise';
