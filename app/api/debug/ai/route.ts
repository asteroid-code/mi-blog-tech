import { NextResponse } from 'next/server';
import { AIClients } from '../../../../lib/ai/clients';

export async function GET() {
  try {
    return NextResponse.json({ message: 'AI debug route' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
