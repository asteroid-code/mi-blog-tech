import Groq from 'groq-sdk';
import { CohereClient } from 'cohere-ai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

interface AIClientsConfig {
  groqApiKey?: string;
  cohereApiKey?: string;
  huggingFaceApiKey?: string;
  googleApiKey?: string;
  openaiApiKey?: string;
}

export class AIClients {
  private groq: Groq;
  private cohere: CohereClient;
  private google: GoogleGenerativeAI;
  private openai: OpenAI;
  private huggingFaceApiKey: string | undefined;

  constructor(config: AIClientsConfig) {
    this.groq = new Groq({
      apiKey: config.groqApiKey,
      timeout: 30000,
    });

    this.cohere = new CohereClient({
      token: config.cohereApiKey,
    });

    this.google = new GoogleGenerativeAI(config.googleApiKey || "");

    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
      timeout: 30000,
    });

    this.huggingFaceApiKey = config.huggingFaceApiKey;
  }

  getGroqClient(): Groq {
    return this.groq;
  }

  getCohereClient(): CohereClient {
    return this.cohere;
  }

  getGoogleClient(): GoogleGenerativeAI {
    return this.google;
  }

  getOpenAIClient(): OpenAI {
    return this.openai;
  }

  getHuggingFaceApiKey(): string | undefined {
    return this.huggingFaceApiKey;
  }

  validateApiKeys(): { provider: string; valid: boolean }[] {
    return [
      { provider: 'groq', valid: !!process.env.GROQ_API_KEY },
      { provider: 'cohere', valid: !!process.env.COHERE_API_KEY },
      { provider: 'huggingface', valid: !!process.env.HUGGINGFACE_API_KEY },
      { provider: 'google', valid: !!process.env.GOOGLE_AI_API_KEY },
      { provider: 'openai', valid: !!process.env.OPENAI_API_KEY },
    ];
  }

  getFallbackOrder(): string[] {
    // This can be dynamically configured or loaded from a central config
    return ['google', 'openai', 'cohere', 'groq', 'huggingface'];
  }
}

// Helper functions for direct API calls (can be refactored to use the AIClients class)
export async function getGroqCompletion(messages: any[], model: string = 'llama3-8b-8192') {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set.');
  }
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
    });
    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`Groq API failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getCohereCompletion(prompt: string, model: string = 'command-r-plus') {
  if (!process.env.COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY is not set.');
  }
  try {
    const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
    const response = await cohere.chat({
      message: prompt,
      model,
      temperature: 0.7,
    });
    return response.text;
  } catch (error) {
    console.error('Cohere API Error:', error);
    throw new Error(`Cohere API failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getHuggingFaceInference(
  modelId: string,
  payload: any,
  options: RequestInit = {}
) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY is not set.');
  }

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${modelId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    }
  );

  if (!response.ok) {
    const errorBody = await response.json();
    console.error('HuggingFace API Error:', errorBody);
    throw new Error(
      `HuggingFace API failed for model ${modelId}: ${response.statusText} - ${JSON.stringify(errorBody)}`
    );
  }

  return response.json();
}
