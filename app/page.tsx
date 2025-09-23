import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturedArticle } from "@/components/featured-article"
import { ArticleGrid } from "@/components/article-grid"
import { Sidebar } from "@/components/sidebar"
import { VideoSection } from "@/components/video-section"
import { supabase } from "@/lib/supabaseClient" // Assuming this is for categories, will adjust if needed
import { getPosts, Post, getPostById } from "@/lib/contentService"
import { Pagination } from "@/components/ui/pagination" // Assuming a pagination component exists or will be created
import { PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination"
import Link from "next/link"

interface HomePageProps {
  searchParams: {
    q?: string;
    category?: string;
    page?: string;
  };
}

const POSTS_PER_PAGE = 10; // Define how many posts per page

export default async function Page({ searchParams }: HomePageProps) {
  const query = searchParams.q || '';
  const categorySlug = searchParams.category || '';
  const currentPage = Number(searchParams.page) || 1;

  const { data: postsData, count: totalPosts } = await getPosts({
    query,
    categorySlug,
    page: currentPage,
    limit: POSTS_PER_PAGE,
  });

  if (!postsData) {
    return <div>Error al cargar los artículos.</div>
  }

  const featuredPost: Post | undefined = postsData?.[0];
  const gridPosts: Post[] = postsData?.slice(1) || [];

  // Petición para obtener categorías
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (categoriesError) {
    console.error("Error al obtener categorías:", categoriesError);
  }

  const totalPages = Math.ceil((totalPosts || 0) / POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {featuredPost && <HeroSection post={featuredPost} />}

        <VideoSection />

        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          <section className="space-y-8">
            <ArticleGrid posts={gridPosts} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href={`/?${new URLSearchParams({ ...searchParams, page: Math.max(1, currentPage - 1).toString() }).toString()}`} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink href={`/?${new URLSearchParams({ ...searchParams, page: pageNumber.toString() }).toString()}`} isActive={pageNumber === currentPage}>
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext href={`/?${new URLSearchParams({ ...searchParams, page: Math.min(totalPages, currentPage + 1).toString() }).toString()}`} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </section>

          <aside className="sticky top-24 h-fit">
            <Sidebar categories={categories} />
          </aside>
        </div>
      </main>
    </div>
  )
}
