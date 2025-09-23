import { createClient } from '@/lib/supabase/server';

// Interface for a single post, ensuring type safety.
export interface Post {
  id: string; // Changed to required string
  created_at?: string;
  title: string;
  summary: string;
  content: string; // Assuming a 'content' field for the full article body
  image_url: string; // Changed to required string
  post_type: 'article' | 'video' | 'tweet';
  category_id: string; // Foreign key to the 'categories' table
  categories?: { name: string } | { name: string }[] | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Fetches a list of posts from the 'generated_content' table with optional filtering and pagination.
 * @param options An object containing query, categorySlug, page, and limit.
 * @returns A promise that resolves to an object with an array of posts and a total count.
 */
export async function getPosts({
  query,
  categorySlug,
  page,
  limit,
}: {
  query?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
}) {
  console.log('DEBUG: getPosts called with:', { query, categorySlug, page, limit });

  const supabase = await createClient();
  console.log('DEBUG: Supabase client created in getPosts.');

  let dbQuery = supabase
    .from('generated_content')
    .select('id, created_at, title, summary, content, image_url, post_type, category_id, categories(name, slug)', { count: 'exact' });

  console.log('DEBUG: Initial Supabase query built.');

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    console.log('DEBUG: Query parameter added:', query);
  }

  if (categorySlug) {
    dbQuery = dbQuery.eq('categories.slug', categorySlug);
    console.log('DEBUG: Category filter added:', categorySlug);
  }

  dbQuery = dbQuery.order('created_at', { ascending: false });
  console.log('DEBUG: Order by created_at added.');

  if (page && limit) {
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    dbQuery = dbQuery.range(start, end);
    console.log('DEBUG: Pagination range added:', { start, end });
  }

  console.log('DEBUG: Executing Supabase query...');
  const { data, error, count } = await dbQuery;
  console.log('DEBUG: Supabase query executed.');

  if (error) {
    console.error('ERROR: Supabase error fetching posts:', error);
    throw new Error(`Could not fetch posts. Supabase error: ${error.message}`);
  }

  console.log('DEBUG: Posts fetched successfully. Count:', count);
  return { data, count };
}

/**
 * Fetches a single post by its ID.
 * @param id The ID of the post to fetch.
 * @returns A promise that resolves to a single post object.
 */
export async function getPostById(id: string) {
  const supabase = await createClient(); // ✅ AWAIT añadido

  const { data, error } = await supabase
    .from('generated_content')
    .select('*, categories(name, slug)')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching post with id ${id}:`, error);
    throw new Error('Could not fetch the specified post.');
  }

  return data;
}

/**
 * Creates a new post in the 'generated_content' table.
 * @param post The post object to create.
 * @returns A promise that resolves to the newly created post data.
 */
export async function createPost(post: Omit<Post, 'id' | 'created_at'>) {
  const supabase = await createClient(); // ✅ AWAIT añadido

  const { data, error } = await supabase
    .from('generated_content')
    .insert([post])
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw new Error('Could not create a new post.');
  }

  return data;
}

/**
 * Fetches posts by category slug
 * @param slug The category slug
 * @returns A promise that resolves to posts in that category
 */
export async function getPostsByCategory(slug: string) {
  const supabase = await createClient(); // ✅ AWAIT añadido

  const { data, error } = await supabase
    .from('generated_content')
    .select('id, created_at, title, summary, image_url, post_type, categories(name, slug)')
    .eq('categories.slug', slug)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching posts for category ${slug}:`, error);
    throw new Error('Could not fetch posts for this category.');
  }

  return data;
}

/**
 * Searches posts by title or content
 * @param query The search query
 * @returns A promise that resolves to matching posts
 */
export async function searchPosts(query: string) {
  const supabase = await createClient(); // ✅ AWAIT añadido

  const { data, error } = await supabase
    .from('generated_content')
    .select('id, created_at, title, summary, image_url, post_type, categories(name, slug)')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error searching posts for "${query}":`, error);
    throw new Error('Could not search posts.');
  }

  return data;
}

/**
 * Gets featured/popular posts
 * @returns A promise that resolves to featured posts
 */
export async function getFeaturedPosts() {
  const supabase = await createClient(); // ✅ AWAIT añadido

  const { data, error } = await supabase
    .from('generated_content')
    .select('id, created_at, title, summary, image_url, post_type, categories(name, slug)')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching featured posts:', error);
    throw new Error('Could not fetch featured posts.');
  }

  return data;
}
