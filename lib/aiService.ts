import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js'; // For direct Supabase client in cascade

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
    const { data, error } = await (await this.supabase)
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
    const { error } = await (await this.supabase).from('api_usage').insert([usage]);
    if (error) {
      console.error('Error logging API usage:', error);
    }
  }

  /**
   * Genera texto utilizando el mejor proveedor disponible.
   */
  async generateText(prompt: string, userId: string, type: 'creative' | 'specific' | 'structured'): Promise<string | null> {
    const { data: profile, error: profileError } = await (await this.supabase)
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
        await (await this.supabase).from('profiles').update({ credits: newCredits }).eq('id', userId);

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

    const { data: profile, error: profileError } = await (await this.supabase)
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
        await (await this.supabase).from('profiles').update({ credits: newCredits }).eq('id', userId);

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

  /**
   * Procesa contenido a través de la cascada de 3 IAs.
   * @param unscrapedContent El objeto de contenido original a procesar.
   * @returns El contenido generado o null si falla.
   */
  async processContentWithCascade(unscrapedContent: any): Promise<any | null> {
    console.log('🚀 Iniciando cascada de 3 IA desde AIService...');

    let job: any = null; // Declare job outside try block
    const supabase = await createServerSupabaseClient(); // Usar el cliente de servidor

    try {
      // 1. CREAR JOB DE PROCESAMIENTO (Capa 1)
      const { data: newJob, error: jobError } = await supabase
        .from('processing_jobs')
        .insert([{
          content_id: unscrapedContent.id,
          status: 'running',
          job_type_id: 1,
          parameters: {
            original_title: unscrapedContent.title,
            content_length: unscrapedContent.content?.length || 0
          },
          progress: 0,
          started_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (jobError) throw new Error(`Error creando job: ${jobError.message}`);
      job = newJob; // Assign newJob to job

      // 2. IA1: ANÁLISIS Y FILTRADO
      console.log('🤖 IA1: Analizando contenido...');
      const analysis = await this.analyzeWithAI(unscrapedContent);
      await this.updateJobProgress(job.id, 33, analysis);

      // 3. IA2: ESTRUCTURA Y OUTLINE
      console.log('📝 IA2: Creando estructura...');
      const outline = await this.createOutlineWithAI(analysis);
      await this.updateJobProgress(job.id, 66, outline);

      // 4. IA3: REDACCIÓN FINAL (USA TU LÓGICA REAL)
      console.log('✍️ IA3: Generando artículo...');
      // TODO: Obtener el userId de la sesión del usuario o usar uno por defecto para tareas de sistema
      const userId = 'system-ai-cascade-bot'; // Usar un ID de usuario de sistema
      const finalArticle = await this.writeArticleWithAI(outline, userId);
      await this.updateJobProgress(job.id, 100, finalArticle);

      // 5. GUARDAR CONTENIDO GENERADO
      const { data: generated, error: genError } = await supabase
        .from('generated_content')
        .insert([{
          original_content_id: unscrapedContent.id,
          title: finalArticle.title,
          content: finalArticle.content,
          ai_provider: finalArticle.ai_provider,
          ai_model: finalArticle.ai_model,
          status: 'published',
          word_count: finalArticle.word_count,
          metadata: {
            processing_time: Date.now(),
            ai_cascade: true,
            analysis_score: analysis.relevance,
            outline_sections: outline.sections?.length || 0,
            version: '1.0'
          },
          published_at: new Date().toISOString(),
          reading_time: Math.ceil(finalArticle.word_count / 200)
        }])
        .select()
        .single();

      if (genError) throw new Error(`Error guardando contenido: ${genError.message}`);

      // 6. MARCAR COMO PROCESADO
      await supabase
        .from('original_content')
        .update({ is_processed: true })
        .eq('id', unscrapedContent.id);

      // 7. COMPLETAR JOB
      await supabase
        .from('processing_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: { generated_content_id: generated.id }
        })
        .eq('id', job.id);

      console.log('✅ Cascada completada exitosamente!');
      return generated;

    } catch (error) {
      console.error('❌ Error en cascada de IA desde AIService:', error);
      if (job) {
        await supabase
          .from('processing_jobs')
          .update({ status: 'failed', completed_at: new Date().toISOString() })
          .eq('id', job.id);
      }
      return null;
    }
  }

  // FUNCIONES DE LAS 3 IA EN CASCADA (adaptadas como métodos privados)
  private async analyzeWithAI(content: any) {
    const topic = this.extractMainTopic(content.title + ' ' + content.content);

    return {
      topic,
      relevance: this.calculateRelevance(topic),
      keyPoints: this.extractKeyPoints(content.content),
      wordCount: content.content?.length || 0,
      sentiment: 'neutral'
    };
  }

  private async createOutlineWithAI(analysis: any) {
    return {
      title: `Análisis: ${analysis.topic}`,
      sections: [
        'Introducción',
        'Desarrollo técnico',
        'Tendencias actuales',
        'Conclusión'
      ],
      keywords: [analysis.topic, 'IA', 'tecnología'],
      targetWordCount: 150
    };
  }

  private async writeArticleWithAI(outline: any, userId: string) {
    const topic = outline.keywords[0] || outline.topic || 'Inteligencia Artificial';

    const generatedText = await this.generateText(topic, userId, 'structured');

    if (!generatedText) {
      throw new Error('No se pudo generar el contenido con IA desde el servicio unificado.');
    }

    try {
      const providerMatch = generatedText.match(/\[(.*?)\]/);
      const provider = providerMatch ? providerMatch[1].toLowerCase() : 'unknown';

      return {
        title: `Artículo sobre ${topic} generado por ${provider}`,
        content: generatedText,
        ai_provider: provider,
        ai_model: 'default-model',
        word_count: generatedText.split(/\s+/).length,
      };
    } catch (error) {
      console.error("Error al parsear la respuesta del AI Service en cascada:", error);
      throw new Error("La respuesta del servicio de IA no es un JSON válido.");
    }
  }

  // FUNCIONES AUXILIARES (adaptadas como métodos privados)
  private async updateJobProgress(jobId: string, progress: number, data: any) {
    const supabase = await createServerSupabaseClient();
    await supabase
      .from('processing_jobs')
      .update({
        progress,
        result: data,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  private extractMainTopic(text: string): string {
    const topics = ['IA', 'machine learning', 'deep learning', 'LLM', 'OpenAI'];
    for (const topic of topics) {
      if (text.toLowerCase().includes(topic.toLowerCase())) {
        return topic;
      }
    }
    return 'Inteligencia Artificial';
  }

  private calculateRelevance(topic: string): number {
    const relevanceMap: { [key: string]: number } = {
      'IA': 9,
      'machine learning': 8,
      'deep learning': 7,
      'LLM': 9,
      'OpenAI': 8
    };
    return relevanceMap[topic] || 6;
  }

  private extractKeyPoints(content: string): string[] {
    const sentences = content.split('.').slice(0, 3);
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  }
}

export const aiService = new AIService();
