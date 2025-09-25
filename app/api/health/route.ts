import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const supabase = createClient();

    // Verificación básica de salud
    const { count, error } = await supabase
      .from('scraping_sources')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      status: 'healthy',
      environment: process.env.NODE_ENV,
      database: error ? 'unhealthy' : 'connected',
      sources_count: count || 0,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      error: 'Service unavailable',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
