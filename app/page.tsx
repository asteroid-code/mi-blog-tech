import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturedArticle } from "@/components/featured-article"
import { ArticleGrid } from "@/components/article-grid"
import { Sidebar } from "@/components/sidebar"
import { VideoSection } from "@/components/video-section"
import { supabase } from "@/lib/supabaseClient"
import ScraperButton from "@/components/scraper-button"

export default async function Page() {
  const { data: posts, error } = await supabase
    .from("generated_content")
    .select("id, created_at, title, summary, image_url, post_type, categories(name)")
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) {
    console.error("Error fetching posts:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <ScraperButton />
        </div>
        <HeroSection />

        <VideoSection />

        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          <section className="space-y-8">
            <FeaturedArticle />
            <ArticleGrid posts={posts} />
          </section>

          <aside className="sticky top-24 h-fit">
            <Sidebar />
          </aside>
        </div>
      </main>
    </div>
  )
}
