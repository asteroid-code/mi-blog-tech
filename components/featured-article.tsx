import Link from "next/link";

interface Post {
  id: string;
  created_at: string;
  title: string;
  summary: string;
  image_url: string;
  post_type: string;
  categories: {
    name: string;
  }[] | null;
}

interface FeaturedArticleProps {
  post: Post;
}

export function FeaturedArticle({ post }: FeaturedArticleProps) {
  if (!post) return null;

  return (
    <Link href={`/articles/${post.id}`} className="block">
      <article className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card to-card/80 p-6 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 transform-gpu">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
              <span className="text-xs">✨</span>
              {post.categories?.[0]?.name || 'General'}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary border border-secondary/30">
              Destacado
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground text-balance">
            {post.title}
          </h2>

          <p className="text-muted-foreground mb-6 text-pretty leading-relaxed">
            {post.summary}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">👤</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  AI • {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
