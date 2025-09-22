import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// 1. CREAMOS EL CLIENTE DE SUPABASE PARA SERVIDOR
//    Usa las claves secretas para poder escribir en la base de datos
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // El proceso de scraping se queda igual
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('title').text();
    const content = $('body p').map((_, el) => $(el).text()).get().join('\n\n'); // Unimos con doble salto de línea para legibilidad

    // 2. GUARDAMOS EL CONTENIDO EN SUPABASE
    const { data: newContent, error: insertError } = await supabase
      .from('original_content') // <-- Revisa que el nombre de tu tabla sea correcto
      .insert([
        {
          title: title,
          content: content,
          url: url, // También guardamos la URL original
          is_processed: false // Marcamos como no procesado por la IA
        }
      ])
      .select('id') // Le pedimos que nos devuelva el ID del nuevo registro
      .single(); // Esperamos un solo resultado

    // 3. MANEJAMOS ERRORES DE SUPABASE
    if (insertError) {
      console.error("Error al guardar en Supabase:", insertError);
      throw new Error(insertError.message); // Lanzamos el error para que lo capture el catch
    }

    // 4. DEVOLVEMOS UNA RESPUESTA DE ÉXITO
    return NextResponse.json({
      message: 'Scraping exitoso y guardado en la base de datos.',
      id: newContent.id, // Devolvemos el ID del nuevo contenido
      title: title
    });

  } catch (error) {
    console.error("Error en la API de scraping:", error);
    // Aseguramos que el error sea un string
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape the URL';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}