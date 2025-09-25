import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Tipos para las tablas de Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface ScrapingSource {
  id: string;
  user_id: string;
  name: string;
  url: string;
  source_type: string;
  category_id?: string;
  scraping_frequency: number;
  last_scraped_at?: string;
  is_active: boolean;
  selectors: Json;
  headers: Json;
  created_at: string;
  updated_at: string;
}

interface ProcessingJob {
  id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  source_id: string;
  job_type_id?: number;
  parameters: Json;
  progress: number;
  result?: Json;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

interface ApiUsage {
  id: string;
  user_id?: string;
  provider: string;
  endpoint: string;
  tokens_used: number;
  credits_consumed: number;
  response_time?: number;
  status_code: number;
  created_at: string;
}

interface JobType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const API_SECRET_TOKEN = process.env.API_SECRET_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    console.log('=== START-SCRAPING REQUEST START ===');

    // Leer headers y cuerpo
    const authHeader = request.headers.get('authorization');
    const bodyText = await request.text();

    // Verificar autenticación
    if (!authHeader || authHeader !== `Bearer ${API_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parsear JSON
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validar campos requeridos
    const { sourceId, userId, jobType = 'scraping' } = body;
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Obtener fuentes de scraping activas
    let query = supabase
      .from('scraping_sources')
      .select('*')
      .eq('is_active', true)
      .eq('user_id', userId); // Added user_id filter

    if (sourceId) {
      query = query.eq('id', sourceId);
    }

    const { data: scrapingSources, error: sourcesError } = await query;
    if (sourcesError) {
      console.error('Error fetching scraping sources:', sourcesError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!scrapingSources || scrapingSources.length === 0) {
      return NextResponse.json({ error: 'No scraping sources found' }, { status: 404 });
    }

    // 🔥 CORRECCIÓN: Usar .maybeSingle() en lugar de .single()
    const { data: jobTypeData, error: jobTypeError } = await supabase
      .from('job_types')
      .select('id')
      .eq('name', jobType)
      .maybeSingle();  // ← CAMBIO IMPORTANTE

    if (jobTypeError) {
      console.error('Error fetching job type:', jobTypeError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!jobTypeData) {
      return NextResponse.json({ error: `Job type '${jobType}' not found` }, { status: 400 });
    }

    // Crear jobs de procesamiento
    const jobs: ProcessingJob[] = [];
    const errors: any[] = [];

    for (const source of scrapingSources as ScrapingSource[]) {
      try {
        // Verificar si ya existe un job pendiente
        const { data: existingJob } = await supabase
          .from('processing_jobs')
          .select('id')
          .eq('source_id', source.id)
          .eq('status', 'pending')
          .maybeSingle(); // Changed to maybeSingle()

        if (existingJob) {
          errors.push({ source_id: source.id, error: 'Pending job exists' });
          continue;
        }

        // Insertar nuevo job
        const jobData: Partial<ProcessingJob> = {
          user_id: userId,
          source_id: source.id,
          job_type_id: jobTypeData.id,
          status: 'pending',
          parameters: {
            url: source.url,
            selectors: source.selectors,
            headers: source.headers,
            source_type: source.source_type
          },
          progress: 0,
          created_at: new Date().toISOString()
        };

        const { data: newJob, error: insertError } = await supabase
          .from('processing_jobs')
          .insert([jobData])
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        jobs.push(newJob as ProcessingJob);

        // Actualizar last_scraped_at
        await supabase
          .from('scraping_sources')
          .update({
            last_scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', source.id);

      } catch (error) {
        errors.push({
          source_id: source.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Registrar uso de API
    const apiUsageData: Partial<ApiUsage> = {
      user_id: userId,
      provider: 'scraping-orchestrator',
      endpoint: '/api/start-scraping',
      tokens_used: scrapingSources.length * 10,
      credits_consumed: scrapingSources.length,
      status_code: 200,
      created_at: new Date().toISOString()
    };

    await supabase.from('api_usage').insert([apiUsageData]);

    return NextResponse.json({
      success: true,
      message: `Started ${jobs.length} scraping jobs`,
      jobs_created: jobs.length,
      jobs: jobs.map(job => ({
        id: job.id,
        source_id: job.source_id,
        status: job.status
      })),
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in start-scraping:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${API_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let query = supabase
      .from('processing_jobs')
      .select(`
        *,
        scraping_sources (
          name,
          url
        ),
        job_types (
          name
        )
      `)
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });
    const { data: jobs, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ jobs: jobs || [], total: jobs?.length || 0 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
