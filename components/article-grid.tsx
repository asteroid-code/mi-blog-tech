import Image from "next/image"
import Link from "next/link"
import { Post } from "@/lib/contentService"
import { slugify } from "@/lib/utils/slugify"

interface ArticleGridProps {
  posts: Post[] | null
}

export function ArticleGrid({ posts }: ArticleGridProps) {
  console.log('🔍 ARTICLEGRID - Posts recibidos:', posts?.length);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Últimas Noticias</h2>

      {posts && posts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post, index) => {
            console.log(`🔍 Renderizando post ${index}:`, post.title);
            console.log(`🔍 Post ${index} tiene imagen:`, post.image_url);

            return (
              <Link
                key={post.id}
                href={`/articles/${post.slug || post.id}`}
                className="block group"
              >
                <article
                  className="relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transform-gpu cursor-pointer flex flex-col"
                >
                  <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                    {post.image_url ? (
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                        <span className="text-4xl text-primary/50">📄</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                  <div className="relative z-10 p-6 flex flex-col flex-grow min-h-[200px]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary backdrop-blur-sm">
                          {post.categories
                            ? Array.isArray(post.categories)
                              ? post.categories[0]?.name || 'General'
                              : post.categories.name || 'General'
                            : 'General'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold mb-2 text-primary-foreground group-hover:text-primary transition-colors text-balance line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <span className="text-primary-foreground text-xs">👤</span>
                        </div>
                        <span className="text-xs font-mono text-primary-foreground/80">
                          AI • {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">No hay posts para mostrar</p>
      )}
    </div>
  );
}
