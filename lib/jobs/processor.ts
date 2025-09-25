import { createClient } from '@supabase/supabase-js'; // Using service_role key
import * as cheerio from 'cheerio';
import { ScrapedContent2025 } from '../../types/scraping';
import { GeneratedContent } from '../../types/ai';

// Define job types and statuses
type JobStatus = 'pending' | 'running' | 'completed' | 'failed';
type JobType = 'scraping' | 'generación de AI';

interface ProcessingJob {
  id: string;
  job_type: JobType;
  status: JobStatus;
  payload: any; // JSON payload for job-specific data
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Initialize Supabase client with service_role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Ensure this env variable is set

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'x-application-name': 'mi-blog-tech-job-processor'
    }
  }
});

export async function processNextJob(): Promise<boolean> {
  let job: ProcessingJob | null = null;

  try {
    // 1. Find and atomically update a pending job
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw new Error(`Error fetching job: ${error.message}`);
    }

    if (!data) {
      console.log('No pending jobs found.');
      return false;
    }

    job = data as ProcessingJob;

    // Atomically update job status to 'running'
    const { error: updateError } = await supabase
      .from('processing_jobs')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('status', 'pending'); // Ensure we only update if still pending

    if (updateError) {
      throw new Error(`Error updating job status to running: ${updateError.message}`);
    }

    console.log(`Processing job ${job.id} of type ${job.job_type}`);

    // 3. Process the job based on its type
    switch (job.job_type) {
      case 'scraping':
        await processScrapingJob(job);
        break;
      case 'generación de AI':
        await processAIGenerationJob(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }

    // 4. Mark job as 'completed' if successful
    const { error: completeError } = await supabase
      .from('processing_jobs')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', job.id);

    if (completeError) {
      throw new Error(`Error marking job as completed: ${completeError.message}`);
    }

    console.log(`Job ${job.id} completed successfully.`);
    return true;

  } catch (err: any) {
    console.error(`Error processing job ${job?.id || 'unknown'}:`, err.message);

    // 5. Mark job as 'failed' if any error occurs
    if (job) {
      const { error: failError } = await supabase
        .from('processing_jobs')
        .update({
          status: 'failed',
          error_message: err.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (failError) {
        console.error(`Critical error: Could not mark job ${job.id} as failed: ${failError.message}`);
      }
    }
    return false;
  }
}

async function processScrapingJob(job: ProcessingJob) {
  const { url, selector, source_id } = job.payload;

  if (!url || !selector || !source_id) {
    throw new Error('Scraping job payload is missing required fields (url, selector, source_id).');
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${url} - Status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('title').text().trim();
    const content = $(selector).text().trim(); // Extract content based on selector

    if (!content) {
      throw new Error(`No content found for selector: ${selector} on URL: ${url}`);
    }

    const scrapedContent: ScrapedContent2025 = {
      source_id: source_id,
      title: title || 'No Title',
      content: content,
      url: url,
      published_at: new Date(), // Or try to extract from page
      language: 'es', // Assuming Spanish for now, could be extracted
      content_type: 'article', // Default, could be inferred
      metadata: {},
    };

    const { error } = await supabase.from('original_content').insert([scrapedContent]);

    if (error) {
      throw new Error(`Error saving scraped content: ${error.message}`);
    }
    console.log(`Scraped content from ${url} saved to original_content.`);

  } catch (err: any) {
    throw new Error(`Scraping process failed for URL ${url}: ${err.message}`);
  }
}

async function processAIGenerationJob(job: ProcessingJob) {
  const { prompt, original_content_id } = job.payload;

  if (!prompt || !original_content_id) {
    throw new Error('AI generation job payload is missing required fields (prompt, original_content_id).');
  }

  // Simulate AI call
  console.log(`Simulating AI generation for prompt: "${prompt}"`);
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate network delay

  const generatedContent: GeneratedContent = {
    title: `AI Generated Article for ${original_content_id}`,
    content: `This is a simulated AI-generated content based on the prompt: "${prompt}". It's a placeholder for actual AI output.`,
    summary: 'Simulated summary.',
    image_descriptions: ['simulated image 1', 'simulated image 2'],
    video_suggestions: ['simulated video 1'],
    tags: ['AI', 'simulated', 'tech'],
    reading_time: 5,
    word_count: 500,
  };

  const { error } = await supabase.from('generated_content').insert([generatedContent]);

  if (error) {
    throw new Error(`Error saving AI generated content: ${error.message}`);
  }
  console.log(`AI generated content for original_content_id ${original_content_id} saved to generated_content.`);
}
