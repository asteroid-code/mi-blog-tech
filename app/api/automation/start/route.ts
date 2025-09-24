import { NextResponse } from 'next/server';
import { ProcessingWorker } from '@/lib/workers/processingWorker';

export async function POST() {
  try {
    const worker = new ProcessingWorker();
    await worker.processPendingJobs();

    return NextResponse.json({
      status: 'automation_started',
      timestamp: new Date().toISOString(),
      message: 'Sistema de automatización activado'
    });
  } catch (error: any) {
    console.error('Error starting automation:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Error al activar el sistema de automatización',
      error: error.message
    }, { status: 500 });
  }
}
