import { processNextJob } from '../../../lib/jobs/processor';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await processNextJob();
    return NextResponse.json({ success: result, message: result ? 'Job processed successfully.' : 'No pending jobs to process.' });
  } catch (error: any) {
    console.error('Error in process-jobs API:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to process job.' }, { status: 500 });
  }
}
