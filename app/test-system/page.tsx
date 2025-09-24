'use client';
import { useState } from 'react';

export default function TestSystemPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runScraperTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/scrape?url=https://openai.com/blog/rss/');
      const data = await response.json();
      setResults(data);
    } catch (error: any) {
      setResults({ error: error.message });
    }
    setLoading(false);
  };

  const runFullSystemTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/full-system', { method: 'POST' });
      const data = await response.json();
      setResults(data);
    } catch (error: any) {
      setResults({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Sistema de Scraping + IA - Pruebas</h1>

      <div className="space-y-4 mb-8">
        <button
          onClick={runScraperTest}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Probando...' : '1. Probar Scraper RSS'}
        </button>

        <button
          onClick={runFullSystemTest}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Probando...' : '2. Probar Sistema Completo'}
        </button>
      </div>

      {results && (
        <div className={`p-4 rounded ${results.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <pre className="whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
