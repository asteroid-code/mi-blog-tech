import { aiService } from './aiService';
import { supabase } from './supabaseClient';

interface ContentProcessingJob {
  id: number;
  original_content: string;
  generated_content: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  user_id: string;
  article_id: number;
  processing_type: 'summarize' | 'rewrite';
}

class AIContentProcessor {
  private supabase;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Procesa un trabajo de mejora de contenido utilizando el AIService.
   */
  async processContentJob(jobId: number): Promise<void> {
    // 1. Obtener el trabajo de la base de datos
    const { data: job, error: fetchError } = await this.supabase
      .from('content_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      console.error(`Error fetching content processing job ${jobId}:`, fetchError);
      return;
    }

    // Si el trabajo ya está completado o fallido, no hacer nada
    if (job.status === 'completed' || job.status === 'failed') {
      console.log(`Job ${jobId} already ${job.status}. Skipping.`);
      return;
    }

    // 2. Marcar el trabajo como "processing"
    await this.supabase
      .from('content_processing_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId);

    try {
      // 3. Usar aiService para mejorar el contenido
      const generatedContent = await aiService.improveContent(
        job.original_content,
        job.user_id,
        job.processing_type as 'summarize' | 'rewrite'
      );

      if (generatedContent) {
        // 4. Actualizar el trabajo con el contenido generado y marcar como "completed"
        await this.supabase
          .from('content_processing_jobs')
          .update({ generated_content: generatedContent, status: 'completed' })
          .eq('id', jobId);
        console.log(`Content processing job ${jobId} completed successfully.`);
      } else {
        // Si no se pudo generar contenido, marcar como "failed"
        await this.supabase
          .from('content_processing_jobs')
          .update({ status: 'failed' })
          .eq('id', jobId);
        console.error(`Content processing job ${jobId} failed: No content generated.`);
      }
    } catch (error) {
      console.error(`Error processing content job ${jobId}:`, error);
      // 5. Marcar el trabajo como "failed" en caso de error
      await this.supabase
        .from('content_processing_jobs')
        .update({ status: 'failed' })
        .eq('id', jobId);
    }
  }
}

export const aiContentProcessor = new AIContentProcessor();
