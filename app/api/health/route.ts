import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('categories').select('count');

    return NextResponse.json({
      status: '✅ Sistema recuperado',
      supabase: '✅ Conectado',
      database: error ? '❌ ' + error.message : '✅ Accesible',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: '❌ Error persistente',
      error: error.message
    }, { status: 500 });
  }
}
