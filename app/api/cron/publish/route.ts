import { NextResponse } from 'next/server';
import { contentOrchestrator } from '@/lib/contentOrchestrator';

export async function POST() {
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
