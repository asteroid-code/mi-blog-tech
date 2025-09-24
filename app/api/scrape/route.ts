import { performScraping } from '../../../lib/cron/scrapingScheduler'; // Adjusted path

export async function POST(request: Request) {
  // Verificar autenticación para cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await performScraping();

    return Response.json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) { // Added any type for error
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
