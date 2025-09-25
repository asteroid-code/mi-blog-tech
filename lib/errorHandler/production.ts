import { isProduction } from '../config/production';

export class ProductionErrorHandler {
  static handle(error: Error, context: string): any {
    const errorId = Date.now().toString();

    console.error(`[${context}] Error ID: ${errorId}`, {
      message: error.message,
      stack: isProduction ? undefined : error.stack,
      context: context
    });

    // En producción, no exponer detalles internos
    if (isProduction) {
      return {
        success: false,
        error: 'An error occurred',
        errorId: errorId,
        timestamp: new Date().toISOString()
      };
    }

    // En desarrollo, mostrar detalles completos
    return {
      success: false,
      error: error.message,
      errorId: errorId,
      stack: error.stack,
      context: context
    };
  }
}
