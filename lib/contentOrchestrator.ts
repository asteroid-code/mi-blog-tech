import { supabase } from './supabaseClient';
import { aiService } from './aiService';
import { aiContentProcessor } from './aiContentProcessor';
import { qualityChecker } from './qualityChecker';
import { startScrapingScheduler } from './cron/scrapingScheduler'; // Aún no creado

export class ContentOrchestrator {
  constructor() {
    console.log('ContentOrchestrator initialized.');
  }

  /**
   * Inicia el programador de scraping.
   */
  public async scheduleScraping(): Promise<void> {
    console.log('Scheduling scraping tasks...');
    // Esto delegará al módulo de cron para iniciar los temporizadores
    startScrapingScheduler();
  }

  /**
   * Procesa el contenido original no procesado, lo pasa por la IA y guarda el contenido generado.
   */
  public async processNewContent(): Promise<void> {
    console.log('Starting to process new content...');
    try {
      // 1. Obtener contenido scrapeado no procesado
      const { data: unscrapedContent, error: fetchError } = await supabase
        .from('original_content')
        .select('*')
        .eq('is_processed', false)
        .limit(1) // Procesar uno a la vez para evitar sobrecarga
        .single();

      if (fetchError || !unscrapedContent) {
        console.log('No new content to process.');
        return;
      }

      console.log(`📄 Procesando: "${unscrapedContent.title}" (ID: ${unscrapedContent.id})`);

      // 2. Crear un registro en content_processing_jobs
      // TODO: Obtener el userId de la sesión del usuario o usar uno por defecto para tareas de sistema
      const userId = 'system-orchestrator-bot'; // Usar un ID de usuario de sistema
      const processingType = 'summarize'; // O 'rewrite', según la lógica de negocio

      const { data: newJob, error: newJobError } = await supabase
        .from('content_processing_jobs')
        .insert([{
          original_content: unscrapedContent.content || unscrapedContent.title,
          status: 'pending',
          user_id: userId,
          article_id: unscrapedContent.id, // Asociar con el ID del contenido original
          processing_type: processingType,
        }])
        .select()
        .single();

      if (newJobError || !newJob) {
        console.error('Error creating content processing job:', newJobError);
        return;
      }

      console.log(`Created content processing job ID: ${newJob.id}`);

      // 3. Delegar el procesamiento real a aiContentProcessor
      await aiContentProcessor.processContentJob(newJob.id);

      // 4. Verificar el estado final del job
      const { data: updatedJob, error: updatedJobError } = await supabase
        .from('content_processing_jobs')
        .select('*')
        .eq('id', newJob.id)
        .single();

      if (updatedJobError || !updatedJob) {
        console.error(`Error fetching updated job ${newJob.id}:`, updatedJobError);
        return;
      }

      if (updatedJob.status === 'completed' && updatedJob.generated_content) {
        // 5. Guardar contenido generado en la tabla 'articles' o 'generated_content'
        // Aquí asumimos que el contenido generado se guarda en 'articles' directamente
        // o se crea una nueva entrada en 'generated_content' y luego se asocia a un artículo.
        // Para simplificar, lo guardaremos en una nueva entrada de 'articles' con un estado inicial.

        const { data: newArticle, error: articleError } = await supabase
          .from('articles')
          .insert([{
            title: `AI Generated: ${unscrapedContent.title}`,
            content: updatedJob.generated_content,
            slug: `ai-generated-${unscrapedContent.id}-${Date.now()}`, // Generar un slug único
            status: 'pending_review',
            author_id: userId,
            original_source_id: unscrapedContent.id,
            // Otros campos necesarios para un artículo
          }])
          .select()
          .single();

        if (articleError || !newArticle) {
          console.error('Error saving AI generated article:', articleError);
          // Marcar el job como fallido si no se puede guardar el artículo
          await supabase.from('content_processing_jobs').update({ status: 'failed' }).eq('id', newJob.id);
          return;
        }

        // 6. Marcar contenido original como procesado
        await supabase
          .from('original_content')
          .update({ is_processed: true })
          .eq('id', unscrapedContent.id);

        console.log(`✅ Contenido "${newArticle.title}" generado y marcado como pendiente de revisión (Article ID: ${newArticle.id}).`);
      } else {
        console.error(`Content processing job ${newJob.id} failed or did not generate content.`);
      }

    } catch (error) {
      console.error('❌ Error processing new content:', error);
    }
  }

  /**
   * Publica automáticamente el contenido que pasa el control de calidad.
   */
  public async autoPublish(): Promise<void> {
    console.log('Starting auto-publish process...');
    try {
      // 1. Obtener contenido pendiente de revisión
      const { data: pendingContent, error: fetchError } = await supabase
        .from('generated_content')
        .select('*')
        .eq('status', 'pending_review')
        .limit(5); // Publicar en lotes

      if (fetchError) {
        console.error('Error fetching pending content:', fetchError);
        return;
      }

      if (!pendingContent || pendingContent.length === 0) {
        console.log('No content pending review for auto-publication.');
        return;
      }

      const publishPromises = pendingContent.map(async (article) => {
        // Usar el qualityChecker real
        const { isDuplicate, isLowQuality, qualityScore } = await qualityChecker.checkArticleQuality(article.id, article.content);

        if (!isDuplicate && !isLowQuality && qualityScore >= 70) { // Umbral de calidad para auto-publicar
          const { error: publishError } = await supabase
            .from('articles') // Asumiendo que 'pendingContent' ahora viene de 'articles'
            .update({ status: 'published', published_at: new Date().toISOString() })
            .eq('id', article.id);

          if (publishError) {
            console.error(`Error publishing article ${article.id}:`, publishError);
          } else {
            console.log(`✅ Artículo "${article.title}" (ID: ${article.id}) auto-publicado. Calidad: ${qualityScore}`);
          }
        } else {
          console.log(`⚠️ Artículo "${article.title}" (ID: ${article.id}) no pasó el control de calidad. ` +
                      `Duplicado: ${isDuplicate}, Baja Calidad: ${isLowQuality}, Puntuación: ${qualityScore}. ` +
                      `Manteniendo como 'pending_review'.`);
          // Opcional: Actualizar estado a 'rejected' o 'needs_manual_review'
          await supabase
            .from('articles')
            .update({ status: 'needs_manual_review' }) // Nuevo estado para revisión manual
            .eq('id', article.id);
        }
      });

      await Promise.all(publishPromises);
      console.log('Auto-publish process completed.');

    } catch (error) {
      console.error('❌ Error in auto-publish process:', error);
    }
  }

  /**
   * Función auxiliar para actualizar el estado de un job.
   */
  private async updateJobStatus(jobId: number, status: string, result: any): Promise<void> {
    const { error } = await supabase
      .from('content_processing_jobs') // Usar la tabla correcta para los jobs de procesamiento de contenido
      .update({
        status: status,
        generated_content: result.generated_content_id ? result.generated_content_id : null, // Si se pasa el ID del contenido generado
        // Otros campos como completed_at, updated_at se manejarán dentro de aiContentProcessor
      })
      .eq('id', jobId);

    if (error) {
      console.error(`Error updating content processing job ${jobId} status to ${status}:`, error);
    }
  }
}

export const contentOrchestrator = new ContentOrchestrator();
