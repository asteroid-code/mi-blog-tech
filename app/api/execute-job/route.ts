import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

// Tipos para las tablas de Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface ProcessingJob {
  id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  source_id: string;
  job_type_id: number;
  parameters: Json;
  progress: number;
  result?: Json;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  job_type_name: string; // Added for RPC return
}

interface OriginalContent {
  id: string;
  source_id: string;
  title: string;
  content: string;
  url: string;
  scraped_at: string;
  created_at: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  let job: ProcessingJob | null = null;
  try {
    console.log('=== EXECUTE-JOB REQUEST START ===');

    // 1. Conéctate a Supabase (ya inicializado globalmente)

    // 2. Busca y Bloquea un Trabajo
    const { data: fetchedJob, error: rpcError } = await supabase.rpc('get_and_lock_next_job');

    if (rpcError) {
      console.error('Error calling get_and_lock_next_job RPC:', rpcError);
      return NextResponse.json({ error: 'Database RPC error' }, { status: 500 });
    }

    if (!fetchedJob || fetchedJob.length === 0) {
      return NextResponse.json({ message: 'No hay trabajos pendientes que procesar' }, { status: 200 });
    }

    job = fetchedJob[0] as ProcessingJob;
    console.log(`Processing job ${job.id} of type ${job.job_type_name}`);

    // 3. Procesa según el Tipo
    switch (job.job_type_name) {
      case 'scrape_url':
        const url = (job.parameters as any)?.url;
        if (!url) {
          throw new Error('URL not found in job parameters for scrape_url job.');
        }

        let title = '';
        let content = '';

        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
          }
          const html = await response.text();
          const $ = cheerio.load(html);

          title = $('title').text();
          // Attempt to get main content, prioritizing common article/blog selectors
          content = $('article, .entry-content, .post-content, main').first().text() || $('body').text();
          // Basic cleanup: remove excessive whitespace and newlines
          content = content.replace(/\s\s+/g, ' ').trim();

        } catch (scrapeError) {
          throw new Error(`Scraping failed for URL ${url}: ${scrapeError instanceof Error ? scrapeError.message : 'Unknown error'}`);
        }

        // 3.iii. Guarda el Resultado en original_content
        const { data: originalContentData, error: insertContentError } = await supabase
          .from('original_content')
          .insert({
            source_id: job.source_id,
            title: title,
            content: content,
            url: url,
            scraped_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertContentError) {
          throw new Error(`Error inserting original content: ${insertContentError.message}`);
        }

        // 3.iv. Crea el Siguiente Job (generate_article_from_original)
        const { data: generateJobType, error: jobTypeError } = await supabase
          .from('job_types')
          .select('id')
          .eq('name', 'generate_article_from_original')
          .single();

        if (jobTypeError || !generateJobType) {
          throw new Error(`Job type 'generate_article_from_original' not found: ${jobTypeError?.message}`);
        }

        const { error: insertFollowUpJobError } = await supabase
          .from('processing_jobs')
          .insert({
            user_id: job.user_id,
            source_id: job.source_id,
            job_type_id: generateJobType.id,
            status: 'pending',
            parameters: {
              original_content_id: originalContentData.id,
              source_url: url,
              scraped_title: title,
            },
            progress: 0,
            created_at: new Date().toISOString(),
          });

        if (insertFollowUpJobError) {
          throw new Error(`Error creating follow-up job: ${insertFollowUpJobError.message}`);
        }

        // 3.v. Finaliza el Job Actual
        const { error: updateJobError } = await supabase
          .from('processing_jobs')
          .update({
            status: 'completed',
            result: { title, content_length: content.length },
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        if (updateJobError) {
          throw new Error(`Error updating job status to completed: ${updateJobError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: `Job ${job.id} (scrape_url) completed. Follow-up job created.`,
          job_id: job.id,
          scraped_title: title,
          original_content_id: originalContentData.id,
        }, { status: 200 });

      default:
        throw new Error(`Unsupported job type: ${job.job_type_name}`);
    }

  } catch (error) {
    console.error('Error in execute-job:', error);

    // Manejo de errores: Actualizar el job a 'failed' si existe
    if (job?.id) {
      await supabase
        .from('processing_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
