import { supabase } from "@/lib/supabaseClient"

interface Post {
  id: string
  title: string
  content: string
  created_at: string
}

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const { data: post, error } = await supabase
    .from("generated_content")
    .select("*")
    .eq("id", params.slug)
    .single()

  if (error || !post) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-red-500">Artículo no encontrado</h1>
        <p className="mt-4 text-gray-600">Lo sentimos, el artículo que buscas no existe o ha sido eliminado.</p>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <article className="prose prose-lg dark:prose-invert">
        <h1 className="text-4xl font-bold mb-6">{post.title}</h1>
        <div className="mt-8 space-y-4">
          {post.content}
        </div>
      </article>
    </main>
  );
    }