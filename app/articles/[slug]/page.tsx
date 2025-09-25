import { getPostById, Post } from "@/lib/contentService"
import { Comments } from "@/components/comments"
import { LikeButton } from "@/components/like-button"
import { createClient } from "@/lib/supabase/server" // Server-side Supabase client for initial likes fetch
import { cookies } from 'next/headers'; // Import cookies

export default async function ArticleDetailPage({ params }: { params: { slug: string | undefined } }) {
  let post: Post | null = null;
  let error: Error | null = null;

  if (!params.slug) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-red-500">Error: Slug no proporcionado</h1>
        <p className="mt-4 text-gray-600">No se ha proporcionado un identificador de artículo válido.</p>
      </main>
    );
  }

  try {
    post = await getPostById(params.slug);
  } catch (e) {
    error = e as Error;
  }

  if (error || !post) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-red-500">Artículo no encontrado</h1>
        <p className="mt-4 text-gray-600">Lo sentimos, el artículo que buscas no existe o ha sido eliminado.</p>
      </main>
    )
  }

  // Fetch initial likes count
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { count: initialLikes, error: likesError } = await supabase
    .from("likes")
    .select("count", { count: "exact", head: true })
    .eq("article_id", post.id || ''); // Provide a default empty string if post.id is undefined

  if (likesError) {
    console.error("Error fetching initial likes:", likesError);
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <article className="prose prose-lg dark:prose-invert">
        <h1 className="text-4xl font-bold mb-6">{post.title}</h1>
        <div className="mt-8 space-y-4">
          {post.content}
        </div>
        {/* Like Button */}
        <LikeButton articleId={post.id || ''} initialLikes={initialLikes || 0} />
      </article>

      {/* Comments Section */}
      <Comments articleId={post.id || ''} />
    </main>
  );
}
