import { createClient } from '@/lib/supabaseClient';
import { ScraperManager } from '@/lib/automation/scraperManager';
import { ContentGenerator, GeneratedContent } from '@/lib/ai/contentGenerator'; // Removed OriginalContent, added GeneratedContent
import { AIClients } from '@/lib/ai/clients';

// Define interfaces for job types and processing jobs
interface JobType {
  id: number;
  name: string;
}

interface ProcessingJob {
  id: number;
  job_type_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  original_content_id?: number;
  scraping_source_id?: number;
  metadata?: any;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress?: number;
  error_message?: string;
  result?: any;
  job_types?: JobType; // Joined data
}

export class ProcessingWorker {
  private supabase = createClient();
  private scraperManager: ScraperManager;
  private contentGenerator: ContentGenerator;
  constructor() {
    this.scraperManager = new ScraperManager();
    this.contentGenerator = new ContentGenerator();
  }

  async processPendingJobs() {
    console.log("🔍 Worker: Buscando trabajos pendientes...");

    const { data: jobs, error: jobsError } = await this.supabase
      .from('processing_jobs')
      .select(`
        *,
        job_types(name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Process up to 10 jobs at once

    if (jobsError) {
      console.error("Worker: Error fetching pending jobs:", jobsError);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log("Worker: ✅ No hay trabajos pendientes.");
      return;
    }

    console.log(`Worker: 🎯 Encontrados ${jobs.length} trabajos pendientes.`);

    for (const job of jobs) {
      await this.processJob(job);
    }
  }

  private async processJob(job: ProcessingJob) {
    try {
      console.log(`Worker: 🔄 Procesando job ${job.id} (${job.job_types?.name})...`);

      await this.supabase
        .from('processing_jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
          progress: 10
        })
        .eq('id', job.id);

      let result: { success: boolean; data?: any; error?: string };

      switch (job.job_types?.name) {
        case 'scraping':
          if (job.scraping_source_id) {
            await this.scraperManager.scrapeSource(job.scraping_source_id);
            result = { success: true, data: { message: `Scraping completed for source ID: ${job.scraping_source_id}` } };
          } else {
            result = { success: false, error: 'Scraping source ID is missing for scraping job.' };
          }
          break;
        case 'content_generation':
          if (job.original_content_id) {
            // Fetch original content to pass to content generator
            const { data: originalContentData, error: originalContentError } = await this.supabase
              .from('original_content')
              .select('*')
              .eq('id', job.original_content_id)
              .single();

            if (originalContentError || !originalContentData) {
              result = { success: false, error: `Original content not found for ID: ${job.original_content_id}` };
            } else {
              // The ContentGenerator constructor no longer takes AIClients
              const contentGenerator = new ContentGenerator(); // Instantiate without AIClients

              // Generate content using the original content's title
              const generatedContent: GeneratedContent = await contentGenerator.generateMultimediaContent(originalContentData.title);

              // Save the generated content to the 'generated_content' table
              const { data: newContent, error: insertError } = await this.supabase
                .from('generated_content')
                .insert([
                  {
                    original_content_id: job.original_content_id,
                    title: generatedContent.title,
                    summary: generatedContent.summary,
                    content: generatedContent.content,
                    image_url: generatedContent.image_descriptions[0] || '', // Use first image description as URL
                    post_type: 'article', // Default to article
                    category_id: job.metadata?.category_id || 'default-category-id', // Assuming category_id is in job metadata
                    tags: generatedContent.tags,
                    word_count: generatedContent.word_count,
                    reading_time: generatedContent.reading_time,
                    // Add other fields as necessary
                  },
                ])
                .select()
                .single();

              if (insertError) {
                console.error(`Error inserting generated content for job ${job.id}:`, insertError);
                throw new Error(`Database insert failed: ${insertError.message}`);
              }

              result = { success: true, data: { message: `Content generated and saved for original content ID: ${job.original_content_id}. New content ID: ${newContent.id}` } };
            }
          } else {
            result = { success: false, error: 'Original content ID is missing for content generation job.' };
          }
          break;
        case 'publishing':
          // TODO: Implement publishing logic
          result = { success: true, data: { message: 'Publishing simulated' } };
          break;
        default:
          result = { success: false, error: `Unknown job type: ${job.job_types?.name}` };
      }

      if (result.success) {
        await this.supabase
          .from('processing_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            progress: 100,
            result: result.data
          })
          .eq('id', job.id);
        console.log(`Worker: ✅ Job ${job.id} completado exitosamente.`);
      } else {
        await this.supabase
          .from('processing_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: result.error
          })
          .eq('id', job.id);
        console.error(`Worker: ❌ Job ${job.id} falló:`, result.error);
      }
    } catch (error) {
      console.error(`Worker: 💥 Error procesando job ${job.id}:`, error);
      await this.supabase
        .from('processing_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', job.id);
    }
  }
}
