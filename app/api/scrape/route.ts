import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// 1. CREAMOS EL CLIENTE DE SUPABASE PARA SERVIDOR
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 2. CONFIGURACIÓN ANTI-SCRAPING
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
];

const getRotatingHeaders = () => ({
  'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
});

const detectBlock = (html: string, statusCode: number): boolean => {
  if (statusCode === 403 || statusCode === 429) return true;

  const blockIndicators = [
    'captcha', 'cloudflare', 'access denied', 'bot detected',
    'distil', 'incapsula', 'blocked', 'security check',
    'please verify you are human', 'unusual traffic'
  ];

  const lowerHtml = html.toLowerCase();
  return blockIndicators.some(indicator => lowerHtml.includes(indicator));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface FetchResult {
  response: Response;
  html: string;
}

const fetchWithRetry = async (
  url: string,
  maxRetries: number = 3
): Promise<FetchResult> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Delay aleatorio entre requests (1-3 segundos)
      await delay(1000 + Math.random() * 2000);

      console.log(`Intento ${attempt} para: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        headers: getRotatingHeaders(),
        signal: controller.signal,
        referrerPolicy: 'no-referrer-when-downgrade'
      });

      clearTimeout(timeoutId);

      const html = await response.text();

      if (detectBlock(html, response.status)) {
        throw new Error(`Bloqueo detectado: Status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { response, html };
    } catch (error: any) {
      console.log(`Intento ${attempt} fallido:`, error.message);

      if (attempt === maxRetries) {
        // Lanzar el error en el último intento para que sea capturado por el catch general
        throw new Error(
          `Todos los reintentos fallaron para ${url}: ${error.message}`
        );
      }

      // Backoff exponencial: 5s, 10s, 15s...
      await delay(5000 * attempt);
    }
  }

  // Esta línea nunca debería ser alcanzada si la lógica es correcta,
  // pero satisface al compilador de TypeScript.
  throw new Error('La función fetchWithRetry ha finalizado inesperadamente.');
};

const extractContent = ($: cheerio.CheerioAPI) => {
  // Eliminar elementos no deseados
  $('script, style, nav, header, footer, aside, .ad, .advertisement, .popup').remove();

  const title = $('title').text() || $('h1').first().text() || 'Sin título';

  // Extraer contenido de manera más inteligente
  const contentSelectors = [
    'article p',
    'main p',
    '.content p',
    '.article-content p',
    'p'
  ];

  let content = '';
  for (const selector of contentSelectors) {
    const paragraphs = $(selector);
    if (paragraphs.length > 2) {
      content = paragraphs.map((_, el) => $(el).text()).get().join('\n\n');
      break;
    }
  }

  // Si no encontramos contenido, usar body
  if (!content) {
    content = $('body p').map((_, el) => $(el).text()).get().join('\n\n');
  }

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

  return { title, content, wordCount };
};

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL es requerida' }, { status: 400 });
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    console.log(`Iniciando scraping de: ${url}`);

    // Scraping con protecciones
    const { html } = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    const { title, content, wordCount } = extractContent($);

    // Validar que tenemos contenido útil
    if (wordCount < 10) {
      throw new Error('Contenido insuficiente o bloqueado');
    }

    // 3. GUARDAR EN SUPABASE
    const { data: newContent, error: insertError } = await supabase
      .from('original_content')
      .insert([
        {
          title: title,
          content: content,
          url: url,
          word_count: wordCount,
          is_processed: false,
          scraped_at: new Date().toISOString()
        }
      ])
      .select('id')
      .single();

    if (insertError) {
      console.error("Error al guardar en Supabase:", insertError);
      throw new Error(`Error de base de datos: ${insertError.message}`);
    }

    // 4. RESPUESTA DE ÉXITO
    return NextResponse.json({
      success: true,
      message: 'Scraping exitoso y guardado en la base de datos',
      data: {
        id: newContent.id,
        title: title,
        wordCount: wordCount,
        url: url
      }
    });

  } catch (error: any) {
    console.error("Error en la API de scraping:", error);

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
