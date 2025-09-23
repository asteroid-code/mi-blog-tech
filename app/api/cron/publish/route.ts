import { NextResponse } from 'next/server';
import { contentOrchestrator } from '@/lib/contentOrchestrator';

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea estáticamente optimizada


export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('Manual publish trigger received.');
    await contentOrchestrator.autoPublish();
    return NextResponse.json({ success: true, message: 'Auto-publish process triggered successfully.' });
  } catch (error) {
    console.error('Error triggering manual publish:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
