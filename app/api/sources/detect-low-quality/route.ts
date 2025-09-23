import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  const supabaseServer = await createClient(cookieStore);

  const {
    data: { session },
  } = await supabaseServer.auth.getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log('🚀 Iniciando detección de fuentes de baja calidad...');

    // 1. Obtener todas las fuentes de scraping
    const { data: sources, error: fetchError } = await supabaseServer
      .from('scraping_sources')
      .select('*');

    if (fetchError) {
      console.error('Error fetching scraping sources:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({ success: true, message: 'No scraping sources found to analyze.' });
    }

    const updates = [];
    const lowQualitySources = [];

    for (const source of sources) {
      let shouldUpdate = false;
      let newTrustLevel = source.trust_level;
      let newIsActive = source.is_active;

      // Lógica para detectar baja calidad
      // Ejemplo: Si la tasa de éxito es muy baja o la calidad es muy baja
      if (source.last_success_rate < 50 && source.trust_level !== 'banned') {
        newTrustLevel = 'banned';
        newIsActive = false;
        shouldUpdate = true;
        lowQualitySources.push({ id: source.id, name: source.name, reason: 'Low success rate' });
      } else if (source.quality_score < 3 && source.trust_level !== 'banned') {
        newTrustLevel = 'banned';
        newIsActive = false;
        shouldUpdate = true;
        lowQualitySources.push({ id: source.id, name: source.name, reason: 'Very low quality score' });
      } else if (source.last_success_rate < 70 && source.trust_level === 'verified') {
        // Degradamos de verified a experimental si la tasa de éxito baja
        newTrustLevel = 'experimental';
        shouldUpdate = true;
        lowQualitySources.push({ id: source.id, name: source.name, reason: 'Degraded due to lower success rate' });
      }

      if (shouldUpdate) {
        updates.push(
          supabaseServer
            .from('scraping_sources')
            .update({ trust_level: newTrustLevel, is_active: newIsActive })
            .eq('id', source.id)
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`✅ ${updates.length} fuentes actualizadas por baja calidad.`);
    } else {
      console.log('✅ No se detectaron fuentes de baja calidad que requieran actualización.');
    }

    return NextResponse.json({
      success: true,
      message: 'Detección de fuentes de baja calidad completada.',
      updatedSourcesCount: updates.length,
      lowQualitySourcesDetected: lowQualitySources,
    });

  } catch (error) {
    console.error('❌ Error en la detección de fuentes de baja calidad:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
