'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Algo salió mal</h1>
      <p className="text-lg text-gray-600 mb-8">
        Ocurrió un error al cargar esta categoría. Por favor, intenta de nuevo.
      </p>
      <Button onClick={() => reset()}>
        Intentar de nuevo
      </Button>
    </div>
  );
}
