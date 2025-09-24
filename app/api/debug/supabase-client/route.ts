import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient'; // Adjusted path

export async function GET() {
  try {
    // TEST 1: Verificar que el import funciona
    console.log('createClient function:', typeof createClient);

    // TEST 2: Verificar que se puede instanciar
    const clientInstance = createClient();
    console.log('Client instance:', clientInstance ? '✅' : '❌');

    // TEST 3: Verificar que tiene el método from (Supabase uses .from, not .get)
    const hasFromMethod = clientInstance && typeof clientInstance.from === 'function';

    return NextResponse.json({
      import_working: typeof createClient === 'function',
      instance_created: !!clientInstance,
      has_from_method: hasFromMethod,
      error: null
    });
  } catch (error: any) {
    return NextResponse.json({
      import_working: false,
      instance_created: false,
      has_from_method: false,
      error: error.message
    });
  }
}
