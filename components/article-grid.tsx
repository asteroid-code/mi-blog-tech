import Image from "next/image"
import Link from "next/link"
import { Post } from "@/lib/contentService"

interface ArticleGridProps {
  posts: Post[] | null
}

export function ArticleGrid({ posts }: ArticleGridProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Últimas Noticias</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {posts?.map((post) => (
          <Link href={`/articles/${post.id}`} key={post.id} className="block">
            <article
            className="group relative overflow-hidden rounded-xl aspect-video bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 transform-gpu cursor-pointer"
          >
            <Image
              src={post.image_url || "/placeholder.jpg"}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="relative z-10 p-6 flex flex-col h-full justify-end">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary backdrop-blur-sm">
                    {Array.isArray(post.categories)
                      ? post.categories[0]?.name || 'General'
                      : post.categories?.name || 'General'}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-2 text-primary-foreground group-hover:text-primary transition-colors text-balance">
                  {post.title}
                </h3>
              </div>

              <div className="flex items-center justify-between mt-auto">
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
        ))}
      </div>
    </div>
  )
}
