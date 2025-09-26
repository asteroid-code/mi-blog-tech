import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest
import { ProcessingWorker } from '@/lib/workers/processingWorker';

export async function POST(request: NextRequest) { // Add request parameter
  try {
    const apiSecretToken = process.env.API_SECRET_TOKEN;
    if (!apiSecretToken) {
      throw new Error('API_SECRET_TOKEN is not defined in environment variables.');
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${apiSecretToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
