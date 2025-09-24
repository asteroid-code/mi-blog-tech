import { NextRequest, NextResponse } from 'next/server';
import { ProcessingWorker } from '@/lib/workers/processingWorker';

export async function GET(request: NextRequest) {
  // Verificar secret key de cron
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Ejecutar procesamiento automático
    const worker = new ProcessingWorker();
    await worker.processPendingJobs();

    return NextResponse.json({
      status: 'processed',
      time: new Date().toISOString(),
      message: 'Cron job executed successfully'
    });
  } catch (error: any) {
    console.error('Error executing cron job:', error);
    return NextResponse.json({
      status: 'error',
      time: new Date().toISOString(),
      message: 'Error executing cron job',
      error: error.message
    }, { status: 500 });
  }
}
