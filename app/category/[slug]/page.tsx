import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ArticleGrid } from '@/components/article-grid';
import { getCategories, getPostsByCategory } from '@/lib/contentService';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categories = await getCategories();
  const category = categories.find(cat => cat.slug === params.slug);

  if (!category) {
    return {
      title: 'Categoría no encontrada',
      description: 'La categoría que buscas no existe.',
    };
  }

  return {
    title: `Artículos de ${category.name}`,
    description: `Explora los últimos artículos en la categoría de ${category.name}.`,
  };
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = params;

  const categories = await getCategories();
  const category = categories.find(cat => cat.slug === slug);

  if (!category) {
    notFound();
  }

  const posts = await getPostsByCategory(slug);

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
