import { NextResponse } from 'next/server';
import { ScraperManager2025 } from '@/lib/scraperManager';
import { createClient } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    throw new Error('CRON_SECRET is not defined in environment variables.');
  }

  // Verificación de seguridad para producción
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${expectedSecret}`) {
    console.warn('Intento de acceso no autorizado al endpoint de scraping');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const scraper = new ScraperManager2025();
    const result = await scraper.startAutomatedScraping();

    // Registrar ejecución en base de datos
    const supabase = createClient();
    await supabase
      .from('system_logs')
      .insert({
        event_type: 'scraping_job',
        message: 'Scraping automático ejecutado exitosamente',
        metadata: { sources_processed: result.sources_processed }
      });

    console.log('✅ Scraping automático completado');

    return NextResponse.json({
      success: true,
      message: 'Scraping automation completed successfully',
      timestamp: new Date().toISOString(),
      details: {
        sources_processed: result.sources_processed,
        items_processed: result.items_processed
      }
    });
  } catch (error: any) {
    console.error('❌ Error en scraping automático:', error);

    // Registrar error en base de datos
    const supabase = createClient();
    await supabase
      .from('system_logs')
      .insert({
        event_type: 'scraping_error',
        message: error.message,
        metadata: { stack: error.stack }
      });

    return NextResponse.json({
      success: false,
      error: 'Scraping automation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
