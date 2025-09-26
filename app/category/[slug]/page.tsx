import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ArticleGrid } from '@/components/article-grid';
import { slugify } from '@/lib/utils/slugify';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: category, error } = await supabase
    .from('categories')
    .select('name, description, slug')
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
  const { data: categories, error } = await supabase.from('categories').select('name');

  if (error) {
    return [];
  }

  return categories.map((category) => ({
    slug: slugify(category.name),
  }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = params;

  const { data: category, error } = await supabase
    .from('categories')
    .select('name, generated_content(*, categories(name, slug))')
    .eq('slug', slug)
    .single();

  if (error || !category) {
    notFound();
  }

  const posts = category.generated_content;

  if (!posts || posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Categoría: {category.name}</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Parece que no hay artículos en esta categoría todavía.
        </p>
        <p className="text-muted-foreground">
          Vuelve pronto, estamos trabajando para traer el contenido más reciente.
        </p>
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
