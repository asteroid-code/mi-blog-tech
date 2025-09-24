import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { Groq } from "groq-sdk";
import Cohere from "cohere-ai";
import { HfInference } from "@huggingface/inference";

export class AIClients {
  private googleAI: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;
  private groq: Groq | null = null;
  private cohere: any | null = null;
  private hf: HfInference | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    try {
      if (process.env.GOOGLE_AI_API_KEY) {
        this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      }

      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      }

      if (process.env.GROQ_API_KEY) {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      }

      if (process.env.COHERE_API_KEY) {
        this.cohere = Cohere;
        this.cohere.init(process.env.COHERE_API_KEY);
      }

      if (process.env.HUGGINGFACE_API_KEY) {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
      }
    } catch (error) {
      console.error('Error initializing AI clients:', error);
    }
  }

  validateApiKeys(): Record<string, boolean> {
    return {
      google: !!process.env.GOOGLE_AI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
      huggingface: !!process.env.HUGGINGFACE_API_KEY
    };
  }

  // Getters seguros con verificación
  getGoogleClient(): GoogleGenerativeAI {
    if (!this.googleAI) throw new Error('Google AI client not initialized');
    return this.googleAI;
  }

  getOpenAIClient(): OpenAI {
    if (!this.openai) throw new Error('OpenAI client not initialized');
    return this.openai;
  }

  getGroqClient(): Groq {
    if (!this.groq) throw new Error('Groq client not initialized');
    return this.groq;
  }

  getCohereClient(): any {
    if (!this.cohere) throw new Error('Cohere client not initialized');
    return this.cohere;
  }

  getHFClient(): HfInference {
    if (!this.hf) throw new Error('HuggingFace client not initialized');
    return this.hf;
  }
}
