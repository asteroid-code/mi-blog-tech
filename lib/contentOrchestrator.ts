import { createClient } from '@/lib/supabase/server';
import { aiService } from './aiService';
// import { aiContentProcessor } from './aiContentProcessor'; // No longer directly used for cascade
import { qualityChecker } from './qualityChecker';
import { startScrapingScheduler } from './cron/scrapingScheduler';

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
      const supabase = await createClient();
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

      // 3. Delegar el procesamiento real a aiService.processContentWithCascade
      const generatedContent = await aiService.processContentWithCascade(unscrapedContent);

      if (generatedContent) {
        // 4. Actualizar el job de procesamiento de contenido a 'completed'
        await supabase
          .from('content_processing_jobs')
          .update({
            status: 'completed',
            generated_content: generatedContent.content, // Asumiendo que generatedContent tiene una propiedad 'content'
            completed_at: new Date().toISOString(),
          })
          .eq('id', newJob.id);

        console.log(`✅ Contenido "${generatedContent.title}" generado y guardado por la cascada de IA (Generated ID: ${generatedContent.id}).`);
        // El original_content ya se marca como procesado dentro de processContentWithCascade
      } else {
        console.error(`Content processing job ${newJob.id} failed: AI cascade did not generate content.`);
        await supabase
          .from('content_processing_jobs')
          .update({ status: 'failed' })
          .eq('id', newJob.id);
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
      const supabase = await createClient();
      // 1. Obtener contenido pendiente de revisión de 'generated_content'
      const { data: pendingContent, error: fetchError } = await supabase
        .from('generated_content')
        .select('*')
        .eq('status', 'published') // La cascada ya lo marca como 'published'
        .is('is_published_to_site', false) // Nuevo campo para controlar si ya se publicó en el sitio
        .limit(5); // Publicar en lotes

      if (fetchError) {
        console.error('Error fetching pending content:', fetchError);
        return;
      }

      if (!pendingContent || pendingContent.length === 0) {
        console.log('No content pending review for auto-publication.');
        return;
      }

      const publishPromises = pendingContent.map(async (article: any) => {
        // Usar el qualityChecker real
        const { isDuplicate, isLowQuality, qualityScore } = await qualityChecker.checkArticleQuality(article.id, article.content);

        if (!isDuplicate && !isLowQuality && qualityScore >= 70) { // Umbral de calidad para auto-publicar
          const supabaseInner = await createClient();
          const { error: publishError } = await supabaseInner
            .from('generated_content') // Actualizar la tabla generated_content
            .update({ status: 'published', published_at: new Date().toISOString(), is_published_to_site: true })
            .eq('id', article.id);

          if (publishError) {
            console.error(`Error publishing article ${article.id}:`, publishError);
          } else {
            console.log(`✅ Artículo "${article.title}" (ID: ${article.id}) auto-publicado. Calidad: ${qualityScore}`);
          }
        } else {
          console.log(`⚠️ Artículo "${article.title}" (ID: ${article.id}) no pasó el control de calidad. ` +
                      `Duplicado: ${isDuplicate}, Baja Calidad: ${isLowQuality}, Puntuación: ${qualityScore}. ` +
                      `Manteniendo como 'published' pero no publicado en el sitio.`);
          // Opcional: Actualizar estado a 'rejected' o 'needs_manual_review'
          const supabaseInner = await createClient();
          await supabaseInner
            .from('generated_content')
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
  // private async updateJobStatus(jobId: number, status: string, result: any): Promise<void> {
  //   const supabase = await createClient(); // Declare once at the beginning of the function
  //   const { error } = await supabase
  //     .from('content_processing_jobs') // Usar la tabla correcta para los jobs de procesamiento de contenido
  //     .update({
  //       status: status,
  //       generated_content: result.generated_content_id ? result.generated_content_id : null, // Si se pasa el ID del contenido generado
  //       // Otros campos como completed_at, updated_at se manejarán dentro de aiContentProcessor
  //     })
  //     .eq('id', jobId);

  //   if (error) {
  //     console.error(`Error updating content processing job ${jobId} status to ${status}:`, error);
  //   }
  // }
}

export const contentOrchestrator = new ContentOrchestrator();
