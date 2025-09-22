import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ArticleGrid } from '@/components/article-grid';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: category, error } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', params.slug)
    .single();

  if (error || !category) {
    return {
      title: 'Categoría no encontrada',
      description: 'La categoría que buscas no existe.',
    };
  }

  return {
    title: `Artículos de ${category.name}`,
    description: category.description || `Explora los últimos artículos en la categoría de ${category.name}.`,
  };
}

export async function generateStaticParams() {
  const { data: categories, error } = await supabase.from('categories').select('slug');

  if (error) {
    return [];
  }

  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = params;

  // Solución: Se utiliza una única y eficiente consulta para obtener la categoría
  // y todo el contenido asociado (`generated_content`) a la vez.
  const { data: category, error } = await supabase
    .from('categories')
    .select('name, generated_content(*)')
    .eq('slug', slug)
    .single();

  // Si la categoría no se encuentra o hay un error en la consulta, se muestra la página 404.
  if (error || !category) {
    notFound();
  }

  // Los posts ahora se extraen del objeto de categoría anidado.
  const posts = category.generated_content;

  // Manejo para el caso en que la categoría existe pero no tiene posts asociados.
  if (!posts || posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Categoría: {category.name}</h1>
        <p className="text-center text-gray-500">No hay artículos en esta categoría todavía.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Categoría: {category.name}</h1>
      <ArticleGrid posts={posts} />
    </div>
  );
}
