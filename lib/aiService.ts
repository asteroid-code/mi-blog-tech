import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';

// Cargar la clave de API de HuggingFace desde las variables de entorno
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Tipos de datos
interface ApiConfiguration {
  id: number;
  provider_name: string;
  api_key: string;
  is_active: boolean;
  model_name?: string;
}

interface Profile {
  id: string;
  credits: number;
}

interface ApiUsage {
  id?: number;
  provider: string;
  tokens_used: number;
  cost: number;
  user_id: string;
  created_at?: string;
}

type ProviderType = 'grok' | 'huggingface' | 'cohere';

const PROVIDER_PREFERENCE: ProviderType[] = ['grok', 'huggingface', 'cohere'];

class AIService {
  private supabase;

  constructor() {
    this.supabase = createServerSupabaseClient();
  }

  /**
   * Obtiene los proveedores de IA activos y configurados.
   */
  async getAvailableProviders(): Promise<ApiConfiguration[]> {
    const { data, error } = await this.supabase
      .from('api_configurations')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching available providers:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calcula el costo en créditos para una cantidad de tokens y un proveedor.
   * (Esta es una implementación de ejemplo, los costos reales deben ser ajustados)
   */
  calculateCost(tokens: number, provider: ProviderType): number {
    switch (provider) {
      case 'grok':
        return tokens * 0.0001;
      case 'huggingface':
        return tokens * 0.0002;
      case 'cohere':
        return tokens * 0.00015;
      default:
        return tokens * 0.001; // Costo por defecto
    }
  }

  /**
   * Registra el uso de la API en la base de datos.
   */
  private async logApiUsage(usage: Omit<ApiUsage, 'id' | 'created_at'>): Promise<void> {
    const { error } = await this.supabase.from('api_usage').insert([usage]);
    if (error) {
      console.error('Error logging API usage:', error);
    }
  }

  /**
   * Genera texto utilizando el mejor proveedor disponible.
   */
  async generateText(prompt: string, userId: string, type: 'creative' | 'specific' | 'structured'): Promise<string | null> {
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile or profile not found:', profileError);
      return null;
    }

    let userCredits = profile.credits;

    const availableProviders = await this.getAvailableProviders();
    const sortedProviders = availableProviders.sort((a, b) => {
      const aIndex = PROVIDER_PREFERENCE.indexOf(a.provider_name as ProviderType);
      const bIndex = PROVIDER_PREFERENCE.indexOf(b.provider_name as ProviderType);
      return aIndex - bIndex;
    });

    for (const providerConfig of sortedProviders) {
      const provider = providerConfig.provider_name as ProviderType;

      // Simulación de llamada a la API y cálculo de tokens
      const estimatedTokens = prompt.length / 4; // Estimación simple
      const cost = this.calculateCost(estimatedTokens, provider);

      if (userCredits < cost) {
        console.warn(`User ${userId} has insufficient credits for ${provider}.`);
        continue; // Salta al siguiente proveedor
      }

      try {
        // Aquí iría la lógica real de la llamada a la API de cada proveedor
        console.log(`Attempting to use provider: ${provider}`);
        let result: string | null = null;

        // Lógica real de la llamada a la API de cada proveedor
        switch (provider) {
          case 'grok':
            // TODO: Implementar la llamada real a la API de Grok
            result = `[Grok] Creative response for: "${prompt}"`;
            break;
          case 'huggingface':
            if (!HUGGINGFACE_API_KEY) {
              throw new Error('HuggingFace API key not configured.');
            }
            // Usar un modelo de resumen o reescritura según el tipo
            const hfModel = providerConfig.model_name || 'facebook/bart-large-cnn'; // Modelo por defecto para resumen
            console.log(`Using HuggingFace model: ${hfModel}`);
            result = await this.queryHuggingFace(hfModel, prompt, HUGGINGFACE_API_KEY);
            break;
          case 'cohere':
            // TODO: Implementar la llamada real a la API de Cohere
            result = `[Cohere] Structured SEO response for: "${prompt}"`;
            break;
          default:
            throw new Error('Unknown provider');
        }

        if (!result) {
          throw new Error(`No result from provider ${provider}`);
        }

        // Si la llamada es exitosa
        const newCredits = userCredits - cost;
        await this.supabase.from('profiles').update({ credits: newCredits }).eq('id', userId);

        await this.logApiUsage({
          provider,
          tokens_used: estimatedTokens,
          cost,
          user_id: userId,
        });

        return result;

      } catch (error) {
        console.error(`Error with provider ${provider}:`, error);
        // El bucle continuará con el siguiente proveedor (fallback)
      }
    }

    console.error('All AI providers failed or user has insufficient credits for all of them.');
    return null;
  }

  /**
   * Realiza una consulta a la API de HuggingFace Inference.
   */
  private async queryHuggingFace(model: string, text: string, apiKey: string): Promise<string | null> {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: 'POST',
        body: JSON.stringify({ inputs: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`HuggingFace API error (${response.status}):`, errorData);
        throw new Error(`HuggingFace API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      // La estructura de la respuesta puede variar según el modelo.
      // Para modelos de resumen/generación, esperamos un array con un objeto que contenga 'summary_text' o 'generated_text'.
      if (Array.isArray(data) && data.length > 0 && data[0].summary_text) {
        return data[0].summary_text;
      } else if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        return data[0].generated_text;
      } else {
        console.warn('Unexpected HuggingFace API response format:', data);
        return JSON.stringify(data); // Devolver el JSON completo si el formato es inesperado
      }

    } catch (error) {
      console.error('Error querying HuggingFace API:', error);
      throw error;
    }
  }

  /**
   * Mejora el contenido (resumen o reescritura) utilizando HuggingFace.
   */
  async improveContent(content: string, userId: string, type: 'summarize' | 'rewrite'): Promise<string | null> {
    const availableProviders = await this.getAvailableProviders();
    const huggingfaceConfig = availableProviders.find(p => p.provider_name === 'huggingface');

    if (!huggingfaceConfig || !huggingfaceConfig.is_active) {
      console.error('HuggingFace provider is not active or configured.');
      return null;
    }

    if (!HUGGINGFACE_API_KEY) {
      console.error('HuggingFace API key not configured.');
      return null;
    }

    let modelName: string;
    let prompt: string;

    if (type === 'summarize') {
      modelName = huggingfaceConfig.model_name || 'facebook/bart-large-cnn'; // Modelo de resumen por defecto
      prompt = `Summarize the following text: ${content}`;
    } else { // rewrite
      modelName = huggingfaceConfig.model_name || 't5-base'; // Modelo de reescritura/generación por defecto
      prompt = `Rewrite the following text: ${content}`;
    }

    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile or profile not found:', profileError);
      return null;
    }

    let userCredits = profile.credits;
    const estimatedTokens = content.length / 4; // Estimación simple
    const cost = this.calculateCost(estimatedTokens, 'huggingface');

    if (userCredits < cost) {
      console.warn(`User ${userId} has insufficient credits for HuggingFace ${type} operation.`);
      return null;
    }

    try {
      const improvedText = await this.queryHuggingFace(modelName, content, HUGGINGFACE_API_KEY);

      if (improvedText) {
        const newCredits = userCredits - cost;
        await this.supabase.from('profiles').update({ credits: newCredits }).eq('id', userId);

        await this.logApiUsage({
          provider: 'huggingface',
          tokens_used: estimatedTokens,
          cost,
          user_id: userId,
        });
      }
      return improvedText;
    } catch (error) {
      console.error(`Error improving content with HuggingFace (${type}):`, error);
      return null;
    }
  }
}

export const aiService = new AIService();
