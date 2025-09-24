import { NextResponse } from 'next/server';
    // ¡CORRECCIÓN 1: Importamos la INSTANCIA, no la función!
    import { supabase } from '@/lib/supabaseClient';

    interface Source {
      id: string;
      name: string;
      url: string;
      is_active: boolean;
      user_id: string | null;
      source_type: string;
    }

    export async function GET() {
      try {
        // ¡CORRECCIÓN 2: Ya no necesitamos crear el cliente, ya existe!
        // const supabase = createClient(); // <--- BORRAMOS ESTA LÍNEA

        console.log('🔍 Ejecutando query de fuentes...');

        const { data: sources, error, count } = await supabase
          .from('scraping_sources')
          .select('*', { count: 'exact' })
          .eq('is_active', true); // <-- SIMPLIFICADO: .or(...) no es necesario aquí

        // ... el resto de tu código de logs y respuesta es perfecto y se queda igual ...
        if (error) {
          console.error('❌ Error en query:', error);
          throw error;
        }
        console.log(`✅ Query exitosa. Fuentes encontradas: ${count}`);
        if (sources && sources.length > 0) {
          console.log('📋 Fuentes encontradas:');
          sources.forEach((source: Source, index: number) => {
            console.log(`   ${index + 1}. ${source.name} (user_id: ${source.user_id || 'NULL'})`);
          });
        }
        return NextResponse.json({
          success: true,
          sources_count: count || 0,
          sources: sources?.map((s: Source) => ({
            id: s.id,
            name: s.name,
            url: s.url,
            is_active: s.is_active,
            user_id: s.user_id,
            source_type: s.source_type,
            has_user_id: !!s.user_id
          })) || [],
        });

      } catch (error: any) {
        console.error('❌ Error en endpoint /api/debug/sources:', error);
        return NextResponse.json({
          success: false,
          error: error.message,
        }, { status: 500 });
      }
    }
