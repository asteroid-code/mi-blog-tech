export const productionConfig = {
  // Seguridad
  security: {
    enableCors: true,
    rateLimit: 100,
    enableHttps: true
  },

  // Performance
  performance: {
    cacheTtl: 3600, // 1 hora
    maxImageSize: 1024 * 1024, // 1MB
    enableCompression: true
  },

  // Scraping en producción
  scraping: {
    enabled: true,
    maxConcurrent: 2,
    timeout: 30000,
    retryAttempts: 2,
    schedule: '0 * * * *' // Cada hora
  },

  // IA en producción
  ai: {
    enableFallbacks: true,
    rateLimit: 50,
    timeout: 25000,
    enableCache: true
  },

  // Database
  database: {
    poolSize: 10,
    connectionTimeout: 10000,
    enableLogging: false
  }
};

export const isProduction = process.env.NODE_ENV === 'production';
