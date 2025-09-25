import { createClient } from '../../../lib/supabase/server'; // Correct path for server-side Supabase client
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers'; // Import cookies
import { GeneratedContent } from '../../../types/ai'; // Adjust path as needed

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const cookieStore = cookies(); // Get cookie store
  const supabase = await createClient(cookieStore); // Initialize server-side Supabase client with cookieStore
  const { slug } = params;

  // Fetch article data from 'generated_content' table
  const { data: article, error } = await supabase
    .from('generated_content')
    .select('*')
    .eq('slug', slug) // Assuming 'slug' column exists in generated_content
    .single();

  if (error) {
    console.error('Error fetching article:', error);
    // Depending on the error, you might want to show a different message or log
    // For now, if no article is found, we'll treat it as notFound
    if (error.code === 'PGRST116') { // No rows found
      notFound();
    }
    // For other database errors, you might want to throw or show a generic error
    throw new Error('Failed to fetch article data.');
  }

  if (!article) {
    notFound(); // Show 404 page if article is not found
  }

  // Cast to GeneratedContent type for better type safety
  const generatedArticle = article as GeneratedContent & { slug: string }; // Assuming slug is also part of the fetched data

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{generatedArticle.title}</h1>
      <div className="prose lg:prose-xl max-w-none">
        {/* Render content, assuming it's HTML or Markdown that Next.js can handle */}
        <p>{generatedArticle.content}</p>
      </div>
      {/* You might want to display other details like summary, tags, etc. */}
      {generatedArticle.summary && (
        <p className="mt-4 text-gray-600 italic">{generatedArticle.summary}</p>
      )}
      {generatedArticle.tags && generatedArticle.tags.length > 0 && (
        <div className="mt-4">
          {generatedArticle.tags.map((tag, index) => (
            <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
