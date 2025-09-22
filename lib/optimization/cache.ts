// lib/optimization/cache.ts
class AICache {
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly TTL: number; // Time To Live in milliseconds

  constructor(ttl: number = 3600 * 1000) { // Default TTL to 1 hour
    this.cache = new Map();
    this.TTL = ttl;
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

export const aiCache = new AICache();
