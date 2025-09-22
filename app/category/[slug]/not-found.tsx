import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Categoría No Encontrada</h1>
      <p className="text-lg text-gray-600 mb-8">
        Lo sentimos, la categoría que estás buscando no existe.
      </p>
      <Button asChild>
        <Link href="/">Volver al Inicio</Link>
      </Button>
    </div>
  );
}
