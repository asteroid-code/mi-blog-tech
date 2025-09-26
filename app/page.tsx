import { HeroSection } from "@/components/hero-section"
import { FeaturedArticle } from "@/components/featured-article"
import { ArticleGrid } from "@/components/article-grid"
import { Sidebar } from "@/components/sidebar"
import { VideoSection } from "@/components/video-section"
import { supabase } from "@/lib/supabaseClient";
import { getPosts, Post, getPostById, Category } from "@/lib/contentService" // Added Category import
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

  const { posts: postsData, count: totalPosts } = await getPosts({
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

  // LOGS DE DIAGNÓSTICO - ELIMINAR DESPUÉS
  console.log('🔍 DIAGNÓSTICO ARTICLEGRID');
  console.log('Total de posts:', totalPosts);
  console.log('Datos de posts:', postsData);
  console.log('Cantidad de posts:', postsData?.length || 0);
  console.log('Post destacado:', featuredPost?.title);
  console.log('Posts para el grid:', gridPosts?.length || 0);
  console.log('Parámetros de búsqueda:', {
    query: query || 'ninguno',
    category: categorySlug || 'ninguna',
    page: currentPage
  });

  // Petición para obtener categorías
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (categoriesError) {
    console.error("Error al obtener categorías:", categoriesError);
  }

  // Petición para obtener los últimos 5 posts de tipo 'video'
  const { data: videoPosts, error: videoPostsError } = await supabase
    .from("generated_content")
    .select("*")
    .eq("post_type", "video")
    .order("created_at", { ascending: false })
    .limit(5);

  if (videoPostsError) {
    console.error("Error al obtener posts de video:", videoPostsError);
  }

  // Peticiones para estadísticas de la barra lateral
  const { count: articlesCount, error: articlesCountError } = await supabase
    .from("generated_content")
    .select("*", { count: "exact" });

  if (articlesCountError) {
    console.error("Error al contar artículos:", articlesCountError);
  }

  const { count: categoriesCount, error: categoriesCountError } = await supabase
    .from("categories")
    .select("*", { count: "exact" });

  if (categoriesCountError) {
    console.error("Error al contar categorías:", categoriesCountError);
  }

  // Petición para obtener los 5 posts con más vistas (tendencias)
  const { data: trendingPosts, error: trendingPostsError } = await supabase
    .from("generated_content")
    .select("id, slug, title, views")
    .order("views", { ascending: false })
    .limit(5);

  if (trendingPostsError) {
    console.error("Error al obtener posts de tendencias:", trendingPostsError);
  }

  const totalPages = Math.ceil((totalPosts || 0) / POSTS_PER_PAGE);

  // Prepare sidebar stats
  const sidebarStats = [
    { label: "Artículos Generados", value: articlesCount?.toLocaleString() || "0", change: "+23%" }, // Placeholder change
    { label: "Lectores Activos", value: "89.2k", change: "+18%" }, // Placeholder, as active readers logic is not defined
    { label: "Temas Cubiertos", value: categoriesCount?.toLocaleString() || "0", change: "+12%" }, // Placeholder change
  ];

  // Prepare sidebar trending topics
  const sidebarTrendingTopics = trendingPosts?.map((post, index) => ({
    topic: post.title,
    count: `${post.views?.toLocaleString() || "0"} vistas`, // Using views as count
    trend: `+${Math.floor(Math.random() * 50) + 10}%`, // Random trend for now
    slug: post.slug,
  })) || [];


  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {featuredPost && <HeroSection post={featuredPost} />}

        <VideoSection videos={videoPosts as Post[]} />

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
            <Sidebar
              categories={categories}
              stats={sidebarStats}
              trendingTopics={sidebarTrendingTopics}
            />
          </aside>
        </div>
      </main>
    </div>
  )
}
