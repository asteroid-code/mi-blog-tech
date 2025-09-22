import Image from "next/image"
import Link from "next/link"

// Define the type for a single post
interface Post {
  id: string
  title: string
  summary: string
  image_url: string
  categories: { name: string }[] | null
}

// Define the props for the HeroSection component
interface HeroSectionProps {
  post: Post
}

export function HeroSection({ post }: HeroSectionProps) {
  // If there's no post, don't render anything.
  // Consider a skeleton loader here for better UX.
  if (!post) {
    return null
  }

  // 🛠️ SOLUCIÓN DEFINITIVA: Normalizar los datos
  // Nos aseguramos de que `categories` sea siempre un array.
  // Si `post.categories` no es un array (es null, undefined, etc.),
  // usaremos un array vacío como valor por defecto.
  const categories = Array.isArray(post.categories) ? post.categories : []

  return (
    <Link href={`/articles/${post.id}`} className="block group">
      <section className="relative mb-12 h-[400px] md:h-[500px] rounded-xl overflow-hidden flex items-center justify-center text-center text-white transition-transform duration-300 ease-in-out group-hover:scale-105">
        {/* Background Image */}
        <Image
          src={post.image_url || "/placeholder.jpg"}
          alt={post.title || "Featured article image"}
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 p-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance drop-shadow-lg group-hover:text-primary transition-colors">
            {post.title}
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-8 text-pretty max-w-2xl mx-auto drop-shadow-md">
            {post.summary}
          </p>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {/* Ahora podemos mapear directamente sobre `categories` sin miedo a errores. */}
            {categories.map((category) => (
              <span
                key={category.name}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white border border-white/30 backdrop-blur-sm group-hover:bg-primary/80 group-hover:border-primary transition-all duration-300"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </Link>
  )
}
