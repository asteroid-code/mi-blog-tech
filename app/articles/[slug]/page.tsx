import { createClient } from '../../../lib/supabase/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { GeneratedContent } from '../../../types/ai';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { TableOfContents } from '@/components/table-of-contents';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { slug } = params;

  const { data: article, error } = await supabase
    .from('generated_content')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching article:', error);
    if (error.code === 'PGRST116') {
      notFound();
    }
    throw new Error('Failed to fetch article data.');
  }

  if (!article) {
    notFound();
  }

  const generatedArticle = article as GeneratedContent & { slug: string };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-8">
        <ChevronLeft className="w-5 h-5 mr-2" />
        Volver al inicio
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        <div className="xl:col-span-3">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{generatedArticle.title}</h1>
          {generatedArticle.summary && (
            <p className="mt-4 text-lg text-muted-foreground italic mb-8">{generatedArticle.summary}</p>
          )}

          <div className="prose dark:prose-invert lg:prose-xl max-w-none">
            <MDXRemote
              source={generatedArticle.content || ''}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: 'wrap' }],
                  ],
                },
              }}
            />
          </div>

          {generatedArticle.tags && generatedArticle.tags.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Etiquetas:</h3>
              <div className="flex flex-wrap gap-2">
                {generatedArticle.tags.map((tag, index) => (
                  <span key={index} className="inline-block bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <TableOfContents />
        </div>
      </div>
    </div>
  );
}
